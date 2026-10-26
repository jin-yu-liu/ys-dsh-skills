# 科学尺度缩放图（Scientific Scale Diagram）

> 来源：[awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)（freestylefly，MIT）的模板库 `data/style-library.json` 与 `docs/templates.md`，提交 63e6176fa01b。小节内另有出处的，以小节内标注为准。

生成多尺度科学信息图，强调层级、标签和可读性。

## 什么时候用

用于需要从微观到宏观展示尺度变化的科普主题。

## 写法要点

- 使用 6-8 个尺度框，每个标签保持短句。
- 展示单位、倍率和不同尺度的细节。

## 防坑

- 避免所有尺度框长得一样。
- 避免通用放大镜式布局。

风格标签：Infographic、Charts、Realistic；场景标签：Education、Tech。

## 提示词模板

以下是上游「图表与信息可视化」分类的全部模板，先选最贴近「科学尺度缩放图」的一段，再按用户需求替换方括号里的内容。

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

- 案例 341「AP Calculus 学习表信息图」：作者 @hqmank，[原帖](https://x.com/hqmank/status/2048587150544028084)，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-341)
