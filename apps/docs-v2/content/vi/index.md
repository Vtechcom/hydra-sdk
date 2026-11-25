---
seo:
  title: Hydra Wallet SDK - Bộ công cụ phát triển Cardano & Hydra bởi Vtechcom
  description: SDK TypeScript mạnh mẽ để xây dựng ứng dụng Cardano và Hydra Layer 2. Đầy đủ với kết nối ví, dựng giao dịch và quản lý Hydra Head bởi Vtechcom.
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
Xây dựng DApp Cardano với [Hydra SDK]{.text-primary}.

#description
Một bộ công cụ phát triển phần mềm toàn diện để xây dựng DApp Cardano và ứng dụng ví với tích hợp [Hydra Layer 2]{.text-primary .font-semibold}.

#links
  :::u-button
  ---
  to: /getting-started
  size: xl
  icon: i-lucide-rocket
  trailing-icon: i-lucide-arrow-right
  ---
  Bắt đầu
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
  Xem trên GitHub
  :::
::

::u-page-section{class="section-tight-top"}
  :::landing-stats
  ---
  items:
    - value: "3"
      label: Gói lõi
    - value: "9+"
      label: Ứng dụng
    - value: "100%"
      label: TypeScript
    - value: WASM
      label: Cực nhanh
    - value: Apache-2.0
      label: Giấy phép
  ---
  :::
::

::u-page-section{class="border-t border-default/60"}
#headline
Khả năng

#title
Mọi thứ bạn cần để xây dựng

#description
Một bộ công cụ hoàn chỉnh với các gói dạng module, hỗ trợ TypeScript và tài liệu toàn diện.

  :::u-page-grid{class="reveal-stagger mt-4 text-left"}
    ::::u-page-card
    ---
    title: Quản lý ví Cardano
    description: Tạo, khôi phục và quản lý ví Cardano với hỗ trợ đầy đủ HD wallet và ký giao dịch.
    icon: i-lucide-wallet
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: Tích hợp Hydra Layer 2
    description: Quản lý toàn bộ vòng đời Hydra Head với xử lý giao dịch thời gian thực.
    icon: i-lucide-zap
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: Transaction Builder
    description: Các tiện ích dựng giao dịch nâng cao với lựa chọn UTxO và tối ưu phí.
    icon: i-lucide-settings-2
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: Tích hợp WASM
    description: Serialize Cardano hiệu năng cao với WebAssembly được tối ưu cho trình duyệt.
    icon: i-lucide-cpu
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: Ưu tiên TypeScript
    description: Hỗ trợ đầy đủ TypeScript với định nghĩa kiểu toàn diện và IntelliSense.
    icon: i-lucide-code
    variant: subtle
    spotlight: true
    class: "hcard hover:ring-primary/40"
    ---
    ::::

    ::::u-page-card
    ---
    title: Kiến trúc dạng module
    description: Kiến trúc dựa trên gói có khả năng mở rộng, dễ tùy biến và tích hợp.
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
Hệ sinh thái

#title
Ứng dụng được xây dựng với Hydra SDK

#description
Khám phá những ứng dụng mạnh mẽ đã dùng SDK của chúng tôi trong môi trường production.

  :::u-page-grid{class="reveal-stagger mt-4 text-left gap-5"}
    ::::u-page-card
    ---
    title: Hexcore
    description: Bảng điều khiển web giúp triển khai và quản lý Hydra Head trên Docker chỉ với một lệnh.
    to: https://hexcore.hydrasdk.com/docs
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard group hover:ring-primary/40"
    ---
    #leading
      :::::div{class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-elevated ring-1 ring-default"}
      ![Hexcore](/images/hexcore.svg){.size-7 .object-contain}
      :::::
      :u-badge{color="primary" variant="subtle" size="sm" label="Infrastructure" class="ml-auto"}
      :u-icon{name="i-lucide-arrow-up-right" class="ml-1.5 size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"}
    ::::

    ::::u-page-card
    ---
    title: Hydra SDK Playground
    description: Môi trường tương tác để thử nghiệm tính năng Hydra SDK và tạo mẫu giao dịch L2.
    to: https://playground.hydrasdk.com
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard group hover:ring-primary/40"
    ---
    #leading
      :::::div{class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-elevated p-1.5 ring-1 ring-default"}
      ![Hydra SDK Playground](/images/hydra-playground-logo.png){.size-full .object-contain}
      :::::
      :u-badge{color="primary" variant="subtle" size="sm" label="Developer Tool" class="ml-auto"}
      :u-icon{name="i-lucide-arrow-up-right" class="ml-1.5 size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"}
    ::::

    ::::u-page-card
    ---
    title: Perpetuals Exchange
    description: Sàn giao dịch hợp đồng tương lai vĩnh cửu tốc độ cao với đòn bẩy tới 50x trên Hydra L2.
    to: https://beta.hydraone.app/games/perpetuals
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard group hover:ring-primary/40"
    ---
    #leading
      :::::div{class="size-11 shrink-0 overflow-hidden rounded-xl bg-elevated ring-1 ring-default"}
      ![Perpetuals Exchange](/images/perpetuals.webp){.size-full .object-cover}
      :::::
      :u-badge{color="primary" variant="subtle" size="sm" label="DeFi" class="ml-auto"}
      :u-icon{name="i-lucide-arrow-up-right" class="ml-1.5 size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"}
    ::::

    ::::u-page-card
    ---
    title: Hydra Gacha
    description: Vòng quay xổ số on-chain minh bạch sử dụng vé NFT trên mạng lưới Hydra L2.
    to: https://beta.hydraone.app/games/hydra-gacha
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard group hover:ring-primary/40"
    ---
    #leading
      :::::div{class="size-11 shrink-0 overflow-hidden rounded-xl bg-elevated ring-1 ring-default"}
      ![Hydra Gacha](/images/gacha.webp){.size-full .object-cover}
      :::::
      :u-badge{color="primary" variant="subtle" size="sm" label="Lottery" class="ml-auto"}
      :u-icon{name="i-lucide-arrow-up-right" class="ml-1.5 size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"}
    ::::

    ::::u-page-card
    ---
    title: Hydra Fly
    description: Giải đấu game arcade trên Hydra L2 với phần thưởng dành cho người dẫn đầu bảng xếp hạng.
    to: https://beta.hydraone.app/games/hydra-fly
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard group hover:ring-primary/40"
    ---
    #leading
      :::::div{class="size-11 shrink-0 overflow-hidden rounded-xl bg-elevated ring-1 ring-default"}
      ![Hydra Fly](/images/fly.webp){.size-full .object-cover}
      :::::
      :u-badge{color="neutral" variant="subtle" size="sm" label="GameFi" class="ml-auto"}
      :u-icon{name="i-lucide-arrow-up-right" class="ml-1.5 size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"}
    ::::

    ::::u-page-card
    ---
    title: River Cross
    description: Game sinh tồn thời gian thực trên Hydra L2 với cơ chế đặt cược và trả thưởng tức thì.
    to: https://beta.hydraone.app/games/river-cross
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard group hover:ring-primary/40"
    ---
    #leading
      :::::div{class="size-11 shrink-0 overflow-hidden rounded-xl bg-elevated ring-1 ring-default"}
      ![River Cross](/images/river-cross.webp){.size-full .object-cover}
      :::::
      :u-badge{color="neutral" variant="subtle" size="sm" label="GameFi" class="ml-auto"}
      :u-icon{name="i-lucide-arrow-up-right" class="ml-1.5 size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"}
    ::::

    ::::u-page-card
    ---
    title: Mines
    description: Trò chơi chiến thuật mở ô nhận hệ số nhân thưởng tức thì trên Hydra L2.
    to: https://beta.hydraone.app/games/mines
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard group hover:ring-primary/40"
    ---
    #leading
      :::::div{class="size-11 shrink-0 overflow-hidden rounded-xl bg-elevated ring-1 ring-default"}
      ![Mines](/images/mines.webp){.size-full .object-cover}
      :::::
      :u-badge{color="neutral" variant="subtle" size="sm" label="GameFi" class="ml-auto"}
      :u-icon{name="i-lucide-arrow-up-right" class="ml-1.5 size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"}
    ::::

    ::::u-page-card
    ---
    title: Russian Roulette
    description: Trò chơi đối kháng kịch tính thắng-ăn-cả với tốc độ xử lý dưới 1 giây trên Hydra L2.
    to: https://beta.hydraone.app/games/russian-roulette
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard group hover:ring-primary/40"
    ---
    #leading
      :::::div{class="size-11 shrink-0 overflow-hidden rounded-xl bg-elevated ring-1 ring-default"}
      ![Russian Roulette](/images/russian-roulette.webp){.size-full .object-cover}
      :::::
      :u-badge{color="neutral" variant="subtle" size="sm" label="GameFi" class="ml-auto"}
      :u-icon{name="i-lucide-arrow-up-right" class="ml-1.5 size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"}
    ::::

    ::::u-page-card
    ---
    title: Onchain Graveyard
    description: Khắc bia tưởng niệm vĩnh viễn trên chuỗi, xác nhận giao dịch tức thì qua Hydra L2.
    to: https://beta.hydraone.app/games/graveyard
    target: _blank
    variant: subtle
    spotlight: true
    class: "hcard group hover:ring-primary/40"
    ---
    #leading
      :::::div{class="size-11 shrink-0 overflow-hidden rounded-xl bg-elevated ring-1 ring-default"}
      ![Onchain Graveyard](/images/graveyard.webp){.size-full .object-cover}
      :::::
      :u-badge{color="neutral" variant="subtle" size="sm" label="Social" class="ml-auto"}
      :u-icon{name="i-lucide-arrow-up-right" class="ml-1.5 size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"}
    ::::
  :::
::

::u-page-section{class="border-t border-default/60"}
#headline
Bắt đầu nhanh

#title
Chạy được chỉ trong vài phút

#description
Cài đặt các gói, khởi tạo một ví và bạn đã sẵn sàng xây dựng trên Hydra.

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
      title: Hướng dẫn cài đặt
      description: Cài đặt và thiết lập SDK trong dự án của bạn.
      icon: i-lucide-download
      to: /getting-started/installation
      variant: subtle
      class: "hcard hover:ring-primary/40"
      ---
      :::

      :::u-page-card
      ---
      title: Sử dụng cơ bản
      description: Tạo ví, dựng giao dịch, giao tiếp với Hydra.
      icon: i-lucide-book-open
      to: /getting-started/quick-start
      variant: subtle
      class: "hcard hover:ring-primary/40"
      ---
      :::

      :::u-page-card
      ---
      title: Ví dụ code
      description: Các ví dụ thực tế cho những tình huống thường gặp.
      icon: i-lucide-square-code
      to: https://github.com/Vtechcom/hydra-sdk
      target: _blank
      variant: subtle
      class: "hcard hover:ring-primary/40"
      ---
      :::

      :::u-page-card
      ---
      title: Hướng dẫn & bài học
      description: Các hướng dẫn từng bước để xây dựng ví.
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
Được hỗ trợ bởi

#title
Nhà tài trợ & nguồn vốn

#description
Hydra SDK được xây dựng với sự hỗ trợ của nhà tài trợ và cộng đồng Cardano thông qua Project Catalyst.

  :::u-page-grid{class="reveal-stagger mt-4 grid-cols-1 text-left sm:grid-cols-2 lg:grid-cols-2"}
    ::::u-page-card
    ---
    title: VTechcom
    description: Một công ty công nghệ phát triển phần mềm sáng tạo, đồng hành cùng tương lai của các ứng dụng phi tập trung trên Cardano.
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
    :u-badge{color="primary" variant="subtle" size="sm" label="Sponsor"}
    ::::

    ::::u-page-card
    ---
    title: Project Catalyst · Fund 14
    description: Việc phát triển Hydra SDK được tài trợ bởi cộng đồng Cardano thông qua Project Catalyst Fund 14.
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
    :u-badge{color="primary" variant="subtle" size="sm" label="Grant funding"}
    ::::
  :::
::

::u-page-section{class="border-t border-default/60"}
#headline
Cộng đồng

#title
Tham gia cộng đồng của chúng tôi

#description
Kết nối với các nhà phát triển, nhận hỗ trợ và cập nhật những phát triển mới nhất của SDK.

  :::u-page-grid{class="reveal-stagger mt-4 text-left"}
    ::::u-page-card
    ---
    title: GitHub
    description: Đóng góp cho SDK, báo lỗi và khám phá mã nguồn.
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
    description: Tham gia Discord cộng đồng của chúng tôi để được hỗ trợ và thảo luận.
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
    description: Nhận cập nhật nhanh và kết nối với các nhà phát triển khác.
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
    description: Theo dõi chúng tôi trên X để nhận thông báo và cập nhật phiên bản.
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
    - label: Bắt đầu
      to: /getting-started
      trailingIcon: i-lucide-arrow-right
    - label: Xem trên GitHub
      to: https://github.com/Vtechcom/hydra-sdk
      target: _blank
      variant: subtle
      icon: i-simple-icons-github
  title: Sẵn sàng xây dựng trên Cardano và Hydra?
  description: Bắt đầu với Hydra SDK và xây dựng các ứng dụng Layer 2 nhanh, chi phí thấp ngay hôm nay.
  class: dark:bg-neutral-950 overflow-hidden
  ---

  :stars-bg
  :::
::
