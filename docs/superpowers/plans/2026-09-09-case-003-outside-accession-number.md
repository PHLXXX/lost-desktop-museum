# Case 003 Outside the Accession Number Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the complete built-in case 003《编号之外》and make the safe extended archive applications participate in clue discovery.

**Architecture:** Keep case content as a self-contained `CaseDefinition` under `src/cases/case-003/` and register it through the existing built-in registry. Expand the existing investigation action contract to cover already-declared safe archive events, then let each extended application dispatch only fixed, data-defined actions through `useGameStore.investigate`; no command execution or network access is introduced.

**Tech Stack:** React 19, TypeScript 6, Zustand 5, Zod 4, Vitest, Testing Library, Playwright, Vite 8.

## Global Constraints

- Keep the existing React/Vite architecture and do not create another main project.
- Preserve cases 001 and 002, all existing saves, installed cases, workshop projects and community data.
- Case 003 uses ID `case-003`, ten discoverable clues, three deduction questions, two ending variants and three rewards.
- Extended apps emit declarative archive events only; the simulated terminal never executes Shell or case-provided code.
- All case assets are repository-local; no remote image, font, audio or script is allowed.
- Case-specific copy stays in the case definition rather than shared React components.
- Follow red-green-refactor for each behavior and commit each independently reviewable deliverable.

---

## File Map

- `src/cases/types.ts`: shared safe investigation action type.
- `src/cases/schema.ts`: Zod contract for extended clue discovery actions.
- `src/features/apps/ExtendedApps.tsx`: explicit inspect/verify interactions for extended applications.
- `src/features/apps/archiveApplications.test.tsx`: component-level evidence that interactions dispatch once and reveal clues.
- `src/assets/illustrations/accession-vault.svg`: local reviewed artwork for case 003.
- `src/cases/case-003/case.ts`: all case 003 narrative, records, deductions, gameplay and rewards.
- `src/cases/case-003/case.test.ts`: case-specific release contract.
- `src/cases/builtInIds.ts`: stable built-in case ID list.
- `src/cases/registry.ts`: case 003 registration.
- `src/cases/runtimeFoundation.test.ts`: multi-case registry and save isolation regression.
- `src/app/appPhase.test.tsx`: completed-case museum rendering count.
- `e2e/case-003.spec.ts`: player journey through extended-app clues, save/resume and deduction.
- `README.md`, `CHANGELOG.md`, `docs/DEEP_INVESTIGATION.md`: shipped feature documentation.
- `docs/images/stage6-case003-*.png`: real runtime screenshots.

---

### Task 1: Connect safe extended-app interactions to the investigation engine

**Files:**
- Modify: `src/cases/types.ts`
- Modify: `src/cases/schema.ts`
- Modify: `src/features/apps/ExtendedApps.tsx`
- Modify: `src/features/apps/archiveApplications.test.tsx`

**Interfaces:**
- Consumes: `useGameStore.getState().investigate(action)` and `eventKey(type, itemId)`.
- Produces: `InvestigationActionType`, `{ type: InvestigationActionType; itemId: string }`, and buttons that dispatch `VIEW_AUDIO_MARKER`, `OPEN_ITEM`, `RUN_COMMAND`, `VIEW_VERSION_DIFF`, or `VIEW_MAP_LOCATION`.

- [ ] **Step 1: Write failing schema and component tests**

Add a test candidate whose clue uses an extended action and verify the four central interactions:

```tsx
const definition = structuredClone(case002)
definition.id = 'test-extended-events'
definition.manifest.caseId = definition.id
definition.manifest.builtIn = false
definition.clues = [
  { ...definition.clues[0]!, id: 'terminal-clue', source: 'terminal', discovery: { type: 'RUN_COMMAND', itemId: 'terminal-source' }, condition: { type: 'event', eventType: 'RUN_COMMAND', targetId: 'terminal-source' } },
  { ...definition.clues[0]!, id: 'version-clue', source: 'versions', discovery: { type: 'VIEW_VERSION_DIFF', itemId: 'version-schedule' }, condition: { type: 'event', eventType: 'VIEW_VERSION_DIFF', targetId: 'version-schedule' } },
  { ...definition.clues[0]!, id: 'map-clue', source: 'sitemap', discovery: { type: 'VIEW_MAP_LOCATION', itemId: 'site-studio' }, condition: { type: 'event', eventType: 'VIEW_MAP_LOCATION', targetId: 'site-studio' } },
  { ...definition.clues[0]!, id: 'data-clue', source: 'data', discovery: { type: 'OPEN_ITEM', itemId: 'data-delay' }, condition: { type: 'event', eventType: 'OPEN_ITEM', targetId: 'data-delay' } },
]
```

Render `TerminalApp`, `VersionDiffApp`, `SitemapApp`, and `DataDeskApp`; click their named verification controls and assert the four clue IDs and completed event keys are present.

- [ ] **Step 2: Run the focused test and confirm red**

Run: `npm test -- src/features/apps/archiveApplications.test.tsx src/cases/runtimeFoundation.test.ts`
Expected: FAIL because the extended action is rejected by the discovery type/schema and the applications do not dispatch those actions.

- [ ] **Step 3: Expand the action contract without expanding execution authority**

Use one explicit union in `src/cases/types.ts`:

```ts
export type FileClueActionType =
  | 'OPEN_ITEM' | 'VIEW_METADATA' | 'COMPARE_ITEMS' | 'VIEW_TRANSCRIPT' | 'UNLOCK_ITEM' | 'VIEW_LOG'

export type InvestigationActionType =
  | FileClueActionType
  | 'RUN_COMMAND' | 'VIEW_AUDIO_MARKER' | 'VIEW_MAP_LOCATION' | 'VIEW_VERSION_DIFF'

export type InvestigationAction = { type: InvestigationActionType; itemId: string }
export type GameEventType = InvestigationActionType | 'VIEW_MAIL_HEADERS' | 'RESTORE_ITEM' | 'COMPARE_AUDIO' | 'CREATE_RELATION'
```

Mirror this allowlist in `src/cases/schema.ts`. Keep `VirtualFile.clueAction` restricted to the original file-relevant actions while `clue.discovery` accepts every `InvestigationActionType`.

- [ ] **Step 4: Add explicit verification controls to the extended applications**

Call `investigate` only from user interactions. Required accessible names:

```tsx
<button onClick={() => investigate({ type: 'OPEN_ITEM', itemId: table.id })}>核验数据表</button>
<button onClick={() => investigate({ type: 'RUN_COMMAND', itemId: item.id })}>{item.command}</button>
<button onClick={() => investigate({ type: 'VIEW_VERSION_DIFF', itemId: selected.id })}>核验差异</button>
<button onClick={() => investigate({ type: 'VIEW_MAP_LOCATION', itemId: node.id })}>{node.label}</button>
```

Hide audio transcript text until the player chooses “查看转写”, and make broadcast rows explicit buttons instead of passive articles.

- [ ] **Step 5: Run the focused tests and confirm green**

Run: `npm test -- src/features/apps/archiveApplications.test.tsx src/cases/runtimeFoundation.test.ts`
Expected: PASS, including one-time clue notification behavior inherited from `discoverClues`.

- [ ] **Step 6: Commit the engine interaction slice**

```bash
git add src/cases/types.ts src/cases/schema.ts src/features/apps/ExtendedApps.tsx src/features/apps/archiveApplications.test.tsx
git commit -m "feat: connect extended apps to investigation events"
```

---

### Task 2: Add and register the complete case 003 definition

**Files:**
- Create: `src/assets/illustrations/accession-vault.svg`
- Create: `src/cases/case-003/case.ts`
- Create: `src/cases/case-003/case.test.ts`
- Modify: `src/cases/builtInIds.ts`
- Modify: `src/cases/registry.ts`
- Modify: `src/cases/runtimeFoundation.test.ts`

**Interfaces:**
- Consumes: `CaseDefinition`, extended investigation actions, existing gameplay condition/reward engines.
- Produces: exported `caseDefinition` with ID `case-003`, and `builtInCaseIds === ['case-001', 'case-002', 'case-003']`.

- [ ] **Step 1: Write the failing case release test**

Create `src/cases/case-003/case.test.ts` with concrete invariants:

```ts
expect(caseDefinition.id).toBe('case-003')
expect(caseDefinition.clues).toHaveLength(10)
expect(new Set(caseDefinition.clues.map((clue) => clue.id)).size).toBe(10)
expect(new Set(caseDefinition.clues.map((clue) => clue.source))).toEqual(new Set(['files', 'versions', 'data', 'logs', 'messages', 'mail', 'calendar', 'photos', 'sitemap', 'terminal']))
expect(caseDefinition.questions).toHaveLength(3)
expect(caseDefinition.gameplay?.hints).toHaveLength(10)
expect(caseDefinition.gameplay?.objectives).toHaveLength(5)
expect(caseDefinition.gameplay?.rewards).toHaveLength(3)
expect(validateCaseDefinition(caseDefinition).filter((issue) => issue.severity === 'error')).toEqual([])
```

Also update the runtime registry assertion to expect all three IDs and the title `编号之外`.

- [ ] **Step 2: Run the case tests and confirm red**

Run: `npm test -- src/cases/case-003/case.test.ts src/cases/runtimeFoundation.test.ts`
Expected: FAIL because `case-003/case.ts` and its registry entry do not exist.

- [ ] **Step 3: Create the local case artwork**

Add an SVG with a muted archive-vault palette, two offset accession labels `A-731` and `R-731`, storage shelf lines, and no external links, scripts, animation, embedded raster data or remote fonts.

- [ ] **Step 4: Implement the complete `CaseDefinition`**

Use the exact content contract from the design spec. The clue action mapping must be:

```ts
[
  ['C01', 'files', 'OPEN_ITEM', 'file-seal-list'],
  ['C02', 'versions', 'VIEW_VERSION_DIFF', 'version-a731'],
  ['C03', 'data', 'OPEN_ITEM', 'data-label-jobs'],
  ['C04', 'logs', 'VIEW_LOG', 'log-qiaowen-auth'],
  ['C05', 'messages', 'OPEN_ITEM', 'message-old-pass'],
  ['C06', 'mail', 'OPEN_ITEM', 'mail-transfer-draft'],
  ['C07', 'calendar', 'OPEN_ITEM', 'calendar-no-transfer'],
  ['C08', 'photos', 'VIEW_METADATA', 'photo-label-overlay'],
  ['C09', 'sitemap', 'VIEW_MAP_LOCATION', 'site-east-lift'],
  ['C10', 'terminal', 'RUN_COMMAND', 'terminal-print-queue'],
]
```

Include 16 enabled applications, five timeline records, at least three entities, supporting records in every extended app, ten three-tier hints, five objectives, five challenges, two ending variants and these rewards:

```ts
[
  { id: 'double-layer-accession-tag', kind: 'artifact', title: '双层藏品标签', requirements: [] },
  { id: 'catalog-auditor', kind: 'badge', title: '目录核验员', requirements: [{ type: 'all-clues' }, { type: 'relation-count-at-least', value: 2 }] },
  { id: 'silent-reconciliation', kind: 'badge', title: '无痕复核', requirements: [{ type: 'all-clues' }, { type: 'no-hints' }, { type: 'score-at-least', value: 90 }] },
]
```

- [ ] **Step 5: Register the case and preserve ordering**

Import `case-003/case` in `src/cases/registry.ts`, append it to the built-in map, and append `case-003` to `builtInCaseIds`. Do not change installed or preview registry semantics.

- [ ] **Step 6: Run the release gates and confirm green**

Run: `npm test -- src/cases/case-003/case.test.ts src/cases/runtimeFoundation.test.ts src/cases/validateCases.test.ts`
Expected: PASS for all three built-in definitions with no validation errors.

- [ ] **Step 7: Commit the case content slice**

```bash
git add src/assets/illustrations/accession-vault.svg src/cases/case-003 src/cases/builtInIds.ts src/cases/registry.ts src/cases/runtimeFoundation.test.ts
git commit -m "feat: add archive case 003"
```

---

### Task 3: Prove museum lifecycle, save isolation and reward continuity

**Files:**
- Modify: `src/app/appPhase.test.tsx`
- Modify: `src/features/museum/MuseumHome.test.tsx`
- Modify: `src/store/gameStore.test.ts`
- Modify: `src/features/result/ResultScreen.test.tsx`

**Interfaces:**
- Consumes: case registry, per-case persistence keys and reward store.
- Produces: regression coverage for a third built-in entry, independent case 003 save and repeatable reward display.

- [ ] **Step 1: Write failing lifecycle assertions**

Add tests that:

```ts
expect(screen.getByRole('heading', { name: '编号之外' })).toBeInTheDocument()
expect(screen.getByText('0 / 10')).toBeInTheDocument()
expect(screen.getByText('奖励 0 / 3')).toBeInTheDocument()
```

Save `C02` into case 003, activate case 001, then reactivate case 003 and assert `C02` remains while case 001 clues are unchanged. Complete case 003 twice and assert reward keys remain unique.

- [ ] **Step 2: Run lifecycle tests and confirm red**

Run: `npm test -- src/app/appPhase.test.tsx src/features/museum/MuseumHome.test.tsx src/store/gameStore.test.ts src/features/result/ResultScreen.test.tsx`
Expected: at least one count/content assertion fails before third-case fixtures are updated.

- [ ] **Step 3: Update only count-sensitive fixtures and assertions**

Change fixed completed-card counts from two to three only where the test intentionally preloads all built-in saves. Keep tests scoped to their original case when they verify case-specific copy. Add case 003 save isolation data with `createFreshSave('case-003')`; do not alter persistence keys for cases 001 or 002.

- [ ] **Step 4: Run lifecycle tests and confirm green**

Run the same command.
Expected: PASS, including independent save and idempotent reward assertions.

- [ ] **Step 5: Commit lifecycle coverage**

```bash
git add src/app/appPhase.test.tsx src/features/museum/MuseumHome.test.tsx src/store/gameStore.test.ts src/features/result/ResultScreen.test.tsx
git commit -m "test: cover case 003 lifecycle and rewards"
```

---

### Task 4: Add a real browser journey for case 003

**Files:**
- Create: `e2e/case-003.spec.ts`

**Interfaces:**
- Consumes: museum hash routing, desktop windows, extended-app accessible controls, system menu, deduction and result screens.
- Produces: one stable Chromium journey independent of network and system time.

- [ ] **Step 1: Write the failing Playwright journey**

The journey must:

1. Clear local storage and open `#/museum`.
2. Open `查看 编号之外 案件简介`, start, skip boot and dismiss onboarding when present.
3. Open versions and click `核验差异`; open terminal and click `queue --inspect A-731`; verify `2 / 10` in taskbar progress.
4. Open the system menu, save and return; verify the museum row shows `2 / 10`.
5. Continue case 003 and verify the two clue titles in the evidence board.
6. Inject the remaining declared interactions through visible application controls, pin six core clues, establish both required relations, answer all three questions and submit.
7. Verify the result shows the high result level and `双层藏品标签`.
8. Return to the museum and verify `奖励 3 / 3` for the case when the mastery requirements were met.

- [ ] **Step 2: Run the journey and confirm red**

Run: `npx playwright test e2e/case-003.spec.ts --project=chromium`
Expected: FAIL at the first missing or inaccessible case 003 control.

- [ ] **Step 3: Stabilize selectors without weakening assertions**

Use roles, accessible names and `.exhibit-row` scoping. If a control has no stable accessible name, add an `aria-label` to the production control rather than selecting by DOM position. Do not bypass the UI with direct Zustand calls.

- [ ] **Step 4: Run the journey and confirm green**

Run: `npx playwright test e2e/case-003.spec.ts --project=chromium`
Expected: PASS with no page errors, uncaught exceptions or failed local asset requests.

- [ ] **Step 5: Commit the browser regression**

```bash
git add e2e/case-003.spec.ts src/features/apps/ExtendedApps.tsx
git commit -m "test: play through archive case 003"
```

---

### Task 5: Capture and inspect real runtime screenshots

**Files:**
- Create: `docs/images/stage6-case003-museum.png`
- Create: `docs/images/stage6-case003-investigation.png`
- Create: `docs/images/stage6-case003-result.png`
- Modify: `e2e/case-003.spec.ts`

**Interfaces:**
- Consumes: the tested browser journey at 1440×900.
- Produces: three PNGs from the actual rendered app, not composed mockups.

- [ ] **Step 1: Add deterministic screenshot checkpoints**

Set the viewport to 1440×900 and call:

```ts
await page.screenshot({ path: 'docs/images/stage6-case003-museum.png', fullPage: true })
await page.screenshot({ path: 'docs/images/stage6-case003-investigation.png', fullPage: true })
await page.screenshot({ path: 'docs/images/stage6-case003-result.png', fullPage: true })
```

Capture the museum with the third row visible, investigation with a version or terminal clue visible, and the completed result with reward copy visible.

- [ ] **Step 2: Generate the screenshots**

Run: `npx playwright test e2e/case-003.spec.ts --project=chromium --update-snapshots`
Expected: PASS and three non-empty PNG files.

- [ ] **Step 3: Visually inspect all three images**

Verify readable Chinese text, no blank windows, no clipped controls at 1440×900, a visible return path, distinct extended-app structure, no remote asset placeholder and no debug data. Fix layout issues in existing scoped CSS only when visible in the captured runtime.

- [ ] **Step 4: Commit inspected screenshots**

```bash
git add docs/images/stage6-case003-*.png e2e/case-003.spec.ts src/styles
git commit -m "docs: capture archive case 003 journey"
```

---

### Task 6: Document the shipped third case and run all release gates

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/DEEP_INVESTIGATION.md`

**Interfaces:**
- Consumes: final test counts, screenshot paths and shipped case content.
- Produces: accurate v0.6.0 documentation and verified branch state.

- [ ] **Step 1: Update documentation with implemented facts only**

Change “two built-in cases” to three, list《编号之外》without exposing the final deduction at the top of the README, update the total clue count from 18 to 28, add the three screenshot links, and document:

```markdown
- 《编号之外》：5 个目标、10 组定制提示、5 个挑战、2 个条件档案注记、3 项专属奖励。
```

Add a v0.6.0 changelog bullet for the third complete case and the safe extended-app investigation interactions.

- [ ] **Step 2: Run focused content validation**

Run: `npm run validate:cases`
Expected: PASS for case 001, case 002 and case 003.

- [ ] **Step 3: Run the complete quality gate**

Run: `npm run check`
Expected: typecheck, lint, all Vitest suites, case validation, editor example validation and production build PASS.

- [ ] **Step 4: Run coverage and complete browser regression**

Run: `npm run test:coverage`
Expected: PASS and a generated local coverage report.
Run: `npm run e2e`
Expected: all Playwright projects PASS with zero failed tests.

- [ ] **Step 5: Review the final diff and repository hygiene**

Run: `git diff --check` and `git status --short`.
Expected: no whitespace errors; only intended source, tests, docs and screenshots are staged or modified. Confirm `node_modules`, `dist`, coverage output, Playwright videos, traces, tokens and machine-specific paths are not tracked.

- [ ] **Step 6: Commit documentation and release evidence**

```bash
git add README.md CHANGELOG.md docs/DEEP_INVESTIGATION.md
git commit -m "docs: document archive case 003"
```

- [ ] **Step 7: Push and verify the existing pull request**

Push `feat/stage-6-deep-investigation` without force, update PR #7 with case 003 scope and real test results, then wait for GitHub checks. Do not merge unless the user separately requests release/merge after review.

---

## Self-Review Result

- Spec coverage: story, all ten clue interactions, deductions, objectives, hints, challenges, endings, rewards, save isolation, screenshots, documentation and regression gates each map to a task.
- Type consistency: `InvestigationActionType` feeds `InvestigationAction`, `GameEventType`, Zod action parsing, store investigation and component dispatches with the same event names.
- Scope control: no new dependency, global theme, backend, remote resource, executable terminal, case editor redesign or rewrite of prior cases is included.
- Execution choice: inline execution is selected because the user delegated implementation decisions and did not request subagent delegation.
