# 场景叙事（Scene Storytelling）

> 来源：[awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2)（freestylefly，MIT）的模板库 `data/style-library.json` 与 `docs/templates.md`，提交 63e6176fa01b。小节内另有出处的，以小节内标注为准。

生成分镜、世界观、故事场景和情绪节奏。

## 什么时候用

用于分镜、世界观、直播场景和情绪叙事画面。

## 写法要点

- 定义人物、地点、时间、冲突、情绪和机位。
- 让场景细节服务故事。

## 防坑

- 避免通用幻想背景。
- 让故事线索在画面里可见。

风格标签：Scenes、Illustration；场景标签：Story、Social。

## 提示词模板

以下是上游「场景与叙事」分类的全部模板，先选最贴近「场景叙事」的一段，再按用户需求替换方括号里的内容。

### 场景与叙事

**常规模板**

```text
生成[故事主题]场景图，发生在[时间+地点]。
主事件：[事件描述]，主角：[角色]，冲突点：[冲突]。
镜头语言：[广角建立镜头/中景叙事/特写]。
氛围：[紧张/温暖/悬疑]，色调：[冷/暖/高反差]。
输出：具备叙事张力的场景概念图。
```

**JSON 进阶模板（推荐给 Agent 调用）**

```json
{
  "type": "Narrative Scene",
  "story_context": "The exact moment an ancient seal breaks",
  "environment": "Crumbling stone temple overgrown with glowing blue vines",
  "action": "A young explorer dropping their torch as a massive beam of light shoots into the sky",
  "atmosphere": {
    "mood": "Awe-inspiring, terrifying",
    "lighting": "Blinding central light casting long dramatic shadows"
  },
  "camera": "Low angle shot, emphasizing the scale of the light beam"
}
```

**避坑指南**

- **要有“动词”**：叙事图最怕画成风景明信片。一定要写“事件”（如“正在崩塌”、“刚点燃火把”），让画面动起来。
- **镜头语言**：使用“Low angle shot（低角度仰拍）”或“Dutch angle（倾斜镜头）”来增加戏剧冲突。

## 参考案例

- 案例 330「月下美女直播画面」：作者 苍何原创实测（公众号文章《我逆向了 329 条 GPT-Image2 提示词模板，全部开源！》），[原帖]()，[上游条目](https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/gallery-part-2.md#case-330)
