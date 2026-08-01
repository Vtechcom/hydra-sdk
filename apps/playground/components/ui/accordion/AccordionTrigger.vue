<script setup lang="ts">
import type { AccordionTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { AccordionHeader, AccordionTrigger } from "reka-ui"
import { cn } from '~/lib/utils'

const props = defineProps<AccordionTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      data-slot="accordion-trigger"
      v-bind="delegatedProps"
      :class="
        cn(
          `flex flex-1 items-start justify-between gap-4 rounded-md py-3 text-left text-sm font-medium
           transition-all outline-none hover:cursor-pointer hover:underline
           focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50
           [&[data-state=open]>svg]:rotate-180`,
          props.class,
        )
      "
    >
      <slot />
      <Icon
        name="lucide:chevron-down"
        size="16"
        class="pointer-events-none mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200"
      />
    </AccordionTrigger>
  </AccordionHeader>
</template>
