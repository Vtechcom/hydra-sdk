import type { TxDraft } from '~/lib/tx-draft'

const q = (value: string) => `'${String(value).replace(/'/g, "\\'")}'`

const assetLiteral = (amount: { unit: string; quantity: string }[]) =>
	`[${amount.map(a => `{ unit: ${q(a.unit)}, quantity: ${q(a.quantity)} }`).join(', ')}]`

/**
 * Turns the current builder state into the `@hydra-sdk/transaction` code that
 * would produce the same transaction. This is the teaching surface of the
 * playground, so it emits the *correct* lifecycle too: `complete()` hands back a
 * live WASM `Transaction`, and both it and the builder have to be released.
 */
export const generateTxSnippet = (draft: TxDraft, options: { returnCbor?: boolean } = {}): string => {
	const lines: string[] = []
	const coreImports = new Set<string>(['Resolver'])
	const usesDatum =
		draft.outputs.some(o => o.datum || o.inlineDatum) ||
		draft.scriptInputs.some(s => s.datumCborHex || s.redeemerCborHex)
	const usesRedeemer = draft.scriptInputs.some(s => s.redeemerMode !== 'none') || draft.mints.some(m => m.redeemerMode !== 'none')
	if (usesDatum) coreImports.add('Deserializer')
	if (usesRedeemer) coreImports.add('RedeemerUtils')

	lines.push(`import { TxBuilder } from '@hydra-sdk/transaction'`)
	lines.push(`import { ${[...coreImports].sort().join(', ')} } from '@hydra-sdk/core'`)
	lines.push('')

	// ── Inputs the transaction spends ─────────────────────────────────────────
	if (draft.inputs.length) {
		lines.push('const utxos = [')
		for (const utxo of draft.inputs) {
			lines.push(`\t{`)
			lines.push(`\t\tinput: { txHash: ${q(utxo.input.txHash)}, outputIndex: ${utxo.input.outputIndex} },`)
			lines.push(`\t\toutput: {`)
			lines.push(`\t\t\taddress: ${q(utxo.output.address)},`)
			lines.push(`\t\t\tamount: ${assetLiteral(utxo.output.amount)}`)
			lines.push(`\t\t}`)
			lines.push(`\t},`)
		}
		lines.push(']')
		lines.push('')
	}

	// ── Builder construction ──────────────────────────────────────────────────
	const builderOptions: string[] = []
	if (draft.isHydra) builderOptions.push('isHydra: true')
	if (draft.useCustomPParams) builderOptions.push('params: customProtocolParams')
	if (draft.useEvaluator) {
		builderOptions.push('evaluator', `txEvaluationMultiplier: ${Number(draft.evaluatorMultiplier) || 1}`)
	}
	if (draft.verbose) builderOptions.push('verbose: true')

	lines.push(`const builder = new TxBuilder(${builderOptions.length ? `{ ${builderOptions.join(', ')} }` : ''})`)

	// setInputs() replaces the input list, so it always comes before txIn().
	if (draft.inputs.length) lines.push(`builder.setInputs(utxos, { strategy: ${q(draft.strategy)} })`)

	for (const script of draft.scriptInputs) {
		lines.push('')
		lines.push(`// script input ${script.txHash.slice(0, 8) || '<hash>'}#${script.outputIndex}`)
		lines.push(`builder.txIn(${q(script.txHash)}, ${Number(script.outputIndex)}, ${assetLiteral(script.amount)}, ${q(script.address)})`)
		lines.push(`builder.txInScript(${q(script.scriptCborHex)}, ${q(script.version)})`)
		if (script.datumMode === 'inlinedatum' && script.datumCborHex)
			lines.push(`builder.txInInlineDatum(Deserializer.deserializePlutusData(${q(script.datumCborHex)}))`)
		if (script.datumMode === 'datumhash' && script.datumCborHex)
			lines.push(`builder.txInDatumHash(Deserializer.deserializePlutusData(${q(script.datumCborHex)}))`)
		if (script.redeemerMode === 'unit')
			lines.push(
				`builder.txInRedeemerValue(RedeemerUtils.mkUnitRedeemer({ tag: 'spend', exUnits: { mem: ${q(script.exUnits.mem)}, steps: ${q(script.exUnits.steps)} } }))`
			)
		if (script.redeemerMode === 'custom' && script.redeemerCborHex)
			lines.push(
				`builder.txInRedeemerValue(RedeemerUtils.mkSpendRedeemer(Deserializer.deserializePlutusData(${q(script.redeemerCborHex)})))`
			)
	}

	for (const ref of draft.referenceInputs) {
		lines.push(`builder.txInReference(${q(ref.txHash)}, ${Number(ref.outputIndex)})`)
	}

	// ── Outputs ───────────────────────────────────────────────────────────────
	if (draft.outputs.length) lines.push('')
	for (const output of draft.outputs) {
		lines.push(`builder.addOutput({ address: ${q(output.address)}, amount: ${assetLiteral(output.amount)} })`)
		if (output.datum) lines.push(`builder.txOutDatumHashValue(Deserializer.deserializePlutusData(${q(output.datum)}))`)
		if (output.inlineDatum) lines.push(`builder.txOutInlineDatumValue(Deserializer.deserializePlutusData(${q(output.inlineDatum)}))`)
	}

	// ── Mint / certificates / withdrawals ─────────────────────────────────────
	// Rows are emitted even when a field is still blank: the snippet is a mirror
	// of the form, and silently dropping a row people just filled in reads as a
	// generator bug.
	for (const mint of draft.mints) {
		lines.push('')
		if (mint.scriptType !== 'Native') lines.push(`builder.mintPlutusScript(${q(mint.scriptType.replace('Plutus', ''))})`)
		// mintingScript()/mintRedeemerValue() attach to the last staged mint.
		lines.push(`builder.mint(${q(mint.quantity)}, ${q(mint.policyId)}, ${q(mint.assetName)})`)
		lines.push(`builder.mintingScript({ type: ${q(mint.scriptType)}, scriptCborHex: ${q(mint.scriptCborHex)} })`)
		if (mint.redeemerMode === 'unit') lines.push(`builder.mintRedeemerValue(RedeemerUtils.mkUnitRedeemer({ tag: 'mint' }))`)
		if (mint.redeemerMode === 'custom' && mint.redeemerCborHex)
			lines.push(
				`builder.mintRedeemerValue(RedeemerUtils.mkMintRedeemer(Deserializer.deserializePlutusData(${q(mint.redeemerCborHex)})))`
			)
	}

	for (const cert of draft.certificates) {
		if (cert.kind === 'StakeRegistration') lines.push(`builder.registerStake(${q(cert.rewardAddress)})`)
		else if (cert.kind === 'StakeDeregistration') lines.push(`builder.deregisterStake(${q(cert.rewardAddress)})`)
		else lines.push(`builder.delegateStake(${q(cert.rewardAddress)}, ${q(cert.poolKeyHash)})`)
	}

	for (const withdrawal of draft.withdrawals) {
		lines.push(`builder.withdrawal(${q(withdrawal.rewardAddress)}, ${q(withdrawal.amount)})`)
	}

	// ── Metadata / collateral / validity / signers ────────────────────────────
	for (const entry of draft.metadata) {
		let inline = entry.json
		try {
			inline = JSON.stringify(JSON.parse(entry.json))
		} catch {
			/* leave the raw text so the snippet still shows intent */
		}
		lines.push(`builder.metadataValue(${q(entry.label)}, ${inline})`)
	}

	for (const collateral of draft.collateral) {
		lines.push(
			`builder.txInCollateral(${q(collateral.txHash)}, ${Number(collateral.outputIndex)}, [{ unit: 'lovelace', quantity: ${q(collateral.lovelace)} }], ${q(collateral.address)})`
		)
	}
	if (draft.totalCollateral) lines.push(`builder.totalCollateral(${q(draft.totalCollateral)})`)
	if (draft.collateralReturnAddress && draft.collateralReturnLovelace)
		lines.push(
			`builder.collateralReturn(${q(draft.collateralReturnAddress)}, [{ unit: 'lovelace', quantity: ${q(draft.collateralReturnLovelace)} }])`
		)

	for (const signer of draft.requiredSigners) {
		lines.push(`builder.requiredSignerHash(${q(signer.trim())})`)
	}

	if (draft.withValidity) {
		if (draft.invalidBefore) lines.push(`builder.invalidBefore(${Number(draft.invalidBefore)})`)
		if (draft.invalidAfter) lines.push(`builder.invalidAfter(${Number(draft.invalidAfter)})`)
	}

	if (draft.withChangeAddress && draft.changeAddress) lines.push(`builder.setChangeAddress(${q(draft.changeAddress)})`)
	if (draft.withCustomFee && draft.customFee) lines.push(`builder.setFee(${q(draft.customFee)})`)
	if (draft.withMinFee && draft.minFee) lines.push(`builder.setMinFee(${q(draft.minFee)})`)

	// ── Build + WASM lifecycle ────────────────────────────────────────────────
	lines.push('')
	if (options.returnCbor) {
		lines.push('// completeCbor() builds and serialises in one step, freeing the')
		lines.push('// intermediate Transaction for you — use it when you only need the bytes.')
		lines.push('try {')
		lines.push('\tconst cborHex = await builder.completeCbor()')
		lines.push('\tconst txId = Resolver.resolveTxHash(cborHex)')
		lines.push('} finally {')
		lines.push('\tbuilder.dispose()')
		lines.push('}')
	} else {
		lines.push('const tx = await builder.complete()')
		lines.push('try {')
		lines.push('\tconst cborHex = tx.to_hex()')
		lines.push('\tconst txId = Resolver.resolveTxHash(cborHex)')
		lines.push('} finally {')
		lines.push('\t// CSL objects live in WASM memory and are not reclaimed by the JS GC.')
		lines.push('\ttx.free()')
		lines.push('\tbuilder.dispose()')
		lines.push('}')
	}

	return lines.join('\n')
}
