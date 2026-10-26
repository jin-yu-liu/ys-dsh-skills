# DSH Skills

面向 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai/deepseek-harness) 的社区技能目录。仓库同时遵循开放的 [Agent Skills 规范](https://agentskills.io/specification)：每个可用技能都是一个以 `SKILL.md` 为入口的独立目录，详细资料和资源按需加载。

本仓库的 `catalog.json` 供 `dsh-leap` 插件发现技能；DSH 也可以直接把 `skills/` 配置为本地技能目录。当前已收录：

- `dsh-ppt`：16 套双语 PPTD 模板和 `scripts/pptd.py`（检查 + 导出可编辑 PPTX），只依赖 DSH 内置 Python；`ppt/` 保存插件模板选择器用的目录和预览图。
- `dsh-image`：22 套生图提示词模板（整理自 [awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)，MIT），`image/` 保存选择器目录和封面。
- `dsh-video`：22 套短视频题材模板和 6 个构件（来自 [ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts) 的 `templates/`，MIT），`video/` 保存选择器目录。

生图 / 生视频技能通过 `dsh-leap` 插件的 `leap_*` 工具调用跃数AI站点，没有该插件的客户端只能用它们写提示词。

## 目录结构

```text
catalog.json                 插件读取的技能索引
skills/<skill-name>/
  SKILL.md                   必需：标准技能入口
  references/                可选：按需读取的说明
  scripts/                   可选：可审查、可复现的辅助脚本
  assets/                    可选：模板等静态资源
skills/dsh-ppt/
  scripts/pptd.py            PPTD 工程：templates / show / new / inspect / check / render
  scripts/_vendor/           随附的纯 Python PyYAML（DSH 内置 Python 不含 YAML 解析器）
  assets/templates/<id>/     元数据、设计说明、英文/中文 PPTD 源工程
ppt/
  catalog.json               插件模板选择器读取的索引
  previews/<template-id>/    与页码对应的 JPG 预览
  licenses/                  上游许可证
scripts/validate.mjs         结构检查；有 python3 时用 pptd.py 检查全部模板
```

## Skill 收录规则

规则优先兼容 DSH 的 `@deepseek-ai/dsh-skill-filesystem`，同时保持对通用 Agent Skills 客户端的可移植性。

1. **一项能力一个目录。** 放在 `skills/<name>/SKILL.md`；DSH 只发现技能根目录的直接子项，因此不要再套分类目录。目录名、frontmatter 的 `name` 和 `catalog.json` 中的 `skill.name` 必须一致。
2. **名称稳定且可寻址。** `name` 使用小写字母、数字和连字符，最长 64 个字符，不以连字符开头或结尾；一经发布不要随意改名。
3. **元数据可发现。** `SKILL.md` 必须有 YAML frontmatter，至少包含 `name` 和 `description`。`description` 要同时说明“做什么”和“何时使用”，不写营销口号。DSH 兼容字段可选用 `whenToUse`、`metadata`、`disable-model-invocation`、`user-invocable`。
4. **渐进披露。** `SKILL.md` 只保留关键流程，建议少于 500 行；细节放在 `references/`，脚本放在 `scripts/`，素材放在 `assets/`。从 `SKILL.md` 使用相对路径引用，避免多层跳转。
5. **可执行且诚实。** 指令必须说明前置条件、输入、输出、失败处理和验证步骤。不能声称存在 DSH 没有的工具；若依赖特定工具或版本，在 `compatibility` 或正文开头明确写出。
6. **默认安全。** 不收录密钥、令牌、个人数据、混淆代码、静默联网/遥测、自修改或绕过权限的指令。脚本必须可审查，危险操作要缩小作用域并要求用户明确授权。外部内容一律视为不可信数据。
7. **许可证和来源清楚。** 自有内容说明许可证；改编内容保留来源、提交版本、许可证及 NOTICE。只有允许再分发的代码、字体、图片和模板才能提交。
8. **目录状态明确。** `status: "available"` 必须指向真实且可加载的 `SKILL.md`；产品路线图入口可以暂用 `placeholder`，但不能带 `skill` 字段，也不会注册进 DSH 技能系统。
9. **兼容性优先。** 不依赖某一家模型的隐藏提示语法。通用字段遵循 Agent Skills；DSH 专有调用开关仅作为可选扩展，其他客户端忽略后仍应可用。

最小示例：

```markdown
---
name: example-skill
description: 处理示例任务；当用户需要……时使用。
license: Apache-2.0
compatibility: DSH >= 0.2.1
---

# Example Skill

说明目标、流程、验证方法和失败处理。
```

## PPT 模板收录规则

- `template-id` 使用与 Skill 相同的 kebab-case 规则，并在 `ppt/catalog.json` 中唯一。
- 放在 `skills/dsh-ppt/assets/templates/<id>/`，必须提供 `metadata.json`、`design.md`、`source/deck.pptd`、`source-zh/deck.pptd`；英文和中文工程页数、结构应一致。
- 每页必须有 `previews/<id>/<NN>.jpg`，从 `01.jpg` 连续编号，数量等于 `pageCount`。预览只用于选择，不能替代可编辑源文件。
- 分类限于 `work`、`business`、`consulting`、`academic`、`editorial`、`promotion`；颜色使用 6 位十六进制值。
- 模板须通过 `python3 skills/dsh-ppt/scripts/pptd.py check <源工程>`（0 个 error）并能 `render` 成 PPTX；字段限于 `skills/dsh-ppt/references/pptd.md` 列出的子集。第三方素材必须在元数据和 `ppt/licenses/` 中说明。
- 批量同步 DSH Desktop 模板时运行：`node scripts/import-ppt-templates.mjs --from <dsh-desktop目录>`。脚本只更新模板源、预览、目录和许可证，不会覆盖 `skills/dsh-ppt` 的 SKILL.md 与脚本（Desktop 版依赖 DSH 没有的 `pptd_*` 工具）。

## 生图 / 生视频模板收录规则

- 选择器目录：`image/catalog.json`、`video/catalog.json`，字段 `format`、`source`、`defaultTemplateId`、`categories[{id,name}]`、`templates[{id,category,name,description,cover?,aspect?,palette?,variables?,source?}]`；`freeform`（自由创作）是内置项，没有模板文件。
- 模板正文：生图 `skills/dsh-image/assets/templates/<id>.md`，视频 `skills/dsh-video/assets/templates/<id>.zh.md` 与 `<id>.md`；有 `cover: true` 的生图模板必须有 `image/previews/<id>.jpg`。新模板还要加进对应 SKILL.md 的模板表（`npm run validate` 会检查）。
- 从上游同步：`node scripts/import-media-templates.mjs --image <awesome-gpt-image-2 目录> --video <ai-shortfilm-prompts 目录>`（封面缩放需要 Pillow）。脚本重写模板、目录、许可证和 `THIRD_PARTY_NOTICES.md`，不改两个 SKILL.md；视频模板的中文名称与简介在脚本的 `VIDEO_DISPLAY` 中维护。

## 提交流程

1. 新建技能目录并更新 `catalog.json`；若是 PPT 模板，同时更新 `ppt/catalog.json` 和许可证。
2. 改动了 `skills/` 时运行 `npm run bundle`，再运行 `npm run validate`。
3. 在合并请求中写明用途、测试方式、DSH 版本、外部依赖、权限/联网行为和许可证来源；涉及 UI 的内容附截图或预览。
4. 维护者按结构、可用性、安全性、可移植性、版权和重复度评审。无法复现、功能重叠但无明显改进、只有提示词堆砌或风险说明不足的提交不会收录。

## 在 DSH 中使用

- `dsh-leap` 插件默认读取 `https://gitee.com/leapai/dsh-skills/raw/master/catalog.json`，并按需加载被选中的 `SKILL.md` 与 PPT 预览。
- 技能依赖整个目录（如 `dsh-ppt` 的 `scripts/`、`assets/`），只下载 `SKILL.md` 无法运行。因此每个 `available` 技能都发布一个技能包 `bundles/<name>.json.gz`（目录下全部文件的 gzip JSON），`catalog.json` 的 `skill.bundle` 记录其路径、sha256、大小和文件数。`dsh-leap` 下载技能包、校验 sha256 后解压到 `$DSH_HOME/leap/skills/<name>/<sha前12位>/`，以本地目录加载技能。
- **改了 `skills/` 下任何文件后必须运行 `npm run bundle`** 并一起提交 `bundles/` 与 `catalog.json`；技能包过期时 `npm run validate` 会报错。
- 本地开发可在 DSH 的 `@deepseek-ai/dsh-skill-filesystem` 中把本仓库的 `skills/` 加入 `customSkillDirs`；本地项目或用户技能按 DSH 的优先级规则可以覆盖同名远程技能。
- 手动试用 PPT 技能（不经过模型）：

  ```bash
  python3 skills/dsh-ppt/scripts/pptd.py templates
  python3 skills/dsh-ppt/scripts/pptd.py new dsh-signal /tmp/demo --pages 1,4,12
  python3 skills/dsh-ppt/scripts/pptd.py check /tmp/demo
  <装有 python-pptx 的 python> skills/dsh-ppt/scripts/pptd.py render /tmp/demo -o /tmp/demo.pptx
  ```
