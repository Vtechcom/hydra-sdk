export interface ISubmitter {
	/**
	 * @param tx - Transaction in hex format (CBOR)
	 * @returns Transaction hash
	 */
	submitTx(tx: string): Promise<string>
}
