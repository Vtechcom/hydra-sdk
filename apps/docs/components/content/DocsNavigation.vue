<template>
	<nav class="docs-navigation">
		<div class="nav-section">
			<h3 class="nav-title">Getting Started</h3>
			<ul class="nav-list">
				<li><NuxtLink to="/getting-started" class="nav-link">Overview</NuxtLink></li>
				<li><NuxtLink to="/getting-started/installation" class="nav-link">Installation</NuxtLink></li>
				<li><NuxtLink to="/getting-started/quick-start" class="nav-link">Quick Start</NuxtLink></li>
				<li><NuxtLink to="/getting-started/configuration" class="nav-link">Configuration</NuxtLink></li>
			</ul>
		</div>

		<div class="nav-section">
			<h3 class="nav-title">API Reference</h3>
			<ul class="nav-list">
				<li><NuxtLink to="/api" class="nav-link">Overview</NuxtLink></li>
				<li><NuxtLink to="/api/core" class="nav-link">@hydra-sdk/core</NuxtLink></li>
				<li><NuxtLink to="/api/bridge" class="nav-link">@hydra-sdk/bridge</NuxtLink></li>
				<li><NuxtLink to="/api/transaction" class="nav-link">@hydra-sdk/transaction</NuxtLink></li>
				<li><NuxtLink to="/api/cardano-wasm" class="nav-link">@hydra-sdk/cardano-wasm</NuxtLink></li>
			</ul>
		</div>

		<div class="nav-section">
			<h3 class="nav-title">Examples</h3>
			<ul class="nav-list">
				<li><NuxtLink to="/examples" class="nav-link">Overview</NuxtLink></li>
				<li><NuxtLink to="/examples/wallet-creation" class="nav-link">Wallet Creation</NuxtLink></li>
				<li><NuxtLink to="/examples/hydra-integration" class="nav-link">Hydra Integration</NuxtLink></li>
				<li><NuxtLink to="/examples/transaction-building" class="nav-link">Transaction Building</NuxtLink></li>
				<li><NuxtLink to="/examples/full-application" class="nav-link">Full Application</NuxtLink></li>
			</ul>
		</div>

		<div class="nav-section">
			<h3 class="nav-title">Guides</h3>
			<ul class="nav-list">
				<li><NuxtLink to="/guides" class="nav-link">Overview</NuxtLink></li>
				<li><NuxtLink to="/guides/building-wallet-app" class="nav-link">Building Wallet App</NuxtLink></li>
				<li><NuxtLink to="/guides/hydra-head-management" class="nav-link">Hydra Head Management</NuxtLink></li>
				<li><NuxtLink to="/guides/testing-strategies" class="nav-link">Testing Strategies</NuxtLink></li>
				<li><NuxtLink to="/guides/deployment" class="nav-link">Deployment</NuxtLink></li>
			</ul>
		</div>
	</nav>
</template>

<style scoped>
	.docs-navigation {
		@apply space-y-6;
	}

	.nav-section {
		@apply space-y-2;
	}

	.nav-title {
		@apply text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100;
	}

	.nav-list {
		@apply space-y-1;
	}

	.nav-link {
		@apply block rounded px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100;
	}

	.nav-link.router-link-active {
		@apply bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400;
	}
</style>
