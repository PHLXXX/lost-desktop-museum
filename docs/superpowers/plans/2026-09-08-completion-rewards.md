# Completion Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add permanent local completion collectibles, mastery badges, and equippable allowlisted ARCHIVE/OS themes without changing investigation difficulty.

**Architecture:** Case definitions optionally declare rewards using the existing gameplay requirement language. A pure reward engine evaluates them after deduction; a separate cross-case local profile deduplicates unlocks and stores the selected built-in theme. Result, museum, and Workshop surfaces consume those focused APIs.

**Tech Stack:** React 19, TypeScript 6, Zustand 5, Zod 4, Vitest, Testing Library, Playwright, localStorage.

## Global Constraints

- Keep `CaseDefinition.formatVersion` at `1`; all reward fields are optional and old packages must remain valid.
- Rewards never grant hints, answers, scores, or gameplay power.
- Theme IDs are limited to `archive-standard`, `departure-night`, and `signal-blueprint`.
- Case content cannot provide CSS, script, remote images, or arbitrary theme IDs.
- Unlock records remain local, survive case restart and uninstall, and never upload.
- Use test-first red-green-refactor for every behavioral change.

---

### Task 1: Reward definitions and pure evaluation

**Files:**
- Modify: `src/cases/types.ts`
- Modify: `src/cases/schema.ts`
- Create: `src/gameplay/rewardEngine.ts`
- Create: `src/gameplay/rewardEngine.test.ts`
- Modify: `src/gameplay/defaultGameplay.ts`
- Modify: `src/gameplay/defaultGameplay.test.ts`
- Modify: `src/gameplay/gameplayValidation.ts`
- Modify: `src/gameplay/gameplayValidation.test.ts`

**Interfaces:**
- Produces: `ArchiveThemeId`, `InvestigationRewardDefinition`, `resolveInvestigationRewards(definition)`, and `evaluateRewards(definition, save, result)`.
- Consumes: `GameplayRequirement` and `meetsGameplayRequirements()`.

- [x] **Step 1: Write failing reward-engine tests**

```ts
expect(evaluateRewards(definition, save, undefined)).toEqual([])
expect(evaluateRewards(definition, save, result).map((item) => item.id)).toEqual(['case-complete'])
expect(evaluateRewards(definition, noHintSave, highScoreResult).map((item) => item.id)).toContain('master-theme')
```

- [x] **Step 2: Run the focused tests and verify the missing API failure**

Run: `npm test -- src/gameplay/rewardEngine.test.ts`

Expected: FAIL because `rewardEngine.ts` and reward types do not exist.

- [x] **Step 3: Add the optional model and evaluator**

```ts
export type ArchiveThemeId = 'archive-standard' | 'departure-night' | 'signal-blueprint'
export interface InvestigationRewardDefinition {
  id: string
  kind: 'artifact' | 'badge' | 'theme'
  title: string
  description: string
  requirements: GameplayRequirement[]
  themeId?: ArchiveThemeId
}
```

`evaluateRewards()` must return an empty array without a deduction result and otherwise filter `resolveInvestigationRewards()` through `meetsGameplayRequirements()`.

- [x] **Step 4: Add Schema and semantic rules**

Accept at most 24 rewards; require safe IDs and non-empty titles/descriptions; require a valid `themeId` for `kind: 'theme'`; reject `themeId` on other kinds; reuse objective-reference validation.

- [x] **Step 5: Add deterministic defaults**

Old cases receive `default-case-archive` with empty requirements and `default-complete-record` with `all-clues` plus `score-at-least: 90`.

- [x] **Step 6: Run focused tests and commit**

Run: `npm test -- src/gameplay/rewardEngine.test.ts src/gameplay/defaultGameplay.test.ts src/gameplay/gameplayValidation.test.ts`

Expected: PASS.

Commit: `feat: add completion reward model`

---

### Task 2: Cross-case reward profile and theme application

**Files:**
- Create: `src/rewards/archiveThemes.ts`
- Create: `src/rewards/archiveThemes.test.ts`
- Create: `src/rewards/rewardProfile.ts`
- Create: `src/rewards/rewardProfile.test.ts`
- Create: `src/rewards/rewardStore.ts`
- Create: `src/rewards/rewardStore.test.ts`
- Modify: `src/main.tsx`
- Modify: `src/styles/tokens.css`

**Interfaces:**
- Produces: `RewardUnlockRecord`, `RewardProfile`, `loadRewardProfile()`, `saveRewardProfile()`, `applyArchiveTheme()`, and `useRewardStore`.
- Consumes: evaluated reward definitions from Task 1.

- [x] **Step 1: Write failing storage tests**

```ts
expect(recordRewards(emptyProfile, case001, [artifact], now).unlocks).toHaveLength(1)
expect(recordRewards(existingProfile, case001, [artifact], later).unlocks).toHaveLength(1)
expect(loadRewardProfile(corruptStorage)).toEqual(defaultRewardProfile)
expect(loadRewardProfile(invalidThemeStorage).selectedTheme).toBe('archive-standard')
```

- [x] **Step 2: Run tests and verify RED**

Run: `npm test -- src/rewards/rewardProfile.test.ts src/rewards/archiveThemes.test.ts`

Expected: FAIL because the profile and theme modules do not exist.

- [x] **Step 3: Implement versioned storage and allowlisted themes**

Use key `archive-os:reward-profile`; normalize unknown data instead of throwing; keep the first `unlockedAt`; namespace record keys as `${caseId}:${rewardId}`; apply only known theme IDs to `document.documentElement.dataset.archiveTheme`.

- [x] **Step 4: Implement the Zustand facade**

```ts
type RewardState = RewardProfile & {
  unlock: (caseDefinition: CaseDefinition, rewards: InvestigationRewardDefinition[]) => string[]
  selectTheme: (themeId: ArchiveThemeId) => boolean
}
```

`unlock()` returns only newly created record keys. `selectTheme()` succeeds for the default theme or an unlocked theme reward, persists once, and applies the DOM attribute.

- [x] **Step 5: Add three token palettes and startup restoration**

Keep the default palette unchanged. `departure-night` uses restrained amber/indigo accents; `signal-blueprint` uses cyan/blue accents. Initialize the store before React render so refreshing restores the selected theme without a flash.

- [x] **Step 6: Run tests and commit**

Run: `npm test -- src/rewards`

Expected: PASS.

Commit: `feat: persist archive rewards and themes`

---

### Task 3: Deduction integration and restart safety

**Files:**
- Modify: `src/cases/types.ts`
- Modify: `src/store/gameStore.ts`
- Modify: `src/store/gameStore.test.ts`
- Modify: `src/preview/PreviewSession.ts`
- Modify: `src/preview/PreviewSession.test.ts`

**Interfaces:**
- Produces: optional `rewardIds` and `newRewardKeys` on `DeductionResult`.
- Consumes: `evaluateRewards()` and `useRewardStore.getState().unlock()`.

- [x] **Step 1: Write failing submit and restart tests**

```ts
const first = useGameStore.getState().submit(correctAnswers, '')
expect(first.rewardIds).toContain('case-complete')
expect(first.newRewardKeys).toContain('case-001:case-complete')
useGameStore.getState().resetCase()
expect(useRewardStore.getState().unlocks).toContainEqual(expect.objectContaining({ key: 'case-001:case-complete' }))
```

- [x] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/store/gameStore.test.ts src/preview/PreviewSession.test.ts`

Expected: FAIL because submission does not evaluate or persist rewards.

- [x] **Step 3: Integrate reward settlement**

After scoring and challenge evaluation, evaluate rewards, record profile unlocks, add IDs and newly unlocked keys to the result, then persist the case save. Do not clear the external reward profile in `resetCase()` or preview teardown.

- [x] **Step 4: Keep preview isolation explicit**

Preview sessions may render reward results but must snapshot and restore the reward profile so Workshop playtests cannot permanently unlock rewards.

- [x] **Step 5: Run tests and commit**

Run: `npm test -- src/store/gameStore.test.ts src/preview/PreviewSession.test.ts`

Expected: PASS.

Commit: `feat: award rewards after deduction`

---

### Task 4: Result and museum reward interfaces

**Files:**
- Create: `src/features/rewards/RewardCollection.tsx`
- Create: `src/features/rewards/RewardCollection.test.tsx`
- Modify: `src/features/result/ResultScreen.tsx`
- Modify: `src/features/result/ResultScreen.test.tsx`
- Modify: `src/features/museum/MuseumHome.tsx`
- Modify: `src/features/museum/MuseumHome.test.tsx`
- Modify: `src/styles/game.css`

**Interfaces:**
- Produces: accessible reward collection dialog content and result reward section.
- Consumes: available case definitions, reward profile, and resolved rewards.

- [x] **Step 1: Write failing component tests**

Verify that the result page labels a fresh artifact “首次解锁”, repeat rewards “已收藏”, the museum displays unlocked/known totals, a locked theme cannot be equipped, and an unlocked theme can be equipped with “当前使用” feedback.

- [x] **Step 2: Run tests and verify RED**

Run: `npm test -- src/features/result/ResultScreen.test.tsx src/features/rewards/RewardCollection.test.tsx src/features/museum/MuseumHome.test.tsx`

Expected: FAIL because reward UI and navigation are absent.

- [x] **Step 3: Add result reward records**

Render compact rows with reward type, title, description, and status. When no rewards are earned, show a replay hint without hiding the existing ending and report.

- [x] **Step 4: Add museum collection**

Add “馆藏奖励” to the museum navigation. The collection groups known definitions by source case, preserves orphaned unlock snapshots, and equips only unlocked theme rewards.

- [x] **Step 5: Add case-row reward progress**

Display `奖励 X / Y` next to case mastery without increasing card height excessively.

- [x] **Step 6: Style and test responsive behavior**

Use square archive-record rows, small type labels, visible focus states, single-column layout below 1024 px, and no continuous animation.

- [x] **Step 7: Run tests and commit**

Run: `npm test -- src/features/result/ResultScreen.test.tsx src/features/rewards/RewardCollection.test.tsx src/features/museum/MuseumHome.test.tsx`

Expected: PASS.

Commit: `feat: add reward collection interface`

---

### Task 5: Workshop reward authoring and built-in rewards

**Files:**
- Modify: `src/editor/features/gameplay-editor/OutcomeEditor.tsx`
- Modify: `src/editor/features/gameplay-editor/GameplayEditor.test.tsx`
- Modify: `src/editor/model/caseDraft.ts`
- Modify: `src/editor/compiler/compiler.test.ts`
- Modify: `src/cases/case-001/case.ts`
- Modify: `src/cases/case-001/case.test.ts`
- Modify: `src/cases/case-002/case.ts`
- Modify: `src/cases/validateCases.test.ts`
- Modify: `src/styles/workshop.css`

**Interfaces:**
- Produces: reward CRUD inside the existing “挑战与结局” editor and authored built-in reward definitions.
- Consumes: reward types, `RequirementFields`, and the theme allowlist.

- [x] **Step 1: Write failing editor and case tests**

Verify adding a reward, selecting `theme`, selecting an allowlisted theme ID, compiling it, and confirming every built-in case exposes at least two rewards including an artifact.

- [x] **Step 2: Run tests and verify RED**

Run: `npm test -- src/editor/features/gameplay-editor/GameplayEditor.test.tsx src/editor/compiler/compiler.test.ts src/cases/case-001/case.test.ts src/cases/validateCases.test.ts`

Expected: FAIL because rewards are not authorable and built-in definitions are absent.

- [x] **Step 3: Implement compact reward CRUD**

Add list, title, description, kind, allowlisted theme selector, shared requirement fields, and delete action. Switching away from `theme` removes `themeId`; switching to `theme` assigns `departure-night`.

- [x] **Step 4: Author concrete rewards**

Case 001: `unused-boarding-pass`, `independent-investigator`, `departure-night-theme`. Case 002: `final-program-sheet`, `complete-broadcast-record`, `signal-blueprint-theme`. Give each reward deterministic requirements from the design.

- [x] **Step 5: Run tests and commit**

Run: `npm test -- src/editor/features/gameplay-editor/GameplayEditor.test.tsx src/editor/compiler/compiler.test.ts src/cases/case-001/case.test.ts src/cases/validateCases.test.ts`

Expected: PASS.

Commit: `feat: author completion rewards in workshop`

---

### Task 6: End-to-end verification, screenshots, and documentation

**Files:**
- Modify: `e2e/deep-investigation.spec.ts`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/DEEP_INVESTIGATION.md`
- Create: `docs/images/stage6-completion-rewards.png`
- Create: `docs/images/stage6-reward-collection.png`
- Modify: `docs/superpowers/plans/2026-09-08-completion-rewards.md`

**Interfaces:**
- Consumes: all completed reward behavior.
- Produces: browser-level regression evidence and release documentation.

- [ ] **Step 1: Add a failing Playwright reward journey**

Complete a deterministic deduction, verify a first-unlock reward, return to the museum, open “馆藏奖励”, equip the unlocked theme, reload, verify the theme remains selected, restart the case, and verify the reward remains.

- [ ] **Step 2: Run the new Playwright test and verify RED**

Run: `npx playwright test e2e/deep-investigation.spec.ts --grep "completion rewards"`

Expected: FAIL before the new reward UI is wired.

- [ ] **Step 3: Update documentation and capture real 1440×900 screenshots**

Document local-only persistence, reward types, theme safety, replay behavior, and Workshop authoring. Capture the real result reward section and museum collection; do not use mock DOM text.

- [ ] **Step 4: Run the full quality gate**

Run: `npm run test:coverage`

Run: `npm run test:editor`

Run: `npm run test:community`

Run: `npm run check`

Run: `npm run e2e`

Expected: all commands exit 0; the historical optional screenshot baseline may remain skipped, with no failures.

- [ ] **Step 5: Inspect production preview**

At 1440×900 and 1280×720 verify result rewards, collection navigation, theme switching, keyboard focus, reload persistence, case restart persistence, console errors, and unchanged built-in/community entry flows.

- [ ] **Step 6: Mark this plan complete and commit**

Commit: `docs: document completion rewards`

- [ ] **Step 7: Push the branch and verify PR #7**

Push `feat/stage-6-deep-investigation`, verify remote HEAD equals local HEAD, and wait for both GitHub Actions jobs to pass before reporting completion.
