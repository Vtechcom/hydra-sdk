<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import type { DropdownMenuItem } from '@nuxt/ui'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { header } = useAppConfig()

const { locale, locales, setLocale } = useI18n()

const currentLocaleName = computed(() =>
  locales.value.find(l => l.code === locale.value)?.name ?? locale.value
)

// Switch programmatically via setLocale rather than a `to` link: Nuxt UI
// re-localizes link targets against the active locale, which broke switching
// back to the default locale from a prefixed (/vi, /ja) route.
const localeItems = computed<DropdownMenuItem[]>(() =>
  locales.value.map(l => ({
    label: l.name ?? l.code,
    icon: l.code === locale.value ? 'i-lucide-check' : undefined,
    onSelect: () => setLocale(l.code)
  }))
)

// Brand entrance: the logo + wordmark + subtitle stagger in on load. Client-only
// (dynamic import) so it never runs during SSR; the elements start at opacity-0
// and we clear inline transforms on completion so the CSS hover scale still
// works. Respects prefers-reduced-motion, and reveals as a safety net if
// anime.js can't be loaded. Queried from the document because the brand lives in
// UHeader's #title slot, where a template ref doesn't bind.
onMounted(async () => {
  await nextTick() // the brand lives in UHeader's slot; wait for it to render
  const items = [...document.querySelectorAll<HTMLElement>('[data-brand-item]')]
  if (!items.length) return
  const reveal = () => items.forEach((i) => { i.style.opacity = '1'; i.style.transform = '' })

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveal()
    return
  }

  try {
    const mod = await import('animejs') as Record<string, any>
    const animate = mod.animate ?? mod.default?.animate
    const stagger = mod.stagger ?? mod.default?.stagger
    if (typeof animate !== 'function') {
      reveal()
      return
    }
    animate(items, {
      opacity: [0, 1],
      translateX: [-12, 0],
      scale: [0.85, 1],
      duration: 700,
      delay: stagger ? stagger(70) : 0,
      ease: 'outExpo',
      onComplete: () => items.forEach(i => { i.style.transform = '' })
    })
  } catch {
    reveal()
  }
})
</script>

<template>
  <UHeader
    :ui="{ center: 'flex-1' }"
    :to="header?.to || '/'"
  >
    <UContentSearchButton
      v-if="header?.search"
      :collapsed="false"
      class="w-full"
    />

    <template
      v-if="header?.logo?.dark || header?.logo?.light || header?.title"
      #title
    >
      <!-- own the alignment: UHeader's title slot is items-end, which sank the
           logo below the two-line wordmark -->
      <div class="group/brand flex items-center gap-2.5">
        <UColorModeImage
          v-if="header?.logo?.dark || header?.logo?.light"
          :light="header?.logo?.light!"
          :dark="header?.logo?.dark!"
          :alt="header?.logo?.alt"
          data-brand-item
          data-brand-logo
          class="size-9 shrink-0 opacity-0 transition-transform duration-300 ease-out will-change-transform group-hover/brand:scale-110"
        />

        <span
          v-if="header?.title"
          class="flex flex-col gap-0.5"
        >
          <span
            data-brand-item
            class="font-display text-lg font-bold leading-none tracking-tight text-highlighted opacity-0"
          >{{ header.title }}</span>
          <span
            data-brand-item
            class="text-[11px] font-medium uppercase leading-none tracking-[0.14em] text-muted opacity-0"
          >Documentation</span>
        </span>
      </div>
    </template>

    <template
      v-else
      #left
    >
      <NuxtLink :to="header?.to || '/'">
        <AppLogo class="w-auto h-6 shrink-0" />
      </NuxtLink>

      <TemplateMenu />
    </template>

    <template #right>
      <UContentSearchButton
        v-if="header?.search"
        class="lg:hidden"
      />

      <UDropdownMenu
        :items="localeItems"
        :content="{ align: 'end' }"
      >
        <UButton
          icon="i-lucide-languages"
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-chevron-down"
          :label="currentLocaleName"
          :ui="{ label: 'hidden sm:inline-block' }"
          :aria-label="`Language: ${currentLocaleName}`"
        />
      </UDropdownMenu>

      <UColorModeButton v-if="header?.colorMode" />

      <template v-if="header?.links">
        <UButton
          v-for="(link, index) of header.links"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>

    <template #body>
      <UContentNavigation
        highlight
        :navigation="navigation"
      />
    </template>
  </UHeader>
</template>
