# Deep Investigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add data-driven investigation objectives, finite progressive hints, replayable mastery challenges, and conditional result variants while preserving every v0.5.0 case and save.

**Architecture:** Extend `CaseDefinition` with an optional bounded gameplay block and resolve deterministic defaults for legacy cases. Keep evaluation in pure engines, persist only hint use and earned mastery, and expose the system through a non-modal investigation panel plus a focused Archive Workshop editor.

**Tech Stack:** React 19, TypeScript 6, Zustand 5, Zod 4, Vitest, Testing Library, Playwright, Vite 8.

## Global Constraints

- Retain `CaseDefinition.formatVersion: 1`; all gameplay fields are optional and backward compatible.
- Retain all built-in, local-import, community-install, workshop, preview, and offline behavior.
- No backend, account, telemetry, public score, arbitrary scripts, remote case assets, or external runtime dependency.
- UI text is Chinese; identifiers and source filenames are English.
- Use failing tests before production behavior and run lint, tests, and build at every milestone.
- Keep components under 300 lines and reuse the existing condition builder and archive visual tokens.

---

### Task 1: Gameplay types, schema, and deterministic defaults

**Files:**
- Modify: `src/cases/types.ts`
- Modify: `src/cases/schema.ts`
- Create: `src/gameplay/defaultGameplay.ts`
- Create: `src/gameplay/defaultGameplay.test.ts`
- Modify: `src/cases/runtimeFoundation.test.ts`

**Interfaces:**
- Produces: `InvestigationGameplayDefinition`, `InvestigationObjectiveDefinition`, `InvestigationHintDefinition`, `InvestigationChallengeDefinition`, `InvestigationEndingVariant`, `GameplayRequirement`.
- Produces: `resolveInvestigationGameplay(caseDefinition: CaseDefinition): InvestigationGameplayDefinition`.

- [ ] **Step 1: Write failing schema and default-resolution tests**

Assert that a valid optional gameplay block parses, invalid hint costs fail with a field path, and a legacy case resolves a primary objective, per-clue hints, four challenges, and no alternate ending.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/gameplay/defaultGameplay.test.ts src/cases/runtimeFoundation.test.ts`  
Expected: FAIL because gameplay types/schema and `resolveInvestigationGameplay` do not exist.

- [ ] **Step 3: Add bounded gameplay types and strict Zod schemas**

Use kebab-case IDs, `initialAnalysisPoints` from 0 through 9, exactly three tiers per hint with positive integer costs, and bounded arrays. Add `gameplay?: InvestigationGameplayDefinition` to `CaseDefinition`.

- [ ] **Step 4: Implement deterministic defaults**

Generate objective IDs under `default-*`, derive clue hint text from source/action/target labels, omit the relationship objective when there are no configured contradictions, and return stable ordering by case definition order.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- src/gameplay/defaultGameplay.test.ts src/cases/runtimeFoundation.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

Commit: `feat: add compatible deep investigation model`

### Task 2: Objective, hint, challenge, and ending engines

**Files:**
- Create: `src/gameplay/gameplayContext.ts`
- Create: `src/gameplay/objectiveEngine.ts`
- Create: `src/gameplay/objectiveEngine.test.ts`
- Create: `src/gameplay/hintEngine.ts`
- Create: `src/gameplay/hintEngine.test.ts`
- Create: `src/gameplay/challengeEngine.ts`
- Create: `src/gameplay/challengeEngine.test.ts`
- Create: `src/gameplay/endingEngine.ts`
- Create: `src/gameplay/endingEngine.test.ts`

**Interfaces:**
- Consumes: `resolveInvestigationGameplay` and the existing `evaluateCondition`.
- Produces: `createGameplayContext(save: GameSave, result?: DeductionResult): GameplayContext`.
- Produces: `getObjectiveStates(definition, save): ObjectiveState[]`.
- Produces: `getHintState(definition, save): HintState` and `revealNextHint(definition, save, hintId): HintRevealResult`.
- Produces: `evaluateChallenges(definition, save, result): string[]`.
- Produces: `selectEnding(definition, save, result): { id: string | null; title: string; text: string }`.

- [ ] **Step 1: Write failing engine tests**

Cover nested condition completion, hidden-objective reveal, three sequential hint tiers, exact cost deduction, completed-clue rejection, exhausted points, all five requirement variants, and stable ending priority.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/gameplay`  
Expected: FAIL on missing engine modules.

- [ ] **Step 3: Implement the pure context and objective engine**

Build event, clue, relation, and trigger sets from `GameSave`; evaluate completion through the existing condition engine. Return explicit `visible`, `complete`, and `kind` state.

- [ ] **Step 4: Implement the pure hint engine**

Calculate points from configured costs and `hintUsage`, reveal only the next tier, return `{ ok: false, reason }` without mutating input, and ignore unknown saved hint IDs.

- [ ] **Step 5: Implement challenge and ending engines**

Evaluate all requirements with AND semantics. Require an existing result for score and no-hint mastery. Sort eligible endings by descending priority then stable ID.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- src/gameplay`  
Expected: PASS.

- [ ] **Step 7: Commit**

Commit: `feat: add investigation gameplay engines`

### Task 3: Save v4 and store integration

**Files:**
- Modify: `src/cases/types.ts`
- Modify: `src/engine/persistence.ts`
- Modify: `src/engine/persistence.test.ts`
- Modify: `src/store/gameStore.ts`
- Modify: `src/store/gameStore.test.ts`

**Interfaces:**
- Adds to `GameSave`: `hintUsage: Record<string, number>` and `bestChallengeIds: string[]`.
- Adds store action: `revealHint(hintId: string): HintRevealResult`.
- Extends `DeductionResult` with optional `challengeIds` and `endingVariantId`.

- [ ] **Step 1: Write failing migration and store tests**

Test v3 defaults, malformed negative/fractional hint normalization, debounced persistence after hint reveal, no mutation when reveal fails, challenge recording on submit, and reset retaining mastery while clearing current hint use.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/engine/persistence.test.ts src/store/gameStore.test.ts`  
Expected: FAIL because save v4 fields and actions are absent.

- [ ] **Step 3: Implement save v4 migration**

Set `CURRENT_SAVE_VERSION = 4`, create empty defaults, normalize all hint values with `Math.max(0, Math.floor(value))`, de-duplicate best challenge IDs, and retain all existing migration behavior.

- [ ] **Step 4: Integrate hint reveal and objective feedback into the store**

Apply successful pure-engine results, persist with the existing 350 ms debounce, play the existing low-volume clue sound, and return exact failure reasons. Append newly completed objective titles to the current evidence notice without forcing navigation.

- [ ] **Step 5: Integrate challenges and endings into deduction submission**

Score first, evaluate challenges, select the ending, save current-run IDs in the result, and merge them into `bestChallengeIds`.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- src/engine/persistence.test.ts src/store/gameStore.test.ts`  
Expected: PASS.

- [ ] **Step 7: Commit**

Commit: `feat: persist hints and case mastery`

### Task 4: Investigation panel and desktop integration

**Files:**
- Create: `src/features/investigation/InvestigationPanel.tsx`
- Create: `src/features/investigation/InvestigationPanel.test.tsx`
- Create: `src/features/investigation/ObjectiveList.tsx`
- Create: `src/features/investigation/HintList.tsx`
- Create: `src/features/investigation/ChallengeList.tsx`
- Modify: `src/features/desktop/Desktop.tsx`
- Modify: `src/features/desktop/Desktop.test.tsx`
- Modify: `src/features/system/SystemMenu.tsx`
- Modify: `src/styles/game.css`

**Interfaces:**
- `InvestigationPanel({ open, onClose }: { open: boolean; onClose(): void })` reads active definition/store state and owns only tab and confirmation UI state.
- `SystemMenu` receives `onOpenInvestigationPanel(): void`.

- [ ] **Step 1: Write failing component tests**

Test taskbar opening, text states, tab keyboard access, inline hint confirmation and cost, successful reveal, failure text, and Escape priority: confirmation → panel → system menu.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/features/investigation/InvestigationPanel.test.tsx src/features/desktop/Desktop.test.tsx`  
Expected: FAIL because the panel and taskbar action do not exist.

- [ ] **Step 3: Implement focused panel components**

Render tabs with `aria-selected`, progress with textual status, no raw IDs in normal copy, and an inline `ArchiveDialog` confirmation before spending a point.

- [ ] **Step 4: Integrate taskbar, system menu, and Escape ordering**

Add `调查目标 n/m`, close the highest-level gameplay dialog first, close the panel second, and only then toggle the system menu. Do not interfere with existing modal handling.

- [ ] **Step 5: Add responsive and reduced-motion styling**

Use a 360 px right panel on desktop and a bounded bottom drawer under 1024 px. Reuse tokens, use 4–8 px radii, and disable transitions under reduced motion.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- src/features/investigation/InvestigationPanel.test.tsx src/features/desktop/Desktop.test.tsx`  
Expected: PASS.

- [ ] **Step 7: Commit**

Commit: `feat: add investigation objectives and hints panel`

### Task 5: Case detail, museum mastery, and result report

**Files:**
- Modify: `src/features/museum/CaseDetail.tsx`
- Modify: `src/features/museum/MuseumHome.tsx`
- Modify: `src/features/museum/MuseumHome.test.tsx`
- Modify: `src/features/result/ResultScreen.tsx`
- Modify: `src/features/result/ResultScreen.test.tsx`
- Modify: `src/styles/game.css`

**Interfaces:**
- Consumes: `resolveInvestigationGameplay`, `getObjectiveStates`, `evaluateChallenges`, and `selectEnding`.
- No new route or global navigation state.

- [ ] **Step 1: Write failing presentation tests**

Assert that case detail shows analysis points/challenge names, museum rows show `专精 x/y`, and the result report shows objective completion, current-run challenge badges, hints used, play time, and selected ending text.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/features/museum/MuseumHome.test.tsx src/features/result/ResultScreen.test.tsx`  
Expected: FAIL on missing mastery and report content.

- [ ] **Step 3: Add case preview and museum mastery**

Use derived gameplay data, hide zero-value noise, and preserve existing start/continue/restart actions.

- [ ] **Step 4: Upgrade the result sheet**

Keep the current 100-point breakdown, add objective/challenge/stat sections, render the persisted ending choice, and describe incomplete objectives only at their authored summary level.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- src/features/museum/MuseumHome.test.tsx src/features/result/ResultScreen.test.tsx`  
Expected: PASS.

- [ ] **Step 6: Commit**

Commit: `feat: add mastery and deep investigation reports`

### Task 6: Archive Workshop gameplay authoring

**Files:**
- Modify: `src/editor/model/caseDraft.ts`
- Modify: `src/editor/model/authoringProject.ts`
- Modify: `src/editor/compiler/compileCaseDraft.ts`
- Modify: `src/editor/compiler/decompileCaseDefinition.ts`
- Modify: `src/editor/compiler/compiler.test.ts`
- Modify: `src/editor/components/EditorSidebar.tsx`
- Modify: `src/editor/components/EditorShell.tsx`
- Create: `src/editor/features/gameplay-editor/GameplayEditor.tsx`
- Create: `src/editor/features/gameplay-editor/GameplayEditor.test.tsx`
- Create: `src/editor/features/gameplay-editor/ObjectiveEditor.tsx`
- Create: `src/editor/features/gameplay-editor/HintEditor.tsx`
- Create: `src/editor/features/gameplay-editor/OutcomeEditor.tsx`
- Modify: `src/styles/workshop.css`

**Interfaces:**
- Adds `gameplay` to `CaseDraft` and `gameplay` to `EditorSection`.
- Compilation emits `gameplay` only when custom gameplay is enabled/present.
- Decompilation retains authored gameplay and initializes an undefined block for legacy cases.

- [ ] **Step 1: Write failing compiler and editor tests**

Test exact gameplay round-trip, legacy draft compilation, section navigation, objective creation with a real condition, hint clue selection, challenge threshold editing, and ending priority editing.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/editor/compiler/compiler.test.ts src/editor/features/gameplay-editor/GameplayEditor.test.tsx`  
Expected: FAIL because draft/editor support is absent.

- [ ] **Step 3: Extend draft, compilation, and decompilation**

Use structured clones, preserve `undefined` for legacy/custom-disabled gameplay, and do not mutate any content arrays during conversion.

- [ ] **Step 4: Implement the gameplay editor modules**

Keep each component focused: general/objectives, hints, and challenges/endings. Reuse `ConditionBuilder`; offer only whitelisted requirement types and bounded numeric inputs.

- [ ] **Step 5: Integrate navigation and issue routing**

Add `玩法设计` beneath triggers, route `gameplay.*` validation paths back to the section, and retain read-only fieldset behavior.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- src/editor/compiler/compiler.test.ts src/editor/features/gameplay-editor/GameplayEditor.test.tsx`  
Expected: PASS.

- [ ] **Step 7: Commit**

Commit: `feat: author deep investigation gameplay in workshop`

### Task 7: Semantic validation and authored built-in gameplay

**Files:**
- Modify: `src/engine/validation.ts`
- Modify: `src/engine/engine.test.ts`
- Modify: `src/cases/case-001/case.ts`
- Modify: `src/cases/case-001/case.test.ts`
- Modify: `src/cases/case-002/case.ts`
- Modify: `src/editor/model/caseDraft.ts`
- Modify: `examples/editor/minimal-valid-project/project.json`
- Modify: `src/cases/validateCases.test.ts`

**Interfaces:**
- Produces structured validation codes for duplicate IDs, missing clue/objective references, impossible points, and unreachable objective conditions.
- Built-in cases expose authored non-spoiler hints and at least one eligible alternate archive note.

- [ ] **Step 1: Write failing validation and built-in content tests**

Assert precise error paths/codes, at least three authored hints per built-in case, valid objective references, and a reachable high-mastery ending variant.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/engine/engine.test.ts src/cases/case-001/case.test.ts src/cases/validateCases.test.ts`  
Expected: FAIL on missing semantic checks and authored gameplay.

- [ ] **Step 3: Add semantic validation**

Reuse existing case target/reference inventories. Validate every gameplay collection independently and return actionable paths such as `gameplay.hints.0.clueId`.

- [ ] **Step 4: Author built-in and template gameplay**

Write non-spoiler objectives/hints tied to real clue IDs, generic mastery challenges, and optional archive-note endings. Update the editor example through its source draft rather than generated package output.

- [ ] **Step 5: Run focused tests and case validation**

Run: `npm test -- src/engine/engine.test.ts src/cases/case-001/case.test.ts src/cases/validateCases.test.ts && npm run validate:editor-examples`  
Expected: PASS.

- [ ] **Step 6: Commit**

Commit: `feat: add authored deep investigation content`

### Task 8: End-to-end replayability regression

**Files:**
- Create: `e2e/deep-investigation.spec.ts`
- Modify: `e2e/player-journey.spec.ts`
- Modify: `e2e/archive-workshop.spec.ts`

**Interfaces:**
- Exercises only user-visible routes and controls; no production test hooks.

- [ ] **Step 1: Write the failing Playwright journey**

Cover objectives, one confirmed hint, clue completion, deduction report, mastery persistence, restart clearing hint use, and a legacy no-gameplay package fallback.

- [ ] **Step 2: Run the new E2E and verify RED**

Run: `npx playwright test e2e/deep-investigation.spec.ts --project=chromium`  
Expected: FAIL until the complete user flow is wired.

- [ ] **Step 3: Fix integration gaps without weakening assertions**

Use accessible names and deterministic saved timestamps; do not add hidden DOM state or wait-only sleeps.

- [ ] **Step 4: Run gameplay and regression E2E**

Run: `npx playwright test e2e/deep-investigation.spec.ts e2e/player-journey.spec.ts e2e/archive-workshop.spec.ts --project=chromium`  
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `test: cover deep investigation replay loop`

### Task 9: Release documentation and full verification

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Create: `docs/DEEP_INVESTIGATION.md`
- Create: `docs/images/stage6-investigation-objectives.png`
- Create: `docs/images/stage6-analysis-hints.png`
- Create: `docs/images/stage6-investigation-report.png`
- Create: `docs/images/stage6-gameplay-editor.png`

**Interfaces:**
- Sets application version to `0.6.0` and documents only verified behavior.

- [ ] **Step 1: Update documentation and version metadata**

Document objectives, the three-point hint economy, mastery persistence, conditional archive notes, authoring, keyboard behavior, compatibility, and local-only privacy.

- [ ] **Step 2: Run static verification**

Run: `npm run typecheck && npm run lint && npm run test && npm run test:coverage && npm run validate:cases && npm run validate:editor-examples && npm run build && npm run check`  
Expected: every command exits 0 with no TypeScript or ESLint errors.

- [ ] **Step 3: Run full browser verification**

Run: `npm run e2e`  
Expected: all required Playwright tests pass; only explicitly documented historical skips may remain.

- [ ] **Step 4: Capture and inspect real 1440×900 screenshots**

Use the running production preview. Verify no overflow at 1280×720, no full-screen obstruction, readable hint confirmations, correct reduced-motion behavior, and no console errors.

- [ ] **Step 5: Confirm repository hygiene**

Run: `git status --short`, inspect the diff, verify no `dist`, Playwright video/trace, credentials, machine paths, or unrelated changes are staged.

- [ ] **Step 6: Commit**

Commit: `chore: prepare v0.6.0 deep investigation release`

## Plan self-review

- Every approved design requirement maps to Tasks 1–9.
- Runtime and editor changes are separated by stable typed interfaces.
- Legacy package and save compatibility have explicit tests before implementation.
- Every production behavior has a preceding RED step and focused GREEN command.
- No task introduces a server, remote dependency, arbitrary code, or account feature.
- Every step names its concrete behavior, files, verification command, and expected result.
