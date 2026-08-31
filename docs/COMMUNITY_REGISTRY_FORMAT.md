# Community Registry v1

`registry/v1/index.json` 保存精简列表摘要、registry 版本、生成时间、source commit、兼容性与统计；`registry/v1/cases/<caseId>.json` 保存版本历史、包相对路径、SHA-256、大小、引擎范围、存档兼容声明、CHANGELOG、截图、许可证与审核状态；发布者位于 `registry/v1/publishers/`。

完整 CaseDefinition 不进入索引，只存在 `.ldmcase`。所有路径必须是 Registry 站点根下的安全相对路径，不允许绝对 URL、协议、反斜杠、空段或 `..`。客户端不信任 registry 文字或来源字段，React 只作文本渲染，不使用原始 HTML。
