# 概念产品研发拆解（Concept Product Breakdown）

> 来源：[awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)（freestylefly，MIT）的模板库 `data/style-library.json` 与 `docs/templates.md`，提交 63e6176fa01b。小节内另有出处的，以小节内标注为准。

生成研发板、拆解图、混合任务和特殊输出。

## 什么时候用

用于实验型任务、研发视觉板、拆解图和特殊视觉系统。

## 写法要点

- 定义产物类型、组件、标签、材质逻辑和展示格式。
- 使用清晰标注和受控技术风格。

## 防坑

- 避免任务边界过泛。
- 标签要短，组件关系要清楚。

风格标签：Other Use Cases、Product；场景标签：Creative、Tech。

## 提示词模板

以下是上游「其他应用场景」分类的全部模板，先选最贴近「概念产品研发拆解」的一段，再按用户需求替换方括号里的内容。

### 其他应用场景

**常规模板**

```text
任务目标：[你要生成的内容类型]。
输入约束：主体[主体]，场景[场景]，风格[风格]，色彩[配色]。
质量约束：清晰度[高清/4K]，比例[比例]，构图[构图方式]。
输出约束：用于[用途]，需突出[核心信息]。
请输出一版主方案 + 一版备选方案。
```

**概念产品研发拆解板模板**

```text
为[产品/家具/装置]生成一张完整的概念产品研发拆解板，而不是单张成品渲染图。

核心概念：
把[灵感来源，如揉皱纸团/贝壳/折纸/机械结构]转译成[产品类型]。
设计哲学：[一句话说明功能与情绪，例如“把受控混乱转化为高舒适度座椅”]。

画面结构：
中心：高质量 hero render，展示最终产品的主要形态、材质和比例。
左侧：观察与形态分析，包含灵感图、轮廓提取、结构线、折痕/纹理/受力方向标注。
中部：形态迭代过程，展示从原始形态到产品外壳的 3-5 个演化步骤。
下方：人体工学或使用场景验证，包含尺寸、角度、使用姿态和关键功能说明。
右侧：结构集成与材料方案，展示内部骨架、外壳、软垫/面料/连接件等分层拆解。
底部：最终材质、表面纹理、颜色方案和关键规格表。

视觉风格：
工业设计提案板，干净白底或浅灰背景，技术图纸 + 产品摄影混合风格，细线标注，清晰标题，真实阴影，材质细节可见。

约束：
不要只画一个漂亮产品；必须展示分析、迭代、人体工学、结构、材料和规格。
不要让文字挤满画面；每个阶段只保留短标题和关键标签。
产品外形应保留[灵感来源]的识别特征，但必须看起来可制造、可使用。
```

**JSON 进阶模板（推荐给 Agent 调用）**

```json
{
  "type": "Custom Generation",
  "objective": "Generate [Specific content]",
  "inputs": {
    "subject": "[Main subject details]",
    "scene": "[Background and context]",
    "style": "[Artistic/Visual style]",
    "palette": "[Color scheme]"
  },
  "quality_constraints": {
    "resolution": "8k, hyper-detailed",
    "aspect_ratio": "[e.g., 16:9]",
    "composition": "[e.g., Rule of thirds]"
  },
  "output_requirements": {
    "usage": "[Intended use case]",
    "focus": "[Key element to highlight]"
  }
}
```

**避坑指南**

- **先说干嘛的**：一上来先写“任务目标和用途”，让模型建立全局上下文，再写视觉细节。
- **A/B 测试**：通用场景建议在 prompt 里要求“一次生成主方案 + 备选方案”，方便你直接挑好的。

***

## 参考案例

- 案例 370「Crumple Chair 概念沙发研发板」：作者 @ShamsAmin56，[原帖](https://x.com/ShamsAmin56/status/2050281206139461780)，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-370)
- 案例 361「手机爆炸拆解图」：作者 @Ankit_patel211，[原帖](https://x.com/Ankit_patel211/status/2048834306379075759)，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-361)
