---
'@hydra-sdk/core': minor
---

Derive and sign with change-address keys (`m/1852'/1815'/account'/1/index`).

**Core**

- `buildKeys`, `EmbeddedWallet.getAccount/signTx/signData` and `AppWallet.getAccount/getPaymentAddress/getEnterpriseAddress/signTx` take an optional `role` (`PaymentRole`, `0 | 1`) after `keyIndex`: `0` is the external chain (receive addresses), `1` the internal chain (change addresses). It defaults to `0`, so existing calls derive the same keys and addresses as before. Only the payment key moves to the chosen chain; the stake key stays on `m/…/2/keyIndex`. Any other role throws.
- `PaymentRole` is exported as a type.
