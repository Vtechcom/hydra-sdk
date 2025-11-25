<template>
  <div class="code-block" :class="{ 'with-filename': filename }">
    <div v-if="filename" class="code-filename">
      <Icon name="lucide:file-text" class="file-icon" />
      <span>{{ filename }}</span>
    </div>
    
    <div class="code-header">
      <div class="language-info">
        <span class="language-label">{{ language }}</span>
        <span v-if="lines" class="lines-count">{{ lines }} lines</span>
      </div>
      
      <div class="code-actions">
        <button 
          @click="copyCode" 
          class="action-btn"
          :class="{ 'copied': isCopied }"
          :title="isCopied ? 'Copied!' : 'Copy code'"
        >
          <Icon v-if="!isCopied" name="lucide:copy" />
          <Icon v-else name="lucide:check" />
        </button>
        
        <button 
          v-if="collapsible"
          @click="toggleCollapse" 
          class="action-btn"
          :title="isCollapsed ? 'Expand' : 'Collapse'"
        >
          <Icon :name="isCollapsed ? 'lucide:chevron-down' : 'lucide:chevron-up'" />
        </button>
      </div>
    </div>
    
    <div 
      class="code-content" 
      :class="{ 'collapsed': isCollapsed }"
    >
      <pre><code :class="`language-${language}`" v-html="highlightedCode"></code></pre>
    </div>
    
    <div v-if="isCollapsed" class="collapse-indicator">
      <button @click="toggleCollapse" class="expand-btn">
        <Icon name="lucide:chevron-down" />
        <span>Show {{ lines }} lines</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  code: string
  language?: string
  filename?: string
  collapsible?: boolean
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  language: 'typescript',
  filename: '',
  collapsible: false,
  maxHeight: '400px'
})

const { copy } = useClipboard()
const isCopied = ref(false)
const isCollapsed = ref(false)

const lines = computed(() => {
  return props.code.split('\n').length
})

const highlightedCode = computed(() => {
  // This would integrate with a syntax highlighter like Prism.js or Shiki
  // For now, return the raw code
  return props.code
})

const copyCode = async () => {
  await copy(props.code)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.code-block {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900;
}

.with-filename {
  @apply border-t-2 border-t-blue-500;
}

.code-filename {
  @apply flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700;
}

.file-icon {
  @apply w-4 h-4 text-blue-600 dark:text-blue-400;
}

.code-filename span {
  @apply text-sm font-medium text-blue-800 dark:text-blue-200;
}

.code-header {
  @apply flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.language-info {
  @apply flex items-center gap-3;
}

.language-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.lines-count {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.code-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors;
}

.action-btn.copied {
  @apply text-green-600 dark:text-green-400;
}

.code-content {
  @apply relative;
  max-height: v-bind(maxHeight);
  @apply overflow-auto;
}

.code-content.collapsed {
  max-height: 120px;
  @apply overflow-hidden;
}

.code-content pre {
  @apply p-4 m-0 bg-transparent;
}

.code-content code {
  @apply text-sm font-mono leading-relaxed;
}

.collapse-indicator {
  @apply border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800;
}

.expand-btn {
  @apply w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors;
}

/* Syntax highlighting styles */
.code-content :deep(.token.comment) {
  @apply text-gray-500 dark:text-gray-400;
}

.code-content :deep(.token.keyword) {
  @apply text-purple-600 dark:text-purple-400;
}

.code-content :deep(.token.string) {
  @apply text-green-600 dark:text-green-400;
}

.code-content :deep(.token.number) {
  @apply text-blue-600 dark:text-blue-400;
}

.code-content :deep(.token.function) {
  @apply text-yellow-600 dark:text-yellow-400;
}

.code-content :deep(.token.operator) {
  @apply text-gray-700 dark:text-gray-300;
}
</style>
