# 建筑与空间（Architecture & Space）

> 来源：[awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)（freestylefly，MIT）的模板库 `data/style-library.json` 与 `docs/templates.md`，提交 63e6176fa01b。小节内另有出处的，以小节内标注为准。

生成室内、建筑、城市地图和空间概念视觉。

## 什么时候用

用于室内、建筑表现、城市地图、空间规划和环境概念图。

## 写法要点

- 定义视角、尺度、材质、光线和空间功能。
- 地图需要指定地标、标签、边框装饰和准确度。

## 防坑

- 概念图之外要避免不合理透视。
- 锁定地图标签语言和相对位置。

风格标签：Architecture；场景标签：Travel、Commerce。

## 提示词模板

以下是上游「建筑与空间」分类的全部模板，先选最贴近「建筑与空间」的一段，再按用户需求替换方括号里的内容。

### 建筑与空间

**常规模板**

```text
生成[空间类型]设计效果图，功能定位为[用途]。
风格：[现代简约/工业/新中式]，材质：[木/石/金属/玻璃]。
空间结构：[开敞/分区]，动线：[主通道说明]。
光线：[自然采光/人工照明方案]，时间：[白天/夜景]。
输出：写实建筑空间渲染图。
```

**JSON 进阶模板（推荐给 Agent 调用）**

```json
{
  "type": "Architectural Visualization",
  "space": {
    "type": "Modern Cabin Interior",
    "function": "Living room",
    "materials": "Exposed concrete, large floor-to-ceiling glass, warm timber accents"
  },
  "environment": "Nestled in a dense, snowy pine forest visible through the glass",
  "camera": {
    "angle": "Eye-level perspective, wide-angle lens",
    "lighting": "Golden hour, warm interior lights glowing, cool blue ambient light outside"
  },
  "render_quality": "Unreal Engine 5 style, hyper-realistic, 8k resolution, ray tracing"
}
```

**避坑指南**

- **控制视角**：建筑图最容易翻车的就是透视变形。用“Eye-level perspective（人眼视角）”能压住它。
- **冷暖对比**：室外的冷光（蓝/灰）和室内的暖光（黄/橙）搭配，是提升空间高级感的作弊码。

## 参考案例

- 案例 331「西安手绘水彩城市地图」：作者 苍何原创实测（公众号文章《我逆向了 329 条 GPT-Image2 提示词模板，全部开源！》），[原帖]()，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-331)
- 案例 11「一张手绘风格的城市美食地图，以台州为主题」：作者 小红书号510244722，[原帖]()，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-1.md#case-11)
