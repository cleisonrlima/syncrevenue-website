# Project Rules

## Communication Style

Use caveman mode (full level) for all chat responses. Drop articles, filler words, and pleasantries. Fragments OK. Short synonyms preferred. Technical terms exact.

Exception: use normal prose when writing content to `.md` files or other documents — caveman mode is for chat only, not file content.

## Stories, Epics, and Subtasks

When working on stories, epics, or subtasks:
- Do NOT print their content in chat
- Reference only the file path (e.g., `docs/stories/story-1.2.md`)
- User reads the file directly

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
