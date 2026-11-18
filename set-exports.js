// set-exports.js
import fs from 'fs'
import path from 'path'

const mode = process.argv[2] // "dev" hoặc "prod"
if (!mode || !['dev', 'prod'].includes(mode)) {
	console.error('❌ Usage: node set-exports.js <dev|prod>')
	process.exit(1)
}

const whitelist = ['cardano-wasm', 'eslint-config', 'tsconfig']
const packagesDir = path.resolve('./packages')
const packages = fs.readdirSync(packagesDir)

packages.forEach(pkgName => {
	if (whitelist.includes(pkgName)) return // Không nằm trong whitelist
	if (pkgName.startsWith('.')) return // Bỏ qua các thư mục ẩn
	const pkgPath = path.join(packagesDir, pkgName, 'package.json')
	if (!fs.existsSync(pkgPath)) return

	const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

	if (mode === 'dev') {
		pkgJson.exports = {
			'.': {
				types: './src/index.ts',
				import: './src/index.ts',
				require: './src/index.ts'
			},
			'./package.json': './package.json'
		}
	} else {
		pkgJson.exports = {
			'.': {
				types: './dist/index.d.ts',
				import: './dist/index.mjs',
				require: './dist/index.js'
			},
			'./package.json': './package.json'
		}
	}

	fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf-8')
	console.log(`✅ Updated exports for ${pkgName} -> ${mode}`)
})

console.log(`\n🎯 All packages set to ${mode} mode.`)
