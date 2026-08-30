# 案件数据格式

新案件应位于 `src/cases/<case-id>/`，通过 `CaseDefinition` 描述内容，不修改窗口管理器、线索引擎或存档内核。

## 必填域

- `id`、`title`、`owner`
- 已按 ISO 风格本地时间排序的 `timeline`
- `folders`、`files`、`chats`、`emails`、`browser`、`calendar`、`photos`、`logs`
- `clues`、`triggers`、三个或更多 `questions`
- `coreEvidenceIds`、`correctContradictions`、`ending`

每个内容条目使用案件内唯一的稳定 ID。正式资源放在 `src/assets` 并通过模块导入；不得使用远程 URL。

## 发现动作

线索必须绑定一个明确玩家动作：

- `OPEN_ITEM`：打开具体邮件、消息、历史或日历事件
- `VIEW_METADATA`：主动展开照片元数据
- `COMPARE_ITEMS`：检查需要比较的文件版本
- `VIEW_TRANSCRIPT`：主动打开辅助转写
- `UNLOCK_ITEM`：完成模拟密码解锁
- `VIEW_LOG`：查看具体日志详情

仅打开应用不能自动获得其全部线索。`discoverClues` 必须能从动作稳定得到线索，重复动作不能重复发现。

## 触发器

一次性事件使用稳定 `id`，条件可依据线索数量或首次打开项目。触发后 ID 写入 `triggeredEventIds`，刷新与重复操作不得再次执行。

## 验证清单

1. `caseDefinitionSchema.parse(caseDefinition)` 成功。
2. 时间线按时间升序。
3. 线索 ID 唯一且连续。
4. 每条线索有合法来源、发现动作、人物、时间和地点。
5. 每条线索可由正常 UI 操作到达。
6. 所有答案、核心证据和正确矛盾关系引用有效 ID。
7. 所有正式资源本地化。
8. 新案件拥有完整玩家旅程测试。

