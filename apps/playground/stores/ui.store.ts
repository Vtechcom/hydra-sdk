import { toast } from 'vue-sonner'

export interface WorkspaceLayout {
	/** Percentage widths of the context / builder / result columns. */
	columns: [number, number, number]
}

const DEFAULT_LAYOUT: WorkspaceLayout = { columns: [22, 40, 38] }

export const useUiStore = defineStore('ui', () => {
	// New key: the previous value stored a vue3-grid-layout item list, which this
	// workspace no longer understands. Bumping the key retires it cleanly instead
	// of trying to migrate a layout model that no longer exists.
	const layout = useLocalStorage<WorkspaceLayout>('hydra-playground.workspace.v1', DEFAULT_LAYOUT, { mergeDefaults: true })
	const contextCollapsed = useLocalStorage('hydra-playground.context-collapsed', false)
	// Closed until there is something to sign — the dock is a lot of vertical
	// space to spend on an empty form (BottomDock opens it on a successful build).
	const dockOpen = useLocalStorage('hydra-playground.dock-open', false)

	const setColumns = (sizes: number[]) => {
		if (sizes.length === 3) layout.value.columns = [sizes[0], sizes[1], sizes[2]]
	}

	const resetWorkspace = () => {
		layout.value = { columns: [...DEFAULT_LAYOUT.columns] as [number, number, number] }
		contextCollapsed.value = false
		dockOpen.value = false
		toast.success('Workspace layout reset')
	}

	return {
		layout,
		contextCollapsed,
		dockOpen,
		setColumns,
		resetWorkspace
	}
})
