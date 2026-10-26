#!/usr/bin/env node
/**
 * Rebuild bundles/<name>.json.gz for every available skill and record each
 * bundle's sha256 / size / file count in catalog.json (`skill.bundle`).
 *
 *   npm run bundle
 *
 * Run after any change under skills/; `npm run validate` fails while a bundle
 * is stale. See skill-bundles.mjs for the format.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bundleDocument, bundlePath, packBundle, sha256 } from './skill-bundles.mjs'

const root = resolve(import.meta.dirname, '..')
const catalogPath = resolve(root, 'catalog.json')
let text = readFileSync(catalogPath, 'utf8')
const catalog = JSON.parse(text)

rmSync(resolve(root, 'bundles'), { recursive: true, force: true })
mkdirSync(resolve(root, 'bundles'), { recursive: true })
for (const entry of catalog.skills) {
  const name = entry.skill?.name
  if (entry.status !== 'available' || name === undefined) continue
  const document = bundleDocument(root, name)
  const bytes = packBundle(document)
  writeFileSync(resolve(root, bundlePath(name)), bytes)
  const bundle = { path: bundlePath(name), sha256: sha256(bytes), size: bytes.length, files: document.files.length }
  // Keep the catalog's hand-written layout: replace (or insert) only the one-line bundle field.
  const line = `"bundle": ${JSON.stringify(bundle).replaceAll('":', '": ').replaceAll(',"', ', "').replace('{', '{ ').replace(/}$/, ' }')}`
  const block = new RegExp(`("path": "skills/${name}/SKILL\\.md",)(\\n\\s*)(?:"bundle": \\{[^}]*\\},\\n\\s*)?`)
  if (!block.test(text)) throw new Error(`catalog.json 中找不到 ${name} 的 skill.path`)
  text = text.replace(block, (_all, path, indent) => `${path}${indent}${line},${indent}`)
  console.log(`${name}: ${document.files.length} 个文件，${(bytes.length / 1024).toFixed(0)} KB`)
}
JSON.parse(text)
writeFileSync(catalogPath, text)
