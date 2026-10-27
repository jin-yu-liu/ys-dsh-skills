#!/usr/bin/env node
/**
 * Chooser details of the AI video templates, quoted from the template files
 * (verbatim copies of ai-shortfilm-prompts `templates/`, MIT). Nothing here is
 * written by DSH: every field is a line or table cell of the zh / en files.
 *
 * - name: the H1 title without the "实战范例 —" / "Worked Example —" prefix
 * - concept: the "概念：" / "Concept:" paragraph of the opening quote
 *   (the first quote paragraph when a template has none)
 * - storyboard: the parenthetical of "### 5 · 分镜（3 拍，约 10s）", plus each
 *   beat ("0–4s · 正常（建立无聊感）") or shot ("分镜一 —— 门口（秋天黄昏）") title
 * - duration: the "约 10s" / "~10s" part of that heading
 * - aspect: a 9:16 / 16:9 / 1:1 frame the template itself prescribes, if any
 * - variables: the `{{name}}` rows of the variable table with their first example
 *
 *   node scripts/video-details.mjs      # refresh video/catalog.json in place
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const MAX_BEATS = 8
const MAX_VARIABLES = 12

/** @returns the paragraphs of the opening `>` quote, each joined into one line. */
function quoteParagraphs(text) {
  const lines = text.split('\n')
  const start = lines.findIndex(line => line.startsWith('>'))
  if (start < 0) return []
  const paragraphs = [[]]
  for (const line of lines.slice(start)) {
    if (!line.startsWith('>')) break
    const body = line.replace(/^>\s?/, '').trim()
    if (body === '') { if (paragraphs.at(-1).length > 0) paragraphs.push([]); continue }
    paragraphs.at(-1).push(body)
  }
  // CJK lines join without a space; Latin lines with one.
  return paragraphs.filter(p => p.length > 0).map(p => p.reduce((acc, part) =>
    acc === '' ? part : /[　-鿿＀-￯]$/.test(acc) || /^[　-鿿＀-￯]/.test(part) ? acc + part : `${acc} ${part}`, ''))
}

const plain = (value) => value.replace(/\*\*|\*|`/g, '').trim()

function parse(text, lang) {
  const title = plain((/^#\s+(.+)$/m.exec(text)?.[1] ?? '').replace(/^(实战范例|Worked Example)\s*[—–-]+\s*/, ''))
  const quotes = quoteParagraphs(text)
  const conceptLabel = lang === 'zh' ? /^概念\s*[:：]\s*/ : /^Concept\s*:\s*/i
  // Without a concept line: the quote's sentence describing the skeleton (the rest is source and usage notes).
  const sentences = (quotes[0] ?? '').match(/[^。.!！]+[。.!！]?/g)?.map(plain).filter(Boolean) ?? []
  const concept = quotes.find(p => conceptLabel.test(p))?.replace(conceptLabel, '')
    ?? sentences.find(sentence => /骨架|skeleton/i.test(sentence)) ?? sentences[0] ?? ''

  const heading = /^###\s*5\s*·\s*(?:分镜|Storyboard)\s*[（(](.+?)[）)]\s*$/m.exec(text)
  const storyboard = heading?.[1]?.trim()
  const duration = storyboard === undefined ? undefined
    : /(?:约\s*|~\s*)([\d.]+(?:\s*[–-]\s*[\d.]+)?\s*(?:s|秒|seconds?))/i.exec(storyboard)?.[1]?.replace(/\s+/g, ' ')
  const beats = []
  if (heading !== undefined && heading !== null) {
    const after = text.slice(heading.index + heading[0].length)
    const block = /```[^\n]*\n([\s\S]*?)```/.exec(after)?.[1] ?? ''
    for (const line of block.split('\n')) {
      const timed = /^(\d+(?:\.\d+)?\s*[–-]\s*\d+(?:\.\d+)?\s*s)\s*·\s*(.+)$/.exec(line)
      const shot = /^((?:分镜|镜)\s*[一二三四五六七八九十\d]+|Shot\s*[\d–-]+)\s*[—–-]+\s*(.+)$/i.exec(line)
      const match = timed ?? shot
      if (match !== null) beats.push({ time: match[1].replace(/\s+/g, ' '), title: plain(match[2]) })
    }
  }
  const aspect = /(?:^|[^\d])(9:16|16:9|1:1)(?:[^\d]|$)/.exec(text)?.[1]

  const variables = []
  const tableStart = text.search(/^##\s+.*(变量|[Vv]ariables)/m)
  if (tableStart >= 0) {
    for (const line of text.slice(tableStart).split('\n').slice(1)) {
      if (/^##\s/.test(line)) break
      const cells = line.split('|').map(cell => cell.trim())
      const name = /^`?\{\{(.+?)\}\}`?$/.exec(cells[1] ?? '')?.[1]
      if (name !== undefined) variables.push({ name, example: plain(cells[2] ?? '') })
    }
  }
  return { title, concept, storyboard, duration, aspect, beats: beats.slice(0, MAX_BEATS), variables: variables.slice(0, MAX_VARIABLES) }
}

/**
 * @param templateDir - skills/dsh-video/assets/templates
 * @param id - template id (has `<id>.zh.md` and `<id>.md`)
 * @returns `{ name, description, details }` for the catalog entry
 */
export function videoDetails(templateDir, id) {
  const zh = parse(readFileSync(join(templateDir, `${id}.zh.md`), 'utf8'), 'zh')
  const en = parse(readFileSync(join(templateDir, `${id}.md`), 'utf8'), 'en')
  const pair = (a, b) => ({ zh: a || b, en: b || a })
  const details = {
    concept: pair(zh.concept, en.concept),
    ...zh.storyboard || en.storyboard ? { storyboard: pair(zh.storyboard, en.storyboard) } : {},
    ...zh.duration || en.duration ? { duration: pair(zh.duration, en.duration) } : {},
    ...zh.aspect || en.aspect ? { aspect: zh.aspect ?? en.aspect } : {},
    // Beats and table rows line up between the two files; the zh file decides how many.
    beats: zh.beats.map((beat, i) => ({ time: pair(beat.time, en.beats[i]?.time), title: pair(beat.title, en.beats[i]?.title) })),
    variables: zh.variables.map((v, i) => ({ name: pair(v.name, en.variables[i]?.name), example: pair(v.example, en.variables[i]?.example) })),
  }
  return { name: pair(zh.title, en.title), description: pair(zh.concept, en.concept), details }
}

// Run directly: refresh the catalog from the template files already in the repository.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const root = resolve(import.meta.dirname, '..')
  const templateDir = join(root, 'skills/dsh-video/assets/templates')
  const file = join(root, 'video/catalog.json')
  const catalog = JSON.parse(readFileSync(file, 'utf8'))
  for (const template of catalog.templates) {
    if (!existsSync(join(templateDir, `${template.id}.zh.md`))) continue
    Object.assign(template, videoDetails(templateDir, template.id))
  }
  writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`)
  console.log(`已从模板正文刷新 ${catalog.templates.length - 1} 套视频模板的选择器信息`)
}
