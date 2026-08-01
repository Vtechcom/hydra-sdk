<script setup lang="ts">
import type { CollapsibleRootEmits, CollapsibleRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { CollapsibleRoot, useForwardPropsEmits } from "reka-ui"
import { cn } from '~/lib/utils'

const props = defineProps<CollapsibleRootProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<CollapsibleRootEmits>()

const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CollapsibleRoot
    data-slot="collapsible"
    v-bind="forwarded"
    :class="cn(props.class)"
  >
    <slot />
  </CollapsibleRoot>
</template>
