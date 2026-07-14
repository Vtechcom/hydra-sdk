---
seo:
  title: Hydra Wallet SDK - Cardano & Hydra Development Kit by Vtechcom
  description: Powerful TypeScript SDK for building Cardano and Hydra Layer 2 applications. Complete with wallet connections, transaction building, and Hydra Head management by Vtechcom.
---

::u-page-hero{class="dark:bg-gradient-to-b from-neutral-900 to-neutral-950"}
#top
:hero-background

#headline
  :::u-badge
  ---
  color: primary
  variant: subtle
  size: lg
  ---
  Cardano + Hydra Layer 2
  :::

#title
Build Cardano DApps with [Hydra SDK]{.text-primary}.

#description
A comprehensive software development kit for building Cardano DApps and wallet applications with [Hydra Layer 2]{.text-primary font-semibold} integration.

#links
  :::u-button
  ---
  to: /getting-started
  size: xl
  icon: i-lucide-rocket
  trailing-icon: i-lucide-arrow-right
  ---
  Get Started
  :::

  :::u-button
  ---
  icon: i-simple-icons-github
  color: neutral
  variant: outline
  size: xl
  to: https://github.com/Vtechcom/hydra-sdk
  target: _blank
  ---
  View on GitHub
  :::
::

::u-page-section{class="dark:bg-neutral-950 !pt-0"}
  :::landing-stats
  ---
  items:
    - value: "3"
      label: Core Packages
    - value: "5+"
      label: Applications
    - value: "100%"
      label: TypeScript
    - value: WASM
      label: Super Fast
    - value: Apache-2.0
      label: License
  ---
  :::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
Everything you need to build

#description
A complete toolkit with modular packages, TypeScript support, and comprehensive documentation.

#features
  :::u-page-feature
  ---
  icon: i-lucide-wallet
  ---
  #title
  Cardano Wallet Management

  #description
  Create, restore, and manage Cardano wallets with full HD wallet support and transaction signing.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-zap
  ---
  #title
  Hydra Layer 2 Integration

  #description
  Complete Hydra Head lifecycle management with real-time transaction processing.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-settings-2
  ---
  #title
  Transaction Builder

  #description
  Advanced transaction building utilities with UTxO selection and fee optimization.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-cpu
  ---
  #title
  WASM Integration

  #description
  High-performance Cardano serialization with browser-optimized WebAssembly.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-code
  ---
  #title
  TypeScript First

  #description
  Full TypeScript support with comprehensive type definitions and IntelliSense.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-boxes
  ---
  #title
  Modular Architecture

  #description
  Extensible package-based architecture for easy customization and integration.
  :::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
Apps Built with Hydra SDK

#description
Discover powerful applications already using our SDK in production.

  :::u-page-grid
    ::::u-page-card
    ---
    title: Hydra Wallet
    description: A modern, secure Cardano wallet with Hydra Layer 2 support for instant transactions and DeFi operations.
    to: https://alpha.hydrawallet.app
    target: _blank
    spotlight: true
    ---
    #leading
    ![Hydra Wallet](/images/hydra-wallet-logo.png){.size-11 .rounded-xl .object-contain}

    #footer
    :u-badge{color="neutral" variant="subtle" size="sm" label="Cardano Wallet"}
    ::::

    ::::u-page-card
    ---
    title: Hydra SDK Playground
    description: An interactive playground for experimenting with Hydra SDK features and building DApps.
    to: https://play.hydrasdk.com
    target: _blank
    spotlight: true
    ---
    #leading
    ![Hydra SDK Playground](/images/hydra-playground-logo-white.png){.size-11 .rounded-xl .object-contain}

    #footer
    :u-badge{color="neutral" variant="subtle" size="sm" label="Development"}
    ::::

    ::::u-page-card
    ---
    title: Hydra Flappy Bird
    description: Classic Flappy Bird game reimagined with blockchain integration, NFT rewards, and Hydra-powered microtransactions.
    to: https://play-flappy.hydrawallet.app
    target: _blank
    spotlight: true
    ---
    #leading
    ![Hydra Flappy Bird](/images/hydra-flappy-logo.png){.size-11 .rounded-xl .object-contain}

    #footer
    :u-badge{color="neutral" variant="subtle" size="sm" label="GameFi"}
    ::::

    ::::u-page-card
    ---
    title: Hydra Fastpay
    description: Lightning-fast payment processing using Hydra Layer 2 for instant, low-cost transactions on Cardano.
    to: https://alpha.hydrawallet.app/dapps/hydra-fastpay
    target: _blank
    spotlight: true
    ---
    #leading
    ![Hydra Fastpay](/images/hydra-fastpay-logo.png){.size-11 .rounded-xl .object-contain}

    #footer
    :u-badge{color="neutral" variant="subtle" size="sm" label="Payment Solution"}
    ::::

    ::::u-page-card
    ---
    title: Hydra Rock Paper Scissors
    description: Decentralized game of Rock Paper Scissors with NFT rewards and Hydra Layer 2 scalability.
    to: https://alpha.hydrawallet.app/games/rock-paper-scissors
    target: _blank
    spotlight: true
    ---
    #leading
    ![Hydra Rock Paper Scissors](/images/hydra-rock-paper-scissors-logo.png){.size-11 .rounded-xl .object-contain}

    #footer
    :u-badge{color="neutral" variant="subtle" size="sm" label="GameFi"}
    ::::
  :::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
Quick Start

#description
Get up and running in minutes.

  :::u-page-grid
    ::::div
    #### 1. Installation

      :::::prose-pre
      ---
      code: npm install @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction @hydra-sdk/cardano-wasm
      filename: Terminal
      ---
      ```bash [Terminal]
      npm install @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction @hydra-sdk/cardano-wasm
      ```
      :::::

    #### 2. Basic Usage

      :::::prose-pre
      ---
      filename: wallet.ts
      code: |
        import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'

        // Create new wallet
        const wallet = new AppWallet({
          networkId: NETWORK_ID.PREPROD,
          key: {
            type: 'mnemonic',
            words: AppWallet.brew() // Generate new mnemonic
          }
        })

        // Get account
        const account = wallet.getAccount(0, 0)
        console.log('Address:', account.baseAddressBech32)
      ---
      ```ts [wallet.ts]
      import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'

      // Create new wallet
      const wallet = new AppWallet({
        networkId: NETWORK_ID.PREPROD,
        key: {
          type: 'mnemonic',
          words: AppWallet.brew() // Generate new mnemonic
        }
      })

      // Get account
      const account = wallet.getAccount(0, 0)
      console.log('Address:', account.baseAddressBech32)
      ```
      :::::
    ::::

    ::::u-page-card
    ---
    title: Installation Guide
    description: Learn how to install and set up the SDK in your project.
    icon: i-lucide-download
    to: /getting-started/installation
    ---
    ::::

    ::::u-page-card
    ---
    title: Basic Usage
    description: Explore how to create wallets, build transactions, and interact with Hydra.
    icon: i-lucide-book-open
    to: /getting-started/quick-start
    ---
    ::::

    ::::u-page-card
    ---
    title: Code Examples
    description: See practical examples and use cases for common scenarios.
    icon: i-lucide-square-code
    to: https://github.com/Vtechcom/hydra-sdk
    target: _blank
    ---
    ::::

    ::::u-page-card
    ---
    title: Guides & Tutorials
    description: Follow step-by-step guides for building wallet applications.
    icon: i-lucide-graduation-cap
    to: /getting-started
    ---
    ::::
  :::
::

::u-page-section{class="dark:bg-neutral-950"}
  :::u-page-c-t-a
  ---
  variant: subtle
  title: Proudly sponsored by VTechcom
  description: A creative software development technology company, accompanying the future of decentralized applications on Cardano.
  links:
    - label: Visit VTechcom
      to: https://vtechcom.org/
      target: _blank
      icon: i-lucide-globe
    - label: Partnership Inquiries
      to: mailto:contact@vtechcom.org
      target: _blank
      variant: subtle
      icon: i-lucide-mail
  ---
  ::::div{.flex .justify-center}
  ![VTechcom](/images/vtechcom-logo.png){.size-16 .object-contain}
  ::::
  :::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
Join our community

#description
Connect with developers, get support, and stay updated with the latest SDK developments.

  :::u-page-grid
    ::::u-page-card
    ---
    title: GitHub
    description: Contribute to the SDK, report issues, and explore the source code.
    icon: i-simple-icons-github
    to: https://github.com/Vtechcom/hydra-sdk
    target: _blank
    spotlight: true
    ---
    ::::

    ::::u-page-card
    ---
    title: Discord
    description: Join our community Discord for support and discussions.
    icon: i-simple-icons-discord
    to: https://discord.com/invite/eZKRyQnbea
    target: _blank
    spotlight: true
    ---
    ::::

    ::::u-page-card
    ---
    title: Telegram
    description: Get quick updates and connect with other developers.
    icon: i-simple-icons-telegram
    to: https://t.me/+DPJxXA5y9wgzZThl
    target: _blank
    spotlight: true
    ---
    ::::
  :::
::

::u-page-section{class="dark:bg-gradient-to-b from-neutral-950 to-neutral-900"}
  :::u-page-c-t-a
  ---
  links:
    - label: Get Started
      to: /getting-started
      trailingIcon: i-lucide-arrow-right
    - label: View on GitHub
      to: https://github.com/Vtechcom/hydra-sdk
      target: _blank
      variant: subtle
      icon: i-simple-icons-github
  title: Ready to build on Cardano and Hydra?
  description: Get started with the Hydra SDK and start shipping fast, low-cost Layer 2 applications today.
  class: dark:bg-neutral-950
  ---

  :stars-bg
  :::
::
