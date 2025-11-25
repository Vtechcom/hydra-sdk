export const useViewImage = () => {
	const showModal = useState('showImageModal', () => false)
	const imageProps = useState('imageProps', () => ({ src: '', alt: '' }))

	return {
		showModal,
		imageProps,
		openImageModal: (src: string, alt?: string) => {
			imageProps.value = { src, alt: alt || '' }
			showModal.value = true
		},
		closeImageModal: () => {
			showModal.value = false
			imageProps.value = { src: '', alt: '' }
		}
	}
}
