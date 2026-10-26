#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { bundleDocument, bundlePath, sha256 } from './skill-bundles.mjs'

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
    // Remote clients install the whole skill directory from this bundle: it must match skills/<name>/ exactly.
    const bundle = entry.skill?.bundle
    if (bundle?.path !== bundlePath(name)) { fail(`${entry.id}: 缺少 skill.bundle，请运行 npm run bundle`); continue }
    const file = resolve(root, bundle.path)
    if (!existsSync(file)) { fail(`${entry.id}: 找不到 ${bundle.path}，请运行 npm run bundle`); continue }
    const bytes = readFileSync(file)
    if (sha256(bytes) !== bundle.sha256 || bytes.length !== bundle.size) fail(`${entry.id}: ${bundle.path} 与 catalog.json 记录的 sha256/size 不一致，请运行 npm run bundle`)
    else if (gunzipSync(bytes).toString('utf8') !== JSON.stringify(bundleDocument(root, name))) fail(`${entry.id}: ${bundle.path} 已过期（skills/${name}/ 有改动），请运行 npm run bundle`)
  }
}

const ppt = json('ppt/catalog.json')
if (!Array.isArray(ppt.templates) || ppt.templates.length === 0) fail('PPT 模板目录为空')
for (const item of ppt.templates ?? []) {
  const dir = `skills/dsh-ppt/assets/templates/${item.id}`
  for (const required of ['metadata.json', 'design.md', 'source/deck.pptd', 'source-zh/deck.pptd']) {
    if (!existsSync(resolve(root, dir, required))) fail(`${item.id}: 缺少 ${required}`)
  }
  const previews = resolve(root, 'ppt/previews', item.id)
  const count = existsSync(previews) ? readdirSync(previews).filter(name => /^\d{2}\.jpg$/.test(name)).length : 0
  if (count !== item.pageCount) fail(`${item.id}: 预览图 ${count} 张，catalog 声明 ${item.pageCount} 张`)
}

// AI 生图 / 生视频模板：目录、技能内模板文件、封面一一对应，SKILL.md 的模板表与目录一致。
const MEDIA = {
  image: { skill: 'skills/dsh-image', files: id => [`assets/templates/${id}.md`], cover: true },
  video: { skill: 'skills/dsh-video', files: id => [`assets/templates/${id}.zh.md`, `assets/templates/${id}.md`], cover: false },
}
const mediaCounts = {}
for (const [kind, spec] of Object.entries(MEDIA)) {
  const media = json(`${kind}/catalog.json`)
  const categoryIds = new Set((media.categories ?? []).map(c => c.id))
  const ids = new Set()
  if (!Array.isArray(media.templates) || media.templates.length === 0) { fail(`${kind}: 模板目录为空`); continue }
  if (!media.templates.some(t => t.id === media.defaultTemplateId)) fail(`${kind}: defaultTemplateId 不在模板列表中`)
  const skillText = readFileSync(resolve(root, spec.skill, 'SKILL.md'), 'utf8')
  for (const item of media.templates) {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(item.id ?? '')) fail(`${kind}: 无效模板 id ${item.id}`)
    if (ids.has(item.id)) fail(`${kind}: 重复模板 id ${item.id}`)
    ids.add(item.id)
    if (!categoryIds.has(item.category)) fail(`${kind}/${item.id}: 分类 ${item.category} 未在 categories 中声明`)
    if (typeof item.name?.zh !== 'string' || typeof item.name?.en !== 'string') fail(`${kind}/${item.id}: 缺少中英文名称`)
    if (item.id === 'freeform') continue
    for (const file of spec.files(item.id)) if (!existsSync(resolve(root, spec.skill, file))) fail(`${kind}/${item.id}: 缺少 ${spec.skill}/${file}`)
    if (spec.cover && !existsSync(resolve(root, kind, 'previews', `${item.id}.jpg`))) fail(`${kind}/${item.id}: 缺少封面 ${kind}/previews/${item.id}.jpg`)
    if (!skillText.includes(`\`${item.id}\``)) fail(`${kind}/${item.id}: ${spec.skill}/SKILL.md 的模板表没有列出该模板`)
  }
  mediaCounts[kind] = media.templates.length
}

// The skill's own checker must accept every bundled template source.
const pptd = resolve(root, 'skills/dsh-ppt/scripts/pptd.py')
if (!existsSync(pptd)) fail('缺少 skills/dsh-ppt/scripts/pptd.py')
const python = process.env.PYTHON ?? 'python3'
if (existsSync(pptd) && spawnSync(python, ['--version']).status === 0) {
  for (const item of ppt.templates ?? []) {
    for (const variant of ['source', 'source-zh']) {
      const project = resolve(root, 'skills/dsh-ppt/assets/templates', item.id, variant)
      const run = spawnSync(python, [pptd, 'check', project], { encoding: 'utf8' })
      let report
      try { report = JSON.parse(run.stdout) } catch { fail(`${item.id}/${variant}: pptd.py check 无法运行：${run.stderr.trim()}`); continue }
      for (const error of report.errors ?? []) fail(`${item.id}/${variant}: ${error.file} 第 ${error.page} 页 ${error.elementId ?? ''} ${error.code}`)
    }
  }
} else {
  console.warn(`WARN: 找不到 ${python}，跳过 PPTD 模板检查`)
}

if (process.exitCode === undefined) console.log(`OK: ${catalog.skills.length} 个目录项，${ppt.templates.length} 套 PPT 模板，${mediaCounts.image} 套生图模板，${mediaCounts.video} 套视频模板`)
