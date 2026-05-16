# Project Rules

## Communication Style

Use caveman mode (full level) for ALL chat responses. This rule is permanent and applies across every model (Claude Sonnet, Opus, Haiku) and every IDE (VS Code, JetBrains, web, CLI). Drop articles, filler words, and pleasantries. Fragments OK. Short synonyms preferred. Technical terms exact.

Exception: use normal prose when writing content to `.md` files, specifications, documents, or any file artifact — caveman mode is for chat output only, never for file content.

## Stories, Epics, and Subtasks

When working on stories, epics, or subtasks:
- Do NOT print their content in chat
- Reference only the file path (e.g., `docs/stories/story-1.2.md`)
- User reads the file directly

## Jira Sync (Mandatory)

After ANY change to a **sprint**, story, subtask, or epic — including status updates, sprint membership changes (adding/removing stories from a sprint), content edits, or new items — ALWAYS trigger `/jira-assistant` to sync the change. This applies regardless of which model or IDE is in use. No exceptions.

Scope explicitly covered:
- Sprint creation, rename, date change, start/close, or membership change (story → sprint, story removed from sprint)
- Epic create, rename, status transition, child re-parenting
- Story create, rename, status transition, sprint assignment, AC/Dev-Notes edits
- Subtask create, rename, status transition, parent reassignment

This is enforced inside the Story Automator workflow as well: step `step-03b-execute-finish` includes a mandatory Jira sync stage (E2) that runs after every story commit. Do not skip it.

## Story Subtasks (Mandatory)

When creating ANY story (via `/bmad-create-story`, story automator `create-story`, or manual authoring) the agent MUST:

1. **In the story file**: emit each acceptance-criterion-level task as a discrete unchecked subtask under a `## Tasks / Subtasks` section. One subtask per AC or per logical implementation unit — never collapse multiple ACs into one "implement all" task.
2. **In Jira**: create matching child issues of type `Sub-task` under the parent story SYN-* issue. Use `/jira-assistant` or the `mcp__atlassian__createJiraIssue` MCP tool. Subtask summaries should mirror the story-file subtask titles 1:1.
3. **Idempotency**: if subtasks already exist in either location, reconcile (add missing, do not duplicate). Do not skip Jira just because the file has them — both surfaces must stay aligned.

This rule applies on **every** story-creation invocation — new chat session, resumed session, new epic, manual run, or orchestrator-spawned agent. No exceptions, no "the user can add them later," no "deferred to dev step." Subtasks land at create-time.

## Cross-Model Review (Mandatory — Story Automator)

In EVERY Story Automator execution — regardless of model (Claude / Codex / any future agent), IDE (VS Code, JetBrains, web, CLI), or epic — the agent that runs the `dev` step (code writer) MUST NOT be the same agent that runs the `review` step (code reviewer).

This applies at agent-configuration time (step `step-02a-preflight-config`):

- If `dev = claude` → `review = codex` (or any non-Claude reviewer)
- If `dev = codex` → `review = claude`
- Applies per complexity level (low / medium / high) and per uniform / custom selection
- Retrospective step is exempt (always Claude by workflow design)

Rationale: same-model self-review produces blind spots and rubber-stamping. Independent cross-model review catches issues the writer missed.

Enforcement:
- Never accept `[S]uggested` defaults if they pair the same agent for dev+review on any complexity level — propose a `[C]ustom` swap.
- If the user picks `[U]niform`, warn that it violates this rule and require explicit override.
- On resume, re-validate the persisted `agentConfig` against this rule; flag violations before continuing.

## Review Findings → New Story (Mandatory — Story Automator)

The reviewer agent's findings must materialize as trackable work. After every Story Automator review step, the orchestrator MUST:

1. Scan the review output for "Outstanding," "Deferred," "Not done," "Suggested follow-up," or any new actionable finding that was not auto-patched in the review commit.
2. For each finding (or thematic cluster), append a new story to the CURRENT sprint:
   - Add entry to `_bmad-output/planning-artifacts/epics.md` under the active epic.
   - Create a story file in `_bmad-output/implementation-artifacts/` with AC and 1:1 subtasks via `/bmad-create-story`.
   - Create parent Jira issue + child Sub-tasks via `/jira-assistant` (rule: Story Subtasks Mandatory).
   - Update `sprint-status.yaml` to include the new story.
   - Extend `storyRange` in the active orchestration state document so the loop picks it up.

Auto-applied reviewer patches for trivial fixes are still acceptable. Anything non-trivial — design changes, deferred items, deletions, new dependencies, new tests beyond the AC scope — gets its own story even if the reviewer also tried to patch it.

The previous "review register only" / "review verify cycle" rules are revoked.

## Git Commit + Push After Every Story (Mandatory)

After every story completes (Story Automator or manual workflow), commit AND push to the remote. The Story Automator `commit-story` helper supports `--push` and is invoked with that flag from `step-03b-execute-finish`. If push fails (no remote, network error), log the warning and continue — but do not silently skip the push step.

## Post-Story Test Architect Pass (Mandatory)

After every story finishes — meaning code review approved, story status set to `done`, commit pushed to remote, AND Jira fully synced (parent story + subtasks) — the orchestrator MUST run `bmad-tea` (Test Architect) against the just-completed story. This rule applies to every story, every epic, every model (Claude / Codex / future agents), and every IDE (VS Code, JetBrains, web, CLI). No exceptions.

Flow:

1. Story reaches `done` in sprint-status.yaml and Jira.
2. Run `bmad-tea` (or invoke `/bmad-tea` via the Test Architect skill) with the story file as input.
3. Capture every recommendation TEA emits: missing test coverage, NFR risks, accessibility gaps, security follow-ups, traceability holes, etc.
4. For each actionable recommendation (or thematic cluster of recommendations), create a NEW story in the CURRENT sprint following the Review Findings → New Story protocol:
   - Append to `_bmad-output/planning-artifacts/epics.md` under the active epic
   - Create the story file with AC + 1:1 subtasks via `/bmad-create-story`
   - Create the parent Jira issue + child Sub-tasks via `/jira-assistant`
   - Update `sprint-status.yaml` to include the new story
   - Extend `storyRange` in the active orchestration state document so the loop picks it up
5. If TEA returns no actionable findings, log "TEA: no findings" in the orchestration action log and continue.

Trivial follow-ups (a single missing assertion, a doc nit) MAY be applied inline as a tiny patch with no new story — same threshold as the reviewer auto-patch rule. Anything beyond a one-touch fix gets its own story.

## Post-Epic Retrospective (Mandatory)

After the last story in an epic reaches `done` (all stories in that epic show `done` in sprint-status.yaml, Jira epic ready to close), the orchestrator MUST run `bmad-retrospective` against the completed epic. This rule applies to every epic, every model, every IDE. No exceptions.

Flow:

1. Last story of the epic finishes (dev → review → done → commit pushed → Jira synced → TEA pass complete).
2. Run `/bmad-retrospective` (or invoke `bmad-retrospective` skill) with the epic identifier.
3. Persist the retro artifact under `_bmad-output/implementation-artifacts/epic-N-retro-YYYY-MM-DD.md` (existing convention — see epic-1-retro-2026-05-15.md, epic-2-retro-2026-05-15.md).
4. Update `sprint-status.yaml`: set `epic-N-retrospective: done`.
5. Sync the epic transition to `Done` in Jira via `/jira-assistant`.
6. If the retro surfaces actionable follow-ups, create new stories in the NEXT sprint (or the current sprint if it still has capacity) using the same Review Findings → New Story protocol.

The retrospective step is exempt from cross-model review (always Claude by workflow design — see Cross-Model Review rule).

## Codex → Claude Deferred-Action Handoff (Mandatory)

When a Story Automator step runs under Codex (or any non-Claude agent) and that agent cannot complete `git commit`, `git push`, OR `/jira-assistant` sync — for any reason (sandbox restrictions, missing MCP transport, network failure, auth gap, tool unavailability) — the failure MUST be captured as a deferred action and the very next Claude agent spawned in the same orchestration MUST execute the deferred actions before doing anything else.

Mechanism:

1. **Detect**: If Codex (or another non-Claude agent) reports inability to commit, push, or sync Jira after its step, do NOT treat the step as complete and do NOT mark the story done.
2. **Record**: Append a `## Deferred Actions` block to the active orchestration state document (`_bmad-output/story-automator/orchestration-*.md`) with one entry per deferred action:
   ```yaml
   - agent: codex
     story: 3.6
     step: dev-story
     blocked: [commit, push, jira-sync-subtasks]
     reason: "sandbox blocks git push; MCP transport unavailable"
     recordedAt: 2026-05-16T14:22:00Z
   ```
3. **Carry forward**: The orchestrator's preflight/resume logic MUST inject the deferred-action list into the next Claude agent's `customInstructions` (per the Orchestrator customInstructions rule in memory — never empty).
4. **Execute first**: The next Claude agent, on spawn, MUST:
   a. Read the `## Deferred Actions` block from the orchestration state doc.
   b. Execute each deferred action in order: stage and commit any uncommitted work with the original Codex's intended commit message, push to the remote, then run `/jira-assistant` to sync any pending epic/story/subtask/sprint changes.
   c. Append a `## Deferred Actions Resolved` entry to the orchestration state doc with timestamp + commit hash(es) + Jira issue keys synced.
   d. Only THEN start the assigned step.
5. **Idempotency**: If a deferred action is already resolved (commit exists, Jira already in sync), record "already-resolved" and skip without erroring.

This rule applies on every run, every epic, every story, every model handoff. If Claude itself fails one of these actions, Claude is responsible for retrying or escalating to the user — the handoff rule applies only to non-Claude → Claude transitions.

## Obsidian Vault (Token Saving)

Vault location: `vault/` in project root.

**Read order for context:**
1. `vault/00-Home.md` — project orientation + quick nav
2. `vault/Planning/Stack.md` — before any code work
3. `vault/Planning/Architecture-Key.md` — before any backend/auth/API work
4. `vault/Planning/Epics-Index.md` — story status tracking
5. `vault/Code/Index.md` — codebase map (exists once implementation starts)

**Rules:**
- Read vault notes instead of full source docs when possible
- Source docs (`_bmad-output/planning-artifacts/`) are ground truth — read them for details not in vault
- Story files live in `docs/stories/` — reference path only in chat

### Vault Update Protocol

**After every story step (sub-task completion):**
- Update story status in `vault/Planning/Epics-Index.md` (`[ ]` → `[~]` or `[x]`)
- Update or create the relevant `vault/Code/` note for any new file or module introduced
- If a new pattern or convention was established, add it to `vault/Planning/Architecture-Key.md`

**After every commit:**
- Update `vault/00-Home.md` project status section to reflect current progress
- Ensure `vault/Code/Index.md` matches actual file tree (add new files, remove deleted ones)

**Code mapping rules (`vault/Code/`):**
- One note per meaningful module/layer — not one per file
- Group by domain: `Code/Frontend.md`, `Code/Backend.md`, `Code/Database.md`, `Code/i18n.md`, `Code/Admin.md`
- Each note lists: files in the module, their responsibility, key exports, and cross-links to other modules
- `Code/Index.md` is the entry point — lists all modules with one-line description
- Update the relevant module note whenever files are added, removed, or significantly changed
