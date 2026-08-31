# Archive Exchange 设计说明

版本：v0.5.0  
阶段：Archive Exchange / 档案交换站  
日期：2026-08-31

## 目标与边界

第五阶段建立一个以GitHub仓库、Actions和Pages为发布设施的静态案件社区。作者在档案工坊准备投稿，维护者通过Pull Request完成自动与人工审核，玩家在主应用中浏览、下载、复验、安装、更新、回滚和离线游玩。系统不引入账号、后端、数据库服务、遥测、公开评分、下载统计或任意社区源。

## 双仓库职责

- `lost-desktop-museum`：播放器、档案工坊、固定registry客户端、IndexedDB缓存、验证安装、更新兼容性、回滚、本地偏好和投稿包生成。
- `lost-desktop-museum-community`：publisher与案件源目录、Schema、包与内容安全校验、确定性registry构建、静态站、GitHub PR审核和Pages发布。

社区维护者只编辑`catalog/`。`dist/`由Actions生成且不提交。正式案件运行时不再访问网络，只读取安装到IndexedDB的Definition和本地Blob。

## Registry与路径模型

`registry/v1/index.json`只提供紧凑摘要；完整版本历史、许可证、变更记录、截图和包元数据位于`cases/<caseId>.json`；publisher资料位于`publishers/<publisherId>.json`。所有包和截图路径都是registry根下的安全相对路径。

主应用只接受构建时配置的`VITE_COMMUNITY_REGISTRY_URL`。URL解析器锁定协议、origin和`registry/v1/`对应的站点根，不接受查询参数、设置输入、跨域重定向、绝对路径、反斜杠、`..`、`data:`、`blob:`或`javascript:`。

## 安装记录与存储

安装记录由客户端生成，不信任案件自报来源：

```ts
interface InstalledCaseSource {
  sourceType: 'built-in' | 'local-import' | 'community'
  registryCaseId?: string
  publisherId?: string
  installedVersion?: string
  packageSha256?: string
  registryVersion?: string
  installedAt?: string
  updatedAt?: string
}
```

社区记录同时保存当前包Blob、来源、同步版本和最多两个回滚版本。案件、资源、缓存、偏好、更新历史分开存储；Blob不进入Zustand，大索引不进入localStorage。

## 下载、验证与事务安装

详情页仅加载JSON和登记截图。完整包只在用户确认后下载，AbortController支持取消；有Content-Length时显示真实字节进度，否则显示不确定进度。下载完成后在Worker计算SHA-256，再调用现有`importCasePackage`执行ZIP、签名、Schema、引用、可达性、远程内容和执行内容检查。

验证通过后展示资源、文件、线索、应用和解压大小，用户第二次确认才写入。写入前捕获旧案件、资源和进度快照；任一步失败都删除新数据并恢复快照。内置ID永远拒绝覆盖，本地同ID需要显式删除或安装为不自动更新的副本。

## 更新与回滚

更新检查基于语义化版本与缓存目录，不在每次启动请求网络。兼容性分析以实际GameSave引用为准：已发现线索、打开/解锁/恢复内容、证据关系、推理问题、窗口应用和触发事件都必须在新版本存在。结果为`compatible`、`review-required`或`incompatible`，后两种都需要显式选择并允许先导出进度。

更新先复用完整安装安全链，再保存旧包和进度、安装、运行启动检查。失败自动恢复；成功保留最多两个旧包。blocked版本不能新装或更新，也不会远程删除已有副本；deprecated版本继续可见并给出维护停止提示。

## 缓存与离线

进入社区时先读取IndexedDB缓存，再在超过6小时或手动刷新时同步。网络失败使用缓存；缓存损坏备份原值后重新同步。没有缓存且离线时只显示局部空状态。我的档案、内置案件、已安装社区案件、本地导入案件、工程、偏好和进度均保持可用。不引入Service Worker。

## 社区浏览体验

档案馆导航升级为“我的档案、社区档案、档案工坊、设置”。社区使用高密度档案目录而非商城卡片，支持本地搜索、语言/难度/时长/标签/评级/精选/安装/更新筛选和非热度排序。默认展示general与teen，mature需要主动开启。

详情深链接为`#/community/cases/<caseId>`，不会自动下载或安装。页面显示内容提示、引擎范围、版本历史、SHA-256、自动校验、人工精选或未人工审阅、许可证、私人收藏/评分/备注和经过域名确认的GitHub报告入口。

## 作者投稿

成功导出`.ldmcase`后，发布界面可进入“准备社区投稿”。投稿工具收集本地publisher资料、社区元数据、许可证、更新说明和1—5张本地截图，再生成只含publisher、entry、案件包、CHANGELOG、截图、checksums和SUBMISSION说明的ZIP。它不包含工程UI状态、玩家存档、私人数据、本机路径或令牌，也不自动上传、Fork或创建PR。

`community:prepare` CLI复用同一核心逻辑，支持`--dry-run`，只读取输入并写指定输出目录。

## 社区仓库审核与发布

PR工作流检查publisher、entry、semver、目录、截图签名、包大小、ZIP安全、CaseDefinition、引用、可达性、内容占位符和确定性构建，并在Step Summary输出案件、版本、字段路径、错误代码、原因和修复提示。主分支工作流重新完整校验并部署Pages；每周完整性任务只报告失败，不自动改仓库。

静态站以Node模板生成无脚本HTML，使用本地CSS，无Cookie、分析、远程字体或第三方资源。页面包括首页、案件详情、publisher、投稿说明、信任模型和内容准则。

## 信任、内容和隐私

“自动校验通过”不是绝对安全保证；“人工精选”只表示维护者检查过内容和基本体验；身份不声称实名认证。社区内容始终作为不可信纯文本处理，不渲染原始HTML。

社区只发送普通静态GET请求，不上传存档、推理、线索、游玩时间、收藏、评分、备注、工程、本地案件、设备标识或指纹。私人评分没有平均分、人数或排行。

## 测试与发布门

主项目以本地fixture或Playwright路由覆盖索引、缓存、搜索、安装、失败重试、哈希错误、离线、更新、兼容性、回滚、卸载、投稿和第四阶段回归；CI不访问真实社区。社区仓库覆盖36项目录与构建边界。两个本地质量门通过后先发布社区Pages，再配置主项目真实URL；最终线上烟雾测试必须验证真实索引、包下载、SHA-256、安装、保存返回、离线和内置案件。
