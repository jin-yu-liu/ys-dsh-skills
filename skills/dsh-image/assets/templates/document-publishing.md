# 文档与出版物（Document & Publishing）

> 来源：[awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)（freestylefly，MIT）的模板库 `data/style-library.json` 与 `docs/templates.md`，提交 63e6176fa01b。小节内另有出处的，以小节内标注为准。

生成白皮书、手册、百科图鉴和页面系统。

## 什么时候用

用于白皮书、手册、百科图鉴、报告页面和出版系统。

## 写法要点

- 定义页面尺寸、分栏、目录、图表系统和字体层级。
- 使用可读标题、表格、标签和页面节奏。

## 防坑

- 避免密集小字。
- 让图表和说明对齐页面网格。

风格标签：Documents、Infographic；场景标签：Education、Tech。

## 提示词模板

以下是上游「文档与出版物」分类的全部模板，先选最贴近「文档与出版物」的一段，再按用户需求替换方括号里的内容。

### 文档与出版物

**常规模板**

```text
制作[文档类型，如菜单/杂志内页/报纸版式]。
版面结构：[栏数/页边距/标题层级]。
内容模块：[封面区/正文区/图表区/脚注]。
字体风格：[衬线/无衬线]，配色：[配色方案]。
输出：可读性强、版式规范的出版物视觉稿。
```

**JSON 进阶模板（推荐给 Agent 调用）**

```json
{
  "type": "Editorial Layout",
  "document": "Fashion Magazine Double-page Spread",
  "grid": "3-column grid, wide margins",
  "content": {
    "left_page": "Full-bleed high-fashion photograph of a model in a red dress",
    "right_page": {
      "headline": "THE RED RENAISSANCE",
      "body_text": "(Simulated text blocks)",
      "pull_quote": "\"Color is power.\""
    }
  },
  "typography": "Elegant serif for headlines, clean sans-serif for body",
  "palette": "Monochrome with stark red accents"
}
```

**企业画册系统模板**

> 来源参考：[@MrLarus](https://x.com/MrLarus/status/2056974720893939950)

```text
请生成一套企业级商用画册视觉方案，主题为【品牌名称】的【行业 / 产品 / 解决方案】宣传画册。

整体风格：高端、专业、具有强视觉冲击力；避免传统 Word 排版感和普通 PPT 感。采用【深色科技美学 / 白色极简商务 / 高端工业风 / 艺术化品牌画册】风格。

画册内容包括：
1、封面与封底
2、企业介绍与品牌理念
3、核心产品与技术优势
4、应用场景与解决方案
5、客户案例与合作方式
6、全册系统预览图

要求：
版式要有设计感，图片、标题、数据、图标、留白和层级关系清晰；保持整套画册统一的品牌视觉系统；重点体现真实商业物料的完成度，避免简单文字排版。
```

**避坑指南**

- **结构优先**：明确“栏数（columns）”和“留白（margins）”比堆砌风格词更重要。
- **放弃全文**：不要指望大模型能排出一整页毫无错字的正文，让它用“模拟文本（Simulated text blocks）”填充正文，只写死大标题。
- **系统预览**：企业画册类任务最好补一张全册预览图，用于验证封面、内页、案例页和联系方式页面的统一性。

## 参考案例

- 案例 360「长发造型分析信息图」：作者 @Gemalpha_88，[原帖](https://x.com/Gemalpha_88/status/2048918707343401034)，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-360)
