---
title: Hướng Dẫn Mint và Burn Token
description: Hướng dẫn cách mint và burn token trên nền tảng Cardano với Hydra SDK
---

# Hướng Dẫn Mint và Burn Token

Hướng dẫn toàn diện này sẽ dạy bạn cách mint (tạo) và burn (hủy) native token trên blockchain Cardano sử dụng Hydra SDK. Bạn sẽ học cách tạo token tùy chỉnh với metadata, quản lý minting policy, và hủy token một cách đúng đắn khi cần thiết.

## 📚 Yêu Cầu Trước Khi Bắt Đầu

Trước khi bắt đầu, đảm bảo bạn có:
- Hiểu biết cơ bản về các khái niệm blockchain Cardano
- Môi trường phát triển Node.js và TypeScript
- Đã cài đặt và cấu hình Hydra SDK
- Truy cập vào Cardano testnet (Preprod) để testing

## 🏗️ Thiết Lập Dự Án

### Cài Đặt Dependencies

```bash
npm install @hydra-sdk/core @hydra-sdk/transaction @hydra-sdk/cardano-wasm
```

### Import Các Module Cần Thiết

```typescript
import {
  AppWallet,
  DatumUtils,
  Deserializer,
  NETWORK_ID,
  ParserUtils,
  PolicyUtils,
  Serializer
} from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
```

## 💰 Thiết Lập Ví

Đầu tiên, tạo instance ví để ký giao dịch:

```typescript
const wallet = new AppWallet({
  key: {
    type: 'mnemonic',
    words: 'your twelve word mnemonic phrase goes here like this example'.split(' ')
  },
  networkId: NETWORK_ID.PREPROD // Sử dụng PREPROD để testing
})

const walletAddress = wallet.getAccount().baseAddressBech32
console.log('Địa Chỉ Ví:', walletAddress)
```

::alert{type="warning"}
**Lưu Ý Bảo Mật**: Không bao giờ sử dụng mnemonic phrase thật trong production code. Hãy sử dụng biến môi trường hoặc quản lý key an toàn.
::

## 🔨 Mint Token

### Bước 1: Query UTxO và Thiết Lập Collateral

```typescript
async function mintToken() {
  // Query các UTxO có sẵn
  console.log('>>> Đang query UTxO...', walletAddress)
  const utxos = await wallet.queryUTxOs(walletAddress)
  console.log(`>>> Tìm thấy ${utxos.length} UTxO`)

  // Tìm UTxO phù hợp làm collateral (>= 5 ADA)
  const collateralUTxOs = utxos.filter(u =>
    u.output.amount.find(a => 
      a.unit === 'lovelace' && Number(a.quantity) >= 5_000_000
    )
  )

  if (!collateralUTxOs.length) {
    throw new Error('Không tìm thấy collateral UTxO')
  }
  
  const collateralUTxO = collateralUTxOs[0]
  // ...tiếp tục bên dưới
}
```

### Bước 2: Tạo Minting Policy và Chi Tiết Token

```typescript
// Tạo minting policy từ địa chỉ ví
const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
const assetNameHex = ParserUtils.stringToHex('AniaToken')

// Định nghĩa metadata token (chuẩn CIP-25)
const assetMetadata = {
  name: 'Ada Binary Option Token',
  description: 'Utility token cho dự án demo Cardano Binary Option',
  ticker: 'tABO',
  url: 'https://preprod.ada-defi.io.vn',
  logo: 'ipfs://Qmaqj4Lg51s9gL654zwFfcimHNcX4GLno7okEdyCGPor2i',
  image: 'ipfs://Qmaqj4Lg51s9gL654zwFfcimHNcX4GLno7okEdyCGPor2i'
}

console.log('Policy ID:', policyId)
console.log('Tên Asset (hex):', assetNameHex)
```

### Bước 3: Xây Dựng và Gửi Giao Dịch Mint

```typescript
const txBuilder = new TxBuilder()

const tx = await txBuilder
  // Set input (loại trừ collateral UTxO)
  .setInputs(
    utxos.filter(u =>
      `${u.input.txHash}#${u.input.outputIndex}` !== 
      `${collateralUTxO.input.txHash}#${collateralUTxO.input.outputIndex}`
    )
  )
  // Mint 1,000,000 token (6 chữ số thập phân = 1 token)
  .mint('1000000', policyId, assetNameHex)
  // Đính kèm minting script
  .mintingScript({
    type: 'Native',
    scriptCborHex: scriptCborHex
  })
  // Thêm metadata (CIP-25 cho NFT/token)
  .metadataValue(721, { 
    [policyId]: { 
      [assetNameHex]: { ...assetMetadata } 
    } 
  })
  // Set collateral cho việc thực thi script
  .txInCollateral(
    collateralUTxO.input.txHash,
    collateralUTxO.input.outputIndex,
    collateralUTxO.output.amount,
    collateralUTxO.output.address
  )
  // Output: gửi token đã mint đến ví
  .addOutput({
    address: walletAddress,
    amount: [
      { unit: 'lovelace', quantity: String(2_000_000) },
      { 
        unit: Serializer.serializeAssetUnit(policyId, assetNameHex), 
        quantity: '1000000' 
      }
    ]
  })
  .changeAddress(walletAddress)
  .complete()

// Ký và gửi giao dịch
const signedCbor = await wallet.signTx(tx.to_hex())
console.log('Giao Dịch Đã Ký:', signedCbor)
console.log('ID Giao Dịch:', Deserializer.deserializeTx(signedCbor).transaction_hash().to_hex())
```

## 🔥 Burn Token

Burn token sẽ loại bỏ chúng vĩnh viễn khỏi lưu thông. Điều này hữu ích cho các cơ chế deflationary hoặc loại bỏ token không mong muốn.

### Triển Khai Burn Hoàn Chỉnh

```typescript
async function burnToken() {
  // Query UTxO (giống như minting)
  const utxos = await wallet.queryUTxOs(walletAddress)
  const collateralUTxOs = utxos.filter(u =>
    u.output.amount.find(a => 
      a.unit === 'lovelace' && Number(a.quantity) >= 5_000_000
    )
  )
  
  if (!collateralUTxOs.length) {
    throw new Error('Không tìm thấy collateral UTxO')
  }
  
  const collateralUTxO = collateralUTxOs[0]
  
  // Cùng policy và chi tiết asset
  const scriptCborHex = PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
  const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
  const assetNameHex = ParserUtils.stringToHex('AniaToken')
  
  const txBuilder = new TxBuilder()
  
  const tx = await txBuilder
    .setInputs(
      utxos.filter(u =>
        `${u.input.txHash}#${u.input.outputIndex}` !== 
        `${collateralUTxO.input.txHash}#${collateralUTxO.input.outputIndex}`
      )
    )
    // Số lượng âm = burn token
    .mint('-1000000', policyId, assetNameHex)
    .mintingScript({
      type: 'Native',
      scriptCborHex: scriptCborHex
    })
    .changeAddress(walletAddress)
    .complete()
    
  const signedCbor = await wallet.signTx(tx.to_hex())
  console.log('ID Giao Dịch Burn:', Deserializer.deserializeTx(signedCbor).transaction_hash().to_hex())
}
```

## 📊 Nâng Cao: Làm Việc Với Datum

Đối với các kịch bản phức tạp hơn, bạn có thể cần làm việc với cấu trúc dữ liệu Plutus:

```typescript
import { DatumUtils } from '@hydra-sdk/core'

const buildDatum = (
  key: string, 
  l1Vkh: string, 
  l2Vkh: string, 
  amount: string
): CardanoWASM.PlutusData => {
  // Tạo constructor lồng nhau với key và verification key hash
  const bKey = DatumUtils.mkBytes(key)
  const cL1Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l1Vkh)])
  const cL2Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l2Vkh)])
  
  const constrKey = DatumUtils.mkConstr(0, [bKey, cL1Vkh, cL2Vkh])
  const wrap1 = DatumUtils.mkConstr(0, [constrKey])
  
  // Tạo cấu trúc map lồng nhau: { "" => { "" => amount } }
  const emptyBytes = DatumUtils.mkBytes('')
  const mapVal = CardanoWASM.PlutusMapValues.new()
  mapVal.add(DatumUtils.mkInt(amount))
  const innerMap = DatumUtils.mkMap([[emptyBytes, mapVal]])
  
  const outerMapVal = CardanoWASM.PlutusMapValues.new()
  outerMapVal.add(innerMap)
  const outerMap = DatumUtils.mkMap([[emptyBytes, outerMapVal]])
  
  return DatumUtils.mkConstr(0, [wrap1, outerMap])
}

// Sử dụng trong giao dịch
const datum = buildDatum(
  'ee91e90e791e4cd983d1b1f331d1e8eb',
  '326cd6bff6114c4d14ebf2385883aac43c4e64476e6a47314f9b2003',
  'f602ad4b16ec2e1a96989dc140eacf546359695cfece8510c8d1c0ac',
  '4000000'
)

// Debug:
console.log('Datum (json):', datum.to_json(DatumUtils.DatumSchema.Detailed))

```

## ⚠️ Những Điều Quan Trọng Cần Lưu Ý

### Thực Hành Bảo Mật Tốt Nhất

1. **Test Trên Preprod Trước**: Luôn test logic mint/burn trên testnet
2. **Validate Input**: Kiểm tra tính khả dụng và số lượng UTxO trước khi xây dựng giao dịch
3. **Xử Lý Lỗi**: Triển khai xử lý lỗi đúng đắn cho network và transaction failure
4. **Quản Lý Key An Toàn**: Sử dụng hardware wallet hoặc lưu trữ key an toàn trong production

### Những Lỗi Thường Gặp

1. **Collateral Không Đủ**: Đảm bảo bạn có đủ ADA cho collateral (≥5 ADA)
2. **Policy ID Nhất Quán**: Sử dụng cùng policy để mint và burn cùng một token
3. **Encoding Tên Asset**: Nhớ chuyển đổi tên asset sang định dạng hex
4. **Lựa Chọn UTxO**: Loại trừ đúng cách collateral UTxO khỏi transaction input

### Gas và Phí

- Giao dịch mint yêu cầu phí cao hơn do thực thi script
- Collateral UTxO được trả lại nếu giao dịch thành công
- Xem xét tắc nghẽn mạng khi đặt phí

## 🎯 Ví Dụ Hoàn Chỉnh

Đây là ví dụ hoàn chỉnh có thể hoạt động:

```typescript
import {
  AppWallet,
  DatumUtils,
  Deserializer,
  NETWORK_ID,
  ParserUtils,
  PolicyUtils,
  Serializer
} from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

// Khởi tạo ví
const wallet = new AppWallet({
  key: {
    type: 'mnemonic',
    words: 'enable away depend exist mad february table onion census praise spawn pipe again angle grant'.split(' ')
  },
  networkId: NETWORK_ID.PREPROD
})

const walletAddress = wallet.getAccount().baseAddressBech32

// Thực hiện mint hoặc burn
async function main() {
  console.log('Địa Chỉ Ví:', walletAddress)
  
  // Uncomment thao tác bạn muốn thực hiện
  await mintToken()
  // await burnToken()
}

main().catch(console.error)
```

## 🔗 Các Bước Tiếp Theo

Sau khi thành thạo mint và burn token, hãy khám phá:
- **Tạo NFT**: Học cách tạo non-fungible token độc nhất
- **Multi-signature Policy**: Triển khai policy yêu cầu nhiều chữ ký
- **Time-locked Policy**: Tạo token với hạn chế mint theo thời gian
- **Plutus Script**: Scripting nâng cao cho logic mint phức tạp

---

*Hướng dẫn này cung cấp nền tảng cho các thao tác token trên Cardano. Luôn test kỹ lưỡng và tuân thủ thực hành bảo mật tốt nhất trong môi trường production.*
