# @hydra-sdk/mpc

- Per-DApp, seedless, non-custodial embedded wallet for Hydra DApps.
- Identity: tenant-scoped OIDC `issuer + subject`; never email.
- Access and recovery require OAuth + passkey; OAuth-only is forbidden.
- Mandatory 2-of-3: device share (A), coordinator share (B), passkey-protected recovery share (C).
- Routine sign: A+B. Device recovery: B+C. Coordinator rotation/emergency exit: A+C.
- Managed and self-host use the same open coordinator implementation, protocol, schema, and conformance suite.
- Web3Auth is an optional compatibility adapter; no mandatory vendor dependency.
- Reference implementation already proves FROST Ed25519 -> Cardano address/VKey witness -> Hydra submission.
- Packages: `@hydra-sdk/mpc`, `@hydra-sdk/mpc-coordinator`, optional `@hydra-sdk/mpc-web3auth`.
- V1 excludes portable cross-DApp wallets, HD/BIP32, password recovery, OAuth-only recovery, and production 1-of-1/2-of-2.
- Wallet cannot receive funds or sign until passkey enrollment removes every temporary 1-of-1 factor.
- Required hardening: WebAuthn PRF capability gate, replay-safe signing sessions, durable FROST nonce state, transaction policy, tenant isolation, resharing, device revocation, and coordinator migration.

