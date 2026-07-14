<script setup lang="ts">
defineProps<{
  items?: { value: string, label: string }[]
}>()
</script>

<template>
  <div class="mx-auto grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-3 md:flex md:items-center md:justify-center md:gap-10">
    <div
      v-for="item in items"
      :key="item.label"
      class="text-center md:flex-1"
    >
      <div class="whitespace-nowrap text-2xl font-bold text-primary md:text-3xl">
        {{ item.value }}
      </div>
      <div class="text-sm text-muted">
        {{ item.label }}
      </div>
    </div>
  </div>
</template>
