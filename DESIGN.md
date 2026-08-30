---
name: "遗失电脑博物馆：最后一次登录"
description: "一套用可信桌面工具承载悬疑档案调查的功能型操作系统。"
colors:
  archive-amber: "#d6ad54"
  live-cyan: "#65c2bd"
  ink-primary: "#f1f0ea"
  ink-muted: "#9ca5a8"
  night-ground: "#05090d"
  work-surface: "#0e1820"
  raised-surface: "#14222b"
  divider: "#3a4d56"
  paper: "#d7d2c5"
  danger: "#c96e70"
typography:
  display:
    fontFamily: "Microsoft YaHei UI, PingFang SC, Noto Sans CJK SC, sans-serif"
    fontSize: "clamp(36px, 4vw, 58px)"
    fontWeight: 500
    lineHeight: 1.18
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Microsoft YaHei UI, PingFang SC, Noto Sans CJK SC, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.7
  data:
    fontFamily: "Consolas, Cascadia Mono, Courier New, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "2px"
  md: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.archive-amber}"
    textColor: "{colors.night-ground}"
    rounded: "{rounded.sm}"
    padding: "7px 14px"
    height: "34px"
  input:
    backgroundColor: "{colors.raised-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
    height: "28px"
---

# Design System: 遗失电脑博物馆

## Overview

**Creative North Star: "封存中的工作站"**

界面应像一台被博物馆恢复、仍可真正操作的档案工作站。可信工具结构占主导：目录树、数据表、工具栏、详情检查器和状态栏先解释信息与状态；琥珀编号、异常时钟和轻微扫描线只在边缘提醒玩家这是一份不完全可靠的快照。

密度来自真实字段与可操作区域，不来自装饰。界面不模仿任何现实操作系统品牌，但保留桌面软件的通用心智模型。

**Key Characteristics:**

- 不透明的墨蓝工作面与 1px 分隔线
- 琥珀标记档案、关键证据和警告，青色标记在线、已记录与成功
- 中文界面字体承担操作，等宽字体只承担时间、编号、路径和日志
- 不同应用拥有不同的信息架构，但共享紧凑系统 chrome

## Colors

主色是低饱和档案琥珀，配合深墨蓝中性色阶；颜色出现得少，状态意义必须稳定。

### Primary

- **Archive Amber**：用于展品编号、主动作、关键证据和警告状态。
- **Live Cyan**：用于在线点、记录进度、成功存档和活跃系统数据。

### Neutral

- **Night Ground**：浏览器画布和最深系统层。
- **Work Surface / Raised Surface**：窗口、工具栏和选中行的层级。
- **Ink Primary / Ink Muted**：正文与次要字段。
- **Paper**：邮件阅读器中唯一的浅色文档材料。

**The Sparse Signal Rule.** 琥珀和青色不能用于大面积装饰；同一控件的状态不得只依赖色相。

## Typography

**Display Font:** 本地中文 UI 字体栈  
**Body Font:** 同一 UI 字体栈  
**Label/Mono Font:** Consolas / Cascadia Mono 本地等宽栈

标题通过字号、字重和负字距建立层级；系统数据保持小号、等宽和高辨识度。正文最大行长约 70 个中文字符，长档案内容使用 1.7—1.9 行高。

**The Data Has a Shape Rule.** 只有编号、日期、时间、路径、域名、状态码和日志字段使用等宽字体；普通叙事正文不穿技术制服。

## Layout

博物馆页面使用最大 1344px 容器和 48px 外边距。调查桌面由 34px 状态条、52px 案件条、中央工作区和 48px 任务栏组成。应用窗口内部采用 38px 工具栏、可伸缩内容区和 26px 状态栏。

应用根据任务使用树/表/预览、联系人/时间线/详情或列表/画布/检查器，不强求同列宽。低于 1024px 时明确提示限制，新窗口默认最大化，次要详情栏可折叠；低于 700px 时馆藏与结果改为单列。

## Elevation & Depth

大部分层级通过色阶和边框表达。只有活动窗口、菜单、toast 和模态使用软阴影；非活动窗口降低亮度和饱和度。没有装饰性玻璃模糊或彩色发光。

**The Flat Until Active Rule.** 静止内容不悬浮；阴影只表示可移动窗口或临时覆盖层。

## Shapes

机器外壳使用 2—4px 小圆角，表格、树、工具栏和正文分区保持直角。边框固定为 1px；A 标识、档案编号槽和 SVG 图标使用统一方形几何。

## Components

### Buttons

- 主按钮为琥珀实底、深色文字、2px 圆角和 34px 高度。
- 次按钮使用深色表面与 1px 分隔线；hover 只提高边框与表面对比度。
- 危险按钮使用暗红底和明确动词，并始终位于二次确认中。

### Chips

状态 chip 是 22px 高的档案标签：暗琥珀底、琥珀文字、1px 边框；它只表示状态，不作为装饰标题。

### Cards / Containers

普通页面不使用同尺寸卡片网格。案件展品、证据卡和模态是有明确语义的容器；证据卡依靠编号、来源与关键状态区分。

### Inputs / Fields

字段使用深色不透明底、1px 分隔线和 2px 圆角。键盘焦点统一为 2px 青色轮廓；错误文本必须说明问题和恢复方向。

### Navigation

馆藏导航使用底边活动标记；桌面任务栏同时显示运行应用、活动态和最小化态；应用内导航使用选中表面或 2px 内嵌琥珀线。

### Archive Window

标题栏 36px，包含本地 SVG 状态标记和三项窗口控制。活动窗口边框更清晰并获得软阴影；标题栏可拖动、双击最大化，八个边角可缩放。

## Do's and Don'ts

### Do:

- **Do** 让每个应用首先像对应的工具，再让案件内容进入工具。
- **Do** 把保存、进度、选中、错误和空状态放在玩家能立即找到的位置。
- **Do** 使用本地线性 SVG 图标与真实字段名。

### Don't:

- **Don't** 使用 emoji、Unicode 符号或现实产品商标代替图标系统。
- **Don't** 用霓虹、玻璃、无意义渐变或装饰网格制造“科技感”。
- **Don't** 把普通内容拆成一组同尺寸圆角卡片，也不要在主标题上方增加装饰性 eyebrow。
