export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'neutral'
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted'
      }
    }
  },
  seo: {
    siteName: 'Hydra SDK'
  },
  header: {
    title: 'Hydra SDK',
    to: '/',
    logo: {
      alt: 'Hydra SDK',
      light: '/logo.png',
      dark: '/logo.png'
    },
    search: true,
    colorMode: true,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/Vtechcom/hydra-sdk',
      'target': '_blank',
      'aria-label': 'Hydra SDK on GitHub'
    }, {
      'icon': 'i-simple-icons-discord',
      'to': 'https://discord.com/invite/eZKRyQnbea',
      'target': '_blank',
      'aria-label': 'Hydra SDK on Discord'
    }, {
      'icon': 'i-simple-icons-x',
      'to': 'https://x.com/VtechcomLabs',
      'target': '_blank',
      'aria-label': 'Vtechcom Labs on X'
    }]
  },
  footer: {
    credits: `© ${new Date().getFullYear()} Hydra SDK • Built by Vtechcom Labs`,
    colorMode: false,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/Vtechcom/hydra-sdk',
      'target': '_blank',
      'aria-label': 'Hydra SDK on GitHub'
    }, {
      'icon': 'i-simple-icons-npm',
      'to': 'https://www.npmjs.com/package/@hydra-sdk/core',
      'target': '_blank',
      'aria-label': '@hydra-sdk on npm'
    }, {
      'icon': 'i-simple-icons-discord',
      'to': 'https://discord.com/invite/eZKRyQnbea',
      'target': '_blank',
      'aria-label': 'Hydra SDK on Discord'
    }, {
      'icon': 'i-simple-icons-telegram',
      'to': 'https://telegram.me/+LeuWUO7YjGYyZmJl',
      'target': '_blank',
      'aria-label': 'Hydra SDK on Telegram'
    }, {
      'icon': 'i-simple-icons-x',
      'to': 'https://x.com/VtechcomLabs',
      'target': '_blank',
      'aria-label': 'Vtechcom Labs on X'
    }]
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/Vtechcom/hydra-sdk/edit/master/apps/docs-v2/content',
      links: [{
        icon: 'i-lucide-star',
        label: 'Star on GitHub',
        to: 'https://github.com/Vtechcom/hydra-sdk',
        target: '_blank'
      }, {
        icon: 'i-simple-icons-discord',
        label: 'Join our Discord',
        to: 'https://discord.com/invite/eZKRyQnbea',
        target: '_blank'
      }]
    }
  }
})
