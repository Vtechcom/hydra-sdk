export function numberFormatter(value: string | number) {
	if (isNil(value) || value === '') return ''
	let num = parseFloat(value.toString().replace(/^0+/, ''))
	if (isNaN(num)) return ''
	console.log('numberFormatter', num)
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function numberParser(value: string): number {
	const maxNum = Number.MAX_SAFE_INTEGER
	const minNum = Number.MIN_SAFE_INTEGER
	let num = parseFloat(value.replace(/,/g, ''))
	if (isNaN(num)) {
		console.warn('NaN', value)
		return num
	}
	if (num < minNum) {
		console.warn('Min number', value)
		num = minNum
	}
	if (num > maxNum) {
		console.warn('Max number', value)
		num = maxNum
	}
	return num
}
