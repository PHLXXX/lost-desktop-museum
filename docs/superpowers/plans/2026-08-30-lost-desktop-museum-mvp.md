# Lost Desktop Museum MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and release a complete 15—30 minute static-browser mystery game, 《遗失电脑博物馆：最后一次登录》, with one playable case, twelve discoverable clues, an evidence board, deterministic deduction scoring, local saves, automated tests, GitHub Pages, and a verified v0.1.0 release.

**Architecture:** Case content is a Zod-validated `CaseDefinition`; pure engine functions turn investigation actions into clues, one-shot events, scores, and save migrations. Zustand coordinates game, window, and settings state, while small React feature modules render the boot flow, virtual desktop, ten applications, evidence board, and deduction experience. All production resources are local, and the Vite output is a serverless static site.

**Tech Stack:** React, TypeScript, Vite, Zustand, Zod, Vitest, React Testing Library, Playwright, ESLint, Prettier, native CSS, Web Audio API, localStorage, GitHub Actions, GitHub Pages.

## Global Constraints

- UI copy is Chinese; variables, types, and filenames are English.
- Case content is data-driven and must not be embedded in React components.
- One file has one clear responsibility; avoid React components over 300 lines.
- Do not add a backend, external AI API, database, login, paid API, runtime hotlink, or large UI library.
- Do not use real Windows/macOS branding or copyrighted platform icons; use original local SVG.
- Local Vite base is `/`; Actions derives `/<repository-name>/` from `GITHUB_REPOSITORY`.
- Use a single-page state machine; do not add a History Router requiring server fallback.
- New behavior begins with a failing test or gains its test in the same task.
- Each milestone runs its focused tests; final verification runs lint, test, build, e2e, production preview, Git and GitHub checks.
- Never commit secrets, cookies, account data, local absolute paths, `node_modules`, `dist`, Playwright traces, or reports.
- Never use force push or destructive Git reset.

---

## File Map

```text
AGENTS.md                         Long-lived implementation rules
vite.config.ts                    Dynamic GitHub Pages base and Vitest config
playwright.config.ts              Production-like e2e web server and screenshots
src/app/                          Root composition, shell and top-level dialogs
src/cases/types.ts                Public case contracts
src/cases/schema.ts               Zod runtime validation
src/cases/case-001/               All case content split by domain
src/engine/                       Pure clue, trigger, score, save and migration logic
src/store/                        Zustand game, window and settings stores
src/features/                     Boot, desktop, applications and investigation UI
src/components/                   Shared controls, icons, notifications and dialogs
src/assets/                       Original local SVG illustrations and wallpaper
src/styles/                       Tokens, global rules and atmosphere effects
src/tests/                        Vitest setup, fixtures and cross-domain tests
e2e/                              Complete player journey and persistence specs
docs/images/                      Screenshots captured from the running application
.github/workflows/                CI and Pages deployment
```

### Task 1: Reproducible Project Foundation

**Files:**
- Create: `AGENTS.md`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.editorconfig`
- Create: `.gitignore`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/tests/setup.ts`
- Create: `src/app/App.test.tsx`

**Interfaces:**
- Produces: `App(): JSX.Element`, npm scripts `dev`, `typecheck`, `lint`, `test`, `test:coverage`, `build`, `preview`, `e2e`, `check`.
- Produces: `resolveBase(repository?: string): string` exported from `vite.config.ts` for direct base-path testing.

- [ ] **Step 1: Create project rules before application code**

Write `AGENTS.md` with the exact long-lived rules from the user request: Chinese UI/English code names, data-driven cases, focused files, no external AI/backend/secrets/hotlinks, tests with features, lint/test/build per phase, no completion claims without evidence, small commits, original icons, and local production resources.

- [ ] **Step 2: Scaffold Vite and install pinned compatible dependencies**

Run:

```powershell
npm init -y
npm install react react-dom zustand zod
npm install -D typescript vite @vitejs/plugin-react eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh prettier vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
```

Set scripts to:

```json
{
  "dev": "vite",
  "typecheck": "tsc -b",
  "lint": "eslint . --max-warnings=0",
  "test": "vitest run",
  "test:coverage": "vitest run --coverage",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "e2e": "playwright test",
  "check": "npm run typecheck && npm run lint && npm run test && npm run build"
}
```

- [ ] **Step 3: Write the first component and base-path tests**

`src/app/App.test.tsx` must assert the product title renders. Add a configuration test that evaluates these exact cases:

```ts
expect(resolveBase()).toBe('/')
expect(resolveBase('PHLXXX/lost-desktop-museum')).toBe('/lost-desktop-museum/')
```

- [ ] **Step 4: Run the tests and establish a clean build**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Expected: ESLint exits 0, Vitest reports all tests passed, and Vite writes `dist/index.html` without an absolute local path.

- [ ] **Step 5: Commit the foundation**

```powershell
git add AGENTS.md package.json package-lock.json index.html tsconfig*.json vite.config.ts eslint.config.js .prettierrc.json .editorconfig .gitignore src
git commit -m "chore: scaffold lost desktop museum"
```

### Task 2: Validated Case Model and Complete Case Content

**Files:**
- Create: `src/cases/types.ts`
- Create: `src/cases/schema.ts`
- Create: `src/cases/case-001/case.ts`
- Create: `src/cases/case-001/files.ts`
- Create: `src/cases/case-001/chats.ts`
- Create: `src/cases/case-001/emails.ts`
- Create: `src/cases/case-001/browser.ts`
- Create: `src/cases/case-001/calendar.ts`
- Create: `src/cases/case-001/photos.ts`
- Create: `src/cases/case-001/logs.ts`
- Create: `src/cases/case-001/clues.ts`
- Create: `src/cases/case-001/triggers.ts`
- Create: `src/cases/case-001/ending.ts`
- Create: `src/cases/case-001/case.test.ts`
- Create: `src/assets/illustrations/airport-0803.svg`
- Create: `src/assets/illustrations/airport-1117.svg`
- Create: `src/assets/wallpapers/archive-grid.svg`

**Interfaces:**
- Produces: `CaseDefinition`, `VirtualFile`, `VirtualFolder`, `ChatThread`, `ChatMessage`, `EmailMessage`, `BrowserHistoryEntry`, `CalendarEvent`, `PhotoAsset`, `PhotoMetadata`, `ClueDefinition`, `GameTrigger`, `EvidenceRelation`, `DeductionQuestion`, `DeductionResult`, `GameSave`.
- Produces: `caseDefinition: CaseDefinition` and `caseDefinitionSchema.parse(input): CaseDefinition`.
- Consumes later: `DiscoveryCondition = { action: InvestigationAction['type']; itemId?: string; detail?: string }`.

- [ ] **Step 1: Define contracts and failing completeness tests**

The test must assert:

```ts
expect(caseDefinition.clues.map(({ id }) => id)).toEqual(
  Array.from({ length: 12 }, (_, index) => `C${String(index + 1).padStart(2, '0')}`),
)
expect(new Set(caseDefinition.clues.map((clue) => clue.discovery.action)).size).toBeGreaterThan(4)
expect(caseDefinition.timeline).toEqual([...caseDefinition.timeline].sort())
expect(() => caseDefinitionSchema.parse(caseDefinition)).not.toThrow()
```

- [ ] **Step 2: Implement the core types and strict Zod schema**

Use discriminated actions such as:

```ts
export type InvestigationAction =
  | { type: 'OPEN_ITEM'; itemId: string }
  | { type: 'VIEW_PHOTO_METADATA'; itemId: string }
  | { type: 'COMPARE_ITEMS'; itemIds: [string, string] }
  | { type: 'VIEW_TRANSCRIPT'; itemId: string }
  | { type: 'UNLOCK_ITEM'; itemId: string }
  | { type: 'VIEW_LOG_DETAIL'; itemId: string }
```

Every clue includes source, discovery, people, times, places, `isCore`, and `isRedHerring`. Every trigger includes a stable ID and condition.

- [ ] **Step 3: Populate every application with the approved story content**

Implement the canonical 2031 timeline, all listed files/folders, two chat threads, five required emails plus background messages, ten browser entries, five calendar events, recycle-bin variants, system logs, the recording descriptor, `mirror.lock`, and the four deduction endings. Keep prose in case files, never in feature components.

- [ ] **Step 4: Add the three original local SVG assets**

Both airport images depict the same invented concourse, aircraft silhouette and “海津夏日影像季” board. The exported variant differs only through subtle crop/export treatment; metadata supplies the actual clue. Do not include a brand logo, linked image, external font, script, or embedded binary.

- [ ] **Step 5: Verify the model**

Run:

```powershell
npx vitest run src/cases/case-001/case.test.ts
npm run typecheck
```

Expected: 12 sequential clue IDs, schema success, sorted timeline, and zero TypeScript errors.

- [ ] **Step 6: Commit the case model**

```powershell
git add src/cases src/assets
git commit -m "feat: add data-driven mystery case"
```

### Task 3: Pure Investigation, Trigger, Score, and Save Engines

**Files:**
- Create: `src/engine/eventTypes.ts`
- Create: `src/engine/clueEngine.ts`
- Create: `src/engine/triggerEngine.ts`
- Create: `src/engine/scoringEngine.ts`
- Create: `src/engine/persistence.ts`
- Create: `src/engine/migrations.ts`
- Create: `src/engine/clueEngine.test.ts`
- Create: `src/engine/triggerEngine.test.ts`
- Create: `src/engine/scoringEngine.test.ts`
- Create: `src/engine/persistence.test.ts`
- Create: `src/tests/gameSaveFixture.ts`

**Interfaces:**
- Produces: `discoverClues(caseDefinition, action, discoveredIds): string[]`.
- Produces: `evaluateTriggers(caseDefinition, state): TriggerEffect[]` with no returned ID already present in `triggeredEventIds`.
- Produces: `scoreDeduction(caseDefinition, submission): DeductionResult`.
- Produces: `loadGameSave(storage, caseDefinition): LoadResult`, `saveGameSave(storage, save): void`, `clearGameSave(storage, caseId): void`.
- Produces: `migrateGameSave(input): GameSave` with `CURRENT_SAVE_VERSION`.

- [ ] **Step 1: Write failing clue and password tests**

Assert opening the photo alone does not unlock C03, metadata does; `1119` unlocks `mirror.lock`, while `1118`, empty text, and five digits do not. The password helper signature is:

```ts
export function canUnlockItem(itemId: string, password: string): boolean
```

- [ ] **Step 2: Implement minimal clue and password engines**

Match actions to `ClueDefinition.discovery`, return only newly discovered IDs, and keep item-password configuration in case data rather than UI.

- [ ] **Step 3: Write failing trigger idempotency tests**

Evaluate a three-clue state twice. The first result contains `EVENT_LINRAN_MESSAGE`; after placing that ID in `triggeredEventIds`, the second result is empty. Add equivalent assertions for the eight-clue file injection and identity-draft clock event.

- [ ] **Step 4: Implement trigger evaluation as a pure function**

Trigger effects must be data only:

```ts
export type TriggerEffect =
  | { id: string; type: 'NOTIFICATION'; message: string }
  | { id: string; type: 'CLOCK_OFFSET'; minutes: number; message: string }
  | { id: string; type: 'UNLOCK_ITEM'; itemId: string; message: string }
```

- [ ] **Step 5: Write failing scoring tests and implement exact scoring**

Test 100 points for all correct choices, six canonical core clues, and two canonical contradiction relations. Test lower evidence coverage without changing the three answer scores. Free text must appear in the result but never change points.

- [ ] **Step 6: Write failing persistence/migration tests and implement recovery**

Use an injected `Storage` interface. Test JSON round-trip, a version-0 fixture migrating to the current version, malformed JSON returning `{ status: 'corrupt', save: freshSave }`, and reset removing only the current case key.

- [ ] **Step 7: Run focused engine coverage**

```powershell
npx vitest run src/engine
npm run typecheck
```

Expected: every engine test passes and pure modules do not import React or Zustand.

- [ ] **Step 8: Commit the engines**

```powershell
git add src/engine src/tests
git commit -m "feat: add clues triggers scoring and saves"
```

### Task 4: Zustand State and Virtual Window Manager

**Files:**
- Create: `src/store/gameStore.ts`
- Create: `src/store/windowStore.ts`
- Create: `src/store/settingsStore.ts`
- Create: `src/store/storeTypes.ts`
- Create: `src/store/gameStore.test.ts`
- Create: `src/store/windowStore.test.ts`
- Create: `src/features/window-manager/WindowFrame.tsx`
- Create: `src/features/window-manager/WindowFrame.test.tsx`
- Create: `src/features/window-manager/windowManager.css`
- Create: `src/features/desktop/Taskbar.tsx`

**Interfaces:**
- Produces: `useGameStore`, `useWindowStore`, `useSettingsStore`.
- Produces window actions: `openWindow(appId)`, `focusWindow(id)`, `moveWindow(id, position)`, `minimizeWindow(id)`, `toggleMaximizeWindow(id)`, `closeWindow(id)`, `restoreWindow(id)`.
- Produces game action: `investigate(action: InvestigationAction): void`, which performs clue discovery, trigger evaluation, and save scheduling exactly once.

- [ ] **Step 1: Write failing window state tests**

Test that opening the same single-instance app focuses it without duplicating it; minimizing hides it from the desktop but keeps it on the taskbar; restoring focuses it; move clamps `x` and `y` so the title bar remains reachable; maximize round-trips the prior geometry.

- [ ] **Step 2: Implement the window store and geometry helpers**

Keep geometry math in exported pure helpers. Assign monotonically increasing z-indices and normalize them before unsafe integer growth.

- [ ] **Step 3: Write failing game-store orchestration tests**

Dispatch `VIEW_PHOTO_METADATA` twice and assert C03 occurs once, its notification occurs once, and the persisted discovered list contains one C03. Dispatch the third clue action and assert the LINRAN event is recorded once.

- [ ] **Step 4: Implement game and settings stores with persistence**

Initialize from `loadGameSave`, expose a friendly corruption notice, debounce ordinary writes, and flush on `visibilitychange`. Reset keeps settings but clears investigation state.

- [ ] **Step 5: Build and test `WindowFrame` and `Taskbar`**

Use Pointer Events on the title bar; control buttons must stop drag initiation and have Chinese `aria-label`s. Component tests click minimize then the taskbar button and assert the window content returns.

- [ ] **Step 6: Run focused checks**

```powershell
npx vitest run src/store src/features/window-manager
npm run typecheck
```

- [ ] **Step 7: Commit the state and windows**

```powershell
git add src/store src/features/window-manager src/features/desktop/Taskbar.tsx
git commit -m "feat: add virtual desktop window manager"
```

### Task 5: Boot Flow, Desktop Shell, Icons, and Settings

**Files:**
- Create: `src/app/AppShell.tsx`
- Create: `src/features/boot/BootScreen.tsx`
- Create: `src/features/boot/BootScreen.test.tsx`
- Create: `src/features/boot/boot.css`
- Create: `src/features/desktop/Desktop.tsx`
- Create: `src/features/desktop/DesktopIcon.tsx`
- Create: `src/features/desktop/Desktop.test.tsx`
- Create: `src/features/desktop/desktop.css`
- Create: `src/features/settings/SettingsApp.tsx`
- Create: `src/components/icons/AppIcon.tsx`
- Create: `src/components/ui/Dialog.tsx`
- Create: `src/components/feedback/NotificationCenter.tsx`
- Create: `src/styles/effects.css`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: the three stores and `openWindow(appId)`.
- Produces: `AppRegistry` mapping ten stable app IDs to Chinese titles, original icon variants, default dimensions, and render functions.

- [ ] **Step 1: Write failing boot and desktop interaction tests**

Use fake timers to verify skip works immediately and the normal sequence enables both entry buttons after its staged copy. Test keyboard focus + Enter and desktop double-click open the selected app.

- [ ] **Step 2: Implement the boot state machine**

Use four timed phases totaling about four seconds, plus “跳过启动”. Both session buttons set the boot-complete state; safe mode also disables anomaly motion.

- [ ] **Step 3: Implement desktop shell and original icon system**

Render all ten Chinese app labels, current fictional clock, taskbar, notification area, sound toggle and progress entry. `AppIcon` uses local inline SVG geometry authored for this project and no brand glyph.

- [ ] **Step 4: Implement settings and reset dialog**

Expose sound, anomaly motion, scanline intensity, instructions, and reset. Reset requires a custom dialog with cancel as the initial focus and an explicit second confirmation action.

- [ ] **Step 5: Add responsive and reduced-motion rules**

At small width/height show a non-blocking orientation notice. Under `prefers-reduced-motion`, transitions complete immediately and scanline movement stops.

- [ ] **Step 6: Verify shell behavior**

```powershell
npx vitest run src/features/boot src/features/desktop
npm run lint
npm run build
```

- [ ] **Step 7: Commit the playable shell**

```powershell
git add src/app src/features/boot src/features/desktop src/features/settings src/components src/styles
git commit -m "feat: add boot flow and archive desktop"
```

### Task 6: Complete Investigative Applications

**Files:**
- Create: `src/features/file-explorer/FileExplorerApp.tsx`
- Create: `src/features/file-explorer/FileViewer.tsx`
- Create: `src/features/file-explorer/PasswordDialog.tsx`
- Create: `src/features/messenger/MessengerApp.tsx`
- Create: `src/features/mail/MailApp.tsx`
- Create: `src/features/photo-viewer/PhotoViewerApp.tsx`
- Create: `src/features/photo-viewer/PhotoViewerApp.test.tsx`
- Create: `src/features/browser-history/BrowserHistoryApp.tsx`
- Create: `src/features/calendar/CalendarApp.tsx`
- Create: `src/features/recycle-bin/RecycleBinApp.tsx`
- Create: `src/features/system-logs/SystemLogsApp.tsx`
- Create: `src/features/file-explorer/RecordingPlayer.tsx`
- Create: `src/features/apps.css`
- Modify: `src/app/AppShell.tsx`

**Interfaces:**
- Every application consumes its domain slice from `caseDefinition` and emits `investigate(action)`.
- `PasswordDialog` consumes `{ itemId: string; onUnlocked(): void }` and delegates password truth to `canUnlockItem`.
- `RecordingPlayer` emits `VIEW_TRANSCRIPT` only after the user clicks “辅助转写”.

- [ ] **Step 1: Add failing interaction tests for discovery boundaries**

Test that opening a photo does not discover C03; clicking metadata does. Test calendar event C06, browser record C04, message C10, email C01, and transcript C12 each dispatch the correct action. Test bad password retains the dialog and `1119` exposes all three locked files.

- [ ] **Step 2: Implement file explorer and recording player**

Render the six folders and complete file set. Support preview/restore where applicable. Build a CSS waveform and a Web Audio graph created only from a play-button user gesture; expose progress, play/pause, volume, and a separate transcript control.

- [ ] **Step 3: Implement message and mail readers**

Display threads, timestamps, unread status, attachments, draft/sent/inbox labels, and ordinary red-herring background items. Opening a clue-bearing message emits the matching investigation action.

- [ ] **Step 4: Implement photo viewer**

Support previous/next, zoom controls, properties, metadata panel and evidence-board action. Metadata displays original `2031-08-03 18:46` and export `2031-11-17 23:18`, and only that panel action can unlock C03.

- [ ] **Step 5: Implement browser, calendar, recycle bin, and logs**

Browser supports keyword search and ascending/descending time sort. Logs filter by time, user, and event type. Recycle-bin previews/restores the three letter versions and dynamically displays the eight-clue file. Calendar exposes all five required events and password hint.

- [ ] **Step 6: Verify all ten app windows are non-empty and usable**

```powershell
npx vitest run src/features
npm run lint
npm run build
```

- [ ] **Step 7: Commit all case applications**

```powershell
git add src/features src/app/AppShell.tsx
git commit -m "feat: add data-driven case applications"
```

### Task 7: Evidence Board and Final Deduction

**Files:**
- Create: `src/features/evidence-board/EvidenceBoardApp.tsx`
- Create: `src/features/evidence-board/EvidenceCard.tsx`
- Create: `src/features/evidence-board/RelationLayer.tsx`
- Create: `src/features/evidence-board/EvidenceBoardApp.test.tsx`
- Create: `src/features/evidence-board/evidenceBoard.css`
- Create: `src/features/final-deduction/FinalDeduction.tsx`
- Create: `src/features/final-deduction/DeductionResultView.tsx`
- Create: `src/features/final-deduction/FinalDeduction.test.tsx`
- Create: `src/features/final-deduction/finalDeduction.css`
- Modify: `src/app/AppShell.tsx`

**Interfaces:**
- Consumes: discovered clues, pinned IDs, saved positions, relations, and scoring engine.
- Produces: store actions `setEvidencePosition`, `togglePinnedClue`, `addEvidenceRelation`, `removeEvidenceRelation`, and `submitDeduction`.

- [ ] **Step 1: Write failing evidence board tests**

Assert discovered clues render automatically; key toggle persists; moving a card invokes its position action; a relation requires two different clues; delete removes only the chosen relation; filters combine source, person, time and place.

- [ ] **Step 2: Implement bounded card movement and SVG relations**

Pointer movement clamps cards to the board. `RelationLayer` computes line endpoints from saved card rectangles, uses marker shapes plus visible relation labels, and has a list fallback where keyboard users can inspect and delete relationships.

- [ ] **Step 3: Write failing deduction-gate and score-view tests**

At five clues display the remaining count and disable entry. At six enable the form. Prevent selecting a seventh key clue and submission with zero contradiction relation. A valid full-score submission renders 100 and “档案重建完成”.

- [ ] **Step 4: Implement deduction and open ending**

Render the three fixed questions, up to six discovered evidence checkboxes, contradiction selector, optional local-only textarea, result breakdown, ignored key clues, chosen evidence, player text, open ending and “重新调查”. After submission, run the required log-check sequence and LINRAN login event once.

- [ ] **Step 5: Run focused and full application tests**

```powershell
npx vitest run src/features/evidence-board src/features/final-deduction
npm run test
npm run build
```

- [ ] **Step 6: Commit investigation completion**

```powershell
git add src/features/evidence-board src/features/final-deduction src/app/AppShell.tsx
git commit -m "feat: add evidence board and final deduction"
```

### Task 8: End-to-End Journey, Persistence, and Browser QA

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/player-journey.spec.ts`
- Create: `e2e/persistence.spec.ts`
- Create: `e2e/accessibility-smoke.spec.ts`
- Create: `scripts/capture-screenshots.mjs`
- Create after capture: `docs/images/desktop.png`
- Create after capture: `docs/images/evidence-board.png`

**Interfaces:**
- Produces stable testing selectors only where accessible roles/text are insufficient: `data-testid="desktop"`, `data-testid="evidence-board"`, and clue IDs.
- Playwright starts `npm run dev -- --host 127.0.0.1` and uses a deterministic boot-skip path.

- [ ] **Step 1: Install the browser and write the failing complete-journey spec**

```powershell
npx playwright install chromium
```

The test performs the mandated journey: boot, restore session, cancellation mail, Tang Yao chat, photo metadata, calendar hint, `1119`, logs, at least six clues, evidence board, contradiction relation, final submission, and result page.

- [ ] **Step 2: Add persistence and reset specs**

Discover C01, reload, and assert it remains. Reset through both confirmation actions and assert the progress returns to `0/12` while the selected scanline setting remains.

- [ ] **Step 3: Add browser and accessibility smoke checks**

Capture `pageerror` and console errors and fail on either. Test 1280×720, a small portrait viewport with the orientation notice, keyboard opening of a desktop app, Escape closing a dialog, and reduced-motion emulation.

- [ ] **Step 4: Run e2e and fix product defects without weakening assertions**

```powershell
npm run e2e
```

Expected: all Chromium tests pass, with no persistent console errors or inaccessible dead ends.

- [ ] **Step 5: Capture real screenshots**

The script opens the running game at 1440×900, skips boot, captures the populated desktop, discovers several clues, opens the evidence board and captures it. Run:

```powershell
node scripts/capture-screenshots.mjs
```

Verify both PNG files have non-zero size and visually show real application UI.

- [ ] **Step 6: Commit the journey and screenshots**

```powershell
git add playwright.config.ts e2e scripts docs/images src
git commit -m "test: cover case engine and player journey"
```

### Task 9: Product Documentation and Static Delivery

**Files:**
- Create: `README.md`
- Create: `docs/CASE_FORMAT.md`
- Create: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`
- Create: `LICENSE`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy-pages.yml`

**Interfaces:**
- CI runs `npm ci` then `npm run check` on main push and pull requests.
- Pages runs `npm ci`, `npm run build`, uploads `dist`, and deploys the `github-pages` environment on main push and `workflow_dispatch`.

- [ ] **Step 1: Write all project documentation with only verified claims**

README is Chinese-first and contains title, one-line pitch, a clearly marked deployment status until Pages is verified, both screenshots, gameplay, feature list, local commands, tests, architecture, Mermaid data flow, case structure, second-case guide, Pages deployment, privacy, roadmap, MIT license, folded spoiler, and short English introduction.

- [ ] **Step 2: Document the extension contract**

`docs/CASE_FORMAT.md` explains required IDs, Zod validation, timeline ordering, discovery actions, triggers, deduction answers, local assets, registration, and required case completeness tests. A second case should be added under `src/cases/<case-id>` without editing window-manager or core engine logic.

- [ ] **Step 3: Add CI workflow**

Use supported official actions versions and stable Node LTS. The workflow must have `permissions: contents: read`, cache npm, and run only the documented commands.

- [ ] **Step 4: Add Pages workflow**

Declare:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
```

Configure Pages, build with `GITHUB_REPOSITORY`, upload `dist`, and deploy in the `github-pages` environment.

- [ ] **Step 5: Run the complete local quality gate**

```powershell
npm run lint
npm run test
npm run build
npm run e2e
npm run check
git diff --check
```

Expected: every command exits 0 and the tree contains no secret or absolute `D:\` path outside ignored local logs.

- [ ] **Step 6: Commit documentation and delivery automation**

```powershell
git add README.md docs CONTRIBUTING.md CHANGELOG.md LICENSE .github .editorconfig .gitignore
git commit -m "docs: add project guide and screenshots"
git add .github vite.config.ts
git commit -m "ci: add checks and GitHub Pages deployment"
```

### Task 10: GitHub Publication, Pages Verification, and v0.1.0 Release

**Files:**
- Modify after verified deployment: `README.md`
- Modify after verified deployment: `CHANGELOG.md`

**Interfaces:**
- Produces public repository `PHLXXX/lost-desktop-museum` unless the preflight detects an unrelated repository, in which case use `lost-desktop-museum-game` and update all derived references.
- Produces a verified Pages URL and Release URL, or a precise permission blocker without a false success claim.

- [ ] **Step 1: Repeat remote preflight immediately before creation**

```powershell
gh auth status
gh api user --jq .login
gh repo view PHLXXX/lost-desktop-museum --json nameWithOwner,url 2>$null
git status --short
```

Expected: authenticated user is `PHLXXX`, preferred repository still does not exist, and local tree is clean.

- [ ] **Step 2: Create the public repository and push main**

```powershell
gh repo create lost-desktop-museum --public --source=. --remote=origin --push --description "An interactive mystery game told through the files, messages and traces left on an abandoned computer."
gh repo edit --add-topic interactive-fiction --add-topic mystery-game --add-topic web-game --add-topic react --add-topic typescript --add-topic vite --add-topic digital-archaeology
```

Do not run this command if the preflight finds an unrelated repository.

- [ ] **Step 3: Configure Pages for Actions and verify workflows**

Use `gh api` to create or update `/repos/PHLXXX/lost-desktop-museum/pages` with `build_type: workflow`. Then inspect:

```powershell
gh run list --limit 10
gh run watch --exit-status
```

If the token lacks Pages permission, record the exact API response and leave README deployment status unverified. The only manual instruction is Repository → Settings → Pages → Build and deployment → Source → GitHub Actions.

- [ ] **Step 4: Verify the deployed site before documenting its URL**

Obtain the URL from `gh api repos/PHLXXX/lost-desktop-museum/pages --jq .html_url`, request it, and run a Playwright smoke check against that exact URL. Confirm boot assets and application chunks load under the repository subpath.

- [ ] **Step 5: Update README and repository homepage only after success**

Replace the pending deployment line with the verified URL, then:

```powershell
git add README.md CHANGELOG.md
git commit -m "docs: publish verified demo address"
git push origin main
gh repo edit --homepage '<verified-pages-url>'
```

- [ ] **Step 6: Reconfirm CI, Pages, local tree, and commit history**

```powershell
npm run lint
npm run test
npm run build
npm run e2e
git status
git log --oneline
git remote -v
gh repo view
gh run list --limit 10
```

Expected: local checks pass, tree is clean, origin matches the created repository, and latest required workflows succeed. A permission-blocked Pages setup is reported as blocked rather than successful.

- [ ] **Step 7: Create the release only when release gates are satisfied**

```powershell
git tag -a v0.1.0 -m "v0.1.0 — The First Archive"
git push origin v0.1.0
gh release create v0.1.0 --title "v0.1.0 — The First Archive" --notes-file release-notes.md
```

Release notes list the first playable case, virtual desktop, ten applications, twelve clues, evidence board, deterministic deduction, local saves, and GitHub Pages only if its deployment was verified. Remove the temporary untracked `release-notes.md` after release creation using a recoverable local cleanup.

## Plan Self-Review Record

- Spec coverage: all fourteen approved design sections map to Tasks 1—10.
- Discovery coverage: every C01—C12 has a concrete action and a unit/component/e2e validation layer.
- Type consistency: `InvestigationAction`, `GameSave`, `TriggerEffect`, stores, and score interfaces are introduced before consumers.
- Delivery truthfulness: remote repository, Pages URL, CI, homepage, tag, and Release are updated only after their corresponding checks.
- Scope: one integrated MVP plan is retained because all subsystems participate in a single playable acceptance journey; milestones remain independently reviewable.
