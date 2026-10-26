# 插画与艺术风格（Illustration & Art Style）

> 来源：[awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)（freestylefly，MIT）的模板库 `data/style-library.json` 与 `docs/templates.md`，提交 63e6176fa01b。小节内另有出处的，以小节内标注为准。

生成动漫、水彩、水墨、材质实验和艺术风格图。

## 什么时候用

用于动漫、水彩、水墨、装饰画和风格实验。

## 写法要点

- 定义构图、主体、配色、笔触材质、情绪和完成度。
- 参考图任务需要说明保留哪些特征。

## 防坑

- 避免只写风格，不写构图。
- 使用参考图时锁定角色识别。

风格标签：Illustration；场景标签：Story、Creative。

## 提示词模板

以下是上游「插画与艺术」分类的全部模板，先选最贴近「插画与艺术风格」的一段，再按用户需求替换方括号里的内容。

### 插画与艺术

**常规模板**

```text
创作[题材]插画，主角为[角色/主体]。
画风：[日漫/水彩/扁平/厚涂]，线条：[细腻/粗犷]。
配色：[配色方案]，背景：[简洁/复杂场景]。
构图：[近景/中景/远景]，重点表现[细节]。
输出：可用于封面或社媒发布的高质量插画。
```

**JSON 进阶模板（推荐给 Agent 调用）**

```json
{
  "type": "Artistic Illustration",
  "art_style": "Studio Ghibli inspired anime style",
  "scene": {
    "description": "A giant flying whale carrying a small cozy village on its back",
    "details": "Windmills turning, tiny people looking over the edge, fluffy white clouds"
  },
  "palette": "Vibrant sky blue, lush greens, soft pastel accents",
  "technique": "Cel shading, detailed background art, soft glowing magical aura",
  "mood": "Whimsical, adventurous, nostalgic"
}
```

**避坑指南**

- **锁定笔触**：插画如果不限制笔触（如“厚涂”、“水彩晕染”），它通常会给你一种毫无灵魂的 AI 默认塑料风。
- **慎用大师名**：提大师名字很爽，但容易被模型原样照搬其代表作的构图。建议提取大师的特征（如“梵高的旋转星空笔触”），而不是直接写大师名。

## 参考案例

- 案例 346「立体刺绣小鸟花枝」：作者 @dotey，[原帖](https://x.com/dotey/status/2048529821706195442)，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-346)
- 案例 6「插画艺术创作图」：作者 小红书号yi_xiao_jiu，[原帖]()，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-1.md#case-6)
