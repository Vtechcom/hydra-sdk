import * as CardanoWASM from '@emurgo/cardano-serialization-lib-browser'
export default CardanoWASM

// export class Bip32PrivateKey {
//   private _bip32PrivateKey: CardanoWASM.Bip32PrivateKey

//   constructor(bip32PrivateKey: CardanoWASM.Bip32PrivateKey) {
//     this._bip32PrivateKey = bip32PrivateKey
//   }

//   static fromBytes(bytes: Uint8Array): Bip32PrivateKey {
//     return new Bip32PrivateKey(CardanoWASM.Bip32PrivateKey.from_bytes(bytes))
//   }

//   static fromHex(hex: string): Bip32PrivateKey {
//     return new Bip32PrivateKey(CardanoWASM.Bip32PrivateKey.from_hex(hex))
//   }

//   static fromBip39Entropy(entropy: string, password: string): Bip32PrivateKey {
//     return new Bip32PrivateKey(
//       CardanoWASM.Bip32PrivateKey.from_bip39_entropy(Buffer.from(entropy, 'hex'), Buffer.from(password, 'utf8'))
//     )
//   }

//   toPublic(): CardanoWASM.Bip32PublicKey {
//     return this._bip32PrivateKey.to_public()
//   }

//   derive(derivationIndices: number[]): Bip32PrivateKey {
//     let bip32PrivateKey = this._bip32PrivateKey
//     for (const index of derivationIndices) {
//       bip32PrivateKey = this._bip32PrivateKey.derive(index)
//     }
//     return new Bip32PrivateKey(bip32PrivateKey)
//   }

//   toBytes(): Uint8Array {
//     return this._bip32PrivateKey.as_bytes()
//   }

//   toHex(): string {
//     return this._bip32PrivateKey.to_hex()
//   }

//   toRawKey(): Ed25519PrivateKey {
//     return new Ed25519PrivateKey(this._bip32PrivateKey.to_raw_key())
//   }

//   toEd25519PrivateKey(): Ed25519PrivateKey {
//     return new Ed25519PrivateKey(this._bip32PrivateKey.to_raw_key())
//   }

//   raw(): CardanoWASM.Bip32PrivateKey {
//     return this._bip32PrivateKey
//   }
// }

// export class Bip32PublicKey {
//   private _bip32PublicKey: CardanoWASM.Bip32PublicKey

//   constructor(bip32PublicKey: CardanoWASM.Bip32PublicKey) {
//     this._bip32PublicKey = bip32PublicKey
//   }

//   static fromBytes(bytes: Uint8Array): Bip32PublicKey {
//     return new Bip32PublicKey(CardanoWASM.Bip32PublicKey.from_bytes(bytes))
//   }

//   static fromHex(hex: string): Bip32PublicKey {
//     return new Bip32PublicKey(CardanoWASM.Bip32PublicKey.from_hex(hex))
//   }

//   toRawKey(): CardanoWASM.PublicKey {
//     return this._bip32PublicKey.to_raw_key()
//   }

//   derive(index: number): Bip32PublicKey {
//     return new Bip32PublicKey(this._bip32PublicKey.derive(index))
//   }

//   toBytes(): Uint8Array {
//     return this._bip32PublicKey.as_bytes()
//   }

//   toHex(): string {
//     return this._bip32PublicKey.to_hex()
//   }
// }

// export declare enum Ed25519PrivateKeyType {
//   Normal = 'Normal',
//   Extended = 'Extended'
// }

// export class Ed25519PrivateKey {
//   private _ed25519PrivateKey: CardanoWASM.PrivateKey

//   constructor(ed25519PrivateKey: CardanoWASM.PrivateKey) {
//     this._ed25519PrivateKey = ed25519PrivateKey
//   }

//   /**
//    *
//    * @param bytes normal-bytes
//    * @returns
//    */
//   static fromBytes(bytes: Uint8Array): Ed25519PrivateKey {
//     return new Ed25519PrivateKey(CardanoWASM.PrivateKey.from_normal_bytes(bytes))
//   }

//   static fromHex(hex: string): Ed25519PrivateKey {
//     return new Ed25519PrivateKey(CardanoWASM.PrivateKey.from_hex(hex))
//   }

//   static fromExtendedBytes(bytes: Uint8Array): Ed25519PrivateKey {
//     return new Ed25519PrivateKey(CardanoWASM.PrivateKey.from_extended_bytes(bytes))
//   }

//   toPublic(): CardanoWASM.PublicKey {
//     return this._ed25519PrivateKey.to_public()
//   }

//   sign(message: Uint8Array): CardanoWASM.Ed25519Signature {
//     return this._ed25519PrivateKey.sign(message)
//   }

//   toBytes(): Uint8Array {
//     return this._ed25519PrivateKey.as_bytes()
//   }

//   toHex(): string {
//     return this._ed25519PrivateKey.to_hex()
//   }

//   raw(): CardanoWASM.PrivateKey {
//     return this._ed25519PrivateKey
//   }
// }
