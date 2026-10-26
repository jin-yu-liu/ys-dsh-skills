---
name: dsh-video
description: 用跃数AI站点的视频模型生成短视频：按 22 套题材模板（短剧、预告片、产品 / 汽车广告、萌宠、美食 ASMR、旅行、航拍、MV、舞蹈、时尚、科幻、慢动作、黏土动画等）和 5 段式结构写出多镜头视频提示词，调用生视频工具（文生视频、参考图 / 首尾帧生视频）并保存到工作区。当用户要做短视频、广告片、分镜视频、让图片动起来，或在首页选择了 AI 生视频模板时使用。
compatibility: DSH >= 0.2.1；需要 dsh-leap 插件提供的 leap_media_models、leap_video_generate、leap_media_task、leap_media_template 工具，并已登录跃数AI账号（试用模式不能生视频）。
metadata:
  version: "1.0.0"
---

# AI 生视频

出片走 dsh-leap 插件的工具，它们用本设备自动注册的「生视频」密钥调用站点的 OpenAI 兼容接口，结果保存在工作区：

| 工具 | 用途 |
|---|---|
| `leap_media_models` | 列出可用模型（`kind: "video"`），含支持的时长、尺寸、参考图数量等参数说明 |
| `leap_video_generate` | 提交生视频，等待完成并下载 mp4；超时返回 `task_id` |
| `leap_media_task` | 查询未完成的任务，完成后下载；不会重复扣费 |
| `leap_media_template` | 读取题材模板（`template_id`）或构件（`module`）全文，`lang` 选中英文 |

密钥由工具在内部读取：不要去找、读取或打印密钥，也不要用 shell / curl 直接调接口。工具报错时把它返回的中文原因转告用户（需要登录、余额不足、密钥被停用等），不要反复重试。

## 1. 明确需求

确定：题材和用途（平台、横竖屏）、时长、主体（人物 / 产品 / 动物 / 环境）、情绪和节奏、是否有参考图或首尾帧、是否需要对白或旁白。视频生成慢、按时长计费，信息不全时先问清再写。

## 2. 选模板

- 用户在首页选了模板时，消息里会附带「视频模板」通知和 `<template>` 模板全文（中文版），直接用它，除非用户明确要求换。选「自由创作」时不套题材，直接用第 3 步的 5 段式结构写。
- 没选模板时按题材挑一套并告诉用户：

| 分类 | 模板 id |
|---|---|
| 剧情 / 短剧 | `micro-drama`、`movie-trailer`、`family-recipe-farewell`、`found-footage-horror` |
| 广告 / 产品 | `product-commercial`、`car-commercial` |
| 萌宠 | `animal-vlog`、`pet-lifetime-narrative`、`elderly-cat-companion` |
| 美食 | `food-asmr` |
| 旅行 / 风光 | `travel-vlog`、`drone-fpv`、`nature-timelapse` |
| 音乐 / 舞蹈 | `music-video`、`dance` |
| 时尚 / 美妆 | `fashion-film` |
| 科幻 / 动作 | `15s-transformation`、`anime-to-real`、`cyberpunk-city`、`sci-fi-space`、`sports-slowmo` |
| 风格化 | `claymation` |

- 没有附带模板全文时，调用 `leap_media_template`（`kind: "video"`、`template_id`，中文需求 `lang: "zh"`，英文需求 `lang: "en"`）读取；文件也在本技能的 `assets/templates/<模板id>.zh.md` / `<模板id>.md`。先看「先定好这些变量」，再以「完整提示词」为骨架，把 `{{变量}}` 换成用户的设定。只读选中的模板。
- 需要更多手法时用同一个工具按需读构件（`module` 参数，文件在 `references/modules/`）：`camera-move-library`（运镜技法库）、`genre-camera-sop`（类型片运镜 SOP）、`atmosphere-prefabs`（风格画质片段）、`negative-prompts`（负面提示词）、`multi-shot-narrative`（多分镜叙事）、`project-planner`（多镜项目一致性规划）。

## 3. 写提示词（5 段式）

模板都按同一结构组织，自由创作也照此写：

1. **核心主题**：一行关键词——题材 | 情绪 | 视觉风格 | 表演基调。
2. **人物与场景**：外形、服装、带瑕疵的真实细节；场景、时间、光源。有参考图时写明「参考上传图片，保持五官 / 产品外观一致」。
3. **氛围与画质**：机型或胶片感、调色、景深、颗粒、有动机的光。
4. **运镜规则**：主运镜方式、手持呼吸感或稳定器、声音设计（现场声 / 音乐 / 静默）。
5. **分镜**：按时间码分拍（如 `0–3s / 3–8s / 8–12s`），每拍写「动作 / 镜头 / 声音」。总时长与 `seconds` 一致，单条通常 4–15 秒。

最后附上负面约束（不要畸形肢体、不要文字水印、不要突兀跳切等，参考 `negative-prompts` 构件）。

- 不要在提示词里写真实明星、受版权保护的角色名或品牌标志；描述外形与风格特征即可。
- 把完整提示词和计划参数（模型、时长、尺寸、是否带参考图）先给用户确认，再提交——**每条视频都会扣余额**。

## 4. 出片

1. 第一次生成前调用 `leap_media_models`（`kind: "video"`），按 `default_parameters` / `parameter_schema` 选模型和可用的时长、尺寸；用户没指定时用列表第一个并说明。
2. 调用 `leap_video_generate`：
   - `prompt`：第 3 步的完整提示词。
   - `seconds`、`size`（如横屏 `1280x720`、竖屏 `720x1280`），模型支持时可加 `resolution`（如 `720p`）、`ratio`（如 `9:16`）。
   - 图生视频：`first_frame` / `last_frame` 放首尾帧图片路径；角色或产品参考图放 `reference_images`。合计最多 9 张，png/jpg/webp，每张 ≤ 12MB。需要先做关键帧时可以先用 dsh-image 技能出图，再把结果当首帧。
   - `output_dir` 默认 `outputs/videos`；`file_prefix` 用简短描述。
3. 结果处理：
   - `completed`：告诉用户 `files` 里的 mp4 路径。
   - `in_progress`：告诉用户还在生成和当前进度，稍后用 `leap_media_task`（`kind: "video"`，同一个 `task_id`）继续取，**不要重新提交**。
   - `failed`：转述原因；内容审核类失败先修改提示词中的敏感描述，再问用户是否重试。

## 5. 多镜头成片

单条视频装不下的故事拆成多条：先按 `project-planner` 构件锁定角色外观、场景、调色和镜头语言，每条复用相同的人物描述和参考图，按顺序生成。每条提交前告诉用户总条数和预计消耗，得到确认后再批量提交。

## 来源与许可

题材模板和构件来自 [ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts)（jnMetaCode，`templates/` 目录为 MIT），文件内容保持原样并保留各自的署名与延伸阅读链接，许可与归属说明见 `video/licenses/`。
