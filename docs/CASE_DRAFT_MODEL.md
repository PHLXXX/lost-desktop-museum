# CaseDraft 模型

`CaseDraft` 是作者编辑状态，允许字段暂时为空；`CaseDefinition` 是可游玩的严格运行时合同。两者不能通过类型断言互换。

## 草稿分区

- `manifest`、`subject`：案件元数据与电脑主人。
- `entities`、`timeline`：人物/地点/设备等实体和时间线。
- `desktop`、`applications`：ARCHIVE/OS 外观、应用类型和图标位置。
- `folders`、`files`、`chats`、`emails`、`browserHistory`、`calendarEvents`、`photos`、`systemLogs`：基础应用内容。
- `audioTracks`、`broadcastEvents`、`dataTables`、`terminalEntries`、`versionDiffs`、`sitemap`：扩展应用内容。
- `clues`、`triggers`、`deduction`：发现条件、剧情效果与最终评分。
- `assets`：本地资源的 ID、路径、MIME、大小、哈希和替代文本引用，不含 Blob。

## 稳定 ID

正式 ID 使用小写字母、数字和连字符。标题或显示名称改变时 ID 不自动变化。执行 ID 重命名时，引用解析器会原子更新关联字段；删除仍被引用的记录时默认阻止，并返回引用路径。

## 编译过程

```text
CaseDraft
  → normalizeCaseDraft（深拷贝、默认值、稳定排序）
  → compileCaseDraft（必填、资源与推理前置检查）
  → caseDefinitionSchema（严格结构）
  → validateCaseDefinition（引用、可达性、安全、运行时能力）
  → CaseDefinition 或 ValidationIssue[]
```

编译不修改输入草稿。成功结果包含正式定义和警告；失败结果只包含结构化问题，不生成“尽量可玩”的部分案件。

内置案件可以通过 `decompileCaseDefinition` 复制为草稿，复制时会去掉 `builtIn` 身份并使用新的案件 ID，防止覆盖馆藏。
