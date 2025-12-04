ID: #1400063
Last updated 3 weeks ago

Share:
Share this on X
Share this on Facebook
Share this on LinkedIn
Share this on Reddit
Share this with...
Hydra SDK – Fast, Modular, WASM Cardano Toolkit
Status:
Onboarding
Problem
Cardano lacks a high-performance, browser-ready SDK for Hydra Layer 2. Current SDKs face polyfill, bundling, and speed issues, slowing DApp adoption and limiting real-time, low-fee use cases.

Solution
Develop a modular, WASM-powered Hydra SDK that works natively in browsers, solves polyfill/bundling issues, and enables fast, scalable Cardano & Hydra Layer 2 DApp development.

Total to date
This is the total amount allocated to Hydra SDK – Fast, Modular, WASM Cardano Toolkit.

₳85,000
Total funds requested


Distributed: ₳0
Remaining: ₳85,000
12/25
01/26
02/26
03/26
Complete
In progress
To be completed
Explore all milestones in-depth
272
Total votes cast

₳102M
Votes yes
₳5.17M
Votes abstain
About this idea
Developer Tools
NB: Monthly reporting was deprecated from January 2024 and replaced fully by the Milestones Program framework. Learn more here

[Proposal setup] Proposal title
Please provide your proposal title

Hydra SDK – Fast, Modular, WASM Cardano Toolkit

[Proposal Summary] Budget Information
Enter the amount of funding you are requesting in ADA

85000

[Proposal Summary] Time
Please specify how many months you expect your project to last

4

[Proposal Summary] Translation Information
Please indicate if your proposal has been auto-translated

No

Original Language

en

[Proposal Summary] Problem Statement
What is the problem you want to solve?

Cardano lacks a high-performance, browser-ready SDK for Hydra Layer 2. Current SDKs face polyfill, bundling, and speed issues, slowing DApp adoption and limiting real-time, low-fee use cases.

[Proposal Summary] Supporting Documentation
Supporting links

https://sdk.hydrawallet.app/
,
https://sdk.hydrawallet.app/getting-started
,
https://github.com/Vtechcom/hydra-sdk-technical-reports
,
https://github.com/Vtechcom/hydra-sdk-technical-reports/blob/main/Polyfill_and_bundling_issues_with_%40cardano-sdk_and_MeshJS.md
,
https://github.com/Vtechcom/hydra-sdk
[Proposal Summary] Project Dependencies
Does your project have any dependencies on other organizations, technical or otherwise?

No

Describe any dependencies or write 'No dependencies'

No dependencies. The project is fully self-contained, developed and maintained by our team without reliance on external organizations or technical dependencies beyond open-source Cardano tools

[Proposal Summary] Project Open Source
Will your project's outputs be fully open source?

Yes

License and Additional Information

The Hydra SDK will be fully open source under the MIT License. All source code, documentation, and build scripts will be publicly available on GitHub, enabling free use, modification, and contribution by the community.

[Theme Selection] Theme
Please choose the most relevant theme and tag related to the outcomes of your proposal

Developer Tools

[Campaign Category] Category Questions
Mention your open source license and describe your open source license rationale.

We will release Hydra SDK under the MIT License. This license is simple, permissive, and widely adopted, allowing anyone to freely use, modify, and distribute the code while encouraging community contributions. It aligns with Cardano’s open innovation spirit and ensures maximum accessibility for developers worldwide

How do you make sure your source code is accessible to the public from project start, and people are informed?

From the beginning, we will host the source code on a public GitHub repository, including all commits, issues, and discussions. Progress updates will be shared via GitHub Releases, Discord, and the Cardano Forum, ensuring transparency and enabling the community to follow, review, and contribute to development at all stages.

How will you provide high quality documentation?

We will maintain a dedicated documentation site built with a modern static site generator (e.g., https://sdk.hydrawallet.app/getting-started) hosted publicly. The docs will include getting-started guides, API references, code examples, and best practices. All documentation will be versioned, peer-reviewed, and updated in parallel with feature development to ensure clarity, completeness, and accuracy.

[Your Project and Solution] Solution
Please describe your proposed solution and how it addresses the problem

What we will build

Hydra SDK is a modular, WASM‑powered toolkit that makes Cardano wallet development and Hydra Layer 2 integration fast, reliable, and truly browser‑ready. It eliminates polyfill/bundling pain, delivers near‑native cryptography performance, and provides first‑class developer ergonomics with TypeScript types and modern build compatibility.

Packages delivered (published on npm):

@hydra-sdk/core — HD wallet, key/addr derivation, tx signing, data signing (CIP‑8), submission, custom fetcher/submitter support.
@hydra-sdk/transaction — high‑level TxBuilder (CIP‑2 coin selection, multi‑asset, Plutus V1/V2/V3, mint/burn, certificates, withdrawals, validity range).
@hydra-sdk/bridge — HydraBridge for Head lifecycle, UTxO snapshot/query, submitTxSync, commit/decommit, recover, with WebsocketConnector and HexcoreConnector (Socket.IO + JWT).
@hydra-sdk/cardano-wasm — thin bindings to cardano-serialization-lib for hashing, CBOR, witnesses, metadata/datum encoding, fees & min‑ADA.
How the solution addresses the problem

Problem → Fix

Browser bundling failures (Node core deps, polyfills) → WASM core, no Node polyfills required; tested configs for Vite/Rollup, Nuxt 3, React+Vite, Next.js (top‑level await, wasm experiments, fallback shims).
Slow JS crypto/serialization → WASM for Ed25519, CBOR, address ops; internal benchmarks target order‑of‑magnitude speedups vs polyfilled JS.
No Hydra‑ready SDK → Built‑in HydraBridge with events & commands covering the full Head lifecycle; snapshot UTxO access and L2 tx flow.
Fragmented dev experience → Consistent TypeScript APIs, comprehensive docs, quick starts, and production‑grade examples.
Technical approach & architecture

WASM at the core: Uses cardano-serialization-lib via WebAssembly for crypto, serialization, addresses, and fee calculations, ensuring the same binary works in Node, browsers, and RN.
Package graph (simplified): App → core, transaction, bridge; each depends on cardano-wasm where needed. Modular install keeps bundles small.


Wallet API (core):
AppWallet from mnemonic/root/CLI keys; getAccount() returns base/enterprise/reward addresses + keys.

signTx, signTxs, signData (CIP‑8), submitTx.

Pluggable IFetcher/ISubmitter (e.g., Blockfrost, Ogmios, or your backend).

Hydra (bridge):
Connect via url (WebSocket) or HexcoreConnector (Socket.IO + JWT).

Event stream: HeadIsInitializing/Open/Closed/Final, TxValid/TxInvalid, SnapshotConfirmed.

Commands: init/close/abort/fanout/contest/recover/newTx/decommit, plus submitTxSync with timeouts & retries.

Helpers: headInfo(), getProtocolParameters(), querySnapshotUtxo(), queryAddressUTxO(), addressesInHead().

Transactions (transaction):
Fluent TxBuilder: txOut, txIn/Collateral, mint/mintingScript, datum/redeemer, requiredSignerHash, changeAddress, complete().

Hydra mode: build against Head params; submit via HydraBridge for realtime, low‑fee flows.

Build configurations provided:
Nuxt 3 / Vue / React (Vite) and Next.js snippets (WASM + top‑level‑await, exclude @hydra-sdk/cardano-wasm from optimizeDeps, minimal fallbacks for buffer on web).

Security posture:
Keys remain client‑side; examples emphasize secure handling (no plaintext mnemonic storage), optional password‑based encryption helpers from WASM package.

Performance targets:
Faster tx (de)serialization & signing, smaller bundles (no heavy polyfills), and reduced cold‑start compared to JS‑only stacks.

[Your Project and Solution] Impact
Please define the positive impact your project will have on the wider Cardano community

Positive Impact on the Cardano Community

1. Lowering Barriers to Entry for Developers

Hydra SDK will remove the current technical roadblocks (polyfill, bundling, performance bottlenecks) that make Cardano/Hydra development in browsers complex and error-prone. By providing a modern, modular, WASM-powered toolkit with ready-to-use templates for Vite, Nuxt 3, Next.js, and React, developers from both Web2 and Web3 can onboard quickly without needing deep knowledge of Cardano internals.

2. Accelerating Hydra Layer 2 Adoption

This SDK is one of the first to offer native Hydra Layer 2 integration at the API level, allowing developers to connect to Hydra Heads, query UTxO snapshots, and submit L2 transactions with the same ease as L1. This will directly support the growth of real-time, low-fee applications such as gaming, micropayments, decentralized trading, and high-frequency DeFi protocols—showcasing Cardano's competitive advantage.

3. Expanding the Ecosystem’s Application Diversity

With fast transaction building and submission, developers can implement use cases previously impractical on L1 due to latency and cost. This opens the door to entire new categories of DApps—real-time multiplayer games, instant settlement marketplaces, live auction platforms—that will bring more users and engagement into the Cardano ecosystem.

4. Open Source and Community Collaboration

Released under the MIT License, all source code, documentation, and examples will be publicly available from day one. This encourages transparency, trust, and community contributions. Developers can fork, extend, and adapt the SDK for their own needs, fostering an environment of shared innovation.

5. Strengthening Cardano’s Position in the Broader Blockchain Space

By providing a high-performance, browser-ready development kit, Cardano positions itself as a leading platform for modern, real-time blockchain applications. The SDK’s architecture—cross-compatible with Node.js, browsers, and mobile—aligns with global development trends, making Cardano more appealing to mainstream developers.

6. Educational Value and Developer Empowerment

The SDK will come with comprehensive, high-quality documentation, API references, and working code examples. This not only supports active developers but also serves as a learning resource for newcomers, universities, and blockchain bootcamps exploring Cardano and Hydra technology.

7. Long-Term Sustainability and Ecosystem Growth

Because Hydra SDK is modular and designed for maintainability, it can evolve alongside Hydra protocol updates and Cardano improvements. The open governance model will allow it to adapt to community needs, ensuring its relevance for future dApp developers and contributing to sustained ecosystem expansion.

[Your Project and Solution] Capabilities & Feasibility
What is your capability to deliver your project with high levels of trust and accountability? How do you intend to validate if your approach is feasible?

Capabilities and Experience with Hydra Technology

We have directly deployed and operated alpha-stage products utilizing the latest Hydra technology, version v0.22, provided by the IOG development team, in order to practically validate Hydra’s performance and stability prior to its official release, including:

Hydra Wallet – A lightweight wallet with integrated web and Telegram interfaces, directly connected to a Hydra Head. Link: https://hydrawallet.app/
Hydra FastPay – An ultra-fast ADA/token payment application powered by Hydra. Link: https://hydrawallet.app/marketplace/hydra-fastpay-en
Rock Paper Scissors Game – A multi-step game integrating commit–reveal mechanics and reward distribution on Hydra. Link: https://hydrawallet.app/marketplace/rock-paper-scissors
Hydra Explorer Tool – A data exploration and analysis tool for Hydra applications. Link: https://explorer.hydrawallet.app/
In addition, we are developing many other DApps on our roadmap, which will be launched on the Hydra App Marketplace.

Link: https://hydrawallet.app/marketplace

These products not only demonstrate our development capabilities but also serve as proof of our ability to implement real-world Layer 2 dApps on Hydra, while giving us deep insights into the challenges developers face. The Hydra Wallet SDK is designed based on these very experiences and practical needs.

Contribution to the Hydra Community

Our technical team has worked extensively and directly with members of the Hydra development team at IOG through:

Bug reports
Feature requests
Testing and verifying real-world technical issues
Evidence: Our GitHub account aniadev has created and discussed many technical issues with the Hydra team, including:

Validation issues with Aiken built-in functions and validity_range:

https://github.com/cardano-scaling/hydra/issues/2162

Intermittent DepositExpired errors before deadline:

https://github.com/cardano-scaling/hydra/issues/2144

Feature request: Allow partial ADA commit from UTxO:

https://github.com/cardano-scaling/hydra/issues/2140

Hydra Head Not Confirming Snapshot UTxO After TxValid When Interacting with Contract Using inlineDatum:

https://github.com/cardano-scaling/hydra/issues/2113

Full list of our technical reports:

https://github.com/cardano-scaling/hydra/issues?q=author%3Aaniadev

This demonstrates that we are not only Hydra users but also active contributors to improving and refining the protocol.

Project Feasibility

The project is built upon real-world experiments, thoroughly analyzed from a technical perspective, and divided into well-defined functional modules.

The community can review the detailed report here:

https://github.com/Vtechcom/hydrawallet-sdk-technical-reports

Each component can be developed, tested, and deployed independently. The project’s core team is expected to include:

01 Project Manager (10+ years of experience)
04 Lead Developers (2–5+ years of experience)
01 QA Specialist (8+ years of experience)
If necessary, we will allocate additional internal resources to ensure the project’s schedule and quality.

Commitment to Delivery and Refund

We commit to:

Completing the project on schedule.
Ensuring technical quality, stability, and scalability.
Delivering an open-source, transparent, maintainable product with long-term support.
If we are unable to deliver as committed, we will return the entire ADA amount funded by Catalyst.

[Milestones] Project Milestones
Milestone Title

Platform Setup, Cardano WASM Integration & Basic Wallet Functions

Milestone Outputs

Project structure configured (pnpm-workspace.yaml, turbo.json, tsconfig).
Development tools setup (ESLint, Prettier, Tailwind, Vitest).
@hydra-sdk/cardano-wasm package created with basic WASM bindings and simple transaction support (send/receive ADA/tokens).
@hydra-sdk/core package created with basic wallet operations (wallet creation, account management, key storage) integrated with cardano-wasm.
Basic API documentation for both packages.
Initial unit tests for cardano-wasm and core.
Acceptance Criteria

Codebase builds successfully with configured development environment.

cardano-wasm can create, sign, and submit a basic transaction on Cardano testnet.

core can generate a wallet, store keys, and connect to cardano-wasm for transactions.

All basic APIs documented in Markdown format.

Minimum 80% test pass rate for implemented features.

Evidence of Completion

Public GitHub repository with code, documentation, and test results.
Video demonstration of wallet creation and a simple transaction on testnet.
Published npm packages for @hydra-sdk/cardano-wasm and @hydra-sdk/core (initial version).
https://www.npmjs.com/package/@hydra-sdk/transaction/v/1.0.2
https://www.npmjs.com/package/@hydra-sdk/core/v/1.0.2
Delivery Month

1

Cost

25000

Progress

30 %

Milestone Title

Transaction Module & Basic Hydra Integration

Milestone Outputs

@hydra-sdk/transaction package with utilities for transaction building and signing.
Integration of transaction with cardano-wasm for basic Cardano transactions.
@hydra-sdk/bridge package with basic Hydra Layer 2 integration (sending transactions via Hydra).
API documentation for both packages.
Unit tests for transaction creation and Hydra integration.
Acceptance Criteria

transaction can create and sign transactions, returning valid CBOR.

bridge can successfully send a transaction to a running Hydra node in a dev/test environment.

API documentation available and reviewed.

Minimum 80% test pass rate for implemented features

Evidence of Completion

Public GitHub repository updates with code, documentation, and test results.
Video demonstration of sending a transaction through Hydra.
Published npm packages for @hydra-sdk/transaction and @hydra-sdk/bridge (initial version).
https://www.npmjs.com/package/@hydra-sdk/transaction/v/1.0.4
https://www.npmjs.com/package/@hydra-sdk/core/v/1.0.4
https://www.npmjs.com/package/@hydra-sdk/bridge/v/1.0.5
Delivery Month

1

Cost

25000

Progress

60 %

Milestone Title

Advanced Wallet, Transaction & Bridge Features

Milestone Outputs

Multi-signature wallet support in core.

Asset management (tokens, NFTs) in core.

Smart contract integration in core.

Smart contract transaction support, mint/burn functionality in transaction.

Hydra smart contract interaction via bridge with hexcore-proxy.

Detailed API documentation for all new features.

Comprehensive unit and integration tests for new features

Acceptance Criteria

core can create and use multi-sig wallets, manage tokens/NFTs, and interact with a basic Plutus script.

transaction can mint and burn tokens, and interact with smart contracts.

bridge can handle Hydra smart contract interactions.

Documentation updated with detailed examples.

Minimum 85% test pass rate for implemented features

Evidence of Completion

Public GitHub repository updates with code, documentation, and test results.
Video demo showing a multi-sig wallet transaction and Hydra smart contract interaction.
Updated npm packages for @hydra-sdk/core, @hydra-sdk/transaction, and @hydra-sdk/bridge.
Delivery Month

1

Cost

20000

Progress

80 %

Milestone Title

Finalization, Optimization & Public Release

Milestone Outputs

Complete usage documentation (README, API Reference, Tutorials).

Performance optimizations across all packages.

Full integration tests across modules.

Documentation website built and deployed.

Final SDK packages published to npm.

Feedback collection mechanism from early adopters.

Acceptance Criteria

Documentation site live with all API references and guides.

All performance benchmarks meet or exceed set targets.

Full test coverage (≥85%) across the SDK.

Public npm release for all SDK modules.

Feedback form/issue tracking system operational.

Evidence of Completion

Live documentation site URL.

GitHub repository with final code and test reports.

Public npm packages for all SDK components.

Report summarizing feedback from at least 5 early adopters.

Delivery Month

1

Cost

20000

Progress

100 %

[Final Pitch] Budget & Costs
Please provide a cost breakdown of the proposed work and resources

The total proposed budget for this project is 85,000 ADA (equivalent to 59,500 USD at an exchange rate of ADA = 0.70 USD).

This budget is calculated based on the actual workload, the required expertise, and the resources needed to deliver a high-quality Hydra SDK and related tools as open-source software.

1. Personnel Costs (80% – 68,000 ADA)

The project will require the following team members:

Project Manager (PM) – 1 person for 6 months
Lead Blockchain Engineer – 1 person for 6 months
Blockchain Developer – 1 person for 6 months
Backend Developer – 1 person for 6 months
Frontend Developer / SDK Documentation Engineer – 1 person for 3 months
QA Engineer – 1 person for 3 months
2. Infrastructure & Tools (10% – 8,500 ADA)

Server rental for Hydra node & testing environment: 5,000 ADA
CI/CD tools & automated testing: 2,500 ADA
API & monitoring services: 1,000 ADA
3. Contingency Fund (10% – 8,500 ADA)

Reserved for unforeseen technical challenges, protocol changes in Hydra, and potential ADA–USD exchange rate risks.
All deliverables will be released as open-source, accompanied by documentation and public usage guides for the Cardano developer community.

[Final Pitch] Value for Money
How does the cost of the project represent value for the Cardano ecosystem?

This project will deliver high value to the Cardano ecosystem for the following reasons:

Direct impact on the ecosystem – By creating a Hydra SDK with clear APIs, integration examples, and developer-focused documentation, we will significantly lower the entry barrier for dApp developers building on Hydra Layer 2. This will accelerate adoption and foster innovation in low-latency Cardano applications.
Proven hands-on Hydra experience – Our team has already worked extensively with Hydra, ensuring that we can deliver practical, production-ready solutions with minimal startup time.
Cost efficiency – The budget is primarily focused (80%) on technical development time and effort, with minimal operational overhead, thus maximizing the effectiveness of Catalyst funding.
Open-source & long-term benefits – The SDK will be fully open-source, enabling:
Developers to reuse and extend it without licensing barriers.
Reduced development cycles for new Hydra-based dApps.
Greater ecosystem resilience as more projects adopt the same open-source foundation.
Community contribution & collaboration – We actively collaborate with the Hydra core team (IOG), reporting bugs, suggesting features, and providing technical feedback to ensure the SDK aligns with real developer needs.
With a one-time investment of 85,000 ADA, Catalyst will fund a strategic, reusable, and open-source infrastructure component capable of accelerating the growth of dozens of Hydra projects in the future – multiplying the value of the initial investment many times over.

[Required Acknowledgements] Consent & Confirmation
Terms and Conditions:

Yes
