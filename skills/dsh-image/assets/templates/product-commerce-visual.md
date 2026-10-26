# 商品商业视觉（Product Commerce Visual）

> 来源：[awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)（freestylefly，MIT）的模板库 `data/style-library.json` 与 `docs/templates.md`，提交 63e6176fa01b。小节内另有出处的，以小节内标注为准。

生成商品图、包装、详情页和卖点排版。

## 什么时候用

用于商品主图、包装视觉、详情页和销售卖点排版。

## 写法要点

- 定义商品、卖点、材质、场景、光线和版块。
- 区分主商品、卖点标签和辅助道具。

## 防坑

- 避免无关道具削弱商品识别。
- 约束包装文字和卖点表达。

风格标签：Product、Realistic；场景标签：Commerce、Food。

## 提示词模板

以下是上游「商品与电商」分类的全部模板，先选最贴近「商品商业视觉」的一段，再按用户需求替换方括号里的内容。

### 商品与电商

**常规模板**

```text
生成[商品名]电商主图，卖点为[卖点1]、[卖点2]。
场景：[纯色棚拍/生活方式场景]，镜头：[特写/半身/全景]。
材质细节：[材质关键词]，灯光：[柔光/侧光/轮廓光]。
附加元素：[价格角标/卖点icon/促销文案]。
输出：电商平台可直接使用的商品展示图。
```

**个人化美妆推荐报告模板**

```text
你是一个专业美妆顾问 + 人脸分析系统 + 品牌视觉设计系统。
目标：基于[用户自拍]与[口红品牌]，生成一张具有“分析 + 推荐 + 试色 + 场景建议”的竖版口红推荐报告信息图。

输入参数：
用户图像：[用户自拍]
品牌：[Dior / YSL / Armani / Chanel / TF / 其他品牌]
风格偏好（可选）：[通勤 / 温柔 / 气场 / 氛围感 / 显白优先]
推荐数量：[3-5]

分析层：
- 判断肤色：冷 / 暖 / 中性（含明度）
- 判断气质：清冷 / 温柔 / 明艳 / 干净 / 成熟
- 判断唇部基础：唇色深浅、唇形、适合浓淡
- 输出一句总结：「更适合 [色系] + [饱和度] + [质地] 的口红方向」

推荐层：
从[品牌]中筛选[3-5]个差异化色号，每个色号包含：
- 色号名称
- 色系标签
- 上脸效果
- 推荐场景

品牌视觉层：
根据[品牌]自动生成视觉调性，只用少量品牌强调色做标题、细线、小 icon 和局部点缀。
示例：YSL 黑金强对比，Dior 法式柔光灰白，Armani 低饱和雾面，Chanel 极简黑白，TF 深色电影感。

版式结构：
左上：用户输入图 + 肤色分析
右上：一句分析结论
中部：3-5 个同一张脸的唇色试色矩阵，每列一个色号
底部：有判断力的个人建议

视觉要求：
高端美妆编辑视觉，结构化信息可视化排版，真实皮肤质感，唇色精准，统一光影，9:16 竖版，8K。
```

**JSON 进阶模板（推荐给 Agent 调用）**

```json
{
  "type": "E-commerce Hero Image",
  "product": {
    "name": "Noise Cancelling Headphones",
    "material": "Matte black finish with metallic accents",
    "angle": "3/4 profile, floating slightly"
  },
  "setting": {
    "background": "Minimalist studio setup, soft gray gradient",
    "lighting": "Softbox overhead, sharp rim light on edges"
  },
  "copywriting": {
    "badges": ["NEW", "$299"],
    "slogan": "Silence the World"
  },
  "constraints": "Commercial photography quality, hyper-realistic textures"
}
```

**避坑指南**

- **材质和光影是灵魂**：一定要堆叠材质（如“磨砂质感”）和灯光（如“轮廓光”）的关键词，商品图一旦没有光影，立刻变成地摊货。
- **别把促销贴满全屏**：文案只给核心的 1-2 句（如“新品上市”），字多了画面就毁了。
- **先分析再出图**：美妆推荐类不要直接让模型摆色号，先要求它分析肤色、气质、唇部基础，再把结论映射到色号推荐。
- **品牌只做点缀**：品牌调性应该体现在细线、强调色、字体气质和光影里，不要把 logo 或大色块铺满画面。
- **试色矩阵要锁定同一张脸**：明确“同一张脸，仅唇色变化”，否则模型容易把每个色号都画成不同的人。

## 参考案例

- 案例 373「高端肉类海鲜品牌英雄图」：作者 @xpg0970，[原帖](https://x.com/xpg0970/status/2050108279385419965)，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-373)
- 案例 358「草莓能量饮料商业广告」：作者 @SPEEDAI07，[原帖](https://x.com/SPEEDAI07/status/2049043627163435040)，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-358)
