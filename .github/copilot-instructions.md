# GitHub Copilot Instructions

**ALWAYS** deep dive into the current codebase before starting implementation to fully understand existing code and patterns and to avoid creating new files and breaking the codebase. **ALWAYS** copy verbatim the original context of a file before splitting or working on same layout, dont create new because many files will missing and broken the code

## Coding Standards & Requirements

- **NO** abstraction layers nobody can explain
- **NO** blurred component boundaries
- **NO** massive technical debt hidden behind a polished UI
- **NO** mock/fake data — remove if any exists
- **NO** magic numbers
- **NO** duplicate JSDoc comments — NEVER add `/** * ComponentName... */` header comments when editing existing files. Files already have documentation at the top. Adding comments creates duplicates
- **NO** duplication — single source of truth. For dynamic data use seeder (schemas), for static data use `packages/shared`
- **NOT** and **NEVER** use `eslint-disable` comments (e.g. `eslint-disable max-lines`, `eslint-disable-next-line security/detect-object-injection`), **EXCEPT** in files generated from other sources
- **AVOID** any `any` types
- **AVOID** plain schemas and types in `apps/web`
- **AVOID** hardcoded values — use variables in code

## Database

- When creating or updating the database, always work within `packages/drizzle-orm` and follow the database pattern: **dto → repositories → schemas → services → validators**

## Imports & Modules

- **IMPORT** without file extensions
- **ALWAYS** import static constants from `packages/shared`
- Only create/update static constants in `packages/shared` (placed after the last import)

## Data Management

- **REDUCE** static data — optimize for database-driven dynamic data following industry standards

## Code Quality

- **ALWAYS** `cp -r` copy verbatim the original context of a file before splitting or working on same layout, dont create new because many files will missing and broken the code
- **MAINTAIN** each file under 500 lines max — reduce/optimize code first before splitting into separate files. Do **NOT** comment out eslint rules or modify existing eslint config
- **CLEAN UP** the codebase: remove duplicate/redundant functions, statics, constants. Use common names/variables for reusability. Remove debug and unnecessary `console` statements
- **WARNING** and **ERROR** are not accepted — fix until there are zero errors and zero warnings

## Testing

- **ALWAYS** create or update tests when creating or updating code

## Runtime

- **ALWAYS** use **Bun** as the runtime/package manager

## Essential Commands

### Validation (ALWAYS run before committing)

| Command             | Description                |
| ------------------- | -------------------------- |
| `bun run format`    | Prettier formatting        |
| `bun run lint`      | Lint all packages          |
| `bun run lint:fix`  | Auto-fix lint issues       |
| `bun run typecheck` | TypeScript type checking   |
| `bun run test`      | Run tests via Turbo/Vitest |
| `bun run build`     | Build all packages         |

## SDLC — Notion-Based Workflow

All project management lives in Notion. See `.blueprint/guide/notion.md` for full API reference and database IDs.

### Notion Databases

| Database | ID                                     |
| -------- | -------------------------------------- |
| Projects | `c955c0d3-a495-42ee-be92-50f51a6748c0` |
| Tasks    | `835f8da2-aab5-46e4-8a50-7db5519779a2` |

### Workflow

1. **Plan** — Create a Project in Notion, then break into Tasks linked via `Project` relation
2. **Branch** — Use type prefix + Notion **Task ID** as the git branch name: `git checkout -b feature/NLT-29` (prefixes: `feature/`, `bugfix/`, `hotfix/`, `improvement/`, `chore/`)
3. **Implement** — Set task status to **In progress**, write code + tests
4. **Review** — Push, open PR, set task status to **Code Review**
5. **QA** — PR merged, set task status to **Quality Assurance**, verify on device/staging
6. **Ship** — All checks pass, set task status to **Done**

### Rules

- **ALWAYS** check existing Notion tasks in the same project first — if one matches the current changes, use it. Only create a new task if no existing task is related
- **ALWAYS** update task status as you progress through the lifecycle
- **ALWAYS** use `.blueprint/guide/notion.md` as the single source of truth for project tracking
- **NEVER** work on a task without setting it to **In progress** first
- **NEVER** commit without a linked Notion task in the same project
