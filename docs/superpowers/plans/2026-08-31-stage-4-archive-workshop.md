# Archive Workshop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver v0.4.0 Archive Workshop so a non-programmer can create, validate, preview, export, reinstall, and play a safe local case without editing JSON.

**Architecture:** Preserve the current React/Zustand runtime and add a strict multi-case registry beneath an independently lazy-loaded authoring layer. CaseDraft compiles through shared normalization, validation, reference and package services into CaseDefinition; IndexedDB stores projects/assets while PreviewSession uses a separate save namespace.

**Tech Stack:** React 19, TypeScript 6 strict, Zustand 5, Zod 4, native IndexedDB/Web Crypto/localStorage heartbeat locks, fflate ZIP, Vite 8, Vitest/Testing Library, Playwright.

**实施状态（2026-08-31）：** Tasks 1—14 已完成并由 93 个 Vitest、34 个编辑器专项测试与 15 个通过的 Playwright 流程验证；Task 15 的本地质量门已通过，PR、Pages 与 Release 状态在发布步骤完成后记录。

## Global Constraints

- Do not recreate the React project, delete existing case data, loosen the formal runtime schema, or introduce a backend/UI framework.
- All conditions and trigger effects are declarative; no JavaScript, HTML, CSS injection, Shell, remote URL, remote asset, or arbitrary plugin execution.
- Export playable packages only as `.ldmcase`; accept `.lmdcase` with a warning; use `.ldmproject` for projects and `.ldmsave` for progress.
- Built-in `case-001` and `case-002` cannot be overwritten; preview saves never share formal case save/window namespaces.
- Production assets are local; third-party packages reject SVG; components remain focused and editor chunks load lazily.
- New behavior follows red-green-refactor and each milestone runs focused tests before commit.

---

### Task 1: Strict multi-case runtime foundation

**Files:** `src/cases/types.ts`, `src/cases/schema.ts`, `src/cases/registry.ts`, `src/cases/case-001/case.ts`, `src/cases/case-002/case.ts`, `src/engine/conditionEngine.ts`, `src/engine/validation.ts`, `src/engine/persistence.ts`, `src/store/gameStore.ts`

**Interfaces:** Produces `CaseDefinition`, `GameEvent`, `CaseCondition`, `validateCaseDefinition`, `caseRegistry`, `activateCase(caseId)`, and per-case save keys.

- [ ] Write failing tests proving two built-in cases register, IDs are unique, composite conditions evaluate, formal schema rejects executable/remote data, saves stay independent, and the legacy case-001 key migrates without deletion.
- [ ] Run the focused tests and confirm failures are caused by missing registry/condition/per-case APIs.
- [ ] Replace `z.any()` with explicit schemas, migrate case-001, add data-driven case-002, implement registry and condition evaluator, and parameterize persistence.
- [ ] Update runtime consumers to read the active case rather than importing case-001.
- [ ] Run focused tests plus `npm run check`; commit `refactor: add strict multi-case runtime foundation`.

### Task 2: Secure case package and installed-case repository

**Files:** `src/packages/packageSecurity.ts`, `src/packages/casePackage.ts`, `src/storage/indexedDb.ts`, `src/storage/caseRepository.ts`, `src/storage/assetRepository.ts`, `scripts/validate-cases.mjs`, `package.json`

**Interfaces:** Produces `exportCasePackage`, `importCasePackage`, `installCase`, `removeInstalledCase`, and `npm run validate:cases`.

- [ ] Write failing tests for path traversal, duplicate paths, remote URLs, SVG, bad signatures, oversize entries, checksum mismatch, legacy extension warnings, `.ldmcase` export naming and package round trip.
- [ ] Verify the security tests fail before package code exists.
- [ ] Add fflate, safe limits, stable ZIP ordering, SHA-256 checksums, IndexedDB repositories with injectable memory adapters, and installed-case loading.
- [ ] Add CLI case validation using the same source validation contract.
- [ ] Run package tests and `npm run validate:cases`; commit `feat: add safe case packages and installed registry`.

### Task 3: Authoring project model and compiler

**Files:** `src/editor/model/caseDraft.ts`, `src/editor/model/authoringProject.ts`, `src/editor/model/projectSchema.ts`, `src/editor/model/projectMigrations.ts`, `src/editor/compiler/normalizeCaseDraft.ts`, `src/editor/compiler/compileCaseDraft.ts`, `src/editor/compiler/decompileCaseDefinition.ts`, `src/editor/compiler/referenceResolver.ts`

**Interfaces:** Produces `CaseDraft`, `AuthoringProject`, `CompileCaseResult`, `normalizeCaseDraft`, `compileCaseDraft`, `decompileCaseDefinition`, `renameStableId`, `findReferences`, `deleteWithReferencePolicy`.

- [ ] Write failing tests for blank/minimal drafts, immutable compile, decompile/recompile equivalence, stable title/ID behavior, atomic ID rename, blocked referenced deletion and migration failure preservation.
- [ ] Run tests red, then implement the distinct permissive project schema and strict compiler boundary without casts to CaseDefinition.
- [ ] Reuse formal validation and return path-addressable issues.
- [ ] Run tests plus typecheck; commit `refactor: separate case drafts from runtime definitions`.

### Task 4: Project storage, history, snapshots and locks

**Files:** `src/editor/storage/projectRepository.ts`, `src/editor/storage/projectSnapshotRepository.ts`, `src/editor/storage/editorAssetRepository.ts`, `src/editor/storage/projectLock.ts`, `src/editor/store/editorStore.ts`, `src/editor/store/historyStore.ts`

**Interfaces:** Produces CRUD project repository, 800ms autosave, 80-step undo/redo, 20 snapshots, save failure recovery, and `ProjectLockState`.

- [ ] Write failing fake-timer tests for debounce, save failure memory preservation, text coalescing, undo/redo, snapshot restore, lock contention, takeover and expiry.
- [ ] Implement repositories behind injectable interfaces, keeping Blob data outside Zustand.
- [ ] Implement history patches and lock heartbeat; only user data edits enter history.
- [ ] Run editor storage tests; commit `feat: add workshop project storage and lifecycle`.

### Task 5: Lazy workshop entry and project creation

**Files:** `src/app/AppShell.tsx`, `src/app/appPhase.ts`, `src/features/museum/MuseumHome.tsx`, `src/editor/entry/WorkshopEntry.tsx`, `src/editor/features/workshop-home/WorkshopHome.tsx`, `src/editor/features/project-create/CreateProjectWizard.tsx`, `src/styles/workshop.css`

**Interfaces:** Produces museum workshop entry, project list and blank/minimal/copy/import creation paths.

- [ ] Write component tests for entering/leaving workshop, listing/opening/copying/deleting projects and the four-step creation wizard.
- [ ] Verify the museum does not load the workshop chunk before entry.
- [ ] Implement lazy routing, archive-terminal visual layout, focused dialogs and low-width single-panel notice.
- [ ] Run component tests and build chunk inspection; commit `feat: add archive workshop interface`.

### Task 6: Editor shell, metadata, entities and timeline

**Files:** `src/editor/components/EditorShell.tsx`, `EditorTopbar.tsx`, `EditorSidebar.tsx`, `InspectorPanel.tsx`, `src/editor/features/metadata-editor/MetadataEditor.tsx`, `entity-editor/EntityEditor.tsx`, `timeline-editor/TimelineEditor.tsx`, `project-search/ProjectSearch.tsx`

**Interfaces:** Produces accessible section navigation, status bar, global search/reference navigation and real metadata/entity/timeline editing.

- [ ] Write component tests for labels/errors, entity creation/rename/reference/delete policies, timeline consistency warnings, search navigation and keyboard undo/redo/save.
- [ ] Implement high-density authoring layout using design tokens and focused components below 200 lines.
- [ ] Preserve panel widths in `EditorUiState`; add numeric/keyboard alternatives to drag actions.
- [ ] Run component/a11y-focused tests; commit `feat: add metadata entities and timeline editors`.

### Task 7: Desktop and application editor registry

**Files:** `src/editor/registry/appEditorRegistry.ts`, `src/editor/features/desktop-editor/DesktopEditor.tsx`, `app-config-editor/AppConfigEditor.tsx`, per-app lazy editor modules, `src/app/appRegistry.ts`

**Interfaces:** Produces `AppEditorModule`, shared desktop geometry helpers and lazy editors for all supported component keys.

- [ ] Write tests for enabling apps, unsupported read-only payloads, desktop drag/coordinate updates, 1280/1440 previews and app module lazy loading.
- [ ] Implement registry lookup with no caseId branches and reuse runtime icon/window constraints.
- [ ] Add functional editors for files, messages, mail, photos, browser, calendar, recycle, logs, audio, broadcast, data, terminal, version diff and sitemap.
- [ ] Run editor registry tests; commit `feat: add desktop and application editors`.

### Task 8: File, message and mail authoring

**Files:** `src/editor/features/file-system-editor/FileSystemEditor.tsx`, `messenger-editor/MessengerEditor.tsx`, `mail-editor/MailEditor.tsx`

**Interfaces:** Produces tree/list editors that emit normalized draft changes and reference-safe deletes.

- [ ] Write tests for folders/text files/locks, message attachments/order, mail folders/headers, plain text or safe Markdown, and HTML/remote rejection.
- [ ] Implement real tree/list/preview interactions and puzzle-password warning.
- [ ] Run focused tests; commit `feat: add file message and mail authoring`.

### Task 9: Clue conditions, dependency analysis and triggers

**Files:** `src/editor/features/clue-editor/ClueEditor.tsx`, `condition-builder/ConditionBuilder.tsx`, `condition-builder/ConditionNode.tsx`, `trigger-editor/TriggerEditor.tsx`, `src/editor/compiler/dependencyAnalyzer.ts`

**Interfaces:** Produces condition serialization/testing, depth/node limits, target-filtered selectors, reachability/cycle analysis and safe effects.

- [ ] Write tests for event/all/any serialization, nested limits, missing targets, cycles, disabled apps and rejection of arbitrary effects.
- [ ] Implement keyboard-reorderable condition trees, read-only raw preview, simulation state and text dependency alternative.
- [ ] Implement trigger effect ordering plus reduced-motion/safe-mode alternatives.
- [ ] Run tests; commit `feat: add clue condition and trigger builders`.

### Task 10: Deduction editor and validation center

**Files:** `src/editor/features/deduction-editor/DeductionEditor.tsx`, `validation-center/ValidationCenter.tsx`, `src/engine/validation.ts`

**Interfaces:** Produces 100-point scoring validation, result interval coverage, reachable unlock rules and issue-to-field navigation.

- [ ] Write tests for total score, interval overlap/gaps, evidence/reference limits and issue filters/navigation.
- [ ] Implement question/option/result editing with deterministic preview and shared validation reports.
- [ ] Run focused tests; commit `feat: add deduction editor and validation center`.

### Task 11: Resource manager and workers

**Files:** `src/editor/features/asset-manager/AssetManager.tsx`, `src/workers/assetHash.worker.ts`, `src/editor/storage/editorAssetRepository.ts`

**Interfaces:** Produces import, hashing, dedupe, metadata, preview, replace, reference-safe delete and orphan cleanup.

- [ ] Write signature/MIME/size/hash/dedup/reference tests with local PNG/WAV/TXT fixtures.
- [ ] Implement Worker SHA-256 with main-thread fallback and explicit recovery state.
- [ ] Implement accessible image alt/audio transcript requirements and Object URL cleanup.
- [ ] Run tests; commit `feat: add asset manager and project search`.

### Task 12: Preview sessions and debug panel

**Files:** `src/preview/PreviewSession.ts`, `src/preview/PreviewCaseLoader.ts`, `src/preview/PreviewDebugPanel.tsx`, editor preview/publish components, runtime store namespace support.

**Interfaces:** Produces immutable preview snapshots, isolated saves/windows, author-only debug state and return-to-editor restoration.

- [ ] Write tests proving preview cannot mutate formal saves, scores, case list or windows and compile errors block full preview.
- [ ] Implement local previews and full runtime preview banner/menu/debug panel.
- [ ] Run preview tests plus both built-in case regressions; commit `feat: add validation center and preview sessions`.

### Task 13: Project backup and publishing

**Files:** `src/packages/projectPackage.ts`, `src/editor/features/project-backup/ProjectBackup.tsx`, `package-publisher/PackagePublisher.tsx`, `scripts/validate-editor-examples.mjs`, `scripts/package-editor-examples.mjs`, `examples/editor/minimal-valid-project/`

**Interfaces:** Produces `.ldmproject` import/export, `.ldmcase` publish wizard, minimal template validation and two verified release assets.

- [ ] Write tests for project round trip, conflict choices, no formal progress/editor state in case packages, referenced-only assets and export re-import validation.
- [ ] Create the six-clue “消失的备用钥匙” template and compile/validate/package it.
- [ ] Add `test:editor`, `validate:editor-examples`, `package:editor-examples` and expanded `check` scripts.
- [ ] Run all template/package commands; commit `feat: add project backup and package publishing`.

### Task 14: E2E workflows, screenshots and documentation

**Files:** `e2e/archive-workshop.spec.ts`, fourteen `docs/images/stage4-*.png`, `docs/EDITOR_GUIDE.md`, `EDITOR_ARCHITECTURE.md`, `CASE_DRAFT_MODEL.md`, `CONDITION_BUILDER.md`, `TRIGGER_EFFECTS.md`, `EDITOR_VALIDATION.md`, `PROJECT_FORMAT.md`, `PREVIEW_SESSIONS.md`, `README.md`, `CHANGELOG.md`

**Interfaces:** Produces eight exact browser journeys, real 1440×900 screenshots and user/developer documentation matching implementation.

- [ ] Implement exact template/export/import, validation, undo/snapshot, isolation, malicious input and built-in regression journeys.
- [ ] Run E2E red against missing UI selectors, then complete UI until all flows pass.
- [ ] Capture and visually inspect all fourteen requested screenshots at 1440×900 and verify 1280×720/reduced-motion/console/resources.
- [ ] Update version/documentation with no unimplemented claims; commit `test: cover archive workshop workflows` and `docs: document archive workshop`.

### Task 15: CI, release verification and delivery

**Files:** `.github/workflows/ci.yml`, `package.json`, `package-lock.json`

**Interfaces:** Produces enforced editor/template/package/security/runtime gates and v0.4.0 delivery evidence.

- [ ] Add CI editor validation and package round-trip gates without removing existing checks.
- [ ] Run fresh `typecheck`, `lint`, `test`, `test:coverage`, `test:editor`, `validate:cases`, `validate:editor-examples`, `package:editor-examples`, `build`, `e2e`, `check`, audit, secret scan and `git diff --check`.
- [ ] Commit `chore: prepare v0.4.0 release`, push `feat/stage-4-archive-workshop`, create the requested PR and wait for all checks.
- [ ] If merge conditions are met, squash merge, wait for Pages, verify the live workshop/export flow and zero resource/console failures.
- [ ] Create immutable `v0.4.0 — Archive Workshop` with only the freshly validated minimal `.ldmproject` and `.ldmcase` assets.

## Self-review

The plan explicitly covers every audit blocker and all requested product boundaries. There are no alternate runtime schemas, empty editor modules, arbitrary code paths, preview/formal save overlap, remote assets or placeholder tasks. Interface names are stable across tasks; package and preview work both depend on the same compiler and validator established first.
