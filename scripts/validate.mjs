#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const fail = message => { console.error(`ERROR: ${message}`); process.exitCode = 1 }
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const names = new Set()
const catalog = json('catalog.json')

if (catalog.format !== 1 || !Array.isArray(catalog.skills)) fail('catalog.json 必须是 format=1 且包含 skills 数组')
for (const entry of catalog.skills ?? []) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(entry.id ?? '')) fail(`无效技能 id: ${entry.id}`)
  if (names.has(entry.id)) fail(`重复技能 id: ${entry.id}`)
  names.add(entry.id)
  if (entry.status === 'available') {
    const path = entry.skill?.path
    const name = entry.skill?.name
    if (!/^skills\/[a-z0-9][a-z0-9-]{0,63}\/SKILL\.md$/.test(path ?? '')) fail(`${entry.id}: skill.path 无效`)
    if (!existsSync(resolve(root, path ?? ''))) fail(`${entry.id}: 找不到 ${path}`)
    const text = existsSync(resolve(root, path ?? '')) ? readFileSync(resolve(root, path), 'utf8') : ''
    if (!new RegExp(`^name:\\s*["']?${name}["']?\\s*$`, 'm').test(text)) fail(`${entry.id}: SKILL.md name 与目录不一致`)
    if (!/^description:\s*.+$/m.test(text)) fail(`${entry.id}: SKILL.md 缺少 description`)
  }
}

const ppt = json('ppt/catalog.json')
if (!Array.isArray(ppt.templates) || ppt.templates.length === 0) fail('PPT 模板目录为空')
for (const item of ppt.templates ?? []) {
  const dir = `ppt/templates/${item.id}`
  for (const required of ['metadata.json', 'design.md', 'source/deck.pptd', 'source-zh/deck.pptd']) {
    if (!existsSync(resolve(root, dir, required))) fail(`${item.id}: 缺少 ${required}`)
  }
  const previews = resolve(root, 'ppt/previews', item.id)
  const count = existsSync(previews) ? readdirSync(previews).filter(name => /^\d{2}\.jpg$/.test(name)).length : 0
  if (count !== item.pageCount) fail(`${item.id}: 预览图 ${count} 张，catalog 声明 ${item.pageCount} 张`)
}

if (process.exitCode === undefined) console.log(`OK: ${catalog.skills.length} 个目录项，${ppt.templates.length} 套 PPT 模板`)
