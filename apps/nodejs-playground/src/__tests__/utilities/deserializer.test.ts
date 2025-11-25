import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { Deserializer } from '@hydra-sdk/core'
const { deserializeAddress } = Deserializer

describe('Deserializer', () => {
	it('Deserializer Base Address: addr_test1q...ne56q3', () => {
		const address =
			'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3'
		const result = deserializeAddress(address)
		expect(result).toEqual({
			kind: CardanoWASM.AddressKind.Base,
			credentialKind: CardanoWASM.CredKind.Key,
			paymentCredentialHash: 'e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebf',
			stakeCredentialHash: 'eee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd'
		})
	})
	it('Deserializer Enterprise Address: addr_test1v...ffakz', () => {
		const address = 'addr_test1vq6zh05zfhj3k37azkpd933rla0fw7tpfwh84mal834nf7czffakz'
		const result = deserializeAddress(address)
		expect(result).toEqual({
			kind: CardanoWASM.AddressKind.Enterprise,
			credentialKind: CardanoWASM.CredKind.Key,
			paymentCredentialHash: '342bbe824de51b47dd1582d2c623ff5e9779614bae7aefbf3c6b34fb'
		})
	})
	it('Deserializer Script Address: addr_test1w...t9fsgx', () => {
		const address = 'addr_test1wr5dx9xptsn4cx0lycfvtgdsvevk862umjp9vjhzvqhdupct9fsgx'
		const result = deserializeAddress(address)
		expect(result).toEqual({
			kind: CardanoWASM.AddressKind.Enterprise,
			credentialKind: CardanoWASM.CredKind.Script,
			scriptHash: 'e8d314c15c275c19ff2612c5a1b0665963e95cdc82564ae2602ede07'
		})
	})
})
