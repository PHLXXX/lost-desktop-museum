# Stage 2 Experience Overhaul Implementation Plan

状态：已于 2026-08-30 交付 `v0.2.0`；下列复选框保留为原始实施模板。2026-08-31 的实测补齐项、红绿测试记录与最终发布门见 [`2026-08-30-stage-2-compliance-follow-up.md`](2026-08-30-stage-2-compliance-follow-up.md)，后者反映当前代码的实际完成状态。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把阶段一单屏虚拟桌面升级为包含博物馆入口、可靠本地存档、持久化窗口和十个真实工具形态的完整阶段二网页游戏。

**Architecture:** `AppShell` 只管理显式导航阶段，Zustand 游戏 store 继续管理案件事实，窗口 store 通过 v2 存档适配器持久化几何。十个应用按领域拆分到独立组件，共享紧凑的工具栏、数据表和状态栏原语，但不共享同一种页面骨架。

**Tech Stack:** React 19、TypeScript 6、Zustand 5、Zod 4、Vite 8、Vitest/Testing Library、Playwright；仅本地 SVG/CSS，无新增运行时依赖。

## Global Constraints

- 保留当前案件、12 条线索、答案、数据结构、GitHub Pages 与现有技术栈。
- UI 文本使用中文；类型、变量、组件与文件名使用英文。
- 每个文件单一职责，组件不超过约 300 行；案件答案不散落到 React 组件。
- 所有资产本地化；不连接后端、数据库、账户、外部 AI 或热链。
- 每个行为先写失败测试或在同一变更中提供聚焦测试；里程碑后运行 `npm run check`。
- 功能分支为 `feat/stage-2-experience-overhaul`；小提交，不 force-push。

---

### Task 1: Navigation lifecycle and museum shell

**Files:**
- Create: `src/app/appPhase.ts`
- Create: `src/features/museum/MuseumHome.tsx`
- Create: `src/features/museum/CaseDetail.tsx`
- Modify: `src/app/AppShell.tsx`
- Test: `src/app/appPhase.test.tsx`

**Interfaces:**
- Produces: `type AppPhase = 'museum' | 'case-detail' | 'case-boot' | 'investigation' | 'deduction' | 'result'` and `AppShell` phase transitions.

- [ ] Write tests proving initial museum, case detail navigation, boot entry, continue state and museum return.
- [ ] Run `npx vitest run src/app/appPhase.test.tsx`; expect failure because museum components do not exist.
- [ ] Implement the phase type, museum home, case detail and route callbacks using existing case metadata and save snapshot.
- [ ] Add the five-block design contract as the first emitted child of the root shell.
- [ ] Run the focused test, then `npm run check`; expect all pass.
- [ ] Commit: `feat: add museum case lifecycle`.

### Task 2: GameSave v2 and visible save state

**Files:**
- Modify: `src/cases/types.ts`
- Modify: `src/engine/persistence.ts`
- Modify: `src/store/gameStore.ts`
- Create: `src/features/system/SaveIndicator.tsx`
- Test: `src/engine/persistence.test.ts`
- Test: `src/store/gameStore.test.ts`

**Interfaces:**
- Produces: `SaveStatus`, `WindowSnapshot`, `migrateGameSave`, `backupCorruptSave`, `saveNow`, `scheduleSave` and v1→v2 compatibility.

- [ ] Add failing tests for v1 migration defaults, corrupt raw backup key, saving/saved/error states and reset preserving display preferences.
- [ ] Run focused tests; expect assertions for `saveVersion === 2` and backup storage to fail.
- [ ] Implement pure migration and backup, 350ms debounced persistence, immediate save and unload flush.
- [ ] Render saved time/status in museum, case detail and desktop.
- [ ] Run focused tests and `npm run check`; expect pass.
- [ ] Commit: `feat: upgrade resilient local saves`.

### Task 3: Persistent window manager

**Files:**
- Modify: `src/store/windowStore.ts`
- Modify: `src/features/window-manager/WindowFrame.tsx`
- Create: `src/features/window-manager/windowGeometry.ts`
- Test: `src/features/window-manager/windowGeometry.test.ts`
- Test: `src/features/window-manager/WindowFrame.test.tsx`

**Interfaces:**
- Produces: exact default sizes, `clampWindow`, `resizeWindow`, `hydrateWindows`, `serializeWindows` and active-window semantics.

- [ ] Write failing tests for every default size, clamp behavior, titlebar double-click and resize persistence callback.
- [ ] Run focused tests; expect missing APIs.
- [ ] Implement geometry helpers and store hydration; add named non-modal dialog semantics, active/dim state and eight resize handles.
- [ ] Default new windows to maximized below 1024px and restore from taskbar.
- [ ] Run focused tests, then `npm run check`; expect pass.
- [ ] Commit: `feat: persist resizable app windows`.

### Task 4: Desktop, system menu and onboarding

**Files:**
- Create: `src/components/icons/ArchiveIcon.tsx`
- Create: `src/features/system/SystemMenu.tsx`
- Create: `src/features/system/Onboarding.tsx`
- Create: `src/features/system/HelpPanel.tsx`
- Modify: `src/features/desktop/Desktop.tsx`
- Test: `src/features/desktop/Desktop.test.tsx`

**Interfaces:**
- Consumes: phase callbacks, `saveNow`, window actions.
- Produces: selection-based desktop keyboard model, A/OS/Esc menu, temporary note and 3-step onboarding.

- [ ] Write failing tests for select/double-click/Enter/deselect, context menu note, A/OS and Esc, save-and-return, restart confirmation and onboarding completion.
- [ ] Run focused test; expect missing controls.
- [ ] Implement local stroke SVG icons, desktop selection, context menu, compact taskbar and system layers with focus management.
- [ ] Add 4-second actionable clue toast and taskbar text `已记录 N / 12`.
- [ ] Run focused test and `npm run check`; expect pass.
- [ ] Commit: `feat: rebuild desktop system controls`.

### Task 5: Distinct archive applications

**Files:**
- Create: `src/features/apps/FilesApp.tsx`
- Create: `src/features/apps/MessagesApp.tsx`
- Create: `src/features/apps/MailApp.tsx`
- Create: `src/features/apps/PhotosApp.tsx`
- Create: `src/features/apps/HistoryApp.tsx`
- Create: `src/features/apps/CalendarApp.tsx`
- Create: `src/features/apps/RecycleApp.tsx`
- Create: `src/features/apps/LogsApp.tsx`
- Modify: `src/app/AppContent.tsx`
- Remove after migration: `src/features/apps/ArchiveApps.tsx`, `src/features/apps/BasicApps.tsx`
- Test: `src/features/apps/archiveApps.test.tsx`

**Interfaces:**
- Consumes: `caseDefinition`, investigation actions and clue/store APIs.
- Produces: independently structured file table, message timeline, three-pane mail, photo library/viewer, history table, month calendar, recycle versions and log detail view.

- [ ] Write component tests for the named toolbar/table/detail fields and the six core clue discovery actions.
- [ ] Run focused test; expect structural role/text failures.
- [ ] Implement each application in its own file while preserving original item IDs and action dispatches.
- [ ] Verify password unlock, audio transcript, file restore and metadata interactions remain reachable.
- [ ] Run focused tests, player journey and `npm run check`; expect pass.
- [ ] Commit in two slices: `feat: rebuild communication archive apps`, then `feat: rebuild system archive apps`.

### Task 6: Evidence workspace, deduction and result phase

**Files:**
- Modify: `src/features/evidence-board/EvidenceBoardApp.tsx`
- Modify: `src/features/evidence-board/EvidenceCard.tsx`
- Create: `src/features/evidence-board/evidenceHistory.ts`
- Modify: `src/styles/evidence.css`
- Test: `src/features/evidence-board/evidenceHistory.test.ts`

**Interfaces:**
- Produces: three-column evidence workspace, auto-layout, undo stack, zoom/reset and phase callback on deduction/result.

- [ ] Write failing tests for deterministic auto-layout, undo, zoom clamp and reset view.
- [ ] Run focused test; expect missing helpers.
- [ ] Implement left clue library, center canvas, right detail/relation inspector and toolbar actions without regressing drag/filter/pin/relation.
- [ ] Wire deduction submit to `result` and return-to-museum callback.
- [ ] Run evidence tests, E2E player journey and `npm run check`; expect pass.
- [ ] Commit: `feat: expand evidence deduction workspace`.

### Task 7: Visual system and responsive behavior

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Rewrite: `src/styles/game.css`
- Modify: `src/styles/evidence.css`
- Create: `DESIGN.md`

**Interfaces:**
- Produces: opaque functional archive OS tokens, application layouts, active window depth, focus/hover/loading/error/empty states and sub-1024 fallback.

- [ ] Replace decorative grid, blur and side-accent patterns with semantic surfaces and 1px rules.
- [ ] Apply compact 36/38/26/48px system chrome dimensions and required default window usability.
- [ ] Add ≥4.5:1 body contrast, visible focus, reduced-motion alternatives and sub-1024 warning/maximized layout.
- [ ] Run `npm run check`; expect pass, then inspect 1440×900 plus 1280×720 in one screenshot batch.
- [ ] Write `DESIGN.md` from the rendered system and commit `style: establish functional archive os`.

### Task 8: E2E acceptance, screenshots and docs

**Files:**
- Rewrite: `e2e/player-journey.spec.ts`
- Keep: `e2e/stage2-baseline.spec.ts`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Create screenshots under: `docs/images/stage2-*.png`

**Interfaces:**
- Produces: four E2E flows covering lifecycle, clue investigation, save/return/reload and deduction/result; eight required stage-two screenshots.

- [ ] Add flows for museum→case→desktop, representative six-app clues, save-return-reload, and evidence→deduction→result.
- [ ] Run `npm run e2e`; expect all four flows pass with empty console-error arrays.
- [ ] Capture the eight required screenshots at 1440×900 and verify 1366×768/1280×720 bounds.
- [ ] Update README to v0.2 features, controls, save recovery, screenshots and architecture; add `[0.2.0] - 2026-08-30` changelog.
- [ ] Run `npm run check && npm run e2e`; expect pass.
- [ ] Commit: `test: cover stage 2 player lifecycle`, then `docs: document stage 2 release`.

### Task 9: Review, PR, deployment and release

**Files:**
- Modify only findings from review.

**Interfaces:**
- Produces: reviewed branch, merged PR, verified Pages deployment and GitHub release `v0.2.0`.

- [ ] Run `git diff --check`, secret-pattern scan, `npm audit --omit=dev`, `npm run check`, `npm run e2e`.
- [ ] Perform screenshot review against the design contract and original audit; batch material fixes once and rerun targeted verification.
- [ ] Push branch and create PR titled `feat: stage 2 experience overhaul` with test and screenshot evidence.
- [ ] Wait for CI; squash merge only if checks pass and repository state is safe.
- [ ] Wait for Pages, verify public URL HTTP 200 and museum/desktop UI without console errors.
- [ ] Create GitHub release `v0.2.0 — Return to the Archive` and verify tag/release URL.

## Self-review

需求覆盖：显式六阶段、首页/详情/启动/桌面/推理/结果、v2 存档与损坏备份、窗口几何和缩放、系统菜单、桌面选择/右键、十应用、证据板工具、toast、onboarding、窄屏、测试、截图、文档、PR、Pages、release 均有对应任务。接口中的类型名在前后任务一致；文档不包含 TBD/TODO 或“稍后实现”占位。
