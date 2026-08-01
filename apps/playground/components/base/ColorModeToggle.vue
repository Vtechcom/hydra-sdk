<script lang="ts" setup>
	const colorMode = useColorMode()

	// `preference` may be 'system'; `value` is the resolved light/dark, which is
	// what the icon has to reflect.
	const isDark = computed(() => colorMode.value === 'dark')

	const toggle = () => {
		colorMode.preference = isDark.value ? 'light' : 'dark'
	}
</script>

<template>
	<Button variant="ghost" size="sm" class="size-8 p-0" :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'" @click="toggle()">
		<ClientOnly>
			<Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" size="18" />
			<template #fallback>
				<Icon name="lucide:sun-moon" size="18" />
			</template>
		</ClientOnly>
	</Button>
</template>
