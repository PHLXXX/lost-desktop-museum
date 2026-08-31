# Archive Workshop 设计规范

日期：2026-08-31  
目标版本：v0.4.0

## 设计决策

评估了三种实现路径：

1. **渐进式编译层（采用）**：保留现有桌面和应用，在严格运行时模型上增加注册表、CaseDraft、编译器、IndexedDB与工坊。迁移量可控，运行时与编辑器共用验证。
2. **完全重写案件引擎**：模型最整洁，但会高风险破坏档案001、窗口和推理回归，拒绝。
3. **编辑器维护独立简化播放器**：短期快，但会产生两套行为、两套校验和不可复现的试玩，拒绝。

用户提供的52节需求已明确产品、数据、安全、测试与发布边界，并要求审计后直接实施，因此本规范按已批准方向执行，不增加新的范围询问。

## 总体架构

```text
Museum
  ├─ CaseRegistry ── Built-in 001 / Built-in 002 / Installed cases
  └─ lazy(ArchiveWorkshop)
         ├─ AuthoringProject + CaseDraft
         ├─ EditorStore + History + Snapshots + Lock
         ├─ Editors + AppEditorRegistry
         ├─ normalize → compile → shared validate
         ├─ PreviewSession → shared runtime engine + preview namespace
         └─ ProjectPackage / CasePackage → secure ZIP → round trip
```

普通档案馆和案件运行入口不静态导入编辑器。`AppShell` 只加载轻量工坊边界；进入工坊后才加载工程界面，ZIP和重型编辑模块进一步动态导入。

## 第三阶段前置修复

- 建立严格的 `CaseDefinition`、`CaseManifest`、`CaseSubject`、实体、桌面、应用、资源、条件、触发器和数据驱动推理模型。
- 把档案001迁移到新模型，并新增独立档案002与案件注册表。
- 将固定存档改为 per-case namespace，保留 v0.2.1 旧键迁移。
- 建立 `GameEvent`、条件求值、白名单效果与跨案件共享验证器。
- 增加 `.ldmcase` 安全导入、导出、安装、卸载及 IndexedDB资源存储。

## 数据模型

`CaseDraft` 与 `CaseDefinition` 永不互为类型断言。草稿数组可以为空，正式模型由 Zod 严格解析。编译结果为判别联合：

```ts
type CompileCaseResult =
  | { ok: true; caseDefinition: CaseDefinition; warnings: ValidationIssue[] }
  | { ok: false; issues: ValidationIssue[] }
```

`normalizeCaseDraft` 只补安全默认值和稳定排序，不修改输入。`compileCaseDraft` 先规范化，再构造候选正式模型并调用共享 Schema 与语义验证。`decompileCaseDefinition` 生成深拷贝草稿。

稳定ID只允许 `^[a-z0-9]+(?:-[a-z0-9]+)*$`。标题修改不改变ID。重命名通过引用解析器生成单次原子补丁；删除被引用实体默认阻止，并列出影响位置。

## 条件与触发器

条件节点为 `event`、`all`、`any`、`clue`、`clue-count`、`relation`、`trigger`。最大深度5、最大节点30。运行时求值器与编辑器使用同一个联合类型和语义。

触发器只接受白名单效果联合类型。Schema无法表示 JavaScript、网络、HTML、CSS注入、Shell、外部URL或任意存储写入。安全模式与 reduced-motion 替代字段是正式模型的一部分。

## 工程存储与历史

`AuthoringProject`、草稿和 UI 状态写入 IndexedDB；Blob 资源单独保存。编辑变更在800ms后自动保存。内存草稿只有在仓库确认成功后标记 saved；失败保持 dirty/error 并允许导出 `.ldmproject`。

历史最多80步，连续同字段输入在600ms窗口内合并。导航与自动保存不进入历史。工程可保留最多20个恢复快照；替换导入和快照恢复前会自动创建保护快照。

工程锁使用带15秒过期时间的 localStorage 心跳，并在 sessionStorage 中保留当前标签身份。第二标签默认只读；接管必须二次确认；过期锁自动恢复。

## 编辑器界面

工坊首页是档案终端式工程列表，不使用SaaS卡片墙。编辑器采用固定顶部工具栏、模块导航、中央工作区、右侧检查器和底部状态栏。

模块分为：概览/基本信息、实体、时间线、桌面、应用内容、线索与条件、触发器、推理、资源、校验。每个模块都有真实新增、编辑、删除或预览行为；不出现空白占位模块。1280×720保持三栏压缩布局，低于1024px切换单面板并保留表单、保存、校验和导出。

所有输入具有关联label和路径化错误。树、列表、条件节点和桌面坐标提供键盘替代。弹窗管理焦点，状态不只依靠颜色。

## 资源与包

正式用户资源允许 PNG、JPEG、WebP、WAV、OGG、TXT、Markdown；第三方案件禁止SVG。导入检查扩展名、MIME、文件签名、单文件和总大小、SHA-256与重复项。Object URL仅用于临时预览。

- `.ldmproject`：含草稿、UI状态、设置、资源和可选快照，不能直接游玩。
- `.ldmcase`：只含严格CaseDefinition、manifest、checksums和实际引用资源。
- `.ldmsave`：只含玩家案件进度，不含案件内容或编辑数据。
- `.lmdcase`：仅作为旧扩展名兼容导入，显示警告，绝不作为导出扩展名。

打包使用稳定文件顺序；生成后立即在内存重新解包、校验校验和、Schema、引用、可达性和安全规则，通过后才下载。

## 试玩隔离

完整试玩生成不可变编译快照并创建 `PreviewSession`。临时定义以内存 `preview-<projectId>` ID 注册，并使用该 ID 的独立玩家存档；进入前的正式玩家状态与窗口状态会被深拷贝。退出时取消待写入、删除临时存档、注销定义并恢复快照，调试解锁永不写入工程或案件包。

## 错误恢复

IndexedDB失败、损坏工程、版本不兼容、资源丢失、Worker失败或编译失败都进入可恢复状态，不白屏、不静默删除。恢复界面提供原始工程导出、快照、重试与返回列表。

## 测试与发布

纯函数核心用Vitest覆盖草稿、编译、引用、条件、安全、历史、锁、资源、包和试玩隔离。Testing Library覆盖工坊入口、全局搜索和关键状态。Playwright覆盖工程创建/保存/快照/发布、空白工程校验、试玩安装、响应式、全局搜索和多标签只读，并继续运行原有玩家回归。

CI依次执行类型、Lint、全部测试、案件校验、编辑器模板校验、模板打包往返、安全测试、构建和Chromium E2E。只有PR与main CI通过、Pages线上验证完成后创建v0.4.0和两个经验证Release Assets。
