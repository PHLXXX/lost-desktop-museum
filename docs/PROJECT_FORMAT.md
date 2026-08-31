# 工程包、案件包与存档包

三种格式用途不同，不能互相替代。

| 格式 | 内容 | 可直接游玩 | 主要用途 |
| --- | --- | --- | --- |
| `.ldmproject` | `AuthoringProject`、`CaseDraft`、编辑器设置与本地资源 | 否 | 创作备份、迁移、继续编辑 |
| `.ldmcase` | 严格 `CaseDefinition`、manifest、checksums、实际引用资源 | 是 | 安装与分享正式案件 |
| `.ldmsave` | 案件 ID/版本和玩家 `GameSave` | 否 | 导出或恢复调查进度 |

旧拼写 `.lmdcase` 只兼容导入并显示警告；再次导出统一使用 `.ldmcase`。

## ZIP 结构

`.ldmproject` 使用 `manifest.json`、`project.json`、`draft.json`、`checksums.json` 和 `assets/`。`.ldmcase` 使用 `manifest.json`、`case.json`、`checksums.json` 和 `assets/`。文件顺序和 ZIP 时间固定，便于复现构建。

`.ldmsave` 是 UTF-8 JSON 信封，不携带案件内容、资源、工程 UI 或调试状态。

## 安全边界

- 最多 512 个条目、单条目 20MB、解压总量 60MB、压缩比最多 100。
- 拒绝绝对路径、盘符、反斜杠、`.`/`..`、重复 Unicode 路径、加密条目和符号链接。
- 只允许固定 JSON 文件和 `assets/` 白名单扩展名。
- 第三方案件拒绝 SVG、远程 URL、脚本/嵌入和未知应用组件。
- 每个打包文件有 SHA-256；资源还需与 `CaseDefinition` 声明的大小和哈希一致。
- 导出后执行内存 round-trip，只有重新导入成功才提供下载。

同 `projectId` 的工程导入不会静默覆盖：用户可取消、安装为副本或替换；替换前保留快照并清理旧资源。
