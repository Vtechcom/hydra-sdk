<template>
	<div class="feature-card" :class="cardClass">
		<div class="feature-icon">
			<Icon :name="icon" class="icon" />
		</div>

		<div class="feature-content">
			<h3 class="feature-title">{{ title }}</h3>
			<p class="feature-description">{{ description }}</p>

			<div v-if="features?.length" class="feature-list">
				<ul>
					<li v-for="feature in features" :key="feature" class="feature-item">
						<Icon name="lucide:check" class="check-icon" />
						<span>{{ feature }}</span>
					</li>
				</ul>
			</div>

			<div v-if="codeExample" class="feature-code">
				<CodeBlock :code="codeExample" :language="codeLanguage" :collapsible="true" />
			</div>

			<div v-if="link" class="feature-action">
				<NuxtLink :to="link" class="action-link">
					{{ linkText || 'Learn more' }}
					<Icon name="lucide:arrow-right" class="arrow-icon" />
				</NuxtLink>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'

	interface Props {
		title: string
		description: string
		icon: string
		features?: string[]
		codeExample?: string
		codeLanguage?: string
		link?: string
		linkText?: string
		variant?: 'default' | 'primary' | 'secondary' | 'accent'
		size?: 'sm' | 'md' | 'lg'
	}

	const props = withDefaults(defineProps<Props>(), {
		codeLanguage: 'typescript',
		variant: 'default',
		size: 'md'
	})

	const cardClass = computed(() => ({
		'card-default': props.variant === 'default',
		'card-primary': props.variant === 'primary',
		'card-secondary': props.variant === 'secondary',
		'card-accent': props.variant === 'accent',
		'card-sm': props.size === 'sm',
		'card-md': props.size === 'md',
		'card-lg': props.size === 'lg'
	}))
</script>

<style scoped>
	.feature-card {
		@apply overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-lg;
	}

	/* Variants */
	.card-default {
		@apply bg-white border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600;
	}

	.card-primary {
		@apply border-blue-200 bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:bg-blue-950 dark:hover:border-blue-700;
	}

	.card-secondary {
		@apply border-purple-200 bg-purple-50 hover:border-purple-300 dark:border-purple-800 dark:bg-purple-950 dark:hover:border-purple-700;
	}

	.card-accent {
		@apply border-green-200 bg-green-50 hover:border-green-300 dark:border-green-800 dark:bg-green-950 dark:hover:border-green-700;
	}

	/* Sizes */
	.card-sm {
		@apply p-4;
	}

	.card-md {
		@apply p-6;
	}

	.card-lg {
		@apply p-8;
	}

	.feature-icon {
		@apply mb-4;
	}

	.icon {
		@apply h-8 w-8;
	}

	.card-primary .icon {
		@apply text-blue-600 dark:text-blue-400;
	}

	.card-secondary .icon {
		@apply text-purple-600 dark:text-purple-400;
	}

	.card-accent .icon {
		@apply text-green-600 dark:text-green-400;
	}

	.card-default .icon {
		@apply text-gray-600 dark:text-gray-400;
	}

	.feature-content {
		@apply space-y-4;
	}

	.feature-title {
		@apply text-xl font-semibold text-gray-700 dark:text-gray-300;
	}

	.card-sm .feature-title {
		@apply text-lg;
	}

	.card-lg .feature-title {
		@apply text-2xl;
	}

	.feature-description {
		@apply leading-relaxed text-gray-600 dark:text-gray-400;
	}

	.feature-list ul {
		@apply space-y-2;
	}

	.feature-item {
		@apply flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300;
	}

	.check-icon {
		@apply mt-0.5 h-4 w-4 flex-shrink-0 text-green-500 dark:text-green-400;
	}

	.feature-code {
		@apply -mx-2;
	}

	.card-sm .feature-code {
		@apply -mx-1;
	}

	.card-lg .feature-code {
		@apply -mx-4;
	}

	.feature-action {
		@apply pt-2;
	}

	.action-link {
		@apply inline-flex items-center gap-2 text-sm font-medium transition-colors;
	}

	.card-primary .action-link {
		@apply text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300;
	}

	.card-secondary .action-link {
		@apply text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300;
	}

	.card-accent .action-link {
		@apply text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300;
	}

	.card-default .action-link {
		@apply text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300;
	}

	.arrow-icon {
		@apply h-4 w-4 transition-transform group-hover:translate-x-1;
	}
</style>
