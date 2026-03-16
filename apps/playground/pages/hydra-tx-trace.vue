<template>
	<div class="container mx-auto p-6 max-w-5xl">
		<h1 class="text-3xl font-bold text-center mb-8 text-primary">🧭 Hydra Message Trace</h1>

		<div class="grid gap-6">
			<el-card shadow="hover">
				<template #header>
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<span class="text-lg font-semibold">Hydra WS Error JSON</span>
							<el-tooltip placement="top" effect="dark" content="Paste full Hydra WS message JSON containing validationError.reason and TxInfo for best parsing.">
								<Icon name="mdi:help-circle-outline" size="18" class="text-gray-400" />
							</el-tooltip>
						</div>
						<div class="flex gap-2">
							<el-button type="primary" :disabled="!rawInput" @click="parseTrace">Parse Trace</el-button>
							<el-button @click="pasteFromClipboard">Paste</el-button>
							<!-- <el-button @click="applyExample">Use Example</el-button> -->
							<el-button @click="clearAll">Clear</el-button>
						</div>
					</div>
				</template>

				<div class="space-y-3">
					<el-input
						v-model="rawInput"
						type="textarea"
						:rows="18"
						@paste="handlePasteParse"
						placeholder='Example: { "tag": "TxInvalid", "transaction": { "txId": "..." }, "validationError": { "reason": "Plutus validation failed: ..." } }'
					/>
					<div class="trace-example">
						<div class="trace-example-header">Short example error message</div>
						<pre class="trace-example-body">{{ shortExampleMessage }}</pre>
					</div>
					<p class="text-sm text-gray-500">Pipeline: parse JSON → extract ScriptInfo/TxInfo/DebugFailure → structure → beautify</p>
				</div>
			</el-card>

			<el-card shadow="hover" v-if="parseError">
				<template #header>
					<div class="flex items-center gap-2">
						<span class="text-lg font-semibold text-red-600">Parse Error</span>
					</div>
				</template>
				<div class="p-3 bg-red-50 rounded border border-red-200 text-red-700 text-sm break-words">
					{{ parseError }}
				</div>
			</el-card>

			<el-card shadow="hover" v-if="traceResult">
				<template #header>
					<div class="flex items-center gap-2">
						<span class="text-lg font-semibold">Beautified Trace</span>
					</div>
				</template>

				<div class="space-y-3">
					<div class="trace-output">
						<div
							v-for="(line, index) in beautifiedLines"
							:key="`${index}-${line.text}`"
							:class="[
								'trace-line',
								line.type === 'heading' ? 'trace-heading' : '',
								line.type === 'bullet' ? 'trace-bullet' : '',
								line.type === 'kv' ? 'trace-kv' : '',
								line.type === 'empty' ? 'trace-empty' : ''
							]"
						>
							{{ line.text }}
						</div>
					</div>

					<el-collapse v-if="traceResult.rawValidationReason">
						<el-collapse-item title="Raw Validation Reason" name="raw-reason">
							<div class="trace-raw-reason">
								<div class="trace-raw-reason-body">{{ traceResult.rawValidationReason }}</div>
							</div>
						</el-collapse-item>
					</el-collapse>

					<div v-if="traceResult.txInfo.exists" class="tx-info-card">
						<div class="tx-info-title">Tx Info</div>

						<div class="tx-info-grid">
							<div class="tx-info-item">
								<div class="tx-info-label">TxId</div>
								<div class="tx-info-value tx-mono">{{ traceResult.txInfo.txId || 'N/A' }}</div>
							</div>
							<div class="tx-info-item">
								<div class="tx-info-label">Fee</div>
								<div class="tx-info-value">{{ traceResult.txInfo.fee || 'N/A' }}</div>
							</div>
							<div class="tx-info-item">
								<div class="tx-info-label">Valid range</div>
								<div class="tx-info-value">{{ traceResult.txInfo.validRange || 'N/A' }}</div>
							</div>
							<div class="tx-info-item">
								<div class="tx-info-label">Value minted</div>
								<div class="tx-info-value tx-mono">{{ traceResult.txInfo.valueMinted || 'N/A' }}</div>
							</div>
							<div class="tx-info-item">
								<div class="tx-info-label">Signatories</div>
								<div class="tx-info-value tx-mono">{{ traceResult.txInfo.signatories || '[]' }}</div>
							</div>
							<div class="tx-info-item">
								<div class="tx-info-label">Redeemers</div>
								<div class="tx-info-value tx-mono">{{ traceResult.txInfo.redeemers || '[]' }}</div>
							</div>
						</div>

						<div class="tx-metrics">
							<span class="tx-metric">Inputs: {{ traceResult.txInfo.inputsCount }}</span>
							<span class="tx-metric">Reference inputs: {{ traceResult.txInfo.referenceInputsCount }}</span>
							<span class="tx-metric">Outputs: {{ traceResult.txInfo.outputsCount }}</span>
							<span class="tx-metric">Datums: {{ traceResult.txInfo.datumsCount }}</span>
							<span class="tx-metric">TxCerts: {{ traceResult.txInfo.txCertsCount }}</span>
							<span class="tx-metric">Votes: {{ traceResult.txInfo.votesCount }}</span>
							<span class="tx-metric">Proposal Procedures: {{ traceResult.txInfo.proposalProceduresCount }}</span>
						</div>

						<div class="tx-info-grid tx-info-grid-compact">
							<div class="tx-info-item">
								<div class="tx-info-label">Current Treasury Amount</div>
								<div class="tx-info-value">{{ traceResult.txInfo.currentTreasuryAmount || 'N/A' }}</div>
							</div>
							<div class="tx-info-item">
								<div class="tx-info-label">Treasury Donation</div>
								<div class="tx-info-value">{{ traceResult.txInfo.treasuryDonation || 'N/A' }}</div>
							</div>
						</div>

						<el-collapse class="mt-2">
							<el-collapse-item title="Parsed Tx Info (Haskell show normalized)" name="tx-info-parsed" class="pl-1">
								<div class="tx-section-wrap">
									<div class="tx-section-title">Inputs</div>
									<div class="tx-info-raw">{{ traceResult.txInfo.parsedInputs || '[]' }}</div>

									<div v-if="traceResult.txInfo.parsedReferenceInputs" class="tx-section-title mt-2">Reference inputs</div>
									<div v-if="traceResult.txInfo.parsedReferenceInputs" class="tx-info-raw">{{ traceResult.txInfo.parsedReferenceInputs }}</div>

									<div class="tx-section-title mt-2">Outputs</div>
									<div class="tx-info-raw">{{ traceResult.txInfo.parsedOutputs || '[]' }}</div>

									<div class="tx-section-title mt-2">Other fields</div>
									<div class="tx-info-raw">{{ traceResult.txInfo.parsedOthers || 'N/A' }}</div>
								</div>
							</el-collapse-item>
							<el-collapse-item title="Raw Tx Info Block" name="tx-info-raw" class="pl-1">
								<div class="tx-info-raw">{{ traceResult.txInfo.raw }}</div>
							</el-collapse-item>
						</el-collapse>
					</div>

					<el-collapse>
						<el-collapse-item title="Structured Object" name="1">
							<div class="p-4 bg-gray-100 rounded-lg font-mono text-xs whitespace-pre-wrap break-words">
								{{ JSON.stringify(traceResult, null, 2) }}
							</div>
						</el-collapse-item>
					</el-collapse>
				</div>
			</el-card>
		</div>
	</div>
</template>

<script setup lang="ts">
	interface TraceSummary {
		mintedAssets: number
		referenceInputs: number
		outputs: number
		datums: number
	}

	interface TxInfoView {
		exists: boolean
		txId: string
		fee: string
		valueMinted: string
		validRange: string
		signatories: string
		redeemers: string
		currentTreasuryAmount: string
		treasuryDonation: string
		inputsCount: number
		referenceInputsCount: number
		outputsCount: number
		datumsCount: number
		txCertsCount: number
		votesCount: number
		proposalProceduresCount: number
		parsedInputs: string
		parsedReferenceInputs: string
		parsedOutputs: string
		parsedOthers: string
		raw: string
	}

	interface TraceResult {
		tag: string
		headId: string
		seq: number | null
		timestamp: string
		txId: string
		rawValidationReason: string
		validationReasonHuman: string
		script: string
		scriptHash: string
		protocolVersion: string
		runtimeError: string
		likelyCause: string
		redeemer: string
		summary: TraceSummary
		txInfo: TxInfoView
		recommendedChecks: string[]
		rawBlocks: {
			scriptInfo: string
			txInfo: string
			debugFailure: string
		}
	}

	const rawInput = ref('')
	const parseError = ref('')
	const traceResult = ref<TraceResult | null>(null)

	const shortExampleMessage = `{
	"tag": "TxInvalid",
	"timestamp": "2026-02-25T10:03:07Z",
	"transaction": { "txId": "f291c592..." },
	"validationError": {
		"reason": "Plutus validation failed:\\nScriptInfo: MintingScript aca8b6...\\nTxInfo:\\n  TxId: f291c592...\\n  Inputs: [ ... ]\\nCaused by: force tailList []"
	}
}`

	const beautifiedOutput = computed(() => {
		if (!traceResult.value) return ''
		const value = traceResult.value
		return [
			`Script: ${value.script}${value.scriptHash ? ` (${shortHex(value.scriptHash)})` : ''}`,
			`Protocol: ${value.protocolVersion}`,
			'',
			'Validation Error (Human Readable):',
			value.validationReasonHuman || 'No validation error details available',
			'',
			'Runtime Error:',
			value.runtimeError || 'Unknown runtime error',
			'',
			'Likely Cause:',
			value.likelyCause || 'Could not infer likely cause',
			'',
			'Context Summary:',
			`Minted assets: ${value.summary.mintedAssets}`,
			`Reference inputs: ${value.summary.referenceInputs}`,
			`Outputs: ${value.summary.outputs}`,
			`Datums: ${value.summary.datums}`,
			'',
			'Redeemer:',
			value.redeemer || 'N/A',
			'',
			'Recommended Check:',
			...value.recommendedChecks.map(item => `- ${item}`)
		].join('\n')
	})

	const beautifiedLines = computed(() => {
		const lines = beautifiedOutput.value.split('\n')
		return lines.map(line => {
			if (!line.trim()) return { text: '', type: 'empty' as const }
			if (line.startsWith('- ')) return { text: line, type: 'bullet' as const }
			if (line.endsWith(':')) return { text: line, type: 'heading' as const }
			if (/^[A-Za-z][A-Za-z\s]+:\s.+/.test(line)) return { text: line, type: 'kv' as const }
			return { text: line, type: 'text' as const }
		})
	})

	function parseTrace() {
		parseError.value = ''
		traceResult.value = null

		const trimmed = rawInput.value.trim()
		if (!trimmed) {
			parseError.value = 'Input is empty. Please paste Hydra error JSON.'
			return
		}

		let payload: any
		try {
			payload = JSON.parse(trimmed)
		} catch (error: any) {
			parseError.value = `Invalid JSON: ${error?.message || 'Unable to parse input'}`
			return
		}

		const reason: string = payload?.validationError?.reason || ''
		const normalizedRawReason = normalizeReasonLineBreaks(reason)
		const sourceText = [normalizedRawReason, JSON.stringify(payload)].filter(Boolean).join('\n')

		const scriptInfo = extractBlock(sourceText, /ScriptInfo:\s*([\s\S]*?)(?=\nTxInfo:|$)/)
		const txInfo = extractBlock(sourceText, /TxInfo:\s*([\s\S]*?)(?=\nRedeemer:|\nDebug info:|$)/)
		const debugFailure = extractBlock(sourceText, /DebugFailure\s*\[([\s\S]*?)\]\s*\(CekError|Debug info:\s*([\s\S]*?)$/)

		const protocolVersion = normalizeProtocolVersion(firstMatch(sourceText, /The protocol version is:\s*Version\s*(\d+)/, 1))
		const script = firstMatch(sourceText, /ScriptInfo:\s*([^\n]+)/, 1)
		const scriptHash = firstMatch(sourceText, /The script hash is:\s*ScriptHash\s*"([a-f0-9]+)"/, 1)
		const txId = payload?.transaction?.txId || firstMatch(sourceText, /TxId:\s*([a-f0-9]+)/, 1)

		const runtimeErrorRaw = firstMatch(sourceText, /Caused by:\s*([^\n]+)/, 1)
		const runtimeError = normalizeRuntimeError(runtimeErrorRaw)
		const likelyCause = inferLikelyCause(sourceText, runtimeErrorRaw)
		const validationReasonHuman = humanizeValidationReason(normalizedRawReason, sourceText)

		const redeemerRaw = firstMatch(sourceText, /Redeemer:\s*\n\s*([^\n]+)/, 1)
		const redeemer = normalizeRedeemer(redeemerRaw)

		const summary = buildSummary(sourceText)
		const parsedTxInfo = parseTxInfoBlock(txInfo, txId || '')

		traceResult.value = {
			tag: payload?.tag || '',
			headId: payload?.headId || '',
			seq: Number.isFinite(payload?.seq) ? payload.seq : null,
			timestamp: payload?.timestamp || '',
			txId: txId || '',
			rawValidationReason: normalizedRawReason,
			validationReasonHuman,
			script: script || 'Unknown',
			scriptHash: scriptHash || '',
			protocolVersion,
			runtimeError,
			likelyCause,
			redeemer,
			summary,
			txInfo: parsedTxInfo,
			recommendedChecks: ['Check outputs_with(...) result', 'Check inputs_with(...) result', 'Ensure reference input filtering matches policy id'],
			rawBlocks: {
				scriptInfo,
				txInfo,
				debugFailure
			}
		}
	}

	function clearAll() {
		rawInput.value = ''
		parseError.value = ''
		traceResult.value = null
	}

	function applyExample() {
		rawInput.value = shortExampleMessage
		parseError.value = ''
		traceResult.value = null
	}

	function handlePasteParse() {
		nextTick(() => {
			if (!rawInput.value.trim()) return
			parseTrace()
		})
	}

	async function pasteFromClipboard() {
		parseError.value = ''
		try {
			const clipboardText = await navigator.clipboard.readText()
			rawInput.value = clipboardText || ''
			if (rawInput.value.trim()) {
				parseTrace()
			}
		} catch (error: any) {
			parseError.value = `Cannot read clipboard: ${error?.message || 'Permission denied or clipboard is unavailable'}`
		}
	}

	function extractBlock(text: string, pattern: RegExp): string {
		const match = text.match(pattern)
		if (!match) return ''
		return (match[1] || match[2] || '').trim()
	}

	function firstMatch(text: string, pattern: RegExp, index = 0): string {
		const match = text.match(pattern)
		return match?.[index] ? String(match[index]).trim() : ''
	}

	function normalizeProtocolVersion(version: string): string {
		if (!version) return 'Unknown'
		return `V${version}`
	}

	function normalizeRuntimeError(raw: string): string {
		if (!raw) return 'Unknown runtime error'
		if (raw.includes('tailList []')) return 'Attempted to take tail of empty list'
		return raw
	}

	function inferLikelyCause(sourceText: string, runtimeErrorRaw: string): string {
		if (sourceText.includes('Expected a non-empty list but got an empty one') || runtimeErrorRaw.includes('tailList []')) {
			return 'A list expected to be non-empty was empty.'
		}
		return 'Unable to infer likely cause from message.'
	}

	function normalizeRedeemer(redeemerRaw: string): string {
		if (!redeemerRaw) return 'N/A'
		const constrMatch = redeemerRaw.match(/^<\s*(\d+)\s*,\s*(.+)>$/)
		if (!constrMatch) return redeemerRaw
		return `Constr 0 [${constrMatch[1]}, <bytes>]`
	}

	function normalizeReasonLineBreaks(reason: string): string {
		if (!reason) return ''
		return reason
			.replace(/\\r\\n/g, '\n')
			.replace(/\\n/g, '\n')
			.replace(/\/n/g, '\n')
			.trim()
	}

	function humanizeValidationReason(reason: string, sourceText: string): string {
		if (!reason?.trim()) return ''

		const lines: string[] = []
		const prettyScriptInfo = firstMatch(sourceText, /ScriptInfo:\s*([^\n]+)/, 1)
		const prettyProtocol = normalizeProtocolVersion(firstMatch(sourceText, /The protocol version is:\s*Version\s*(\d+)/, 1))
		const scriptHash = firstMatch(sourceText, /The script hash is:\s*ScriptHash\s*"([a-f0-9]+)"/, 1)
		const runtimeErrorRaw = firstMatch(sourceText, /Caused by:\s*([^\n]+)/, 1)
		const debugFailure = firstMatch(sourceText, /DebugFailure\s*\["([^"]+)"\]/, 1)

		if (prettyScriptInfo) {
			lines.push(`Script: ${prettyScriptInfo}${scriptHash ? ` (${shortHex(scriptHash)})` : ''}`)
		}
		if (prettyProtocol !== 'Unknown') {
			lines.push(`Protocol: ${prettyProtocol}`)
		}

		const normalizedError = normalizeRuntimeError(runtimeErrorRaw)
		if (normalizedError && normalizedError !== 'Unknown runtime error') {
			lines.push(`Failure: ${normalizedError}`)
		}
		if (debugFailure) {
			lines.push(`Debug: ${debugFailure}`)
		}

		const summary = buildSummary(sourceText)
		lines.push(`Summary: minted ${summary.mintedAssets}, reference inputs ${summary.referenceInputs}, outputs ${summary.outputs}, datums ${summary.datums}`)

		const likelyCause = inferLikelyCause(sourceText, runtimeErrorRaw)
		if (likelyCause && likelyCause !== 'Unable to infer likely cause from message.') {
			lines.push(`Likely cause: ${likelyCause}`)
		}

		if (lines.length > 0) {
			return lines.join('\n')
		}

		const compact = reason
			.replace(/\n+/g, ' ')
			.replace(/\s+/g, ' ')
			.replace(/Base64-encoded script bytes:\s*"[^"]+"/g, 'Base64 script bytes: [omitted]')
			.trim()

		return compact.length > 600 ? `${compact.slice(0, 600)}…` : compact
	}

	function buildSummary(sourceText: string): TraceSummary {
		const mintedBlock = extractBlock(sourceText, /Value minted:\s*([\s\S]*?)(?=\n\s*TxCerts:|$)/)
		const mintedAssets = countMintedAssets(mintedBlock)

		const referenceInputsBlock = extractBlock(sourceText, /Reference inputs:\s*\[([\s\S]*?)\]\s*\n\s*Outputs:/)
		const outputsBlock = extractBlock(sourceText, /Outputs:\s*\[([\s\S]*?)\]\s*\n\s*Fee:/)
		const datumsBlock = extractBlock(sourceText, /Datums:\s*\[([\s\S]*?)\]\s*\n\s*Votes:/)

		return {
			mintedAssets,
			referenceInputs: countOccurrences(referenceInputsBlock, /->/g),
			outputs: countOccurrences(outputsBlock, /-\s*Value/g),
			datums: countDatums(datumsBlock)
		}
	}

	function parseTxInfoBlock(txInfoBlock: string, fallbackTxId: string): TxInfoView {
		if (!txInfoBlock?.trim()) {
			return {
				exists: false,
				txId: '',
				fee: '',
				valueMinted: '',
				validRange: '',
				signatories: '',
				redeemers: '',
				currentTreasuryAmount: '',
				treasuryDonation: '',
				inputsCount: 0,
				referenceInputsCount: 0,
				outputsCount: 0,
				datumsCount: 0,
				txCertsCount: 0,
				votesCount: 0,
				proposalProceduresCount: 0,
				parsedInputs: '',
				parsedReferenceInputs: '',
				parsedOutputs: '',
				parsedOthers: '',
				raw: ''
			}
		}

		const inputsSection = extractBlock(txInfoBlock, /Inputs:\s*\[([\s\S]*?)\]\s*(Reference inputs:|Outputs:)/)
		const referenceInputsSection = extractBlock(txInfoBlock, /Reference inputs:\s*\[([\s\S]*?)\]\s*Outputs:/)
		const outputsSection = extractBlock(txInfoBlock, /Outputs:\s*\[([\s\S]*?)\]\s*Fee:/)
		const othersSection = firstMatch(txInfoBlock, /Fee:\s*([\s\S]*)$/, 1)

		return {
			exists: true,
			txId: firstMatch(txInfoBlock, /TxId:\s*([^\n]+)/, 1) || fallbackTxId,
			fee: firstMatch(txInfoBlock, /Fee:\s*([^\n]*)/, 1),
			valueMinted: firstMatch(txInfoBlock, /Value minted:\s*([^\n]*)/, 1),
			validRange: firstMatch(txInfoBlock, /Valid range:\s*([^\n]*)/, 1),
			signatories: firstMatch(txInfoBlock, /Signatories:\s*([^\n]*)/, 1),
			redeemers: compactWhitespace(extractBlock(txInfoBlock, /Redeemers:\s*\[([\s\S]*?)\]\s*Datums:/)),
			currentTreasuryAmount: firstMatch(txInfoBlock, /Current Treasury Amount:\s*([^\n]*)/, 1),
			treasuryDonation: firstMatch(txInfoBlock, /Treasury Donation:\s*([^\n]*)/, 1),
			inputsCount: countOccurrences(inputsSection, /->/g),
			referenceInputsCount: countOccurrences(referenceInputsSection, /->/g),
			outputsCount: countOccurrences(outputsSection, /-\s*Value/g),
			datumsCount: countListFieldEntries(txInfoBlock, 'Datums'),
			txCertsCount: countListFieldEntries(txInfoBlock, 'TxCerts'),
			votesCount: countListFieldEntries(txInfoBlock, 'Votes'),
			proposalProceduresCount: countListFieldEntries(txInfoBlock, 'Proposal Procedures'),
			parsedInputs: normalizeHaskellShowSection(inputsSection),
			parsedReferenceInputs: normalizeHaskellShowSection(referenceInputsSection),
			parsedOutputs: normalizeHaskellShowSection(outputsSection),
			parsedOthers: normalizeHaskellShowSection(othersSection),
			raw: txInfoBlock.trim()
		}
	}

	function countMintedAssets(block: string): number {
		if (!block) return 0
		const assetMatches = block.match(/\("[^"]+"\s*,\s*\d+\)/g)
		if (assetMatches?.length) return assetMatches.length
		if (block.includes('Map {unMap = []}')) return 0
		return block.includes('unMap') ? 1 : 0
	}

	function countDatums(block: string): number {
		if (!block || block.trim() === '') return 0
		if (block.includes('unMap = []')) return 0
		const datumMatches = block.match(/\(.*?\)/g)
		return datumMatches?.length || 0
	}

	function countOccurrences(text: string, pattern: RegExp): number {
		if (!text) return 0
		const matches = text.match(pattern)
		return matches ? matches.length : 0
	}

	function shortHex(value: string): string {
		if (!value) return ''
		if (value.length <= 12) return value
		return `${value.slice(0, 6)}…${value.slice(-4)}`
	}

	function compactWhitespace(value: string): string {
		if (!value) return ''
		return value.replace(/\s+/g, ' ').trim()
	}

	function countListFieldEntries(text: string, fieldName: string): number {
		const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		const content = firstMatch(text, new RegExp(`${escaped}:\\s*\\[([\\s\\S]*?)\\]`, 'm'), 1)
		if (!content || !content.trim()) return 0
		const compact = content.trim()
		if (compact === '') return 0
		if (compact === ',') return 0
		return compact
			.split(',')
			.map(item => item.trim())
			.filter(Boolean).length
	}

	function normalizeHaskellShowSection(value: string): string {
		if (!value) return ''

		const normalized = value.replace(/\r\n/g, '\n').replace(/\t/g, '    ')
		const lines = normalized.split('\n').map(line => line.replace(/\s+$/g, ''))
		const nonEmptyLines = lines.filter(line => line.trim().length > 0)
		if (nonEmptyLines.length === 0) return ''

		const commonIndent = Math.min(
			...nonEmptyLines.map(line => {
				const leading = line.match(/^\s*/)?.[0] ?? ''
				return leading.length
			})
		)

		return lines
			.map(line => {
				if (!line.trim()) return ''
				const deindented = line.slice(commonIndent)
				const leading = deindented.match(/^\s*/)?.[0] ?? ''
				const content = deindented.slice(leading.length).replace(/\s{2,}/g, ' ')
				const tabLevel = Math.floor(leading.length / 2)
				return `${'\t'.repeat(tabLevel)}${content}`
			})
			.join('\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim()
	}
</script>

<style scoped>
	.trace-output {
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid var(--el-border-color);
		background: var(--el-color-info-light-9);
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
		font-size: 14px;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.trace-example {
		padding: 0.75rem;
		border-radius: 0.6rem;
		border: 1px solid var(--el-border-color-lighter);
		background: var(--el-fill-color-light);
	}

	.trace-example-header {
		font-size: 12px;
		font-weight: 600;
		color: var(--el-text-color-secondary);
		margin-bottom: 0.35rem;
	}

	.trace-example-body {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
		font-size: 11px;
		line-height: 1.45;
		white-space: pre-wrap;
		word-break: break-word;
		color: var(--el-text-color-regular);
	}

	.trace-line {
		color: var(--el-text-color-primary);
	}

	.trace-heading {
		font-weight: 700;
		margin-top: 0.35rem;
		color: var(--el-color-primary);
	}

	.trace-kv {
		color: var(--el-text-color-regular);
	}

	.trace-bullet {
		padding-left: 0.75rem;
		color: var(--el-text-color-regular);
	}

	.trace-empty {
		height: 0.35rem;
	}

	.trace-raw-reason {
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid var(--el-border-color);
		background: var(--el-fill-color-light);
	}

	.trace-raw-reason-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--el-text-color-primary);
		margin-bottom: 0.5rem;
	}

	.trace-raw-reason-body {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
		font-size: 0.8rem;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
		color: var(--el-text-color-regular);
	}

	.tx-info-card {
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid var(--el-border-color);
		/* background: var(--el-fill-color); */
	}

	.tx-info-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--el-color-primary);
		margin-bottom: 0.75rem;
	}

	.tx-info-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.tx-info-grid-compact {
		margin-top: 0.75rem;
	}

	.tx-info-item {
		padding: 0.6rem;
		border-radius: 0.5rem;
		background: var(--el-fill-color-light);
		border: 1px solid var(--el-border-color-lighter);
	}

	.tx-info-label {
		font-size: 14px;
		font-weight: 600;
		color: var(--el-text-color-secondary);
		margin-bottom: 0.2rem;
	}

	.tx-info-value {
		font-size: 12px;
		color: var(--el-text-color-primary);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.tx-mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
	}

	.tx-metrics {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-top: 0.8rem;
		margin-bottom: 0.75rem;
	}

	.tx-metric {
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
		background: var(--el-color-primary-light-9);
		color: var(--el-color-primary);
		border: 1px solid var(--el-color-primary-light-7);
	}

	.tx-info-raw {
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: var(--el-fill-color-light);
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
		font-size: 0.78rem;
		line-height: 1.45;
		white-space: pre-wrap;
		word-break: break-word;
		color: var(--el-text-color-regular);
	}

	.tx-section-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.tx-section-title {
		font-size: 12px;
		font-weight: 700;
		color: var(--el-text-color-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	@media (max-width: 768px) {
		.tx-info-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
