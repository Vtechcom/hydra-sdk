import { NETWORK_ID } from '@hydra-sdk/core'

export type WalletConfig = {
	mnemonic: string
	network: (typeof NETWORK_ID)[keyof typeof NETWORK_ID]
}

export function useWalletConfig() {
	const walletConfig = useState<WalletConfig>('walletConfig', () => ({
		mnemonic: '',
		network: NETWORK_ID.PREPROD
	}))

	return {
		walletConfig
	}
}
