/**
 * Shared fixtures for `@hydra-sdk/core` unit tests.
 *
 * Unless noted otherwise, derived values were computed once with CSL
 * (`@emurgo/cardano-serialization-lib` via `@hydra-sdk/cardano-wasm`) from the
 * inputs listed here, and hashes were cross-checked with `@noble/hashes`
 * blake2b (dkLen 28 for key/script hashes).
 */

// Test-only mnemonic — DO NOT USE IN PRODUCTION.
export const TEST_MNEMONIC = (
	'member genius submit circle suggest square ivory stem evidence snow rack festival faculty recipe amazing ' +
	'cliff warrior mistake screen humor chat night glad weather'
).split(' ')

/** Values derived from TEST_MNEMONIC at m/1852'/1815'/0'/0/0 (payment) and m/1852'/1815'/0'/2/0 (stake). */
export const TEST_WALLET = {
	/** 96-byte BIP32 root key (prv | pub | chaincode) */
	rootKeyHex:
		'30a7e40c1cf43c40b602cc10ae6fcfc59314ed6631b5e241f278eeed65f3a9576d91244c42c93b41e5edc213c0f892da25d0d286d5133d1db290a57c44ecd7cd7842decc7f140e80a6c1437756a96049b3c0583e16aeb417b74a861d24a11698',
	/** 64-byte payment key (prv | chaincode) */
	paymentKeyHex:
		'885edd05a70aabe1799e01f5a2fac7f6a529a7b8d0b87a43b34ae7797cf3a957ffda50ec3ee078f498fe4919589dca8bc198eb2dd691e3cba9c50b93792487ff',
	stakeKeyHex:
		'8823df2bc6846741086e914c2ce9e709432841262e174c0778104bba77f3a9575354a3004874d3bc0ad9b1764a408fc59cc60a7dd6a47cae74af758700751e9b',
	paymentPubKeyHex: '473447e8eae7633b31e83a55a3512f955c429379872b132e175ecaff4a73d70c',
	/** blake2b-224(paymentPubKey) */
	paymentKeyHash: '89d2fa514215fb063a7efca89fe9cd7447c857fe9c880b46240516d0',
	stakeKeyHash: '39065ca955fdf0c8025b851e7429895ae766ad42f8165bef04b3d71c',
	baseAddressPreprod:
		'addr_test1qzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq68d0h9',
	enterpriseAddressPreprod: 'addr_test1vzya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5q95da34',
	rewardAddressPreprod: 'stake_test1uqusvh9f2h7lpjqztwz3uapf39dwwe4dgtupvkl0qjeaw8qpkyn0f',
	baseAddressMainnet:
		'addr1qxya97j3gg2lkp360m7238lfe46y0jzhl6wgsz6xysz3d5peqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwqe3s0m6',
	/** base address at m/1852'/1815'/0'/0/1 */
	baseAddressPreprodKey1:
		'addr_test1qryyexckzh9xyhxla2kxkfp0uxehmxn53ml2592wnuxtvy432c94ss6hlazuc0apfyxnzr4pwr5xwjfqstky3tyw77lqqpl74w',
	/** base address at m/1852'/1815'/1'/0/0 */
	baseAddressPreprodAccount1:
		'addr_test1qrezx6j0xvrrmn876da6rd30mhsdnvtjnkhhtk48v8f7kut5ly403ch8r60d24g7dgxju70ddrpsawujlk0420ehcqzss4k9cc'
}

/** A second, unrelated testnet base address (key payment + key stake). */
export const OTHER_ADDRESS =
	'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz'
export const OTHER_ADDRESS_KEY_HASH = '7597146e03ad217819eedb3e420edb84a58f08be64d45597e3ba9ef2'

/** Enterprise script address (testnet) and its payment script hash. */
export const SCRIPT_ADDRESS = 'addr_test1wrf8enqnl26m0q5cfg73lxf4xxtu5x5phcrfjs0lcqp7uagh2hm3k'
export const SCRIPT_ADDRESS_HASH = 'd27ccc13fab5b782984a3d1f99353197ca1a81be069941ffc003ee75'

/**
 * Unsigned Babbage tx: 1 input, 2 outputs.
 * - output 0: 100 ADA to an `addr_test1qrsx72…` base address
 * - output 1: 99.828339 ADA + 10000 × `0836…e05f` / asset name "tRPS" (hex `74525053`)
 */
export const UNSIGNED_TX = {
	cborHex:
		'84a400d9010281825820a3d36ebe9989d832841c683544a9304d3de3dee218872ca982f7d2770489e01800018282583900e06f2ae361f33815f775b224789025dccc4b6413599224e70841eebfeee790c7bb9c497f716fcec7d92a4d68c27b48c9e301b7c547c653cd1a05f5e1008258390015bc6c82189db95e8eb57107e06b8819b8ddbdb9ae873c8487249825d7ea711f85c8f93a1e1176bac951b6332b0875661c9ffc4547416fc1821a05f34273a1581c0836587ed7cee3c0790e24c930c67f31fc2511a3c25aa66ed205e05fa14474525053192710021a00029e8d075820d36a2619a672494604e11bb447cbcf5231e9f2ba25c2169177edc941bd50ad6ca0f5a0',
	hash: 'f7867871ba75ce5e3c513d1279812556938a281e6098bd1e848b61c31144be98',
	policyId: '0836587ed7cee3c0790e24c930c67f31fc2511a3c25aa66ed205e05f',
	assetNameHex: '74525053',
	/** lovelace summed over both outputs: 100000000 + 99828339 */
	totalLovelace: '199828339',
	tokenQuantity: '10000',
	/** vkey witness of TEST_WALLET's payment key over `hash` (ed25519 is deterministic) */
	paymentWitnessHex:
		'825820473447e8eae7633b31e83a55a3512f955c429379872b132e175ecaff4a73d70c584025db07c26dde09d3e8f54707916d29772a63fc6ebdd5a571e2973f2d66f937dea93c3e7001087a847901c43e685578c1c907bd6373992b8fd0105fa5c2e19000'
}

/**
 * An unapplied Plutus script (single CBOR bytestring, header `5901a2`).
 * Script hash = blake2b-224(languageTag || inner bytes), with tag 0x01/0x02/0x03 for V1/V2/V3.
 */
export const PLUTUS_SCRIPT = {
	cborHex:
		'5901a2010100229800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cdc3a400130080024888966002600460106ea800e266446644b300130060018acc004c034dd5004400a2c80722b300130030018acc004c034dd5004400a2c80722c805900b099192cc004c04400626464b30013008300e3754015159800980418071baa32330010013758602600a44b30010018a6103d87a80008992cc004cdd7980a98091baa001018899ba548000cc0500052f5c113300300330160024040602800280922b30013371e6eb8c03800922010089802800c528201a8b201a899b870014800500d1bad300e00130100018b201c3259800980198061baa0018a5eb7bdb18226eacc040c034dd5000a016323300100137566020602260226022602200444b30010018a60103d87a8000899192cc004cdc8803800c56600266e3c01c006266e9520003301230100024bd7045300103d87a80004039133004004301400340386eb8c038004c04400500f18059baa003300a375400c6eb8c030c024dd50019b874800a2c8038601000260066ea802229344d95900101',
	hashV1: 'f099a0e3f18076f98927e1cec179e8bcef9c643dbd2211cab708ad00',
	hashV2: '36730815e425855ca301274cb9f226ee3c4697321d7695295cc80c7b',
	hashV3: '53e2fe88529d3a2cf38df16e2887da8538bb891e50a9e5a714779ea1'
}

/**
 * Native script `sig(c10e…fe82)` (CBOR `[0, keyHash]`).
 * Policy ID = blake2b-224(0x00 || script CBOR).
 */
export const NATIVE_SIG_SCRIPT = {
	keyHash: 'c10e19cfae1283949ec4b98a8e8ed9dbedafc00e419c8dc82d61fe82',
	cborHex: '8200581cc10e19cfae1283949ec4b98a8e8ed9dbedafc00e419c8dc82d61fe82',
	policyId: '09af357417c96d8f26a46560221ee1f1a6d301ce5b675c9d459d3dfa'
}

/** Base address: PLUTUS_SCRIPT (as PlutusV2) payment credential + TEST_WALLET stake key, testnet. */
export const BASE_SCRIPT_ADDRESS =
	'addr_test1zqm8xzq4usjc2h9rqyn5ew0jymhrc35hxgwhd9fftnyqc7eeqew2j40a7ryqyku9re6znz26uan26shczed77p9n6uwq0gw6r7'

/** CIP-19 test vector: testnet pointer address (type 4) and its payment key hash. */
export const POINTER_ADDRESS = 'addr_test1gz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer5pnz75xxcrdw5vky'
export const POINTER_ADDRESS_KEY_HASH = '9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e'
