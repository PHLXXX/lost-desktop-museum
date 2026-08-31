# 社区架构

主仓库负责浏览器客户端、档案工坊、包复验、IndexedDB 安装、运行、更新与回滚；`lost-desktop-museum-community` 负责 `catalog/` 源数据、PR 审核、确定性构建、静态 Registry 和 Pages。两者没有数据库、账号或 API 服务器。

社区模块由 `AppShell` 动态导入。`CommunityRegistryClient` 只访问 `VITE_COMMUNITY_REGISTRY_URL`，URL resolver 将详情、发布者、截图和包限定在同一 origin 与站点根前缀。索引和详情存入独立 IndexedDB；包 Blob、来源记录、偏好分别使用独立数据库，避免大型数据进入 Zustand 或 localStorage。

安装数据流：用户确认 → 支持 AbortController 的下载 → Worker SHA-256 → 复用 `importCasePackage` → 身份一致性检查 → 用户二次确认 → 案件/资源/来源写入 → 注册运行时。任何写入失败都会清理新数据并恢复旧案件、资源和来源记录。
