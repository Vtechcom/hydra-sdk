import { IFetcher } from '../../types/wallet/fetcher'
import { ISubmitter } from '../../types/wallet/submitter'

export abstract class BaseWalletProvider {
	public abstract fetcher: IFetcher
	public abstract submitter: ISubmitter
}
