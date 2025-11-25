<template>
	<div class="api-reference">
		<div class="api-header">
			<h2 class="api-title">{{ title }}</h2>
			<p v-if="description" class="api-description">{{ description }}</p>
		</div>

		<div class="api-content">
			<!-- Methods Section -->
			<div v-if="methods?.length" class="api-section">
				<h3 class="section-title">Methods</h3>
				<div class="methods-list">
					<div v-for="method in methods" :key="method.name" class="method-item">
						<div class="method-header">
							<h4 class="method-name">{{ method.name }}</h4>
							<span v-if="method.async" class="async-badge">async</span>
							<span v-if="method.deprecated" class="deprecated-badge">deprecated</span>
						</div>

						<p v-if="method.description" class="method-description">
							{{ method.description }}
						</p>

						<div class="method-signature">
							<CodeBlock :code="method.signature" language="typescript" :collapsible="false" />
						</div>

						<!-- Parameters -->
						<div v-if="method.parameters?.length" class="method-params">
							<h5 class="params-title">Parameters</h5>
							<div class="params-list">
								<div v-for="param in method.parameters" :key="param.name" class="param-item">
									<div class="param-header">
										<code class="param-name">{{ param.name }}</code>
										<span class="param-type">{{ param.type }}</span>
										<span v-if="param.optional" class="optional-badge">optional</span>
									</div>
									<p v-if="param.description" class="param-description">
										{{ param.description }}
									</p>
								</div>
							</div>
						</div>

						<!-- Returns -->
						<div v-if="method.returns" class="method-returns">
							<h5 class="returns-title">Returns</h5>
							<div class="returns-info">
								<span class="returns-type">{{ method.returns.type }}</span>
								<p v-if="method.returns.description" class="returns-description">
									{{ method.returns.description }}
								</p>
							</div>
						</div>

						<!-- Example -->
						<div v-if="method.example" class="method-example">
							<h5 class="example-title">Example</h5>
							<CodeBlock :code="method.example" language="typescript" />
						</div>
					</div>
				</div>
			</div>

			<!-- Properties Section -->
			<div v-if="properties?.length" class="api-section">
				<h3 class="section-title">Properties</h3>
				<div class="properties-list">
					<div v-for="property in properties" :key="property.name" class="property-item">
						<div class="property-header">
							<code class="property-name">{{ property.name }}</code>
							<span class="property-type">{{ property.type }}</span>
							<span v-if="property.readonly" class="readonly-badge">readonly</span>
						</div>
						<p v-if="property.description" class="property-description">
							{{ property.description }}
						</p>
					</div>
				</div>
			</div>

			<!-- Types Section -->
			<div v-if="types?.length" class="api-section">
				<h3 class="section-title">Types</h3>
				<div class="types-list">
					<div v-for="type in types" :key="type.name" class="type-item">
						<div class="type-header">
							<h4 class="type-name">{{ type.name }}</h4>
						</div>
						<p v-if="type.description" class="type-description">
							{{ type.description }}
						</p>
						<div class="type-definition">
							<CodeBlock :code="type.definition" language="typescript" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import CodeBlock from './CodeBlock.vue'

	interface Parameter {
		name: string
		type: string
		description?: string
		optional?: boolean
	}

	interface Returns {
		type: string
		description?: string
	}

	interface Method {
		name: string
		description?: string
		signature: string
		parameters?: Parameter[]
		returns?: Returns
		example?: string
		async?: boolean
		deprecated?: boolean
	}

	interface Property {
		name: string
		type: string
		description?: string
		readonly?: boolean
	}

	interface Type {
		name: string
		description?: string
		definition: string
	}

	interface Props {
		title: string
		description?: string
		methods?: Method[]
		properties?: Property[]
		types?: Type[]
	}

	defineProps<Props>()
</script>

<style scoped>
	.api-reference {
		@apply space-y-8;
	}

	.api-header {
		@apply space-y-2;
	}

	.api-title {
		@apply text-2xl font-bold text-gray-700 dark:text-gray-300;
	}

	.api-description {
		@apply text-gray-600 dark:text-gray-400;
	}

	.api-content {
		@apply space-y-8;
	}

	.api-section {
		@apply space-y-6;
	}

	.section-title {
		@apply border-b border-gray-200 pb-2 text-xl font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300;
	}

	/* Methods */
	.methods-list {
		@apply space-y-8;
	}

	.method-item {
		@apply space-y-4 rounded-lg border border-gray-200 p-6 dark:border-gray-700;
	}

	.method-header {
		@apply flex items-center gap-3;
	}

	.method-name {
		@apply text-lg font-semibold text-gray-700 dark:text-gray-300;
	}

	.async-badge {
		@apply rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200;
	}

	.deprecated-badge {
		@apply rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200;
	}

	.method-description {
		@apply text-gray-600 dark:text-gray-400;
	}

	.method-signature {
		@apply -mx-2;
	}

	.method-params,
	.method-returns,
	.method-example {
		@apply space-y-3;
	}

	.params-title,
	.returns-title,
	.example-title {
		@apply text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300;
	}

	.params-list {
		@apply space-y-3;
	}

	.param-item {
		@apply space-y-1;
	}

	.param-header {
		@apply flex items-center gap-2;
	}

	.param-name {
		@apply rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-800;
	}

	.param-type {
		@apply font-mono text-sm text-blue-600 dark:text-blue-400;
	}

	.optional-badge {
		@apply rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400;
	}

	.param-description {
		@apply ml-2 text-sm text-gray-600 dark:text-gray-400;
	}

	.returns-info {
		@apply space-y-1;
	}

	.returns-type {
		@apply font-mono text-sm text-blue-600 dark:text-blue-400;
	}

	.returns-description {
		@apply text-sm text-gray-600 dark:text-gray-400;
	}

	/* Properties */
	.properties-list {
		@apply space-y-4;
	}

	.property-item {
		@apply space-y-2 rounded border border-gray-200 p-4 dark:border-gray-700;
	}

	.property-header {
		@apply flex items-center gap-3;
	}

	.property-name {
		@apply rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-800;
	}

	.property-type {
		@apply font-mono text-sm text-blue-600 dark:text-blue-400;
	}

	.readonly-badge {
		@apply rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
	}

	.property-description {
		@apply text-sm text-gray-600 dark:text-gray-400;
	}

	/* Types */
	.types-list {
		@apply space-y-6;
	}

	.type-item {
		@apply space-y-4;
	}

	.type-header {
		@apply space-y-1;
	}

	.type-name {
		@apply text-lg font-semibold text-gray-700 dark:text-gray-300;
	}

	.type-description {
		@apply text-gray-600 dark:text-gray-400;
	}

	.type-definition {
		@apply -mx-2;
	}
</style>
