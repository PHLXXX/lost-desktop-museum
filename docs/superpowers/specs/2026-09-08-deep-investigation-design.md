# Deep Investigation Design

**Status:** Approved for implementation  
**Target release:** v0.6.0  
**Date:** 2026-09-08

## Purpose

The current game already has complete cases, evidence relationships, deductions, community installation, and a visual workshop. This iteration adds a reusable gameplay layer between “open applications” and “submit deduction” so players have clearer intermediate decisions, optional mastery goals, limited help, and reasons to replay a completed case.

The player-facing name is **深度调查 / Deep Investigation**. The existing visual direction remains a restrained digital archive workstation.

## Goals

- Add visible primary and optional investigation objectives without exposing answers.
- Add a finite, progressive hint resource that helps stuck players without becoming a walkthrough.
- Add replayable case challenges and persistent mastery records.
- Add result variants that reward thorough investigation without hiding the main truth.
- Keep every existing built-in, imported, and community `.ldmcase` playable.
- Make the new layer data-driven and authorable in Archive Workshop.
- Preserve local-only operation, offline play, and the current security model.

## Non-goals

- No combat, inventory economy, random loot, daily tasks, online leaderboard, public achievements, telemetry, or account system.
- No arbitrary scripts or executable conditions in case packages.
- No mandatory time limit and no punishment for accessibility or safe-mode settings.
- No change to the community registry trust boundary or remote-source policy.
- No new full-screen route during investigation.

## Considered approaches

### Chosen: optional compatibility layer

Add an optional `gameplay` block to `CaseDefinition` while retaining `formatVersion: 1`. Cases without the block receive deterministic default objectives, hints, challenges, and the original ending. This provides immediate value to every case and lets authors opt into richer writing later.

### Rejected: mandatory CaseDefinition v2

A required schema upgrade would give authors complete control, but it would add migration and compatibility risk to local imports, community packages, editor projects, and update analysis. The gameplay does not require that break.

### Rejected: built-in-only hard-coded systems

Hard-coding objectives and hints for the two built-in cases would be quick, but it would violate the data-driven architecture and leave community cases behind.

## Player loop

1. The case detail page previews objective count, three analysis points, and available challenges.
2. During investigation, the taskbar shows `调查目标 n/m`.
3. The player opens a non-modal investigation panel with three views: objectives, analysis hints, and challenges.
4. Objectives update from existing clues, events, relationships, and triggers. Hidden optional objectives appear only when their reveal condition is met.
5. An unresolved clue can expose up to three hint tiers. Each tier costs one analysis point:
   - direction: which information domain deserves attention;
   - action: what investigative action to try;
   - location: the precise application or record.
6. Completing an objective adds a compact notification to the existing clue feedback; it never changes the active window.
7. The player submits a deduction through the existing evidence board.
8. The result becomes an investigation report showing score, objectives, challenges, hints used, play time, and the selected ending variant.
9. Restarting clears current hint use and objective progress while retaining the best score and earned mastery badges.

## Data model

`CaseDefinition` receives an optional `gameplay?: InvestigationGameplayDefinition` field.

```ts
interface InvestigationGameplayDefinition {
  initialAnalysisPoints: number;
  objectives: InvestigationObjectiveDefinition[];
  hints: InvestigationHintDefinition[];
  challenges: InvestigationChallengeDefinition[];
  endingVariants: InvestigationEndingVariant[];
}

interface InvestigationObjectiveDefinition {
  id: string;
  title: string;
  description: string;
  kind: "primary" | "optional";
  condition: CaseCondition;
  revealWhen?: CaseCondition;
}

interface InvestigationHintDefinition {
  id: string;
  clueId: string;
  label: string;
  tiers: [
    { id: string; label: string; text: string; cost: number },
    { id: string; label: string; text: string; cost: number },
    { id: string; label: string; text: string; cost: number }
  ];
}

type GameplayRequirement =
  | { type: "all-clues" }
  | { type: "no-hints" }
  | { type: "score-at-least"; value: number }
  | { type: "relation-count-at-least"; value: number }
  | { type: "objective"; objectiveId: string };

interface InvestigationChallengeDefinition {
  id: string;
  title: string;
  description: string;
  requirements: GameplayRequirement[];
}

interface InvestigationEndingVariant {
  id: string;
  title: string;
  text: string;
  priority: number;
  requirements: GameplayRequirement[];
}
```

All IDs use stable lower-case kebab-case. Hint costs are positive integers, analysis points are limited to 0–9, and authored collections have bounded lengths.

## Deterministic defaults

For a case without `gameplay`, `resolveInvestigationGameplay(caseDefinition)` creates:

- one primary objective for the minimum clue threshold;
- one optional objective for all clues;
- one optional objective for all configured contradiction relationships when any exist;
- one progressive hint for every clue, derived from its source, discovery action, and target label;
- four challenges: no hints, all clues, all contradiction relationships, and score at least 90;
- no alternate ending, so the existing `ending` remains authoritative.

Defaults are derived at runtime and are never written back into an imported case package.

## Runtime engines

- `objectiveEngine` resolves configured/default objectives, reveal state, completion state, and aggregate progress from `ConditionContext`.
- `hintEngine` resolves configured/default hints, validates sequential reveal, calculates remaining points, and returns explicit failure reasons for completed clues, exhausted points, or missing hints.
- `challengeEngine` evaluates challenge requirements against the final score, clue set, relation set, objective state, and hint use.
- `endingEngine` selects the highest-priority eligible authored variant. Ties use stable ID sorting. If none match, it returns the original case ending.

The engines remain pure. React components receive view models and dispatch store actions; they do not duplicate gameplay rules.

## Save model and migration

`GameSave` moves from save version 3 to 4 and adds:

```ts
hintUsage: Record<string, number>;
bestChallengeIds: string[];
```

The hint value is the number of revealed tiers for that hint. Remaining points are derived from the current case definition and the recorded tier costs. Objective completion is derived from existing save fields and is not duplicated.

`DeductionResult` adds optional `challengeIds` and `endingVariantId` fields so old results remain readable. Migration supplies empty hint usage and challenge history. Restart preserves `bestScore`, `bestChallengeIds`, global onboarding, and settings; it clears the current hint usage.

Malformed hint usage is normalized to non-negative integers and unknown hint IDs are ignored by runtime selectors. A case update therefore cannot make an old save crash.

## Interface design

### Taskbar and desktop

- Add a compact `调查目标 n/m` button next to evidence progress.
- The button reports completed visible objectives and uses text plus state, not color alone.
- A newly completed objective can briefly mark the button without animation under `prefers-reduced-motion`.

### Investigation panel

- Desktop: a right-side, non-modal 360 px panel above the taskbar.
- Below 1024 px: a full-width bottom drawer with a bounded height.
- Tabs use buttons with `aria-selected`; content remains keyboard reachable.
- Escape closes the panel before opening the system menu.
- The system menu also contains `调查目标与提示`.
- Revealing a hint requires an inline confirmation showing the cost and remaining points; browser `confirm` is not used.

### Result and museum

- The result page shows current-run challenges, objective completion, hint usage, play time, and ending variant.
- Missing objectives are described as broad directions, never answer text.
- Museum case rows display mastery as `专精 x/y` when challenges exist.
- Case detail previews challenge names and the number of analysis points.

## Archive Workshop

Add a `玩法设计` section under Logic.

- General controls: enable custom gameplay and select initial analysis points.
- Objective editor: title, description, kind, completion condition, and optional reveal condition using the existing `ConditionBuilder`.
- Hint editor: choose a clue and edit the three fixed tiers.
- Challenge editor: choose one or more whitelisted requirements and configure numeric thresholds.
- Ending editor: title, text, priority, and whitelisted requirements.
- Compilation and decompilation preserve the optional gameplay block exactly.
- Validation rejects duplicate IDs, missing clue/objective references, invalid points, empty tiers, and unreachable objective conditions.

The editor cannot add code or unrestricted expressions.

## Error handling

- If an authored gameplay block fails schema validation, package import fails with a field path and corrective message, as other invalid case data does.
- If a hint references content removed by a compatible update, that hint is omitted and the rest of the case remains playable.
- If all custom objectives are hidden or invalid at runtime, the deterministic primary objective is shown as a safe fallback.
- Exhausted analysis points produce an inline explanation and never change the save.
- A failed save uses the existing save indicator; the revealed hint remains in memory and can be saved again manually.
- Gameplay UI failures are contained inside the panel and cannot blank the investigation desktop.

## Accessibility and motion

- Objectives expose textual `完成/进行中/未公开` states.
- Hint confirmation receives focus and restores focus when closed.
- Tabs, challenge badges, and progress are fully keyboard readable.
- Status announcements occur only on objective completion and hint reveal, not on every progress recalculation.
- No timed challenge is enabled by default.
- Reduced motion disables panel movement and completion pulse.

## Testing strategy

### Unit tests

- Configured and deterministic default gameplay resolution.
- Objective visibility/completion for clue, event, relation, and nested conditions.
- Sequential hint reveal, point accounting, completed-clue rejection, and exhaustion.
- Challenge evaluation and stable ending priority.
- Save v3 to v4 migration and malformed hint normalization.
- Restart clears current hint use while retaining mastery.
- Compile/decompile and schema validation for gameplay data.

### Component tests

- Taskbar opens and closes the panel.
- Escape priority closes hint confirmation, then panel, then system menu.
- Hint confirmation shows real cost and updates the remaining points.
- Objective and challenge states are expressed in text.
- Result report and museum mastery use actual saved data.
- Gameplay editor produces valid draft changes without mutating unrelated content.

### End-to-end tests

- Start an existing case, open objectives, spend one hint, discover its clue, and verify the objective updates.
- Complete a deduction and verify challenge badges, hint count, ending selection, and persistence after returning to the museum.
- Restart and verify hint use is cleared while earned mastery remains.
- Import a legacy case without gameplay and verify generated objectives/hints work.
- Re-run the existing complete player journey and Archive Exchange regressions.

## Acceptance criteria

- Existing v0.5.0 saves and packages load without data loss.
- Every playable case has at least one visible objective and usable hints.
- A hint can never reveal a later tier before earlier tiers or spend below zero.
- Restart behavior preserves historical mastery and clears only current-run help state.
- Main truth remains accessible regardless of challenge completion.
- No gameplay feature requires network access.
- TypeScript, ESLint, Vitest, case validation, editor validation, production build, and Playwright all pass.

