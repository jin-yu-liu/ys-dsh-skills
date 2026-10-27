#!/usr/bin/env node
/**
 * Import the AI image / AI video prompt templates from their upstream checkouts.
 *
 *   node scripts/import-media-templates.mjs --image /path/to/awesome-gpt-image-2 --video /path/to/ai-shortfilm-prompts
 *
 * - awesome-gpt-image-2 (freestylefly, MIT): the template library in
 *   data/style-library.json plus the matching sections of docs/templates.md
 *   become skills/dsh-image/assets/templates/<id>.md; each template's cover
 *   case becomes image/previews/<id>.jpg.
 * - ai-shortfilm-prompts (jnMetaCode, MIT for templates/): every `genre`
 *   template (zh + en) is copied to skills/dsh-video/assets/templates/, every
 *   `module` to skills/dsh-video/references/modules/; covers are drawn by
 *   scripts/render-video-covers.py into video/previews/<id>.jpg.
 * - image/catalog.json and video/catalog.json are what the DSH plugin's
 *   template chooser reads; both start with a built-in "free form" entry.
 *
 * SKILL.md and references/*.md of both skills are maintained here and never
 * overwritten. Covers are resized with Pillow (python3 -m pip install pillow).
 */
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { videoDetails } from './video-details.mjs'

const root = resolve(import.meta.dirname, '..')
const arg = (name) => {
  const index = process.argv.indexOf(name)
  return index < 0 ? undefined : process.argv[index + 1]
}
const imageSource = arg('--image')
const videoSource = arg('--video')
if (imageSource === undefined || videoSource === undefined) {
  console.error('用法：node scripts/import-media-templates.mjs --image <awesome-gpt-image-2 目录> --video <ai-shortfilm-prompts 目录>')
  process.exit(1)
}
const python = process.env.PYTHON ?? 'python3'
const COVER_WIDTH = 560
const COVER_QUALITY = 74
const FREEFORM_ID = 'freeform'

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
const commitOf = (dir) => spawnSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).stdout.trim()
const fresh = (dir) => { rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }) }

/**
 * Resize one cover to a JPG and report its aspect ratio.
 * @returns `{ width, height }` of the written file.
 */
function writeCover(from, to) {
  const code = `
import sys
from PIL import Image
src, dst, width, quality = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
image = Image.open(src).convert('RGB')
if image.width > width:
    image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
image.save(dst, 'JPEG', quality=quality, optimize=True, progressive=True)
print(image.width, image.height)
`
  const run = spawnSync(python, ['-E', '-c', code, from, to, String(COVER_WIDTH), String(COVER_QUALITY)], { encoding: 'utf8' })
  if (run.status !== 0) throw new Error(`封面转换失败 ${from}: ${run.stderr.trim()}`)
  const [width, height] = run.stdout.trim().split(/\s+/).map(Number)
  return { width, height }
}

/** Nearest common aspect label for a cover. */
function aspectOf({ width, height }) {
  const ratios = [['1:1', 1], ['4:3', 4 / 3], ['3:4', 3 / 4], ['3:2', 3 / 2], ['2:3', 2 / 3], ['16:9', 16 / 9], ['9:16', 9 / 16]]
  const value = width / height
  return ratios.reduce((best, item) => Math.abs(item[1] - value) < Math.abs(best[1] - value) ? item : best)[0]
}

// ───────────────────────── AI 生图 ─────────────────────────

/** Category ids for the chooser, keyed by the upstream category value (display order). */
const IMAGE_CATEGORIES = {
  'UI & Interfaces': 'ui',
  'Charts & Infographics': 'infographic',
  'Posters & Typography': 'poster',
  'Products & E-commerce': 'product',
  'Brand & Logos': 'brand',
  'Architecture & Spaces': 'architecture',
  'Photography & Realism': 'photo',
  'Illustration & Art': 'illustration',
  'Characters & People': 'character',
  'Scenes & Storytelling': 'scene',
  'History & Classical Themes': 'history',
  'Documents & Publishing': 'document',
  'Other Use Cases': 'other',
}

/** Split docs/templates.md into its `<a name="tpl-…">` sections. */
function templateSections(markdown) {
  const sections = new Map()
  const pattern = /<a name="(tpl-[a-z-]+)"><\/a>/g
  const marks = [...markdown.matchAll(pattern)]
  marks.forEach((mark, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : markdown.length
    const body = markdown.slice(mark.index + mark[0].length, end)
      // Drop the page's own navigation lines and trailing separators.
      .replace(/^\s*>\s*\[返回[^\n]*\n/gm, '')
      .replace(/\n-{3,}\s*$/u, '')
      .trim()
    sections.set(mark[1], body)
  })
  return sections
}

function importImage() {
  const source = resolve(imageSource)
  const library = readJson(join(source, 'data/style-library.json'))
  const cases = new Map(readJson(join(source, 'data/cases.json')).cases.map(item => [item.id, item]))
  const sections = templateSections(readFileSync(join(source, 'docs/templates.md'), 'utf8'))
  const commit = commitOf(source)
  const repository = 'https://github.com/freestylefly/awesome-gpt-image-2'

  const templateDir = join(root, 'skills/dsh-image/assets/templates')
  const previewDir = join(root, 'image/previews')
  fresh(templateDir)
  fresh(previewDir)

  const categoryTitle = new Map(library.categories.map(item => [item.value, item.title.zh]))
  const categories = library.categories
    .filter(item => IMAGE_CATEGORIES[item.value] !== undefined)
    .map(item => ({ id: IMAGE_CATEGORIES[item.value], name: { zh: item.title.zh, en: item.title.en } }))

  const templates = [{
    id: FREEFORM_ID,
    category: 'general',
    name: { zh: '自由创作', en: 'Free form' },
    description: { zh: '不套用模板，按你的描述直接组织提示词', en: 'No template: the prompt follows your description' },
    palette: { background: 'EEF2FF', accent: '4F46E5', text: '1E1B4B' },
  }]
  for (const item of library.templates) {
    const category = IMAGE_CATEGORIES[item.category]
    if (category === undefined) throw new Error(`未知分类 ${item.category}（${item.id}）`)
    const section = sections.get(item.anchor)
    if (section === undefined) throw new Error(`docs/templates.md 缺少 ${item.anchor}（${item.id}）`)
    const coverCase = cases.get(item.exampleCases[0])
    const coverFile = join(source, 'data', item.cover)
    if (!existsSync(coverFile)) throw new Error(`缺少封面 ${item.cover}（${item.id}）`)
    const size = writeCover(coverFile, join(previewDir, `${item.id}.jpg`))
    const examples = item.exampleCases.map(id => cases.get(id)).filter(Boolean)

    writeFileSync(join(templateDir, `${item.id}.md`), [
      `# ${item.title.zh}（${item.title.en}）`,
      '',
      `> 来源：[awesome-gpt-image-2](${repository})（freestylefly，MIT）的模板库 \`data/style-library.json\` 与 \`docs/templates.md\`，提交 ${commit.slice(0, 12)}。小节内另有出处的，以小节内标注为准。`,
      '',
      `${item.description.zh}`,
      '',
      '## 什么时候用',
      '',
      item.useWhen.zh,
      '',
      '## 写法要点',
      '',
      ...item.guidance.zh.map(line => `- ${line}`),
      '',
      '## 防坑',
      '',
      ...item.pitfalls.zh.map(line => `- ${line}`),
      '',
      `风格标签：${item.styles.join('、')}；场景标签：${item.scenes.join('、')}。`,
      '',
      '## 提示词模板',
      '',
      `以下是上游「${categoryTitle.get(item.category) ?? item.category}」分类的全部模板，先选最贴近「${item.title.zh}」的一段，再按用户需求替换方括号里的内容。`,
      '',
      section,
      '',
      '## 参考案例',
      '',
      ...examples.map(example => `- 案例 ${example.id}「${example.title}」：作者 ${example.sourceLabel}，[原帖](${example.sourceUrl})，[上游条目](${example.githubUrl})`),
      '',
    ].join('\n'))

    templates.push({
      id: item.id,
      category,
      name: { zh: item.title.zh, en: item.title.en },
      description: { zh: item.description.zh, en: item.description.en },
      aspect: aspectOf(size),
      cover: true,
      source: {
        license: 'MIT',
        cover: {
          case: coverCase?.id, title: coverCase?.title, author: coverCase?.sourceLabel,
          ...coverCase?.sourceUrl ? { url: coverCase.sourceUrl } : {},
        },
      },
    })
  }

  mkdirSync(join(root, 'image'), { recursive: true })
  writeJson(join(root, 'image/catalog.json'), {
    format: 1,
    source: { repository, commit },
    defaultTemplateId: FREEFORM_ID,
    categories: [{ id: 'general', name: { zh: '通用', en: 'General' } }, ...categories],
    templates,
  })
  mkdirSync(join(root, 'image/licenses'), { recursive: true })
  cpSync(join(source, 'LICENSE'), join(root, 'image/licenses/awesome-gpt-image-2.LICENSE'))
  writeFileSync(join(root, 'image/THIRD_PARTY_NOTICES.md'), [
    '# AI 生图模板来源',
    '',
    `模板文字（\`skills/dsh-image/assets/templates/\`）整理自 [awesome-gpt-image-2](${repository})（Copyright (c) 2026 freestylefly，MIT，许可证见 \`licenses/awesome-gpt-image-2.LICENSE\`），提交 \`${commit}\`。DSH 按模板拆分为独立文件并补充了使用说明；模板内另有出处的小节保留其原始标注。`,
    '',
    '## 封面图',
    '',
    '`previews/` 中的封面由上述项目收录的社区案例图片缩放转码而来，仅用于模板选择器预览。图片归原作者所有：',
    '',
    '| 模板 | 案例 | 作者 | 原帖 |',
    '|---|---|---|---|',
    ...templates.filter(t => t.source !== undefined).map(t => {
      const cover = t.source.cover
      return `| ${t.id} | ${cover.case}「${cover.title}」 | ${cover.author} | ${cover.url ?? '—'} |`
    }),
    '',
    '原作者如不希望在此展示，请提交 issue，维护者会移除对应封面并改用色块卡片。',
    '',
  ].join('\n'))
  return templates.length - 1
}

// ───────────────────────── AI 生视频 ─────────────────────────

/** Category ids for the chooser, keyed by the upstream zh category (display order). */
const VIDEO_CATEGORIES = [
  ['剧情 / 短剧', 'drama', 'Drama'],
  ['广告 / 产品', 'commercial', 'Commercial'],
  ['萌宠', 'pets', 'Pets'],
  ['美食', 'food', 'Food'],
  ['旅行 / 风光', 'travel', 'Travel & Scenery'],
  ['音乐 / 舞蹈', 'music', 'Music & Dance'],
  ['时尚 / 美妆', 'fashion', 'Fashion & Beauty'],
  ['科幻 / 动作', 'action', 'Sci-fi & Action'],
  ['风格化', 'stylized', 'Stylized'],
]
/** Card colors per category (hex, no `#`). */
const VIDEO_PALETTES = {
  general: { background: 'EEF2FF', accent: '4F46E5', text: '1E1B4B' },
  drama: { background: '1F1D2B', accent: 'E0B15C', text: 'F4EFE6' },
  commercial: { background: 'F3F4F6', accent: '111827', text: '111827' },
  pets: { background: 'FFF4E6', accent: 'F08C00', text: '5C3D11' },
  food: { background: 'FFF1E6', accent: 'D9480F', text: '4A1D0A' },
  travel: { background: 'E7F5FF', accent: '1C7ED6', text: '0B2E4F' },
  music: { background: '2B1238', accent: 'F06595', text: 'FDE7F1' },
  fashion: { background: 'F8F0EC', accent: 'A61E4D', text: '3B1020' },
  action: { background: '0B1220', accent: '22D3EE', text: 'E2E8F0' },
  stylized: { background: 'EBFBEE', accent: '2F9E44', text: '173D21' },
}
function importVideo() {
  const source = resolve(videoSource)
  const index = readJson(join(source, 'templates/index.json'))
  const commit = commitOf(source)
  const repository = 'https://github.com/jnMetaCode/ai-shortfilm-prompts'
  const categoryOf = new Map(VIDEO_CATEGORIES.map(([zh, id]) => [zh, id]))

  const templateDir = join(root, 'skills/dsh-video/assets/templates')
  const moduleDir = join(root, 'skills/dsh-video/references/modules')
  fresh(templateDir)
  fresh(moduleDir)

  const byId = new Map()
  for (const entry of index.templates) {
    const item = byId.get(entry.id) ?? {}
    item[entry.lang] = entry
    byId.set(entry.id, item)
  }
  const templates = [{
    id: FREEFORM_ID,
    category: 'general',
    name: { zh: '自由创作', en: 'Free form' },
    description: { zh: '不套用题材模板，用 5 段式结构直接写分镜提示词', en: 'No genre template: write the shot prompt with the 5-stage structure' },
    palette: VIDEO_PALETTES.general,
  }]
  const modules = []
  for (const [id, { zh, en }] of byId) {
    if (zh === undefined || en === undefined) throw new Error(`${id} 缺少中文或英文版本`)
    const files = [[`${id}.zh.md`, `templates/${id}.zh.md`], [`${id}.md`, `templates/${id}.md`]]
    if (zh.kind === 'module') {
      for (const [name, from] of files) cpSync(join(source, from), join(moduleDir, name))
      modules.push({ id, name: zh.title })
      continue
    }
    if (zh.kind !== 'genre') continue
    const category = categoryOf.get(zh.category)
    if (category === undefined) throw new Error(`未知分类 ${zh.category}（${id}）`)
    for (const [name, from] of files) cpSync(join(source, from), join(templateDir, name))
    // Chooser copy is quoted from the template files themselves (scripts/video-details.mjs).
    const { name, description, details } = videoDetails(templateDir, id)
    templates.push({
      id,
      category,
      name,
      description,
      details,
      palette: VIDEO_PALETTES[category],
      variables: (zh.variables ?? []).map(v => v.name),
      source: { license: 'MIT', url: `${repository}/blob/main/templates/${id}.zh.md` },
    })
  }
  const order = new Map([['general', -1], ...VIDEO_CATEGORIES.map(([, cid], i) => [cid, i])])
  templates.sort((a, b) => order.get(a.category) - order.get(b.category))

  mkdirSync(join(root, 'video'), { recursive: true })
  writeJson(join(root, 'video/catalog.json'), {
    format: 1,
    source: { repository, commit },
    defaultTemplateId: FREEFORM_ID,
    categories: [{ id: 'general', name: { zh: '通用', en: 'General' } }, ...VIDEO_CATEGORIES.map(([zh, cid, en]) => ({ id: cid, name: { zh: zh.replace(/\s*\/\s*/g, '/'), en } }))]
      .filter(c => templates.some(t => t.category === c.id)),
    templates,
  })
  mkdirSync(join(root, 'video/licenses'), { recursive: true })
  cpSync(join(source, 'LICENSE'), join(root, 'video/licenses/ai-shortfilm-prompts.LICENSE'))
  cpSync(join(source, 'NOTICE'), join(root, 'video/licenses/ai-shortfilm-prompts.NOTICE'))
  writeFileSync(join(root, 'video/THIRD_PARTY_NOTICES.md'), [
    '# AI 生视频模板来源',
    '',
    `题材模板（\`skills/dsh-video/assets/templates/\`）与构件（\`skills/dsh-video/references/modules/\`）原样复制自 [ai-shortfilm-prompts](${repository}) 的 \`templates/\` 目录，提交 \`${commit}\`。该目录为 jnMetaCode 原创工作，采用 MIT 许可（Copyright (c) 2026 jnMetaCode，见 \`licenses/ai-shortfilm-prompts.LICENSE\`；归属说明见 \`licenses/ai-shortfilm-prompts.NOTICE\`）。`,
    '',
    '未复制上游 `prompts/` 目录中版权归 Mx-Shell 等原作者所有的完整提示词原文。模板文件中的延伸阅读链接与署名保持原样。',
    '',
    '模板选择器的名称、概念、分镜节拍、变量与时长均由 `scripts/video-details.mjs` 原样摘自模板正文。上游没有示意图，`previews/` 中的封面由 `scripts/render-video-covers.py` 用 Pillow 绘制（不含第三方图片、字体或表情图），随本仓库许可发布。',
    '',
  ].join('\n'))
  // Covers are drawn locally (no upstream stills); re-render them so the catalog marks them again.
  const covers = spawnSync(python, ['-E', join(root, 'scripts/render-video-covers.py')], { stdio: 'inherit' })
  if (covers.status !== 0) throw new Error('视频封面绘制失败（需要 Pillow）')
  return { templates: templates.length - 1, modules: modules.length }
}

const imageCount = importImage()
const video = importVideo()
console.log(`OK: ${imageCount} 套生图模板，${video.templates} 套视频题材模板，${video.modules} 个视频构件`)
