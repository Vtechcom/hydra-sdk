<script setup lang="ts">
	import type { HTMLAttributes } from 'vue'
	import { cn } from '@/lib/utils'

	const props = withDefaults(
		defineProps<{
			defaultValue?: string | number
			class?: HTMLAttributes['class']
			type?: HTMLInputElement['type']
			name?: string
			placeholder?: string

			// customize
			inputClass?: HTMLAttributes['class']
			parser?: (value: string) => string | number
			formatter?: (value: string | number) => string | number
			clearable?: boolean
			readonly?: boolean
		}>(),
		{
			type: 'text',
			name: 'input',
			placeholder: '',

			// customize
			parser: (value: string) => value,
			formatter: (value: string | number) => value,
			clearable: false,
			readonly: false
		}
	)

	const modelValue = defineModel<string | number>('modelValue', { default: '' })
	const showClearButton = computed(() => props.clearable && modelValue.value)
	const refInput = ref<HTMLInputElement | null>(null)

	const formattedValue = ref(modelValue.value)
	watch(modelValue, () => {
		formattedValue.value = props.formatter(modelValue.value)
		modelValue.value = props.parser(modelValue.value.toString())
		if (refInput.value && refInput.value.value) {
			refInput.value.value = props.formatter(modelValue.value).toString()
		}
	})

	const emits = defineEmits<{
		blur: [e: Event]
	}>()

	function onBlurInput(e: Event) {
		emits('blur', e)
		modelValue.value = props.parser(modelValue.value.toString())

		// Update formatter
		if (refInput.value && refInput.value.value) {
			refInput.value.value = props.formatter(modelValue.value).toString()
		}
	}

	defineExpose({
		focus() {
			refInput.value?.focus()
		},
		blur() {
			refInput.value?.blur()
		},
		clear() {
			modelValue.value = ''
		}
	})
</script>

<template>
	<div class="relative" :class="props.class">
		<input
			ref="refInput"
			:value="formattedValue"
			@input="(event: any) => (modelValue = parser(event.target?.value))"
			@blur="onBlurInput"
			data-slot="input"
			:name="props.name"
			:type="props.type"
			:placeholder="props.placeholder"
			:readonly="props.readonly"
			:class="
				cn(
					'file:text-foreground placeholder:text-placeholder selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
					'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
					'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
					props.inputClass,
					...(showClearButton ? ['pr-6'] : [])
				)
			"
		/>
		<button v-if="showClearButton" @click="modelValue = ''" :class="cn('absolute top-1/2 right-[7px] -translate-y-1/2 text-gray-500', 'hover:cursor-pointer hover:text-gray-700')">
			<NuxtIcon name="lucide:circle-x" class="" size="12" />
		</button>
	</div>
</template>
