# PPTD 格式（`scripts/pptd.py` 支持的子集）

本说明只描述随技能附带的 `pptd.py` 能检查和导出的字段。没列出的字段会被忽略；不要假定其他 PPTD 实现的字段在这里可用。

## 工程结构

```text
<工程>/
  deck.pptd          清单
  pages/01.page      每页一个 YAML 文件
  assets/            （可选）本工程用到的图片
```

```yaml
version: v2
title: 项目说明
size: [960, 540]          # 单位：点（pt），16:9
template: {id: dsh-signal, name: Signal}   # 由 new 写入，check 用它识别残留示例文字
theme:                    # 可选；用 $名称 引用
  colors: {ink: '#1C2644', accent: '#C8A870'}
  textStyles:
    title: {fontSize: 32, bold: true, color: $ink, lineHeight: 1.1}
  tableStyles:
    grid:
      cellStyle: {fontSize: 11, color: $ink, fill: {type: solid, color: '#FFFFFF'}, border: {width: 0.5, color: '#D0D0D0'}}
      firstRowStyle: {bold: true, fill: {type: solid, color: $ink}, color: '#FFFFFF'}
pages:
  - pages/01.page
```

页面：

```yaml
pageType: content          # 仅作标记：cover / content / closing ...
background: {type: solid, color: '#F8F8F6'}   # 或 {type: image, src: assets/bg.jpg}
notes: 本页讲稿（写入 PPTX 演讲者备注）
elements:
  - elementId: title       # 页内唯一
    elementType: text
    bounds: [48, 96, 864, 60]   # [x, y, 宽, 高]，单位 pt，原点左上
    content:
      text: 一个清晰的结论
      fontFamily: {latin: Arial, ea: Noto Sans CJK SC, mac: PingFang SC, win: Microsoft YaHei}
      fontSize: 32
      color: '#252320'
      bold: true
```

元素按书写顺序叠放，后写的在上层。所有元素必须在页面内（`out-of-page` 会报错）。

## YAML 注意

文字里含 `: `、`#`、`<span style="...">`，或以 `- `、`[`、`{`、`*`、`&` 开头时，整段用单引号括起来（单引号内的 `'` 写成 `''`），或用 `|-` 块标量。YAML 写错时 `check` 返回 `page-invalid` 并给出行号。

## 颜色

`'#RRGGBB'`、带透明度的 `'#RRGGBBAA'`（`00` 为全透明）、`none`，或 `$名称` 引用 `theme.colors`。YAML 中 `#` 开头的值要加引号。

## text

`content` 字段：

| 字段 | 说明 |
|---|---|
| `text` | 必填。可含轻量 HTML：`<br>`、`<b>`/`<strong>`、`<i>`/`<em>`、`<u>`、`<sup>`、`<sub>`、`<span style="color: #hex; font-size: 12px; font-weight: bold">` |
| `style` | `$名称` 引用 `theme.textStyles`，其余字段覆盖它 |
| `fontFamily` | 字符串，或 `{latin, ea, mac, win}`：西文用 `latin`，中文按 `render --platform` 选 `mac` / `win` / `ea` |
| `fontSize` | pt |
| `color`、`bold`、`italic`、`underline` | |
| `lineHeight` | 行高倍数（按字号换算为固定行距），默认 1.2 |
| `letterSpacing` | 字距，pt，可为负 |
| `align` | `left`（默认）/ `center` / `right` / `justify`，也可写 `[水平, 垂直]` |
| `verticalAlign` | `top`（默认）/ `middle` / `bottom` |
| `paragraphSpacing` | 段后距，pt |
| `literalEscapes` | `true` 时允许文本里原样出现 `\n`（代码、路径） |

元素级可加 `rotation`（度）。文本框不自动缩放：放不下时 `check` 报 `text-overflow`，并给出 `textCapacity`。

### 多行文字

```yaml
content:
  text: |-
    水是供应链中
    最被低估的宏观变量
```

YAML 双引号里的 `"第一行\n第二行"` 也是真换行；单引号、普通标量和块标量里的 `\n` 是字面量反斜杠，`check` 报 `text-escaped-newline`。用代码生成 YAML 时让序列化器处理换行。需要原样展示转义字符时：

```yaml
content:
  text: 'print("a\nb")'
  literalEscapes: true
```

## shape

```yaml
- elementId: card
  elementType: shape
  bounds: [48, 200, 260, 120]
  shapeName: roundRect      # rect / roundRect / ellipse / triangle / diamond / hexagon / pentagon / homePlate / chevron / rightArrow / leftArrow / upArrow / downArrow / parallelogram / trapezoid / star5 / donut / arc / plus
  radius: 8                 # 仅 roundRect，pt
  fill: {type: solid, color: $surface}   # 或 {type: none}
  border: {width: 1, color: '#CCCCCC', style: dash}   # width 0 = 无边框；style: dash / dot / dashDot / longDash
  rotation: 0
  content: {text: 卡片内文字, fontSize: 14, color: '#FFFFFF', align: center}   # 可选；默认垂直居中、内边距 6pt
```

## line

```yaml
- elementId: arrow1
  elementType: line
  bounds: [100, 250, 200, 1]
  viewBox: [200, 1]          # points 的坐标系，按 bounds 缩放
  points: 0,0 200,0          # 两点为直线；多点为折线
  border: {width: 1.5, color: '#888888', style: dash}
  arrow: [null, triangle]    # [起点, 终点]：triangle / arrow / stealth / oval / diamond / null
```

## chart（原生可编辑图表）

```yaml
- elementId: revenue
  elementType: chart
  bounds: [80, 160, 480, 280]
  data:
    cols: [year, revenue, cost]
    rows:
      - ['2022', 1.6, 1.1]
      - ['2023', 2.1, 1.3]
  series:
    - {type: bar, name: 收入, encode: {x: year, y: revenue}, fill: {type: solid, color: $accent}, dataLabels: {show: true}}
    - {type: bar, name: 成本, encode: {x: year, y: cost}, fill: {type: solid, color: $muted}}
  stacked: false
  legend: {show: true, position: bottom}     # top / bottom / left / right
  xAxis: {label: {fontSize: 9, color: $muted}, gridLine: false}
  yAxis: {min: 0, max: 3, majorUnit: 1, format: '0.0', label: {fontSize: 9}, gridLine: {color: '#DDDDDD', style: dot}, line: false}
  fill: {type: solid, color: '#FFFFFF00'}   # 图表背景；透明写 00
  fontFamily: {latin: Arial, mac: PingFang SC, win: Microsoft YaHei, ea: Noto Sans CJK SC}
  plotLayout: {x: 0.08, y: 0.05, w: 0.88, h: 0.8}   # 可选，绘图区占图表框的比例
```

- `series[].type`：`bar`、`line`、`area`、`pie`、`scatter`。一张图只用一种类型（组合图会按第一个系列类型渲染并给出警告）。
- `bar`：`encode.x` 是数值列、`encode.y` 是分类列时画**横向条形图**（按数据顺序从上到下），反之为柱形图。横向图 `xAxis` 是数值轴、`yAxis` 是分类轴，纵向图相反。
- `line`：`lineColor`、`width`、`smooth`、`marker: {shape: circle|square|diamond|triangle, size, fill, lineColor}`。
- `pie`：`encode: {category, value}`；`fill` 为颜色数组（按行顺序）；`innerRadius: 0.6` 变为环形图。
- `bar` 可用 `pointColors: [$accent, ...]` 单独给某根柱上色以强调。
- `dataLabels: {show, fontSize, color, format}`；轴 `hidden: true` 可隐藏，`label.position`：none / low / high / nextTo。
- 数值写成数字，不要写成带单位的字符串；单位放在标题或注释里。

## table

```yaml
- elementId: compare
  elementType: table
  bounds: [80, 168, 800, 240]
  style: $grid                    # theme.tableStyles；cellStyle / firstRowStyle / firstColStyle
  columnWidths: [0.25, 0.25, 0.25, 0.25]   # 比例（或 pt）
  rowHeights: [0.2, 0.2, 0.2, 0.2, 0.2]
  rows:
    - [{text: 维度}, {text: 方案 A}, {text: 方案 B}, {text: 方案 C}]
    - [{text: 成本}, {text: 低}, {text: 中, fill: {type: solid, color: '#FFF3C4'}, bold: true}, {text: 高}]
```

- 单元格可以是字符串或对象；对象可覆盖 `fontSize`、`color`、`bold`、`fill`、`align`（默认居中）、`verticalAlign`（默认居中）、`border: {width, color}`，以及 `colspan` / `rowspan`。
- 每行单元格数量必须相同（合并时被覆盖的位置写空字符串）。
- PowerPoint 会把放不下的行自动撑高，`check` 用 `table-cell-overflow` 提醒。

## image

```yaml
- elementId: photo
  elementType: image
  bounds: [500, 120, 400, 300]
  src: assets/photo.jpg      # 相对工程目录；png / jpg / gif / bmp / tif
  fit: cover                 # cover（默认，裁切填满）/ contain（完整显示）/ stretch
```

## 命令速查

| 命令 | 作用 |
|---|---|
| `templates [--json]` | 列出模板 |
| `show <id> [--lang zh] [--page N]` | 模板概览 / 某页完整源码 |
| `new <id> <dir> [--lang zh] [--pages 1,3,12] [--title T]` | 从模板建工程 |
| `inspect <dir> [--page N] [--all]` | 元素清单、字号和文本容量 |
| `check <dir>` | 只读检查，JSON：`status` ok / needs_revision，`errors`、`warnings` |
| `render <dir> -o out.pptx [--platform win\|mac\|linux] [--overwrite]` | 检查并导出；有 errors 时退出码 2 且不出文件 |

`check` 的版面估算按字符宽度近似计算，不等同 PowerPoint/WPS 的实际排版；能做视觉检查时以渲染图为准。
