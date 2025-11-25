import { HydraApi, wallet, walletAddress } from './common'

async function main() {
	console.log('>>> walletAddress:', walletAddress)
	const commitTx = await HydraApi.commit({})
	if (commitTx) {
		const signedTx = await wallet.signTx(commitTx.cborHex, true)
		console.log('>>> Signed partial commit tx:', { ...commitTx, cborHex: signedTx })
		/**
         * >>> Signed partial commit tx: {
            cborHex: '84a600d901028182582025ff6624827a0fbd93f691fd5b395a6ef1c9e573e8009464bd0f19a18f010052010dd901028182582025ff6624827a0fbd93f691fd5b395a6ef1c9e573e8009464bd0f19a18f010052010182a300581d70ae01dade3a9c346d5c93ae3ce339412b90a0b8f83f94ec6baa24e30c011a001070fc028201d818582cd8799f581c5f873221eb2288eddbe63adef6187d8dc25a8d353a39718b6a37b5881b00000199c0439a4e80ff82581d6067b499913a7169d504d7887c99b1ff862d980b6f3ad5683c6394cde01a2b579ef0021a0002b409031a0635b8050758209037ac2528c541555d05a24b308fdfbc815ff54f228f4d09cc6d8b4b366570b8a100d901028282582091ebb8c454f37fd86161aeba2d6b8404f4ba030fb97543f0f5bf6dd2fbcdfddc58409784af70d622e478186aaf94b28e2e960f45b49c803d63e08a6b0f1e79cad4b9d10b4bf0c2c99e5cc66995fb0483b94520cea74fbc42ae7d66ca03370e5f7d0282582028c8f378ae7928d8605cc34aff7051d3affdf3e144ae4a638fbe66c80dd8227858406a038e5dd68bb422a9d1c8ad4549239baf78629671fb056fd69cb23751e31ac0ff4b8b91fa15ed9c414da09a6cbbad9d960c1f842fff6c3c0781987e7a48ed08f5d90103a100a119d90371487964726156312f4465706f7369745478',
            description: '',
            txId: '8e3ced7e07087bb8c90b7070d9408d5756083d990f38a869f78f05efefab0e68',
            type: 'Tx ConwayEra'
            }
         */
	}
}

main()
