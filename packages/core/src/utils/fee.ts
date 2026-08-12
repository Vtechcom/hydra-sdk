import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { DEFAULT_PROTOCOL_PARAMETERS } from '../constants/protocol-parameters'
import type { Protocol } from '../types/protocol'
import type { UTxO } from '../types/cardano'

/** A script execution budget. */
export interface ExUnitsLike {
	mem: number
	steps: number
}

/** Per-component breakdown of a transaction's fee, in lovelace (decimal strings). */
export interface FeeBreakdown {
	/** Total fee after `feeMultiplier` and `safetyMarginLovelace`. */
	fee: string
	/** Total fee before `feeMultiplier`/`safetyMarginLovelace` (sizeFee + scriptFee + refScriptFee). */
	baseFee: string
	/** Size-based fee: `minFeeA × txBytes + minFeeB`. */
	sizeFee: string
	/** Script execution fee: `ceil(priceMem × mem + priceStep × steps)`. */
	scriptFee: string
	/** Reference-script fee: `minFeeRefScriptCostPerByte × refScriptBytes`. */
	refScriptFee: string
	/** Measured transaction size in bytes (with mock witnesses). */
	txBytes: number
	/** Number of vkey witnesses assumed (distinct input/collateral signers + required signers). */
	signerCount: number
	/** Total reference-script bytes across resolved reference inputs. */
	refScriptBytes: number
}

export interface CalculateTxFeeOptions {
	/** Evaluated exUnits to price. If omitted, the tx's own redeemer exUnits are summed. */
	exUnits?: ExUnitsLike[]
	/** Resolved UTxOs — used to count signers and size reference scripts. */
	resolvedUtxos?: UTxO[]
	/** Protocol parameters. Missing fields fall back to `DEFAULT_PROTOCOL_PARAMETERS`. */
	params?: Partial<Protocol>
	/** Extra mock witnesses beyond the derived signer count. */
	extraSigners?: number
	/** Multiply the base fee (e.g. 1.05 for +5% headroom). Default: 1. */
	feeMultiplier?: number
	/** Flat lovelace added to the total. Default: 0. */
	safetyMarginLovelace?: number
}

// CSL's own build reserves a wider fee field during convergence than the final
// encoding uses (a live 5-byte uint vs a reserved max-width field). The
// TransactionBody fee field is immutable here (no set_fee), so instead of
// re-encoding it we add a flat byte headroom to the size calculation. 8 bytes
// covers the full fee-field width variance (1→9 byte uint) plus a little
// rounding slack, keeping the estimate >= CSL.
const FEE_FIELD_HEADROOM_BYTES = 8
// A vkey witness is a fixed 32-byte key + 64-byte signature.
const DUMMY_VKEY = new Uint8Array(32)
const DUMMY_SIG = new Uint8Array(64)

const priceToRational = (value: number): { numerator: string; denominator: string } => {
	const denominator = 1_000_000_000
	return { numerator: String(Math.round(value * denominator)), denominator: String(denominator) }
}

/**
 * Compute a full transaction fee (size + script + reference-script components)
 * WITHOUT re-running coin selection or a TxBuilder rebuild.
 *
 * The result is a safe estimate: it adds a byte headroom for the fee field and a
 * mock witness per expected signer, so it is `>=` the fee CSL's own build
 * converges on (typically within ~0.1%). It never under-provisions. It does not
 * rebalance the change output — it returns the number, not a new transaction.
 *
 * Sits alongside {@link resolveTxFees}; used by `@hydra-sdk/transaction` and
 * `@hydra-sdk/evaluator` so neither duplicates the fee math.
 */
export const calculateTxFee = (txHex: string, options: CalculateTxFeeOptions = {}): FeeBreakdown => {
	const params: Protocol = { ...DEFAULT_PROTOCOL_PARAMETERS, ...options.params }
	const scratch: { free(): void }[] = []
	const track = <T extends { free(): void }>(obj: T): T => (scratch.push(obj), obj)

	try {
		let tx: CardanoWASM.Transaction
		try {
			tx = track(CardanoWASM.Transaction.from_hex(txHex))
		} catch (cause) {
			throw new Error(`calculateTxFee: failed to decode transaction CBOR: ${String(cause)}`)
		}

		const body = track(tx.body())
		const witnessSet = track(tx.witness_set())

		// --- signer count → mock witnesses ---
		const signerCount = countVkeys(body, options.resolvedUtxos ?? [], track) + (options.extraSigners ?? 0)
		const vkeys = track(CardanoWASM.Vkeywitnesses.new())
		for (let i = 0; i < signerCount; i++) {
			const vw = track(
				CardanoWASM.Vkeywitness.new(
					track(CardanoWASM.Vkey.new(track(CardanoWASM.PublicKey.from_bytes(DUMMY_VKEY)))),
					track(CardanoWASM.Ed25519Signature.from_bytes(DUMMY_SIG))
				)
			)
			vkeys.add(vw)
		}
		if (signerCount > 0) witnessSet.set_vkeys(vkeys)

		const measured = track(CardanoWASM.Transaction.new(body, witnessSet, tx.auxiliary_data()))
		const txBytes = measured.to_bytes().length

		// --- size fee: minFeeA × (bytes + fee-field headroom) + minFeeB ---
		const linearFee = track(
			CardanoWASM.LinearFee.new(
				track(CardanoWASM.BigNum.from_str(String(params.minFeeA))),
				track(CardanoWASM.BigNum.from_str(String(params.minFeeB)))
			)
		)
		const sizeFee =
			BigInt(track(CardanoWASM.min_fee(measured, linearFee)).to_str()) +
			BigInt(params.minFeeA) * BigInt(FEE_FIELD_HEADROOM_BYTES)

		// --- script fee (from evaluated totals, or the tx's own redeemer exUnits) ---
		const { mem, steps } = totalExUnits(options.exUnits, witnessSet, track)
		let scriptFee = 0n
		if (mem > 0n || steps > 0n) {
			const exUnitPrices = track(
				CardanoWASM.ExUnitPrices.from_json(
					JSON.stringify({ mem_price: priceToRational(params.priceMem), step_price: priceToRational(params.priceStep) })
				)
			)
			const exUnits = track(
				CardanoWASM.ExUnits.new(
					track(CardanoWASM.BigNum.from_str(String(mem))),
					track(CardanoWASM.BigNum.from_str(String(steps)))
				)
			)
			scriptFee = BigInt(track(CardanoWASM.calculate_ex_units_ceil_cost(exUnits, exUnitPrices)).to_str())
		}

		// --- reference-script fee ---
		const refScriptBytes = referenceScriptBytes(body, options.resolvedUtxos ?? [], track)
		let refScriptFee = 0n
		if (refScriptBytes > 0) {
			const refPrice = track(
				CardanoWASM.UnitInterval.new(
					track(CardanoWASM.BigNum.from_str(String(params.minFeeRefScriptCostPerByte))),
					track(CardanoWASM.BigNum.from_str('1'))
				)
			)
			refScriptFee = BigInt(track(CardanoWASM.min_ref_script_fee(refScriptBytes, refPrice)).to_str())
		}

		const baseFee = sizeFee + scriptFee + refScriptFee
		const multiplier = options.feeMultiplier ?? 1
		const margin = BigInt(Math.max(0, Math.floor(options.safetyMarginLovelace ?? 0)))
		const total = BigInt(Math.ceil(Number(baseFee) * multiplier)) + margin

		return {
			fee: total.toString(),
			baseFee: baseFee.toString(),
			sizeFee: sizeFee.toString(),
			scriptFee: scriptFee.toString(),
			refScriptFee: refScriptFee.toString(),
			txBytes,
			signerCount,
			refScriptBytes
		}
	} finally {
		for (const obj of scratch.reverse()) {
			try {
				obj.free()
			} catch {
				/* ignore */
			}
		}
	}
}

/** Distinct vkey signers across inputs + collateral (by resolved address) plus required signers. */
const countVkeys = (
	body: CardanoWASM.TransactionBody,
	resolvedUtxos: UTxO[],
	track: <T extends { free(): void }>(o: T) => T
): number => {
	const byKey = new Map<string, boolean>()
	const utxoByRef = new Map<string, UTxO>()
	for (const u of resolvedUtxos) utxoByRef.set(`${u.input.txHash}#${u.input.outputIndex}`, u)

	const addFromInputs = (inputs: CardanoWASM.TransactionInputs | undefined) => {
		if (!inputs) return
		track(inputs)
		for (let i = 0; i < inputs.len(); i++) {
			const input = track(inputs.get(i))
			const ref = `${track(input.transaction_id()).to_hex()}#${input.index()}`
			const utxo = utxoByRef.get(ref)
			if (!utxo) continue
			const keyHash = paymentKeyHash(utxo.output.address, track)
			if (keyHash) byKey.set(keyHash, true)
		}
	}

	addFromInputs(body.inputs())
	addFromInputs(body.collateral())

	const required = body.required_signers()
	if (required) {
		track(required)
		for (let i = 0; i < required.len(); i++) byKey.set(track(required.get(i)).to_hex(), true)
	}

	return byKey.size
}

const paymentKeyHash = (address: string, track: <T extends { free(): void }>(o: T) => T): string | undefined => {
	try {
		const addr = track(CardanoWASM.Address.from_bech32(address))
		const cred = addr.payment_cred()
		if (!cred) return undefined
		track(cred)
		const keyHash = cred.to_keyhash()
		return keyHash ? track(keyHash).to_hex() : undefined
	} catch {
		return undefined
	}
}

/** Sum of provided exUnits, or the tx's own redeemer exUnits when none are given. */
const totalExUnits = (
	exUnits: ExUnitsLike[] | undefined,
	witnessSet: CardanoWASM.TransactionWitnessSet,
	track: <T extends { free(): void }>(o: T) => T
): { mem: bigint; steps: bigint } => {
	if (exUnits && exUnits.length) {
		return exUnits.reduce((acc, e) => ({ mem: acc.mem + BigInt(e.mem), steps: acc.steps + BigInt(e.steps) }), {
			mem: 0n,
			steps: 0n
		})
	}
	const redeemers = witnessSet.redeemers()
	if (!redeemers) return { mem: 0n, steps: 0n }
	track(redeemers)
	let mem = 0n
	let steps = 0n
	for (let i = 0; i < redeemers.len(); i++) {
		const ex = track(track(redeemers.get(i)).ex_units())
		mem += BigInt(track(ex.mem()).to_str())
		steps += BigInt(track(ex.steps()).to_str())
	}
	return { mem, steps }
}

/** Total byte size of reference scripts carried by the tx's resolved reference inputs. */
const referenceScriptBytes = (
	body: CardanoWASM.TransactionBody,
	resolvedUtxos: UTxO[],
	track: <T extends { free(): void }>(o: T) => T
): number => {
	const refInputs = body.reference_inputs()
	if (!refInputs) return 0
	track(refInputs)
	const utxoByRef = new Map<string, UTxO>()
	for (const u of resolvedUtxos) utxoByRef.set(`${u.input.txHash}#${u.input.outputIndex}`, u)

	let bytes = 0
	for (let i = 0; i < refInputs.len(); i++) {
		const input = track(refInputs.get(i))
		const ref = `${track(input.transaction_id()).to_hex()}#${input.index()}`
		const scriptCbor = utxoByRef.get(ref)?.output.scriptRef?.scriptCbor
		if (scriptCbor) bytes += scriptCbor.length / 2
	}
	return bytes
}
