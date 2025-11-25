import { toast } from 'vue-sonner'
import type { LayoutItem } from 'vue3-grid-layout-next/dist/helpers/utils'

export const useUiStore = defineStore('ui', () => {
	const defaultLayout: LayoutItem[] = [
		{
			i: 'BaseWalletConfig',
			x: 0,
			y: 0,
			w: 3,
			h: 7,
			minW: 1,
			minH: 2,
			maxW: 3,
			maxH: 7,
			isDraggable: true,
			isResizable: false,
			moved: false
		},
		{
			i: 'BaseProviderConfig',
			x: 3,
			y: 0,
			w: 3,
			h: 7,
			minH: 2,
			minW: 2,
			maxH: 7,
			maxW: 3,
			isDraggable: true,
			isResizable: false,
			moved: false
		},
		{
			i: 'TxSigner',
			x: 0,
			y: 24,
			w: 3,
			h: 15,
			minW: 3,
			minH: 7,
			static: false,
			moved: false
		},
		{
			i: 'UtxoManager',
			x: 6,
			y: 24,
			w: 6,
			h: 15,
			minW: 6,
			minH: 7,
			static: false,
			moved: false
		},
		{
			i: 'TxBuilder',
			x: 0,
			y: 7,
			w: 12,
			h: 17,
			static: false,
			moved: false
		},
		{
			i: 'TxSubmit',
			x: 3,
			y: 24,
			w: 3,
			h: 15,
			static: false,
			moved: false
		}
	] as const
	const layout = useLocalStorage<LayoutItem[]>('layout.0.0.1', defaultLayout)
	const draggable = ref(true)
	const resizable = ref(true)

	const resetLayout = () => {
		layout.value = defaultLayout
		toast.success('Layout reset to default')
	}

	const getLayoutConfig = (key: string) => {
		return layout.value.find(item => item.i === key)!
	}

	const setMinimized = (i: string, minimized: boolean) => {
		const item = layout.value.find(item => item.i === i)
		if (item) {
			item.h = minimized ? item.minH || 1 : item.maxH || 4
			item.w = minimized ? item.minW || 1 : item.maxW || 4
		} else {
			toast.error(`Item with key ${i} not found`)
		}
	}

	return {
		layout,
		draggable,
		resizable,
		resetLayout,
		getLayoutConfig,
		setMinimized
	}
})
