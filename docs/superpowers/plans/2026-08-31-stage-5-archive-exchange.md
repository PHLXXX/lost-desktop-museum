# Archive Exchange Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver v0.5.0 with a fixed-origin static case community, verified installation/update/rollback, offline catalog, local preferences, author submission bundles, and a separately deployed registry repository.

**Architecture:** The community repository turns reviewed `catalog/` sources into deterministic JSON, packages, screenshots, and script-free HTML. The main app lazy-loads a fixed registry client, caches untrusted data in IndexedDB, reuses the existing `.ldmcase` validator, and coordinates installs and updates through explicit rollback snapshots.

**Tech Stack:** React 19, TypeScript 6, Zustand, Zod, IndexedDB, fflate, Web Crypto/Workers, Vitest, Testing Library, Playwright, Node 24, GitHub Actions and GitHub Pages.

## 执行记录（2026-08-31）

- 主项目已完成固定源registry客户端、IndexedDB离线缓存、目录/详情/搜索筛选、双确认安装、Worker SHA-256、完整包复验、兼容性分析、两份回滚包、进度快照恢复、卸载选项、本地收藏/评分/备注和投稿ZIP/CLI。
- 社区仓库已独立创建并上线；catalog、publisher、entry、包、截图、路径、符号链接、未登记文件、完整checksums、资源签名、可达性与确定性输出均由CI校验，静态Pages与registry v1已部署。
- 状态管理按实际规模保留在懒加载的`CommunityEntry`中，没有创建空壳Zustand store；包Blob和registry仍分别保存在IndexedDB仓储中。
- publisher与案件详情均缓存；生产构建不复制测试fixture，只有Vite开发服务器暴露本地fixture中间件。
- “启动检查”在实际实现中由严格包导入、Definition注册和资源写入验证承担，没有模拟额外加载过程。
- 同ID本地导入案件当前采取安全拒绝并提示先移除；没有自动重写第三方案件内部ID生成副本。

## Global Constraints

- No account, OAuth, backend server, cloud database, analytics, telemetry, public rating, download count or arbitrary registry URL.
- Complete packages download only after explicit confirmation and install only after a second confirmation.
- Community cases execute no JavaScript, HTML, WebAssembly, shell, SVG, remote media, remote font or custom React component.
- Main app production does not bundle the sample community case; tests use local deterministic fixtures.
- Catalog strings are untrusted text and never use `dangerouslySetInnerHTML`.
- Blob data stays outside Zustand/localStorage; registry JSON and preferences use IndexedDB.
- Every behavior task follows red-green-refactor and ends with focused tests and a small commit.

---

### Task 1: Freeze Stage 5 contracts and audit

**Files:**
- Create: `docs/audits/stage-5-community-architecture-audit.md`
- Create: `docs/superpowers/specs/2026-08-31-stage-5-archive-exchange-design.md`
- Create: `docs/superpowers/plans/2026-08-31-stage-5-archive-exchange.md`

**Interfaces:** Produces the fixed registry trust boundary, installation state machine and dual-repository release order used by all later tasks.

- [ ] Verify v0.4.0 with `npm ci`, `npm run validate:cases`, `npm run validate:editor-examples`, `npm run check`, and `npm run e2e`.
- [ ] Record the reusable package, registry, storage and preview modules and every required migration.
- [ ] Commit with `docs: audit static community architecture`.

### Task 2: Build deterministic community fixtures and submission core

**Files:**
- Create: `src/community/schema/registrySchema.ts`
- Create: `src/community/types/communityTypes.ts`
- Create: `src/editor/features/community-publishing/SubmissionBundleBuilder.ts`
- Create: `scripts/generate-community-fixtures.ts`
- Create: `scripts/community-prepare.ts`
- Create: `tests/fixtures/community/**`
- Test: `src/community/schema/registrySchema.test.ts`
- Test: `src/editor/features/community-publishing/SubmissionBundleBuilder.test.ts`

**Interfaces:** Produces strict publisher/index/detail types, `buildSubmissionBundle(input)`, and deterministic 1.0.0/1.1.0/2.0.0 fixture packages consumed by both repositories.

- [ ] Write failing tests for strict index parsing, registry-version rejection, package/entry consistency, no editor/save data in submission ZIP, and dry-run filesystem behavior.
- [ ] Run `npm run test:community` and confirm failures identify missing parsers/builders.
- [ ] Implement the schemas, canonical JSON/checksum builder and fixture generator using the existing case compiler/exporter.
- [ ] Run focused tests and `npm run generate:community-fixtures`; verify a second generation leaves tracked files unchanged.
- [ ] Commit with `feat: add deterministic community contracts and fixtures`.

### Task 3: Scaffold and validate the static community repository

**Files:**
- Create in sibling repository: `package.json`, `tsconfig.json`, `eslint.config.js`, repository policy files and JSON Schemas
- Create: `src/schema/*`, `src/validation/*`, `src/build/*`
- Create: `scripts/validate-catalog.mjs`, `validate-package.mjs`, `build-registry.mjs`, `build-site.mjs`, `verify-deterministic-build.mjs`, `check-links.mjs`
- Test: `tests/catalog-validation.test.ts`, `package-validation.test.ts`, `deterministic-build.test.ts`, `path-security.test.ts`, `registry-schema.test.ts`

**Interfaces:** Produces `validateCatalog(root)`, `validateCasePackage(bytes, entry)`, `buildRegistry(options)` and `buildSite(options)`.

- [ ] Initialize an independent `main` repository only after confirming the sibling directory and remote name are unused.
- [ ] Add failing tests for all publisher, entry, path, screenshot, package, semver, reachability and deterministic-output boundaries.
- [ ] Implement strict validation with structured issue codes, field paths and fix hints; never execute package files.
- [ ] Build stable UTF-8 sorted registry output and script-free static pages; compare two builds with only generatedAt/sourceCommit normalized.
- [ ] Run every community command and commit the scaffold, schemas, validator and builder in focused commits.

### Task 4: Publish the community sample catalog locally

**Files:**
- Create in community repository: `catalog/publishers/ldm-team.json`
- Create: `catalog/cases/case-community-sample-001/1.0.0/**`
- Create: community documentation, PR/issue templates and Actions workflows

**Interfaces:** Produces registry v1 with sample case `case-community-sample-001@1.0.0`, three screenshots, SHA-256 and publisher detail.

- [ ] Copy the deterministically generated sample package, entry and local screenshots into the catalog.
- [ ] Verify package ID/version/author, six reachable clues, one safe trigger, two questions totaling100 and complete result coverage.
- [ ] Add PR validation, Pages deployment and weekly integrity workflows using current official Actions.
- [ ] Run `npm run check`, inspect built HTML/JSON/package paths, and commit the sample, docs and CI separately.

### Task 5: Add fixed-origin registry client and offline cache

**Files:**
- Create: `src/community/config/*`, `src/community/client/*`, `src/community/cache/*`, `src/community/store/communityStore.ts`
- Create: `src/storage/communityPreferencesRepository.ts`
- Test: URL resolver, registry client, cache, throttling and corruption recovery tests

**Interfaces:** Produces `getCommunityRegistryUrl()`, `resolveRegistryAssetUrl()`, `RegistryClient`, `RegistryCacheRepository`, and `syncRegistry({manual})`.

- [ ] Write failing tests for origin/protocol/prefix escape, index schema failure, timeout, cache-first fallback, corrupt backup, six-hour throttle and manual refresh.
- [ ] Implement fixed build-time configuration, abortable fetch and IndexedDB cache without putting full JSON in localStorage/Zustand.
- [ ] Verify community failure never throws through `AppShell` and commit with `feat: add community registry client and cache`.

### Task 6: Build community catalog, detail and local preferences UI

**Files:**
- Create: `src/community/features/community-home/*`, `community-search/*`, `community-case-detail/*`, `community-publisher/*`, `community-report/*`
- Create: `src/community/components/*`, `src/styles/community.css`
- Modify: `src/app/appPhase.ts`, `src/app/AppShell.tsx`, `src/features/museum/MuseumHome.tsx`
- Test: search/filter/deep-link/preferences/components

**Interfaces:** Produces lazy `CommunityEntry`, weighted local search, filters, trust labels, `#/community/cases/<caseId>`, and device-only preferences.

- [ ] Write failing component tests for navigation, status, search priority, filters, detail, publisher, warnings, blocked/deprecated, mature opt-in, external-domain confirmation, favorite/rating/note privacy and missing routes.
- [ ] Implement a dense archive catalog with list/grid views, native fieldsets/selects, keyboard focus, lazy screenshots and responsive single-column layout.
- [ ] Verify no package request occurs before install confirmation and no public aggregate rating copy exists.
- [ ] Commit catalog and details in separate focused commits.

### Task 7: Implement verified download and transactional installation

**Files:**
- Create: `src/community/client/downloadCasePackage.ts`, `src/community/install/*`, `src/community/store/downloadStore.ts`, `src/workers/packageHash.worker.ts`
- Create: `src/storage/installedCaseRepository.ts`
- Modify: `src/storage/caseRepository.ts`, `src/storage/assetRepository.ts`, `src/features/museum/MuseumHome.tsx`
- Test: integrity, cancellation, rollback, source conflict, isolation and uninstall tests

**Interfaces:** Produces `downloadCasePackage`, `verifyPackageIntegrity`, `CommunityInstallManager.prepare/install`, source-aware records and uninstall modes.

- [ ] Write failing tests for cancellation, indeterminate progress, byte/hash mismatch, package mismatch, built-in conflict, same/newer/older versions, transaction failure cleanup and cross-case asset isolation.
- [ ] Implement streaming download, Worker hash with fallback, existing package-validator reuse, two-confirmation UI, explicit rollback snapshots and owner-scoped cleanup.
- [ ] Add source labels and installed versions to My Archives; local imports remain `local-import` and cannot display community trust.
- [ ] Commit with `feat: add verified community installation flow`.

### Task 8: Implement updates, compatibility, rollback and case management

**Files:**
- Create: `src/community/updates/*`, `src/community/store/updateStore.ts`, `src/community/features/community-update/*`, `src/community/features/community-library/*`
- Test: semver, compatibility, backup limits, failed rollback and blocked/deprecated tests

**Interfaces:** Produces `compareVersions`, `analyzeUpdateCompatibility`, `CaseUpdateManager.update/rollback`, two-version backup retention and explicit reset choices.

- [ ] Write failing tests for every GameSave reference class and all three compatibility results.
- [ ] Implement update checks without automatic network-on-start, backup package/progress, strict import/registration check, restore-on-failure and maximum two rollback versions.
- [ ] Add management dialogs for update history, package/progress export, clear progress and uninstall resource/progress choices.
- [ ] Commit with `feat: add community case update and rollback`.

### Task 9: Add workshop submission UI and CLI

**Files:**
- Create: `src/editor/features/community-publishing/CommunityPublishPanel.tsx`, `SubmissionMetadataForm.tsx`, `SubmissionChecklist.tsx`, session module
- Modify: `src/editor/features/package-publisher/PackagePublisher.tsx`
- Test: submission UI, ZIP contents, errors/warnings and CLI dry-run

**Interfaces:** Produces a six-step local submission wizard and `npm run community:prepare -- ...` without GitHub authentication or upload.

- [ ] Write failing tests that block invalid cases/screenshots and prove ZIP excludes project state, GameSave, private notes, absolute paths and tokens.
- [ ] Preserve the last successfully exported package outside Zustand, collect publisher/community metadata and 1—5 local screenshots, generate checksums and submission instructions.
- [ ] Add copyable PR title/body and one confirmed external community-repository link.
- [ ] Commit with `feat: add workshop community submission tools`.

### Task 10: Complete E2E, visual and documentation acceptance

**Files:**
- Create: `e2e/archive-exchange.spec.ts`
- Create: `docs/images/stage5-*.png`
- Create: `docs/COMMUNITY_*.md`, `docs/OFFLINE_COMMUNITY_BEHAVIOR.md`
- Modify: `README.md`, `CHANGELOG.md`, workflows, `package.json`, `vite.config.ts`

**Interfaces:** Produces offline deterministic browser flows, 13 real app screenshots, privacy/security documentation and v0.5.0 commands.

- [ ] Add fixture-routed Playwright flows for browse/install, retry, hash failure, offline, compatible/incompatible update, uninstall, submission and v0.4 regressions.
- [ ] Generate screenshots at1440×900 plus1280×720/reduced-motion/mobile checks and inspect console/network/404/Object URL cleanup.
- [ ] Run every main and community quality command, coverage, production previews, package audits and secret/path scans.
- [ ] Commit tests, docs and release preparation separately.

### Task 11: Publish the community repository and registry v1

**Files:** Community repository only; no nested repository or submodule in the main project.

**Interfaces:** Produces the public repository, Pages registry URL and `registry-v1.0.0` release.

- [ ] Create the public remote only after local `npm run check` passes, set description/topics and push `main`.
- [ ] Enable Pages through Actions, wait for PR/deploy/integrity workflows, and verify HTML, index, detail, publisher, screenshots, package, MIME and SHA-256 online.
- [ ] Build and attach a registry snapshot, publish `Registry v1.0.0 — First Catalog`, and record the real URLs.

### Task 12: Configure, merge and release the main application

**Files:** Main repository Actions variable, README links and final release metadata.

**Interfaces:** Produces live v0.5.0 consuming the verified fixed community registry.

- [ ] Set `COMMUNITY_REGISTRY_URL` to the deployed community index and run the main production build with the same value.
- [ ] Push `feat/stage-5-archive-exchange`, create the specified PR, inspect all CI checks and resolve failures without lowering assertions.
- [ ] After eligible squash merge, wait for main CI and Pages, then run a real online community install, SHA check, save/return, offline/local regression and console/404 smoke test.
- [ ] Publish `v0.5.0 — Archive Exchange` only after those checks pass and verify the tag, release, repository and clean local worktree.
