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

After ANY change to a story, subtask, or epic — including status updates, content edits, or new items — ALWAYS trigger `/jira-assistant` to sync the change. This applies regardless of which model or IDE is in use. No exceptions.

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

## Git Commit + Push After Every Story (Mandatory)

After every story completes (Story Automator or manual workflow), commit AND push to the remote. The Story Automator `commit-story` helper supports `--push` and is invoked with that flag from `step-03b-execute-finish`. If push fails (no remote, network error), log the warning and continue — but do not silently skip the push step.

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
