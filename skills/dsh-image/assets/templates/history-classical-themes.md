# 历史与古风题材（History & Classical Themes）

> 来源：[awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)（freestylefly，MIT）的模板库 `data/style-library.json` 与 `docs/templates.md`，提交 63e6176fa01b。小节内另有出处的，以小节内标注为准。

生成朝代服饰、长卷叙事、诗词和传统题材。

## 什么时候用

用于古风题材、长卷、朝代服饰、诗词视觉和历史场景。

## 写法要点

- 指定朝代、服饰制度、器物参考、版式和文化气质。
- 明确长卷、册页或海报形式。

## 防坑

- 需要历史准确时，避免朝代混搭。
- 约束随机现代物件。

风格标签：History、Classical、Illustration；场景标签：History、Story。

## 提示词模板

以下是上游「历史与古风题材」分类的全部模板，先选最贴近「历史与古风题材」的一段，再按用户需求替换方括号里的内容。

### 历史与古风题材

**常规模板**

```text
生成[朝代/古风设定]题材画面，主题为[主题]。
人物：[身份/服饰/器物]，场景：[宫廷/市井/山水]。
美术风格：[工笔/写意/影视写实]，色调：[色调]。
文化细节：[纹样/礼制/建筑要素]。
输出：历史氛围准确的古风题材图。
```

**JSON 进阶模板（推荐给 Agent 调用）**

```json
{
  "type": "Historical/Oriental Scene",
  "setting": "Tang Dynasty Capital City at Night",
  "subject": {
    "identity": "Noblewoman",
    "clothing": "Traditional Ruqun (襦裙) with elaborate floral embroidery",
    "action": "Holding a glowing silk lantern, looking at fireworks"
  },
  "style": "Cinematic realism combined with subtle traditional ink wash (水墨) textures",
  "details": "Accurate Tang architecture, bustling crowd in background",
  "constraints": "No modern elements, historically accurate clothing structure"
}
```

**避坑指南**

- **拒绝大杂烩**：明确朝代（唐/宋/明），否则大模型会给你画出一个穿着和服、拿着清朝折扇在唐朝宫殿里的人。
- **强制排雷**：一定要加上“禁用现代元素（No modern elements）”，防止古风美女手里突然多出一杯星巴克。

## 参考案例

- 案例 375「古希腊三哲时间轴城市图」：作者 @ToroJushiAi，[原帖](https://x.com/ToroJushiAi/status/2050713034503409874)，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-375)
- 案例 338「《赤壁怀古》长卷图」：作者 苍何原创实测（公众号文章《我逆向了 329 条 GPT-Image2 提示词模板，全部开源！》），[原帖]()，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-338)
