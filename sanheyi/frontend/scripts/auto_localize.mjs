#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import generateModule from '@babel/generator'
import * as t from '@babel/types'
import { globSync } from 'glob'

const traverse = traverseModule.default || traverseModule
const generate = generateModule.default || generateModule
const CHINESE_RE = /[\u4e00-\u9fff]/

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const srcRoot = path.join(projectRoot, 'src')

const containsChinese = (text = '') => CHINESE_RE.test(text)

const buildValuesObject = (expressions) => {
  if (!expressions.length) return null
  const properties = expressions.map((expr) => {
    const source = generate(expr).code
    return t.objectProperty(t.stringLiteral(source), t.cloneNode(expr, true))
  })
  return t.objectExpression(properties)
}

const buildTranslateCall = (textNode, valuesExpression = null) => {
  const args = [textNode]
  if (valuesExpression && valuesExpression.properties.length > 0) {
    args.push(valuesExpression)
  }
  return t.callExpression(t.identifier('t'), args)
}

const templateLiteralToString = (node) => {
  let result = ''
  node.quasis.forEach((quasi, index) => {
    result += quasi.value.cooked ?? quasi.value.raw ?? ''
    if (index < node.expressions.length) {
      const expr = node.expressions[index]
      const code = generate(expr).code
      result += `\${${code}}`
    }
  })
  return result
}

const ensureTranslationImport = (ast) => {
  let hasTranslateImport = false
  let lastImportIndex = -1

  ast.program.body.forEach((node, index) => {
    if (t.isImportDeclaration(node)) {
      lastImportIndex = index
      if (node.source.value === '@/i18n') {
        hasTranslateImport = node.specifiers.some((specifier) =>
          t.isImportSpecifier(specifier) && specifier.imported.name === 't'
        )
      }
    }
  })

  if (hasTranslateImport) return

  const importDeclaration = t.importDeclaration(
    [t.importSpecifier(t.identifier('t'), t.identifier('t'))],
    t.stringLiteral('@/i18n')
  )

  if (lastImportIndex >= 0) {
    ast.program.body.splice(lastImportIndex + 1, 0, importDeclaration)
  } else {
    ast.program.body.unshift(importDeclaration)
  }
}

const transformFile = (filePath) => {
  const code = fs.readFileSync(filePath, 'utf8')
  let ast
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties', 'classPrivateProperties', 'optionalChaining', 'objectRestSpread'],
    })
  } catch (error) {
    console.error(`Failed to parse ${filePath}: ${error.message}`)
    return false
  }

  let changed = false

  traverse(ast, {
    JSXText(path) {
      const raw = path.node.value
      if (!containsChinese(raw)) return
      const normalized = raw.replace(/\s+/g, ' ').trim()
      if (!normalized) return
      const callExpr = buildTranslateCall(t.stringLiteral(normalized))
      path.replaceWith(t.JSXExpressionContainer(callExpr))
      changed = true
    },
    JSXAttribute(path) {
      const { value } = path.node
      if (!value) return
      if (t.isStringLiteral(value) && containsChinese(value.value)) {
        const callExpr = buildTranslateCall(t.stringLiteral(value.value))
        path.node.value = t.JSXExpressionContainer(callExpr)
        changed = true
      }
    },
    JSXExpressionContainer(path) {
      const expression = path.node.expression
      if (!expression) return
      if (t.isStringLiteral(expression) && containsChinese(expression.value)) {
        const callExpr = buildTranslateCall(t.stringLiteral(expression.value))
        path.replaceWith(t.JSXExpressionContainer(callExpr))
        changed = true
        return
      }
      if (t.isTemplateLiteral(expression)) {
        const hasChinese = expression.quasis.some((quasi) => containsChinese(quasi.value.cooked ?? ''))
        if (!hasChinese) return
        const literal = templateLiteralToString(expression)
        const valuesObject = buildValuesObject(expression.expressions)
        const callExpr = buildTranslateCall(t.stringLiteral(literal), valuesObject)
        path.replaceWith(t.JSXExpressionContainer(callExpr))
        changed = true
      }
    },
  })

  if (!changed) {
    return false
  }

  ensureTranslationImport(ast)
  const output = generate(ast, { retainLines: true }, code).code
  fs.writeFileSync(filePath, output)
  return true
}

const pattern = process.argv[2] || '**/*.{js,jsx}'
const files = globSync(pattern, {
  cwd: srcRoot,
  absolute: true,
  ignore: ['i18n/**', '**/node_modules/**'],
})

let modified = 0
files.forEach((file) => {
  if (transformFile(file)) {
    modified += 1
    console.log(`Translated: ${path.relative(srcRoot, file)}`)
  }
})

console.log(`Finished. Updated ${modified} files.`)
