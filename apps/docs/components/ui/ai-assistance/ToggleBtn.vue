<script lang="ts" setup>
	const { visiblePanel } = useHydraAssistance()
</script>

<template>
	<button v-if="!visiblePanel" class="ask-hydra-btn hidden sm:inline-flex" @click="visiblePanel = true" aria-label="Ask Hydra AI" title="Ask Hydra AI">
		<div class="ask-hydra-btn__inner">
			<span class="btn-icon" aria-hidden="true">
				<!-- Chat + spark icon -->
				<Icon name="tabler:sparkles" size="20" />
			</span>
			<span class="btn-text">Ask Hydra AI (beta)</span>
			<!-- <span class="text-white absolute -top-2 right-1 rounded-full bg-violet-300 px-2 py-0.5 text-[10px] font-semibold">beta</span> -->
		</div>
	</button>
</template>

<style lang="scss" scoped>
	@keyframes rotation {
		0% {
			transform: translate(-50%, -50%) rotate(0deg);
		}
		50% {
			transform: translate(-50%, -50%) rotate(180deg);
		}
		100% {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}
	$primary-a: #ea69fe;
	$primary-b: #2cffe6;

	.ask-hydra-btn {
		overflow: hidden;
		padding: 2px;
		border-radius: 999px;
		border: none;
		cursor: pointer;
		color: #071328;
		font-weight: 600;
		font-size: 0.95rem;
		box-shadow:
			0 6px 18px rgba(44, 255, 230, 0.222),
			0 2px 6px rgba(234, 105, 254, 0.226);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			opacity 0.12s ease;
		-webkit-tap-highlight-color: transparent;

		&::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			width: 250px;
			height: 250px;
			background: #ea69fe;
			background: linear-gradient(90deg, #ea69fed5 0%, #ea69fed5 40%, #2cffe6d5 61%, #2cffe6d5 100%);

			-webkit-mask-composite: destination-out;
			mask-composite: exclude;
			pointer-events: none;

			transform: translate(-50%, -50%) rotate(0deg);
			transform-origin: center;
			animation: rotation 3s linear infinite;
			z-index: 0;
		}

		&__inner {
			display: inline-flex;
			align-items: center;
			gap: 0.75rem;
			background-image: linear-gradient(90deg, $primary-a 0%, $primary-b 100%);
			border-radius: 999px;
			padding: 0.5rem;
			position: relative;
			z-index: 1;
		}
	}

	.ask-hydra-btn:hover {
		transform: translateY(-3px);
		box-shadow:
			0 10px 30px rgba(44, 255, 230, 0.2),
			0 6px 16px rgba(234, 105, 254, 0.12);
	}

	.ask-hydra-btn:active {
		transform: translateY(-1px) scale(0.995);
	}

	.ask-hydra-btn:focus {
		outline: none;
		box-shadow:
			0 0 0 4px rgba(44, 255, 230, 0.12),
			0 10px 30px rgba(44, 255, 230, 0.16);
	}

	.btn-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.6rem;
		height: 1.6rem;
		flex-shrink: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
	}

	.btn-icon svg {
		width: 18px;
		height: 18px;
		fill: currentColor;
	}

	.btn-text {
		display: inline-block;
		color: #071328;
		letter-spacing: 0.1px;
	}

	@media (prefers-reduced-motion: reduce) {
		.ask-hydra-btn,
		.ask-hydra-btn:hover,
		.ask-hydra-btn:active {
			transition: none;
			transform: none;
		}
	}
</style>
