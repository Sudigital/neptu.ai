# GitHub Copilot Instructions

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

- **ALWAYS** read and copy verbatim the original context of a file before splitting
- **MAINTAIN** each file under 500 lines max — reduce/optimize code first before splitting into separate files. Do **NOT** comment out eslint rules or modify existing eslint config
- **ALWAYS** deep dive into the current codebase before starting implementation to fully understand existing code and patterns
- **CLEAN UP** the codebase: remove duplicate/redundant functions, statics, constants. Use common names/variables for reusability. Remove debug and unnecessary `console` statements
- **WARNING** and **ERROR** are not accepted — fix until there are zero errors and zero warnings

## Testing

- **ALWAYS** create or update tests when creating or updating code

## Runtime

- **ALWAYS** use **Bun** as the runtime/package manager
