import { PolicyUtils, type UTxO } from '@hydra-sdk/core'
import { createDefaultDraft, type TxDraft } from '~/lib/tx-draft'

/**
 * Offline sample UTxOs so the builder is usable without a Blockfrost key. They
 * are shaped exactly like `fetchAddressUTxOs()` results — same preprod address,
 * plausible balances, one multi-asset entry — but the tx hashes are synthetic,
 * so anything built from them is for inspection only and will not submit.
 */
export const SAMPLE_ADDRESS = 'addr_test1qpxsf0x8xypuhq5k408f9kh0meyy6jv2lxgqw2fefvjlte0u06dugtmxuhhw8hschdn4q59g64q5s9z42ax6qyg7ewsqt6e548'

export const SAMPLE_RECIPIENT = 'addr_test1qqgagp6hm64jsxphelk494rpwysrkk8gzlhn8cnaueqqsqmfksxjux7q5ulgtfe9f40zt2sz0w4rw9t06kft8qa0w2cqxzut0c'

export const SAMPLE_UTXOS: UTxO[] = [
	{
		input: { txHash: 'c2e3452de098d13ae536c3fb9df599d119631d618aaa2738522aeced2d2a1ac2', outputIndex: 0 },
		output: {
			address: SAMPLE_ADDRESS,
			amount: [
				{ unit: 'lovelace', quantity: '120500000' },
				{ unit: 'e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed724d494e', quantity: '2000000000' },
				{ unit: 'fef67460342d081cb7881318b1f33b87626d1a1042b4c2acbbc0725d7441424f', quantity: '1000000' }
			]
		}
	},
	{
		input: { txHash: 'd2e3452de098d13ae536c3fb9df599d119631d618aaa2738522aeced2d2a1ac3', outputIndex: 1 },
		output: {
			address: SAMPLE_ADDRESS,
			amount: [{ unit: 'lovelace', quantity: '5000000000' }]
		}
	},
	{
		input: { txHash: 'a7d1f0c4be2149dd9f2b0e3a5c86b1d7e409c3a2f5b8471cd0e6a93b2f14c8d5', outputIndex: 2 },
		output: {
			address: SAMPLE_ADDRESS,
			amount: [
				{ unit: 'lovelace', quantity: '1327480' },
				{ unit: '9649407b4f02a38d98b1d9de2457eff522c47c87e22533377dcc70c455444f', quantity: '1000000000' }
			]
		}
	}
]

/** "HYDRA" — the asset name the mint preset uses. */
const MINT_ASSET_NAME_HEX = '4859445241'

export interface PresetContext {
	/** Address presets pay change to and derive a minting policy from — the
	 *  configured wallet when there is one, otherwise the sample address. */
	address: string
}

export interface TxPreset {
	id: string
	name: string
	description: string
	icon: string
	/** Returns a complete draft — presets always start from a clean slate. */
	build: (ctx: PresetContext) => TxDraft
}

const withSampleInputs = (ctx: PresetContext, count = 1): TxDraft => ({
	...createDefaultDraft(),
	inputs: SAMPLE_UTXOS.slice(0, count).map(utxo => structuredClone(utxo)),
	changeAddress: ctx.address
})

export const TX_PRESETS: TxPreset[] = [
	{
		id: 'simple-transfer',
		name: 'Simple ADA transfer',
		description: 'One input, one recipient, change back to the sender.',
		icon: 'lucide:arrow-right-left',
		build: ctx => {
			const draft = withSampleInputs(ctx)
			draft.outputs = [{ address: SAMPLE_RECIPIENT, amount: [{ unit: 'lovelace', quantity: '100000000' }] }]
			return draft
		}
	},
	{
		id: 'multi-asset',
		name: 'Multi-asset send',
		description: 'Send ADA plus a native token in the same output.',
		icon: 'lucide:coins',
		build: ctx => {
			const draft = withSampleInputs(ctx)
			draft.outputs = [
				{
					address: SAMPLE_RECIPIENT,
					amount: [
						{ unit: 'lovelace', quantity: '5000000' },
						{ unit: 'e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed724d494e', quantity: '150000000' }
					]
				}
			]
			return draft
		}
	},
	{
		id: 'hydra-l2',
		name: 'Hydra L2 transfer',
		description: 'Hydra mode on — fee-less, unbalanced transactions are allowed inside a head.',
		icon: 'lucide:waves',
		build: ctx => {
			const draft = withSampleInputs(ctx)
			draft.isHydra = true
			draft.withCustomFee = true
			draft.customFee = '0'
			draft.outputs = [{ address: SAMPLE_RECIPIENT, amount: [{ unit: 'lovelace', quantity: '10000000' }] }]
			return draft
		}
	},
	{
		id: 'inline-datum',
		name: 'Output with inline datum',
		description: 'Pay to a script address carrying an inline datum (Constr(0, [])).',
		icon: 'lucide:file-code',
		build: ctx => {
			const draft = withSampleInputs(ctx)
			draft.outputs = [
				{
					address: SAMPLE_RECIPIENT,
					amount: [{ unit: 'lovelace', quantity: '3000000' }],
					// Constr(0, []) — the canonical "unit" datum.
					inlineDatum: 'd87980'
				}
			]
			return draft
		}
	},
	{
		id: 'metadata',
		name: 'Transaction with metadata',
		description: 'A CIP-20 transaction message under label 674.',
		icon: 'lucide:tag',
		build: ctx => {
			const draft = withSampleInputs(ctx)
			draft.outputs = [{ address: SAMPLE_RECIPIENT, amount: [{ unit: 'lovelace', quantity: '2000000' }] }]
			draft.metadata = [{ id: 'preset-meta', label: '674', json: '{\n  "msg": ["Built with Hydra SDK"]\n}' }]
			return draft
		}
	},
	{
		id: 'mint',
		name: 'Mint a native token',
		description: 'Mint 1000 HYDRA under a sig policy derived from the current address.',
		icon: 'lucide:sparkles',
		build: ctx => {
			const draft = withSampleInputs(ctx)
			// A real, self-consistent `sig` policy so the preset builds as-is: the
			// policy script is the address' own payment key hash, and the policy id
			// is that script's hash. Submitting it still needs a signature from the
			// same key, which is exactly what the sig policy encodes.
			const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(ctx.address)
			const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
			draft.outputs = [
				{
					address: ctx.address,
					amount: [
						{ unit: 'lovelace', quantity: '2000000' },
						{ unit: `${policyId}${MINT_ASSET_NAME_HEX}`, quantity: '1000' }
					]
				}
			]
			draft.mints = [
				{
					id: 'preset-mint',
					policyId,
					assetName: MINT_ASSET_NAME_HEX,
					quantity: '1000',
					scriptType: 'Native',
					scriptCborHex,
					redeemerMode: 'none',
					redeemerCborHex: ''
				}
			]
			return draft
		}
	}
]
