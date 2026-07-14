<script setup lang="ts">
defineProps<{
  items?: { value: string, label: string }[]
}>()
</script>

<template>
  <div class="reveal mx-auto max-w-5xl">
    <dl
      class="reveal-stagger grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[var(--ui-border)] ring-1 ring-default sm:grid-cols-3 lg:grid-cols-5"
    >
      <div
        v-for="item in items"
        :key="item.label"
        class="flex flex-col items-center justify-center gap-1.5 bg-default px-3 py-7 text-center transition-colors duration-300 hover:bg-elevated"
      >
        <dt class="font-display text-2xl font-bold whitespace-nowrap text-primary md:text-3xl">
          {{ item.value }}
        </dt>
        <dd class="text-xs font-medium uppercase tracking-wider text-muted">
          {{ item.label }}
        </dd>
      </div>
    </dl>
  </div>
</template>
