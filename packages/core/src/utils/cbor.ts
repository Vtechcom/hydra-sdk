// 1st byte (58) 0101(major type 2) , 1000 (additional info)
// 2n byte byte represents the lenght of the content
// 3rd byte represents bytestring content
// https://www.rfc-editor.org/rfc/rfc7049#section-2.1

import { decode, encode } from 'cbor-x'
import { bytesToHex, hexToBytes } from './parser'

// Apply double bytestring encoding of type `major type 2`
export const applyDoubleCborEncoding = (script: string) => {
	try {
		decode(decode(hexToBytes(script)))
		return script
	} catch (error) {
		try {
			decode(hexToBytes(script))
			return bytesToHex(encode(hexToBytes(script).buffer))
		} catch (error) {
			return bytesToHex(encode(encode(hexToBytes(script).buffer)))
		}
	}
}
