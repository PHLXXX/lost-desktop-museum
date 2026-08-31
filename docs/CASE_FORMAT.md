# 案件数据格式

v0.4.0 使用严格 `CaseDefinition` 作为所有内置和已安装案件的运行时合同。内置案件位于 `src/cases/`；用户案件由档案工坊编译并以 `.ldmcase` 安装，不需要修改 React 组件。

## 顶层结构

- `formatVersion`、`id`、`title`、`owner`。
- `manifest`、`subject`、`entities`、`timeline`。
- `desktop`、`applications`、`assets`。
- 文件、聊天、邮件、浏览记录、日历、照片和系统日志。
- 音频、广播、数据表、模拟终端、版本差异和站点地图。
- `clues`、`triggers`、`questions`、`resultLevels`、核心证据、正确关系和结局。

每个内容条目使用案件内稳定 ID。组件通过 `componentKey` 注册表加载；未知组件会阻止第三方案件发布，而不是运行任意代码。

## 发现事件与条件

事件包括打开条目、查看元数据、比较条目、查看转写、解锁、查看日志、邮件头、恢复文件、运行模拟命令、查看音频标记、地图位置、版本差异和建立证据关系。仅打开应用不会自动获得全部线索。

条件支持 `event`、`all`、`any`、`clue`、`clue-count`、`relation` 和 `trigger`，最多 5 层、30 节点，并禁止循环线索依赖。

## 资源

正式用户资源只能使用 PNG、JPEG、WebP、WAV、OGG、TXT 与 Markdown，并通过 `assetId` 或正式资源路径引用。包内资源必须与声明的大小和 SHA-256 一致，不允许远程 URL；第三方案件禁止 SVG。内置案件可以继续使用经过仓库审查的本地 SVG。

## 验证清单

1. `caseDefinitionSchema.parse` 成功，ID 唯一且引用有效。
2. `manifest.caseId` 与顶层 ID 一致，用户案件不覆盖内置 ID。
3. 每条线索可由已启用应用中的真实动作到达。
4. 条件目标、前置线索和触发器存在且无循环。
5. 推理题总分 100，结果等级无重叠、无缺口覆盖 0—100。
6. 核心证据、正确关系和答案引用现有 ID。
7. 触发器只使用白名单效果，并提供必要的安全模式/减弱动画替代。
8. 所有资源本地化、类型允许、哈希匹配。
9. `.ldmcase` 导出后可以重新导入并开始真实调查。

编辑器草稿和编译细节见 [CASE_DRAFT_MODEL.md](CASE_DRAFT_MODEL.md)，包格式见 [PROJECT_FORMAT.md](PROJECT_FORMAT.md)。

