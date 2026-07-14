---
seo:
  title: Hydra Wallet SDK - Vtechcom による Cardano & Hydra 開発キット
  description: Cardano および Hydra Layer 2 アプリケーションを構築するための強力な TypeScript SDK。ウォレット接続、トランザクション構築、Hydra Head 管理を Vtechcom が完備。
---

::u-page-hero{class="relative overflow-hidden"}
#top
:hero-background

#headline
  :::div{class="flex flex-col items-center gap-5"}
    ![Hydra SDK](/images/logo-1024x1024.png){.hero-logo .size-20 width="80" height="80"}

    ::::u-badge
    ---
    color: primary
    variant: subtle
    size: lg
    icon: i-lucide-zap
    class: rounded-full
    ---
    Cardano + Hydra Layer 2
    ::::
  :::

#title
[Hydra SDK]{.text-primary} で Cardano DApp を構築。

#description
[Hydra Layer 2]{.text-primary .font-semibold} 統合により、Cardano DApp やウォレットアプリケーションを構築するための包括的なソフトウェア開発キットです。

#links
  :::u-button
  ---
  to: /getting-started
  size: xl
  icon: i-lucide-rocket
  trailing-icon: i-lucide-arrow-right
  ---
  はじめる
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
  GitHub で見る
  :::
::

::u-page-section{class="section-tight-top"}
  :::landing-stats
  ---
  items:
    - value: "3"
      label: コアパッケージ
    - value: "5+"
      label: アプリケーション
    - value: "100%"
      label: TypeScript
    - value: WASM
      label: 超高速
    - value: Apache-2.0
      label: ライセンス
  ---
  :::
::

::u-page-section{class="border-t border-default/60"}
#headline
機能

#title
構築に必要なすべて

#description
モジュール化されたパッケージ、TypeScript サポート、包括的なドキュメントを備えた完全なツールキットです。

  :::u-page-grid{class="reveal-stagger mt-4 text-left"}
    ::::u-page-card
    ---
    title: Cardano ウォレット管理
    description: 完全な HD ウォレットサポートとトランザクション署名により、Cardano ウォレットの作成、復元、管理を行います。
    icon: i-lucide-wallet
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: Hydra Layer 2 統合
    description: リアルタイムのトランザクション処理を備えた、完全な Hydra Head ライフサイクル管理。
    icon: i-lucide-zap
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: トランザクションビルダー
    description: UTxO 選択と手数料最適化を備えた高度なトランザクション構築ユーティリティ。
    icon: i-lucide-settings-2
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: WASM 統合
    description: ブラウザ向けに最適化された WebAssembly による高性能な Cardano シリアライゼーション。
    icon: i-lucide-cpu
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: TypeScript ファースト
    description: 包括的な型定義と IntelliSense を備えた、完全な TypeScript サポート。
    icon: i-lucide-code
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: モジュラーアーキテクチャ
    description: カスタマイズと統合が容易な、拡張可能なパッケージベースのアーキテクチャ。
    icon: i-lucide-boxes
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::
  :::
::

::u-page-section{class="section-alt border-t border-default/60"}
#headline
エコシステム

#title
Hydra SDK で構築されたアプリ

#description
すでに本番環境で私たちの SDK を利用している強力なアプリケーションをご覧ください。

  :::u-page-grid{class="reveal-stagger mt-4 text-left"}
    ::::u-page-card
    ---
    title: Hydra Hub
    description: 分散型の Hydra Node 管理、Hydra Head 接続、Cardano DApp を構築するための Layer-2 API を提供します。
    to: https://dev.hydrahub.io.vn
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    #leading
    ![Hydra Hub](/images/hydra-hub.png){.size-11 .rounded-xl .object-contain .ring-1 .ring-default}

    #footer
    :u-badge{color="primary" variant="subtle" size="sm" label="インフラ"}
    ::::

    ::::u-page-card
    ---
    title: Hydra SDK Playground
    description: Hydra SDK の機能を試したり DApp を構築したりするためのインタラクティブなプレイグラウンド。
    to: https://play.hydrasdk.com
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    #leading
    ![Hydra SDK Playground](/images/hydra-playground-logo-white.png){.size-11 .rounded-xl .object-contain .ring-1 .ring-default}

    #footer
    :u-badge{color="primary" variant="subtle" size="sm" label="開発"}
    ::::

    ::::u-page-card
    ---
    title: Hydra Fly
    description: Cardano Hydra L2 上に構築された GameFi トーナメントゲーム。リーダーボードの上位プレイヤーが報酬を獲得します。
    to: https://alpha.hydraone.app/games/hydra-fly/play
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    #leading
    ![Hydra Fly](/images/fly.webp){.size-11 .rounded-xl .object-contain .ring-1 .ring-default}

    #footer
    :u-badge{color="neutral" variant="subtle" size="sm" label="GameFi"}
    ::::

    ::::u-page-card
    ---
    title: River Cross
    description: Cardano Hydra L2 上のサバイバル GameFi ゲーム。プレイヤーは tADA を賭けて川を渡ります。
    to: https://alpha.hydraone.app/games/river-cross/play
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    #leading
    ![River Cross](/images/river-cross.webp){.size-11 .rounded-xl .object-contain .ring-1 .ring-default}

    #footer
    :u-badge{color="neutral" variant="subtle" size="sm" label="GameFi"}
    ::::

    ::::u-page-card
    ---
    title: Hydra Gacha
    description: NFT チケットを使い、Cardano Hydra L2 上に構築されたオンチェーンの宝くじゲーム。
    to: https://alpha.hydraone.app/games/hydra-gacha
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    #leading
    ![Hydra Gacha](/images/gacha.webp){.size-11 .rounded-xl .object-contain .ring-1 .ring-default}

    #footer
    :u-badge{color="primary" variant="subtle" size="sm" label="宝くじ"}
    ::::

    ::::u-page-card
    ---
    title: Knight
    description: Cardano Hydra L2 上のダンジョンサバイバル GameFi ゲーム。プレイヤーは tADA を賭けて敵を倒します。
    to: https://alpha.hydraone.app/games/knight/play
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    #leading
    ![Knight](/images/knight.webp){.size-11 .rounded-xl .object-contain .ring-1 .ring-default}

    #footer
    :u-badge{color="neutral" variant="subtle" size="sm" label="GameFi"}
    ::::
  :::
::

::u-page-section{class="border-t border-default/60"}
#headline
クイックスタート

#title
数分で稼働開始

#description
パッケージをインストールし、ウォレットを立ち上げれば、Hydra 上での構築を始められます。

  :::div{class="reveal mx-auto mt-4 grid max-w-5xl gap-6 text-left lg:grid-cols-5"}
    ::::div{class="space-y-4 lg:col-span-3"}
      :::::prose-pre{filename="Terminal"}
      ```bash
      npm install @hydra-sdk/core @hydra-sdk/bridge @hydra-sdk/transaction @hydra-sdk/cardano-wasm
      ```
      :::::

      :::::prose-pre{filename="wallet.ts"}
      ```ts
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

    ::::div{class="flex flex-col gap-3 lg:col-span-2"}
      :::u-page-card
      ---
      title: インストールガイド
      description: プロジェクトに SDK をインストールしてセットアップします。
      icon: i-lucide-download
      to: /getting-started/installation
      variant: subtle
      class: "hcard hover:ring-primary/40"
      ---
      :::

      :::u-page-card
      ---
      title: 基本的な使い方
      description: ウォレットを作成し、トランザクションを構築し、Hydra と対話します。
      icon: i-lucide-book-open
      to: /getting-started/quick-start
      variant: subtle
      class: "hcard hover:ring-primary/40"
      ---
      :::

      :::u-page-card
      ---
      title: コード例
      description: 一般的なシナリオの実用的な例。
      icon: i-lucide-square-code
      to: https://github.com/Vtechcom/hydra-sdk
      target: _blank
      variant: subtle
      class: "hcard hover:ring-primary/40"
      ---
      :::

      :::u-page-card
      ---
      title: ガイドとチュートリアル
      description: ウォレット構築のためのステップバイステップガイド。
      icon: i-lucide-graduation-cap
      to: /getting-started
      variant: subtle
      class: "hcard hover:ring-primary/40"
      ---
      :::
    ::::
  :::
::

::u-page-section{class="section-alt border-t border-default/60"}
#headline
支援

#title
スポンサーと資金提供

#description
Hydra SDK は、私たちのスポンサーと Project Catalyst を通じた Cardano コミュニティの支援によって構築されています。

  :::u-page-grid{class="reveal-stagger mt-4 grid-cols-1 text-left sm:grid-cols-2 lg:grid-cols-2"}
    ::::u-page-card
    ---
    title: VTechcom
    description: Cardano 上の分散型アプリケーションの未来に寄り添う、クリエイティブなソフトウェア開発テクノロジー企業。
    to: https://vtechcom.org/
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    #leading
      :::::div{class="flex size-12 items-center justify-center rounded-xl bg-white shadow-sm"}
      ![VTechcom](/images/vtechcom-logo.png){.size-9 .object-contain}
      :::::

    #footer
    :u-badge{color="primary" variant="subtle" size="sm" label="スポンサー"}
    ::::

    ::::u-page-card
    ---
    title: Project Catalyst · Fund 14
    description: Hydra SDK の開発は、Project Catalyst Fund 14 を通じて Cardano コミュニティから資金提供を受けています。
    to: https://projectcatalyst.io/funds/14/cardano-open-developers/hydra-sdk-fast-modular-wasm-cardano-toolkit
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    #leading
      :::::div{class="flex size-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20"}
      :u-icon{name="i-simple-icons-cardano" class="size-7 text-primary"}
      :::::

    #footer
    :u-badge{color="primary" variant="subtle" size="sm" label="助成金"}
    ::::
  :::
::

::u-page-section{class="border-t border-default/60"}
#headline
コミュニティ

#title
コミュニティに参加する

#description
開発者とつながり、サポートを受け、SDK の最新情報を入手しましょう。

  :::u-page-grid{class="reveal-stagger mt-4 text-left"}
    ::::u-page-card
    ---
    title: GitHub
    description: SDK への貢献、Issue の報告、ソースコードの探索を行えます。
    icon: i-simple-icons-github
    to: https://github.com/Vtechcom/hydra-sdk
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: Discord
    description: サポートやディスカッションのために、コミュニティ Discord に参加しましょう。
    icon: i-simple-icons-discord
    to: https://discord.com/invite/eZKRyQnbea
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: Telegram
    description: 最新情報をすばやく入手し、他の開発者とつながりましょう。
    icon: i-simple-icons-telegram
    to: https://telegram.me/+LeuWUO7YjGYyZmJl
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: X
    description: お知らせやリリース情報は X でフォローしてください。
    icon: i-simple-icons-x
    to: https://x.com/VtechcomLabs
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::
  :::
::

::u-page-section{class="dark:bg-gradient-to-b from-neutral-950 to-neutral-900"}
  :::u-page-c-t-a
  ---
  links:
    - label: はじめる
      to: /getting-started
      trailingIcon: i-lucide-arrow-right
    - label: GitHub で見る
      to: https://github.com/Vtechcom/hydra-sdk
      target: _blank
      variant: subtle
      icon: i-simple-icons-github
  title: Cardano と Hydra で構築する準備はできましたか？
  description: Hydra SDK を使い始めて、高速かつ低コストな Layer 2 アプリケーションを今日から出荷しましょう。
  class: dark:bg-neutral-950 overflow-hidden
  ---

  :stars-bg
  :::
::
