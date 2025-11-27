import { Project, SyntaxKind, ArrowFunction, FunctionExpression } from 'ts-morph'
import { globSync } from 'glob'
import * as fs from 'fs'
import * as path from 'path'

const PACKAGES_DIR = path.resolve('packages')
const OUTPUT_FILE = path.resolve('sdk-ai-agent/sdk-api-metadata.json')

const project = new Project({
	tsConfigFilePath: path.resolve('tsconfig.json')
})

function extractFromSource(filePath: string) {
	const source = project.addSourceFileAtPath(filePath)
	const exports = []

	// Extract top-level function declarations
	source.getFunctions().forEach(fn => {
		const name = fn.getName()
		if (!name) return
		const jsDocs = fn
			.getJsDocs()
			.map(doc => doc.getComment())
			.join('\n')
		const params = fn.getParameters().map(p => ({
			name: p.getName(),
			type: p.getType().getText()
		}))
		const returnType = fn.getReturnType().getText()

		exports.push({
			type: 'function',
			name,
			description: jsDocs || '',
			params,
			returnType
		})
	})

	// Extract exported arrow functions and function expressions
	source.getVariableDeclarations().forEach(decl => {
		const name = decl.getName()
		// Only exported
		if (!decl.isExported()) return
		const initializer = decl.getInitializer()
		if (!initializer) return
		// Get JSDoc from VariableStatement
		let jsDocs = ''
		const varStmt = decl.getVariableStatement()
		if (varStmt) {
			jsDocs = varStmt
				.getJsDocs()
				.map(doc => doc.getComment())
				.join('\n')
		}
		// Arrow function
		const arrowFn = initializer.asKind(SyntaxKind.ArrowFunction) as ArrowFunction | undefined
		if (arrowFn) {
			const params = arrowFn.getParameters().map(p => ({
				name: p.getName(),
				type: p.getType().getText()
			}))
			const returnType = arrowFn.getReturnType().getText()
			exports.push({
				type: 'function',
				name,
				description: jsDocs || '',
				params,
				returnType
			})
		}
		// Function expression
		const fnExpr = initializer.asKind(SyntaxKind.FunctionExpression) as FunctionExpression | undefined
		if (fnExpr) {
			const params = fnExpr.getParameters().map(p => ({
				name: p.getName(),
				type: p.getType().getText()
			}))
			const returnType = fnExpr.getReturnType().getText()
			exports.push({
				type: 'function',
				name,
				description: jsDocs || '',
				params,
				returnType
			})
		}
	})

	// Extract classes
	source.getClasses().forEach(cls => {
		const className = cls.getName()
		const jsDocs = cls
			.getJsDocs()
			.map(doc => doc.getComment())
			.join('\n')

		// Extract constructor information
		const constructors = cls.getConstructors()
		const constructorInfo =
			constructors.length > 0
				? constructors.map(ctor => {
						const ctorJsDocs = ctor
							.getJsDocs()
							.map(doc => doc.getComment())
							.join('\n')

						// Extract @param tags from constructor JSDoc
						const jsDocTags = ctor.getJsDocs().flatMap(doc => doc.getTags())
						const paramDescriptions = new Map<string, string>()
						jsDocTags.forEach(tag => {
							if (tag.getTagName() === 'param') {
								const tagText = tag.getText()
								const match = tagText.match(/@param\s+(\w+)\s+(.+)/)
								if (match) {
									paramDescriptions.set(match[1], match[2])
								}
							}
						})

						const params = ctor.getParameters().map(p => {
							const paramName = p.getName()
							return {
								name: paramName,
								type: p.getType().getText(),
								description: paramDescriptions.get(paramName) || '',
								isOptional: p.isOptional(),
								hasQuestionToken: p.hasQuestionToken(),
								hasInitializer: p.hasInitializer(),
								initializer: p.hasInitializer() ? p.getInitializer()?.getText() : undefined
							}
						})

						return {
							description: ctorJsDocs || '',
							params,
							signature: ctor.getText()
						}
					})
				: []

		const methods = cls.getMethods().map(m => ({
			name: m.getName(),
			description: m
				.getJsDocs()
				.map(d => d.getComment())
				.join('\n'),
			params: m.getParameters().map(p => ({
				name: p.getName(),
				type: p.getType().getText()
			})),
			returnType: m.getReturnType().getText()
		}))

		exports.push({
			type: 'class',
			name: className,
			description: jsDocs || '',
			constructors: constructorInfo,
			methods
		})
	})

	return exports
}

function main() {
	const tsFiles = globSync(`${PACKAGES_DIR}/**/*.ts`, {
		ignore: ['**/node_modules/**', '**/*.spec.ts', '**/dist/**']
	})

	const result: Record<string, any> = {}

	for (const filePath of tsFiles) {
		const rel = path.relative(PACKAGES_DIR, filePath)
		const apiData = extractFromSource(filePath)
		if (apiData.length) {
			result[rel] = apiData
		}
	}

	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8')
	console.log(`✅ Extracted API metadata to ${OUTPUT_FILE}`)
}

main()
