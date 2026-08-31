# 档案工坊架构

## 边界

档案馆通过 `React.lazy` 加载 `WorkshopEntry`。玩家只调查内置或已安装案件时，不会预加载编辑器界面、ZIP 打包器和资源管理器。

```text
AppShell
├─ Museum + CaseRegistry + Runtime
└─ lazy WorkshopEntry
   ├─ EditorStore / HistoryStore
   ├─ ProjectRepository / SnapshotRepository
   ├─ Editor modules / AppEditorRegistry
   ├─ CaseDraft → normalize → compile → validate
   ├─ PreviewSession → shared Desktop runtime
   └─ ProjectPackage / CasePackage
```

## 模块职责

- `src/editor/model/`：可不完整的 `CaseDraft`、工程信封和迁移。
- `src/editor/compiler/`：规范化、编译、反编译、依赖分析、稳定 ID 重命名和引用删除策略。
- `src/editor/store/`：当前工程、历史、保存状态、校验结果和模块导航。
- `src/editor/storage/`：IndexedDB 工程/资源/快照、800ms 自动保存、多标签心跳锁和 Worker 哈希。
- `src/editor/features/`：三栏编辑器及每个领域编辑模块。
- `src/editor/registry/`：`componentKey` 到编辑器的注册表；运行时使用独立的 `src/app/appComponentRegistry.tsx`。
- `src/preview/`：共享真实桌面的隔离试玩会话与调试面板。
- `src/packages/`：`.ldmproject`、`.ldmcase`、`.ldmsave` 和 ZIP 安全检查。

## 状态与存储

`AuthoringProject` 只保存 JSON 可序列化数据。Blob 以 `projectId:assetId` 为键单独存入 IndexedDB，Object URL 只在预览期间创建并及时撤销。Zustand 中不保存 Base64、Blob 或完整 ZIP。

编辑操作先生成结构化深拷贝，记录历史并增加 revision，再排队自动保存。导航变更不污染撤销语义。工程删除同时清理所属资源和快照。

## 运行时解耦

案件逻辑只认 `CaseDefinition`、事件、条件与白名单效果。组件发出调查事件，线索与触发器引擎求值；编辑器不在 React 组件中硬编码案件 ID。未知 `componentKey` 在校验时阻止发布，运行时仍有可理解的“不支持应用”回退界面。
