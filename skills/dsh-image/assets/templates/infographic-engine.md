# 信息图引擎（Infographic Engine）

> 来源：[awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)（freestylefly，MIT）的模板库 `data/style-library.json` 与 `docs/templates.md`，提交 63e6176fa01b。小节内另有出处的，以小节内标注为准。

生成结构化图解、时间线、知识图谱和技术解释图。

## 什么时候用

用于解释图、技术图解、时间线和知识卡片。

## 写法要点

- 定义 3-5 个模块、信息流、层级和短标签。
- 用色块、箭头、图标和留白控制复杂度。

## 防坑

- 避免把长段正文塞进画面。
- 先限制模块数量，再补视觉细节。

风格标签：Infographic、Charts；场景标签：Education、Tech。

## 提示词模板

以下是上游「图表与信息可视化」分类的全部模板，先选最贴近「信息图引擎」的一段，再按用户需求替换方括号里的内容。

### 图表与信息可视化

**常规模板**

```text
生成[主题：明确、具体，避免宽泛。例如：“老年人日常健康管理指南”而非“健康”]信息图，目标读者为[人群:细化人群特征，如年龄段、职业、兴趣等]。
结构：标题区 + [3-5]个模块（每模块含图标、短标题、1-2句说明,模块间逻辑：可用箭头、颜色区分或连接线提示信息流或关系等适当的方式）。
图表类型：[流程图/对比图/关系图/时间线]。
风格：[专业报告/科普插画/儿童教育等]，主色[颜色]，背景[浅色/深色]。
输出：信息层级清晰、可读性高的中文信息图。
```

**JSON 进阶模板（推荐给 Agent 调用）**

```json
{
  "type": "Infographic",
  "topic": "Urban Metabolism",
  "audience": "General Public",
  "structure": {
    "title_area": "城市生命系统图谱",
    "layout": "Isometric cutaway, 12 numbered panels",
    "modules": [
      {"title": "能源", "icon": "lightning", "text": "Power flows"},
      {"title": "水循环", "icon": "water_drop", "text": "Water flows"}
    ]
  },
  "style": {
    "aesthetic": "Scientific atlas",
    "colors": "Low saturation, color-coded flows",
    "background": "Light paper texture"
  },
  "constraints": "No cyberpunk, no gibberish text, strict structural layout"
}
```

**尺度缩放科学信息图模板**

```text
为[主题]生成一张科学尺度缩放信息图。
结构：6-8 个圆形或六边形框，按从微观到宏观的尺度递进排列。
每个框包含：尺度名称、3-5 个词的洞察、测量单位或放大倍率，以及该尺度下的高细节 3D 渲染。
用细线连接各尺度，避免重复层级。标题使用“[主题]：AT EVERY SCALE”或“ZOOM: THE WORLD OF [主题]”。
风格：科学编辑信息图、精准微距光、清晰层级、文字短而可读。
约束：不要通用放大镜图标，不要把所有尺度画成同一大小，不要塞长段正文。
```

**避坑指南**

- **控制模块数量**：强制定制“模块数量”和“图表类型”，能极大降低画面混乱和信息溢出。
- **文案克制**：图表场景优先使用短句文案，千万不要把大段正文塞进画面里，模型不是排版工人。

## 参考案例

- 案例 334「RAG 技术详解图」：作者 苍何原创实测（公众号文章《我逆向了 329 条 GPT-Image2 提示词模板，全部开源！》），[原帖]()，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-334)
- 案例 1「信息图可视化设计」：作者 小红书号insight_express，[原帖]()，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-1.md#case-1)
- 案例 8「科普百科图」：作者 小红书号1055699679，[原帖]()，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-1.md#case-8)
