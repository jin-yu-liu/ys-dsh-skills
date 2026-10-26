---
name: dsh-image
description: 用跃数AI站点的图像模型生成图片：按 22 套工业级提示词模板（UI、信息图、海报、电商、品牌、建筑、写实摄影、插画、角色、场景、古风、文档等）把需求写成完整提示词，调用生图工具出图并保存到工作区。当用户要生成图片、海报、配图、封面、插画、产品图、改图（图生图），或在首页选择了 AI 生图模板时使用。
compatibility: DSH >= 0.2.1；需要 dsh-leap 插件提供的 leap_media_models、leap_image_generate、leap_media_task、leap_media_template 工具，并已登录跃数AI账号（试用模式不能生图）。
metadata:
  version: "1.0.0"
---

# AI 生图

出图走 dsh-leap 插件的工具，它们用本设备自动注册的「生图」密钥调用站点的 OpenAI 兼容接口，结果保存在工作区：

| 工具 | 用途 |
|---|---|
| `leap_media_models` | 列出可用模型（`kind: "image"`），含默认参数和参数说明 |
| `leap_image_generate` | 提交生图（有 `reference_images` 时为图生图），等待完成并下载 |
| `leap_media_task` | 查询等待超时的任务，完成后下载；不会重复扣费 |
| `leap_media_template` | 读取一套模板的全文（`kind: "image"`, `template_id`） |

密钥由工具在内部读取：不要去找、读取或打印密钥，也不要用 shell / curl 直接调接口。工具报错时把它返回的中文原因转告用户（例如需要登录、余额不足、密钥被停用），不要反复重试同一请求。

## 1. 明确需求

确定：画面主体、用途（社媒 / 电商 / 演示 / 印刷）、比例或尺寸、画面里必须出现的**准确文字**、风格偏好、张数。缺关键信息时先问一句；能合理默认的就默认并告诉用户。

## 2. 选模板

- 用户在首页选了模板时，消息里会附带「生图模板」通知和 `<template>` 模板全文，直接用它，除非用户明确要求换。选的是「自由创作」时不套模板，直接按第 3 步的结构写。
- 没选模板时，按用途从下表挑最贴近的一套，告诉用户你用了哪套：

| 分类 | 模板 id |
|---|---|
| UI 与界面 | `ui-screenshot-system` |
| 图表与信息图 | `infographic-engine`、`scientific-scale-diagram` |
| 海报与排版 | `poster-layout-system`、`sports-campaign-poster`、`conceptual-typography-poster`、`ink-double-exposure-poster`、`nature-science-poster` |
| 商品与电商 | `product-commerce-visual`、`personalized-beauty-report` |
| 品牌与标志 | `brand-identity-package`、`brand-touchpoint-board` |
| 建筑与空间 | `architecture-space` |
| 摄影与写实 | `realistic-photography`、`street-accident-moment` |
| 插画与艺术 | `illustration-art-style` |
| 人物与角色 | `character-design-sheet`、`3d-collectible-toy` |
| 场景与叙事 | `scene-storytelling` |
| 历史与古风 | `history-classical-themes` |
| 文档与出版物 | `document-publishing` |
| 其他 | `concept-product-breakdown` |

- 没有附带模板全文时，调用 `leap_media_template`（`kind: "image"`、`template_id`）读取，模板文件也在本技能的 `assets/templates/<模板id>.md`。先看「什么时候用 / 写法要点 / 防坑」，再从「提示词模板」里挑最贴近的一段作为骨架。只读选中的那一套。

## 3. 写提示词

按模板骨架填空，并确保包含这六块（模板没写的补上）：

1. **主体与任务**：画什么、给谁用。
2. **构图与版式**：视角、主次、留白、网格或层级。
3. **风格与材质**：画风、光线、色彩（写具体颜色）、质感。
4. **文字**：要出现的文字用引号原样写出，说明位置和字号层级；不需要文字就写「画面中不要出现文字」。
5. **比例与输出**：与 `size` 参数一致。
6. **约束与避免**：模板「防坑」里的要点 + 用户特别不要的东西。

- 用户用中文提需求就用中文写提示词，画面文字保持用户给的语言；用户要求英文时用英文。
- 不要把真人肖像、商标或受版权保护的角色写成「照抄」，可以描述风格特征。
- 先把完整提示词给用户看一眼；用户说「直接生成」或需求已经很明确时可以直接出图。

## 4. 出图

1. 第一次生成前调用 `leap_media_models`（`kind: "image"`），按用户要求或默认参数选 `model`；用户没指定时用列表第一个，并在回复里说明。
2. 调用 `leap_image_generate`：
   - `prompt`：第 3 步的完整提示词。
   - `size`：横版 `1536x1024`、竖版 `1024x1536`、方图 `1024x1024`，或 `auto`；以模型的 `parameter_schema` 为准。
   - `n`：默认 1。生成多张或多轮之前先和用户确认——**每张都会扣余额**。
   - 改图 / 图生图：把工作区里的图片路径放进 `reference_images`（最多 4 张，png/jpg/webp，每张 ≤ 12MB），提示词写清楚保留什么、改什么。
   - `output_dir` 默认 `outputs/images`；`file_prefix` 用简短的英文或拼音描述，例如 `poster-spring-sale`。
3. 返回 `status: completed` 时，把 `files` 里的路径告诉用户；返回 `in_progress` 时说明还在生成，稍后用 `leap_media_task`（`kind: "image"`，同一个 `task_id`）取结果，**不要重新提交**。
4. `failed` 时转述原因。内容审核类失败要调整提示词里的敏感描述后再问用户是否重试。

## 5. 迭代

用户要修改时，在上一版提示词上改动最少的地方（换色、改字、调构图），说明改了什么；需要保留原图结构时用上一张结果做 `reference_images`。

## 来源与许可

模板来自 [awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)（freestylefly，MIT），每个模板文件开头注明了提交版本；模板内另有出处的小节以其标注为准。模板选择器的封面图来自该项目收录的社区案例，作者与原帖链接见 `image/catalog.json`。
