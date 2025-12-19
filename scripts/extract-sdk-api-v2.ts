import { Project, SyntaxKind, ArrowFunction, FunctionExpression, Node, Symbol as MorphSymbol } from 'ts-morph'
import { globSync } from 'glob'
import * as fs from 'fs'
import * as path from 'path'

const PACKAGES_DIR = path.resolve('packages')
const OUTPUT_FILE = path.resolve('sdk-ai-agent/sdk-api-metadata-v2.json')

const project = new Project({
	tsConfigFilePath: path.resolve('tsconfig.json')
})

/**
 * Normalize type text:
 * - remove absolute paths
 * - keep logical / exported name
 */
function normalizeType(typeText: string) {
	// import("...").TypeName  -> TypeName
	const importMatch = typeText.match(/import\(.+\)\.(\w+)/)
	if (importMatch) return importMatch[1]

	return typeText.replace(/".*node_modules.*?"/g, '').trim()
}

function extractSymbolMeta(node: Node) {
	const symbol: MorphSymbol | undefined = node.getSymbol()
	const declarations = symbol?.getDeclarations() ?? []

	const isExported = declarations.some(d => {
		if ('isExported' in d && typeof d.isExported === 'function') {
			return d.isExported()
		}
		return false
	})

	return {
		exported: isExported,
		visibility: isExported ? 'public' : 'internal'
	}
}

function extractParams(params: any[]) {
	return params.map(p => ({
		name: p.getName(),
		type: normalizeType(p.getType().getText()),
		optional: p.isOptional(),
		hasDefault: p.hasInitializer(),
		defaultValue: p.hasInitializer() ? p.getInitializer()?.getText() : undefined
	}))
}

function extractFromSource(filePath: string) {
	const source = project.addSourceFileAtPath(filePath)
	const exports: any[] = []

	/**
	 * ========= FUNCTIONS =========
	 */

	source.getFunctions().forEach(fn => {
		const name = fn.getName()
		if (!name) return

		const jsDocs = fn
			.getJsDocs()
			.map(d => d.getComment())
			.join('\n')
		const meta = extractSymbolMeta(fn)

		exports.push({
			kind: 'function',
			name,
			description: jsDocs || '',
			...meta,
			params: extractParams(fn.getParameters()),
			returnType: normalizeType(fn.getReturnType().getText())
		})
	})

	/**
	 * ========= VARIABLE FUNCTIONS =========
	 */

	source.getVariableDeclarations().forEach(decl => {
		if (!decl.isExported()) return

		const name = decl.getName()
		const initializer = decl.getInitializer()
		if (!initializer) return

		const varStmt = decl.getVariableStatement()
		const jsDocs =
			varStmt
				?.getJsDocs()
				.map(d => d.getComment())
				.join('\n') || ''

		const meta = extractSymbolMeta(decl)

		const arrowFn = initializer.asKind(SyntaxKind.ArrowFunction) as ArrowFunction | undefined
		const fnExpr = initializer.asKind(SyntaxKind.FunctionExpression) as FunctionExpression | undefined

		const fnNode = arrowFn || fnExpr
		if (!fnNode) return

		exports.push({
			kind: 'function',
			name,
			description: jsDocs,
			...meta,
			params: extractParams(fnNode.getParameters()),
			returnType: normalizeType(fnNode.getReturnType().getText())
		})
	})

	/**
	 * ========= CLASSES =========
	 */

	source.getClasses().forEach(cls => {
		const className = cls.getName()
		if (!className) return

		const jsDocs = cls
			.getJsDocs()
			.map(d => d.getComment())
			.join('\n')
		const meta = extractSymbolMeta(cls)

		const constructors = cls.getConstructors().map(ctor => {
			const ctorDocs = ctor
				.getJsDocs()
				.map(d => d.getComment())
				.join('\n')

			return {
				description: ctorDocs || '',
				params: extractParams(ctor.getParameters()),
				signature: ctor.getText()
			}
		})

		const methods = cls.getMethods().map(m => ({
			name: m.getName(),
			description: m
				.getJsDocs()
				.map(d => d.getComment())
				.join('\n'),
			params: extractParams(m.getParameters()),
			returnType: normalizeType(m.getReturnType().getText()),
			...extractSymbolMeta(m)
		}))

		exports.push({
			kind: 'class',
			name: className,
			description: jsDocs || '',
			...meta,
			constructors,
			methods
		})
	})

	return exports
}

function main() {
	const tsFiles = globSync(`${PACKAGES_DIR}/**/*.ts`, {
		ignore: ['**/node_modules/**', '**/*.spec.ts', '**/*.test.ts', '**/dist/**']
	})

	const result: Record<string, any[]> = {}

	for (const filePath of tsFiles) {
		const relPath = path.relative(PACKAGES_DIR, filePath)
		const apiData = extractFromSource(filePath)

		if (apiData.length > 0) {
			result[relPath] = apiData
		}
	}

	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8')
	console.log(`✅ SDK API metadata extracted to ${OUTPUT_FILE}`)
}

main()
