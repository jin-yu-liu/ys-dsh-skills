#!/usr/bin/env node
/**
 * Import the PPT template packs and authoring skill from a dsh-desktop checkout.
 *
 *   node scripts/import-ppt-templates.mjs --from /path/to/dsh-desktop
 *
 * The checkout must have its dependencies installed (js-yaml for the template
 * generators; sharp, jsdom, pptxgenjs, fflate, saxes, zod and
 * @aiden0z/pptx-renderer for the preview renderer). The script:
 * 1. runs the checkout's three template generators into a temporary directory;
 * 2. copies each pack's metadata, design notes and PPTD sources (en + zh);
 * 3. renders every Chinese example page to a JPG preview;
 * 4. writes ppt/catalog.json, the file the DSH plugin reads at runtime;
 * 5. refreshes licenses, notices and skills/dsh-ppt.
 *
 * The PPT output is plain data; only the standard SKILL.md is executable guidance.
 */
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')
const fromIndex = process.argv.indexOf('--from')
if (fromIndex < 0 || process.argv[fromIndex + 1] === undefined) {
  console.error('用法：node scripts/import-ppt-templates.mjs --from <dsh-desktop 仓库目录>')
  process.exit(1)
}
const source = resolve(process.argv[fromIndex + 1])
const output = resolve(root, 'ppt')

/** Preview width in pixels (reference pages are 16:9). */
const PREVIEW_WIDTH = 720
const PREVIEW_QUALITY = 72
const GENERATORS = ['generate-zara-ppt-templates', 'localize-ppt-templates', 'enrich-ppt-templates']
/** Category display order in the chooser. */
const CATEGORY_ORDER = ['work', 'business', 'consulting', 'academic', 'editorial', 'promotion']

/**
 * Chinese display copy. Six upstream packs carry English-only names and ten
 * carry "中文名 · English" as their description, so the chooser uses this
 * reviewed copy instead. Every imported id must be listed here.
 */
const DISPLAY = {
  'dsh-engineering-blueprint': { name: '工程蓝图', description: '纸张底色配工程网格和流程框，适合架构评审、技术方案和执行计划' },
  'dsh-work-curated-modular-logistics-system': { name: '模块化物流', description: '模块化信息块和流程线，适合供应链、跨境履约和经营行动汇报' },
  'dsh-work-curated-nordic-operating-report': { name: '北欧经营报告', description: '深蓝底配数据时间线，适合年度经营复盘、市场进入和管理层汇报' },
  'dsh-editorial-forest': { name: '森林季刊', description: '森林绿配期刊式排版，适合季度复盘、年度报告和可持续发展主题' },
  'dsh-blue-professional': { name: '蓝色商务', description: '米白底配钴蓝强调色，适合经营分析、季度汇报和投资研究' },
  'dsh-neo-grid-bold': { name: '荧光网格', description: '粗网格配高饱和撞色，适合产品发布、增长复盘和创意提案' },
  'dsh-consulting-curated-swiss-signal-grid': { name: '瑞士网格', description: '瑞士网格排版，适合管理层数据汇报、市场洞察和模式对比' },
  'dsh-cartesian': { name: '理性简报', description: '坐标网格和克制配色，适合数据简报、策略分析和对比论证' },
  'dsh-signal': { name: '深蓝决策', description: '深色底配醒目强调色，适合战略汇报、管理层决策和风险提示' },
  'dsh-course-workshop': { name: '课程工作坊', description: '学习目标边栏、概念图和自测页，适合培训、课程和工作坊' },
  'dsh-monochrome': { name: '极简研究', description: '米白底极简排版，适合用户研究、学术汇报和观点陈述' },
  'dsh-editorial-notebook': { name: '编辑笔记', description: '双栏论述、边注和决策矩阵，适合研究、观点和业务叙事' },
  'dsh-soft-editorial': { name: '柔和编辑部', description: '柔和底色配杂志式排版，适合品牌故事、内容策划和观点文章' },
  'dsh-broadside': { name: '橙黑宣言', description: '橙黑大字海报风格，适合活动宣传、发布会和宣言式表达' },
  'dsh-playful': { name: '杏色创意', description: '杏色暖调配轻松版式，适合创意提案、团队分享和活动介绍' },
  'dsh-sakura-chroma': { name: '复古彩带', description: '复古配色和彩带装饰，适合品牌宣传、节日活动和生活方式内容' },
}

/** Run a checkout script with the template output pointed at `templateRoot`. */
function runGenerator(name, templateRoot) {
  const result = spawnSync(process.execPath, [join(source, 'scripts', `${name}.mjs`)], {
    cwd: source,
    stdio: 'inherit',
    env: { ...process.env, DSH_PPT_TEMPLATE_OUTPUT: templateRoot },
  })
  if (result.status !== 0) throw new Error(`${name} 执行失败`)
}

const scratch = mkdtempSync(join(tmpdir(), 'dsh-leap-ppt-'))
try {
  const templateRoot = join(scratch, 'templates')
  mkdirSync(templateRoot, { recursive: true })
  for (const name of GENERATORS) runGenerator(name, templateRoot)

  const { runCli } = await import(pathToFileURL(join(source, 'packages/ppt-runtime/core/lib/bin.js')).href)
  const sharp = createRequire(join(source, 'package.json'))('sharp')

  rmSync(output, { recursive: true, force: true })
  mkdirSync(join(output, 'templates'), { recursive: true })
  mkdirSync(join(output, 'previews'), { recursive: true })

  const entries = []
  for (const category of readdirSync(templateRoot)) {
    for (const directory of readdirSync(join(templateRoot, category))) {
      const pack = join(templateRoot, category, directory)
      const metadata = JSON.parse(readFileSync(join(pack, 'metadata.json'), 'utf8'))
      const { definition, provenance } = metadata
      const display = DISPLAY[definition.id]
      if (display === undefined) throw new Error(`模板 ${definition.id} 缺少中文展示文案，请补充 DISPLAY`)
      if (!CATEGORY_ORDER.includes(definition.category)) throw new Error(`模板 ${definition.id} 的分类 ${definition.category} 未知`)

      const target = join(output, 'templates', definition.id)
      for (const item of ['metadata.json', 'design.md', 'source', 'source-zh']) cpSync(join(pack, item), join(target, item), { recursive: true })

      // Render the Chinese example: the plugin's users read Chinese first.
      const shots = join(scratch, 'shots', definition.id)
      const io = { stdout: { write: () => undefined }, stderr: { write: chunk => process.stderr.write(chunk) } }
      const exit = await runCli(['screenshot', join(pack, 'source-zh'), '-o', shots, '--scale', '1', '--force', '--json'], io)
      if (exit !== 0) throw new Error(`模板 ${definition.id} 预览渲染失败`)
      const pages = JSON.parse(readFileSync(join(shots, 'index.json'), 'utf8')).pages
      if (pages.length !== definition.referencePageCount) throw new Error(`模板 ${definition.id} 预览页数不完整`)
      const previewDir = join(output, 'previews', definition.id)
      mkdirSync(previewDir, { recursive: true })
      for (const [index, page] of pages.entries()) {
        const file = `${String(index + 1).padStart(2, '0')}.jpg`
        await sharp(resolve(shots, page.file)).resize({ width: PREVIEW_WIDTH }).jpeg({ quality: PREVIEW_QUALITY, mozjpeg: true }).toFile(join(previewDir, file))
      }

      entries.push({
        id: definition.id,
        category: definition.category,
        name: { zh: display.name, en: definition.localizedNames?.en ?? definition.name },
        description: display.description,
        palette: definition.palette,
        pageCount: pages.length,
        license: provenance?.license ?? 'MIT',
      })
      console.log(`[dsh-skills] ${definition.id}：${pages.length} 页`)
    }
  }
  if (entries.length !== Object.keys(DISPLAY).length) throw new Error(`期望 ${Object.keys(DISPLAY).length} 套模板，实际 ${entries.length} 套`)
  entries.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.id.localeCompare(b.id))

  const policy = JSON.parse(readFileSync(join(source, 'packages/ppt-runtime/catalog-policy.json'), 'utf8'))
  const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).stdout.trim()
  writeFileSync(join(output, 'catalog.json'), `${JSON.stringify({
    format: 1,
    source: { repository: 'https://github.com/dataelement/dsh-desktop', commit: revision },
    defaultTemplateId: policy.defaultTemplateId,
    categories: CATEGORY_ORDER,
    templates: entries,
  }, null, 2)}\n`)

  // Licenses, notices and the DSH-compatible authoring Skill.
  const core = join(source, 'packages/ppt-runtime/core')
  mkdirSync(join(output, 'licenses'), { recursive: true })
  cpSync(join(source, 'LICENSE'), join(output, 'licenses/dsh-desktop.LICENSE'))
  cpSync(join(source, 'packages/ppt-runtime/upstream/zara/LICENSE'), join(output, 'licenses/zara-beautiful-html-templates.LICENSE'))
  cpSync(join(source, 'packages/ppt-runtime/upstream/html-anything/LICENSE'), join(output, 'licenses/html-anything.LICENSE'))
  cpSync(join(core, 'THIRD_PARTY_NOTICES.md'), join(output, 'THIRD_PARTY_NOTICES.md'))
  const skillOutput = join(root, 'skills/dsh-ppt')
  rmSync(skillOutput, { recursive: true, force: true })
  cpSync(join(core, 'skills/dsh-ppt'), skillOutput, { recursive: true })
  if (!existsSync(join(skillOutput, 'SKILL.md'))) throw new Error('缺少 dsh-ppt SKILL.md')
  console.log(`\n[dsh-skills] 已导入 ${entries.length} 套模板到 ${output}（来源提交 ${revision}）`)
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
