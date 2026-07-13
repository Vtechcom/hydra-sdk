<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import type { DropdownMenuItem } from '@nuxt/ui'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { header } = useAppConfig()

const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const currentLocaleName = computed(() =>
  locales.value.find(l => l.code === locale.value)?.name ?? locale.value
)

const localeItems = computed<DropdownMenuItem[]>(() =>
  locales.value.map(l => ({
    label: l.name ?? l.code,
    to: switchLocalePath(l.code),
    icon: l.code === locale.value ? 'i-lucide-check' : undefined
  }))
)
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
      <UColorModeImage
        v-if="header?.logo?.dark || header?.logo?.light"
        :light="header?.logo?.light!"
        :dark="header?.logo?.dark!"
        :alt="header?.logo?.alt"
        class="size-8 shrink-0 rounded-lg"
      />

      <span
        v-if="header?.title"
        class="flex flex-col leading-tight"
      >
        <span class="font-display text-lg font-bold tracking-tight text-highlighted">{{ header.title }}</span>
        <span class="text-xs text-muted">Documentation</span>
      </span>
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
