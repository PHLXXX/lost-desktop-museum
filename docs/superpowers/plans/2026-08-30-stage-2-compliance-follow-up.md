# Stage 2 Compliance Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` and complete each task with a red-green-refactor cycle.

**Goal:** Close the verified gaps between the published v0.2.0 implementation and the approved Stage 2 interaction, persistence, application, accessibility, and regression requirements.

**Architecture:** Preserve the existing React/Zustand/data-driven structure. Add small dialog and lifecycle components, extend `GameSave` through migration-safe fields, keep desktop keyboard policy in one helper, and move evidence-board subviews out of the oversized coordinator.

**Tech Stack:** React 19, TypeScript 6, Zustand 5, Zod 4, Vite 8, Vitest/Testing Library, Playwright. No runtime dependencies or external assets.

## Global Constraints

- Never use browser `alert`, `confirm`, `window.close`, force-push, hard reset, or destructive repository cleanup.
- Preserve case 001, all 12 clue IDs, the password `1119`, scoring, settings, and v1/v2 save compatibility.
- Add a focused failing test before each behavior change and run it red before implementation.
- Use local SVG/CSS assets, Chinese UI copy, accessible names, and focused components below 300 lines.

---

### Task 1: Museum lifecycle, metrics, and accessible confirmations

**Files:**
- Modify: `src/app/AppShell.tsx`
- Modify: `src/features/museum/MuseumHome.tsx`
- Modify: `src/features/museum/CaseDetail.tsx`
- Create: `src/features/system/ArchiveDialog.tsx`
- Modify: `src/cases/types.ts`
- Modify: `src/engine/persistence.ts`
- Modify: `src/store/gameStore.ts`
- Test: `src/app/appPhase.test.tsx`
- Test: `src/engine/persistence.test.ts`

- [x] Add failing tests proving no browser dialogs are called, reset requires the in-app confirmation, continue bypasses boot, metrics render, and v1 migration supplies the new progress fields.
- [x] Run focused tests and confirm the expected failures.
- [x] Add separate start/continue callbacks, museum/about/restart dialogs, safe-mode controls, completion/best-score/play-time fields, and migration defaults.
- [x] Run focused tests and `npm run test`; pass.

### Task 2: Desktop command policy and safe restart

**Files:**
- Modify: `src/features/desktop/Desktop.tsx`
- Modify: `src/features/system/SystemMenu.tsx`
- Modify: `src/store/windowStore.ts`
- Create: `src/features/desktop/desktopShortcuts.ts`
- Test: `src/features/desktop/Desktop.test.tsx`
- Test: `src/store/windowStore.test.ts`

- [x] Add failing tests for Esc menu priority, Ctrl/Cmd+S, Delete note removal, required system-menu actions, and reset clearing live windows while retaining settings.
- [x] Run focused tests and confirm failures reflect missing behavior.
- [x] Implement one desktop keyboard dispatcher, complete the menu, clamp the context menu, and add `resetWindows`.
- [x] Run focused tests and `npm run test`; pass.

### Task 3: Persisted recycle restoration and meaningful application controls

**Files:**
- Modify: `src/cases/types.ts`
- Modify: `src/engine/persistence.ts`
- Modify: `src/store/gameStore.ts`
- Modify: `src/features/apps/FilesApp.tsx`
- Modify: `src/features/apps/MessagesApp.tsx`
- Modify: `src/features/apps/MailApp.tsx`
- Modify: `src/features/apps/PhotosApp.tsx`
- Modify: `src/features/apps/HistoryApp.tsx`
- Modify: `src/features/apps/CalendarApp.tsx`
- Modify: `src/features/apps/RecycleApp.tsx`
- Modify: `src/features/apps/LogsApp.tsx`
- Create: `src/features/apps/archiveApplications.test.tsx`

- [x] Add failing tests for persisted restore/original-directory visibility, functional search/filter/navigation controls, birthday-note disclosure, photo metadata fields, and log detail discovery.
- [x] Run the focused application test and confirm the expected failures.
- [x] Implement only the approved local behaviors; disabled commands explain why and no button is a silent no-op.
- [x] Run focused tests and `npm run test`; pass.

### Task 4: Evidence-board decomposition

**Files:**
- Modify: `src/features/evidence-board/EvidenceBoardApp.tsx`
- Create: `src/features/evidence-board/EvidenceLibrary.tsx`
- Create: `src/features/evidence-board/EvidenceCanvas.tsx`
- Create: `src/features/evidence-board/EvidenceInspector.tsx`
- Create: `src/features/evidence-board/DeductionDialog.tsx`
- Test: `src/features/evidence-board/EvidenceBoardApp.test.tsx`

- [x] Add focused behavior coverage for evidence helpers, notes, key-evidence state, relation handling and deduction entry.
- [x] Run the note test red before implementation.
- [x] Extract focused presentational components while preserving the existing store API and canvas behavior.
- [x] Ensure every component is below 300 lines and run the focused tests.

### Task 5: Exact Stage 2 regression journeys and release evidence

**Files:**
- Modify: `e2e/player-journey.spec.ts`
- Modify: `docs/audits/stage-2-ui-audit.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Refresh: `docs/images/stage2-*.png`

- [x] Add exact E2E flows for exit/resume, reset cancel/confirm with settings preservation, window move/resize/minimize/maximize persistence, and all 12 clues plus `1119` plus result.
- [x] Run the final `npm run lint`, `npm run test`, `npm run test:coverage`, `npm run build`, `npm run e2e`, and `npm run check` after documentation/version updates.
- [x] Verify 1440x900, 1366x768, 1280x720, a sub-1024 viewport, reduced motion, anomaly-off behavior, no console errors, and no resource failures in the final build.
- [x] Commit focused changes, push the follow-up branch, open a PR, wait for CI, squash merge, wait for Pages, and verify the public URL.
- [x] Keep the existing immutable `v0.2.0` tag intact and publish the completed follow-up as the `v0.2.1` patch release.

## Self-review

The plan covers every confirmed gap without replacing the stack or case data. There are no placeholders. New save fields are migration-defaulted before use, desktop shortcuts have a single owner, app controls are testable behaviors, and the evidence split reduces rather than relocates the oversized component responsibility.
