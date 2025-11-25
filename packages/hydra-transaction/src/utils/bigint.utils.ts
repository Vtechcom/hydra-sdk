/**
 * Utility functions for handling BigInt serialization/deserialization in NestJS
 */

/**
 * Custom JSON.stringify replacer function to handle BigInt values
 * Converts BigInt to string with 'n' suffix to preserve type information
 */
export function bigIntReplacer(_key: string, value: any): any {
	if (typeof value === 'bigint') {
		return value.toString() + 'n'
	}
	return value
}

/**
 * Custom JSON.parse reviver function to handle BigInt values
 * Converts string with 'n' suffix back to BigInt
 */
export function bigIntReviver(_key: string, value: any): any {
	if (typeof value === 'string' && value.endsWith('n')) {
		const numStr = value.slice(0, -1)
		if (/^\d+$/.test(numStr)) {
			return BigInt(numStr)
		}
	}
	return value
}

/**
 * Recursively converts BigInt types to string types
 * Handles nested objects and arrays properly
 */
type StringifyBigIntType<T> = T extends bigint
	? string
	: T extends Array<infer U>
		? Array<StringifyBigIntType<U>>
		: T extends Record<string, any>
			? { [K in keyof T]: StringifyBigIntType<T[K]> }
			: T

const TEST = {
	a: BigInt(123),
	b: 'test',
	c: [BigInt(456), 'hello', { d: BigInt(789) }],
	val: {
		nested: {
			big: BigInt(1000),
			str: 'world'
		}
	}
}

type TestType = StringifyBigIntType<typeof TEST>
// Expected type:
// {
//   a: string;
//   b: string;
//   c: Array<string | { d: string }>;
//   val: {
//     nested: {
//       big: string;
//       str: string;
//     };
//   };
// }
/**
 * Recursively converts BigInt values in an object to strings
 * This is useful for API responses where BigInt needs to be serialized
 */
export function convertBigIntToString<T>(obj: T): StringifyBigIntType<T> {
	if (obj === null || obj === undefined) {
		return obj as StringifyBigIntType<T>
	}

	if (typeof obj === 'bigint') {
		return obj.toString() as StringifyBigIntType<T>
	}

	if (Array.isArray(obj)) {
		return obj.map(convertBigIntToString) as StringifyBigIntType<T>
	}

	if (typeof obj === 'object') {
		const converted = {} as StringifyBigIntType<T>
		for (const [key, value] of Object.entries(obj)) {
			;(converted as any)[key] = convertBigIntToString(value)
		}
		return converted
	}

	return obj as StringifyBigIntType<T>
}

/**
 * Recursively converts string values back to BigInt where appropriate
 * This is the reverse of convertBigIntToString
 */
export function convertStringToBigInt(obj: any, bigIntFields: string[] = []): any {
	if (obj === null || obj === undefined) {
		return obj
	}

	if (Array.isArray(obj)) {
		return obj.map(item => convertStringToBigInt(item, bigIntFields))
	}

	if (typeof obj === 'object') {
		const converted: any = {}
		for (const [key, value] of Object.entries(obj)) {
			if (bigIntFields.includes(key) && typeof value === 'string' && /^\d+$/.test(value)) {
				converted[key] = BigInt(value)
			} else {
				converted[key] = convertStringToBigInt(value, bigIntFields)
			}
		}
		return converted
	}

	return obj
}

/**
 * Safe JSON stringify that handles BigInt values
 */
export function safeStringify(obj: any, space?: string | number): string {
	return JSON.stringify(obj, bigIntReplacer, space)
}

/**
 * Safe JSON parse that handles BigInt values
 */
export function safeParse(json: string): any {
	return JSON.parse(json, bigIntReviver)
}

/**
 * Transform object for API response - converts BigInt to strings
 * and adds metadata about which fields were BigInt
 */
export function transformForApiResponse(obj: any): { data: any; bigIntFields?: string[] } {
	const bigIntFields: string[] = []

	function collectBigIntFields(current: any, path: string = ''): any {
		if (current === null || current === undefined) {
			return current
		}

		if (typeof current === 'bigint') {
			if (path) bigIntFields.push(path)
			return current.toString()
		}

		if (Array.isArray(current)) {
			return current.map((item, index) => collectBigIntFields(item, path ? `${path}[${index}]` : `[${index}]`))
		}

		if (typeof current === 'object') {
			const transformed: any = {}
			for (const [key, value] of Object.entries(current)) {
				const fieldPath = path ? `${path}.${key}` : key
				transformed[key] = collectBigIntFields(value, fieldPath)
			}
			return transformed
		}

		return current
	}

	const transformedData = collectBigIntFields(obj)

	return {
		data: transformedData,
		...(bigIntFields.length > 0 && { bigIntFields })
	}
}

/**
 * Type-safe helper function to create a BigInt-to-string converter
 * This ensures compile-time type safety for the conversion
 */
export function createBigIntConverter<T>() {
	return {
		convert: (obj: T): StringifyBigIntType<T> => convertBigIntToString(obj),
		type: {} as StringifyBigIntType<T> // Type helper for inference
	}
}

/**
 * Utility to check if an object contains any BigInt values
 */
export function hasBigIntValues(obj: any): boolean {
	if (obj === null || obj === undefined) {
		return false
	}

	if (typeof obj === 'bigint') {
		return true
	}

	if (Array.isArray(obj)) {
		return obj.some(hasBigIntValues)
	}

	if (typeof obj === 'object') {
		return Object.values(obj).some(hasBigIntValues)
	}

	return false
}

/**
 * Type guard function to check if conversion is needed
 */
export function needsBigIntConversion(obj: any): obj is { [key: string]: any } {
	return hasBigIntValues(obj)
}

/**
 * Example usage demonstrating proper typing
 */
export function exampleUsage() {
	const data = {
		id: BigInt(123),
		name: 'test',
		values: [BigInt(456), BigInt(789)],
		nested: {
			amount: BigInt(1000),
			description: 'example'
		}
	}

	// Type-safe conversion
	const converted = convertBigIntToString(data)

	// converted is now typed as:
	// {
	//   id: string;
	//   name: string;
	//   values: string[];
	//   nested: {
	//     amount: string;
	//     description: string;
	//   };
	// }

	return converted
}
