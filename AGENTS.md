# AGENTS.md ??finel (Next.js 16 + Prisma + Neon + Vercel)

This project uses:

- Next.js 16 (App Router)
- Prisma ORM
- Neon Postgres database
- TypeScript
- npm (NOT pnpm)
- Vercel deployment
- Single database shared by Preview and Production (CRITICAL RISK)

---

# CRITICAL DATABASE SAFETY WARNING

This project uses Neon Postgres, and Vercel Preview and Production currently share the SAME database.

This means:

- prisma db push can mutate the production schema
- preview builds can break production
- accidental schema changes are dangerous

Therefore strict DB safety rules apply.

---

# Global rules (always apply)

## Secrets safety

NEVER:

- print .env contents
- print DATABASE_URL
- print secrets or tokens
- commit secrets

Allowed:

- confirm whether env vars exist (without printing values)

Relevant env vars:

- DATABASE_URL
- DIRECT_URL (optional)
- any auth secrets

---

## Database safety rules

NEVER run automatically:

    prisma db push
    prisma migrate dev
    prisma migrate deploy

UNLESS user explicitly requested DB/schema change.

If build script includes db push:

- warn user first
- confirm environment safety

Assume DATABASE_URL points to production unless confirmed otherwise.

---

## Minimal changes rule

Always:

- prefer smallest working diff
- avoid unrelated refactors
- preserve behavior

---

## Always inspect before working

Read:

- package.json
- prisma/schema.prisma
- next.config.*
- tsconfig.json
- relevant app/lib/components files

---

# Mode tags

If user message starts with tag, follow that mode strictly.

---

## @plan

Goal: Create an execution plan only (no code changes).

Use when:

- user asks for plan mode
- task is large/unclear and needs step-by-step agreement first

Rules:

- DO NOT edit files
- DO NOT run DB mutation commands
- inspect only the minimum relevant files
- keep scope tight and aligned to user goal

Plan requirements:

1. briefly restate goal and constraints
2. list assumptions and unknowns
3. provide step-by-step plan with priorities
4. define verification criteria for each step
5. mark risk level (low/medium/high) and rollback idea if applicable

Output format:

- objective
- constraints
- assumptions
- plan steps
- risks
- verification
- questions for user (only if blocking)

Example usage:

@plan admin inquiry page 성능 이슈 해결 계획만 작성

---
## @build

Goal: Make project build successfully.

Default build command:

    npm run build

IMPORTANT:

This runs:

    prisma generate
    prisma db push
    next build

Since db push mutates schema:

Before running build:

1. warn that db push will run
2. confirm it is safe
3. if unsafe or unknown environment:
   DO NOT run build automatically
   ask user confirmation

Fix order:

1. Prisma errors
2. TypeScript errors
3. Next build errors

DO NOT:

- change schema unless requested
- add dependencies unless required

Output format:

- inspected files
- commands run
- errors fixed
- files changed
- final build status

---

## @fix

Goal: Fix specific bug with minimal diff.

Rules:

- fix only described issue
- preserve behavior
- avoid refactors

Always explain:

- root cause
- fix applied
- verification steps

---

## @analyze

Goal: Analyze architecture and risks.

Inspect:

- /app
- /lib
- /components
- prisma/schema.prisma
- package.json

Explain:

- routing structure
- server/client boundaries
- database schema
- auth flow (jsonwebtoken, jose, bcryptjs)
- potential bugs
- performance risks
- security risks

DO NOT modify code.

---

## @test

Goal: Ensure build succeeds safely.

Steps:

1. inspect build script
2. warn about db push risk
3. run build only if safe

Fix:

- type errors
- prisma client errors
- next build errors

---

## @lint

Goal: Fix ESLint issues.

Run:

    npm run lint

Fix minimal issues only.

DO NOT modify lint config unless requested.

---

## @prisma

Goal: Prisma client/schema validation.

Allowed:

    npx prisma generate
    npx prisma validate
    npx prisma format

DO NOT run db push or migrate automatically.

---

## @migrate

Goal: Controlled DB schema change.

Before running:

- confirm user explicitly requested schema change

Preferred commands:

dev:

    npx prisma migrate dev

production:

    npx prisma migrate deploy

Always explain:

- schema changes
- data impact
- risks

---

## @deps

Goal: Dependency management.

Rules:

- minimal changes
- explain why needed
- prefer existing libraries

---

## @security

Goal: Security audit and fixes.

Focus:

- JWT handling
- cookie flags (HttpOnly, Secure, SameSite)
- password hashing (bcryptjs)
- email handling

DO NOT break auth behavior.

---

## @perf

Goal: Performance optimization.

Focus:

- Next.js server/client boundaries
- bundle size
- Prisma query efficiency

Minimal diff only.

---

## @review

Goal: Code review.

Output:

- issues (high ??low priority)
- suggested fixes
- risks

---

## @doc

Goal: Documentation only.

Do not modify code.

---
## @feature

Goal: Implement a new feature fully.

Steps:

1. analyze existing structure
2. create required files
3. modify necessary files
4. ensure build works

Output:

- files created
- files modified
- usage instructions

Example:

@feature implement password reset

---

## @create

Goal: Create new files.

Rules:

- Create file at exact path specified
- Follow existing project structure and conventions
- Do not modify unrelated files

Output:

- file path
- full file content
- purpose explanation

Example usage:

@create app/api/auth/login/route.ts

---

## @edit

Goal: Modify an existing file safely.

Rules:

- Only change what is necessary
- Do not rewrite entire file unless required
- Preserve behavior unless instructed otherwise

Output:

- file modified
- exact changes
- explanation

Example usage:

@edit app/lib/auth.ts fix token validation bug

---

## @modify

Goal: Modify multiple files for a feature or fix.

Rules:

- identify required files first
- minimize scope of changes
- preserve architecture

Output:

- files changed
- summary of changes
- reasoning

Example usage:

@modify implement refresh token system

---

## @refactor

Goal: Improve code quality without changing behavior.

Rules:

- preserve functionality
- improve readability, structure, types

DO NOT:

- change business logic
- change external behavior

Output:

- files changed
- improvements made

Example usage:

@refactor app/lib/prisma.ts

---

## @delete

Goal: Safely delete unused files.

Rules:

- confirm file is unused
- explain why safe

Output:

- file deleted
- reasoning

Example usage:

@delete app/lib/old-auth.ts

---

## @rename

Goal: Rename files safely.

Rules:

- update imports
- update references

Output:

- old path
- new path
- updated files

Example usage:

@rename app/lib/db.ts app/lib/prisma.ts


# Coding standards

TypeScript:

- NEVER use any unless unavoidable
- prefer strict types

Prisma:

- do not mutate schema without explicit instruction

Next.js:

- prefer server components
- use client components only when necessary

---

# Project structure

/app
/components
/lib
/prisma

Database schema:

prisma/schema.prisma

---

# Build success definition

Build is successful only if:

    npm run build

completes with zero errors

AND no unintended DB schema mutation occurred.

---

## @design

Goal: Design implementation approach before coding.

Use when:

- user asks for design first
- requirements need technical structure before build

Rules:

- DO NOT modify code
- propose minimal, practical implementation
- keep compatibility with existing architecture

Design requirements:

1. define scope (in/out)
2. define affected files and responsibilities
3. define data flow and server/client boundaries
4. define edge cases and rollback idea
5. define validation strategy before build

Output format:

- objective
- scope
- architecture decisions
- file-level design
- risks and mitigations
- implementation checklist

---

## @verify

Goal: Verify changes are correct, safe, and releasable.

Rules:

- verify with minimal required commands first
- do not run DB mutation commands automatically
- if verification requires `npm run build`, follow DB safety warning/confirmation first

Verification checklist:

1. static checks (lint/typecheck if available)
2. targeted runtime checks for changed feature
3. regression check for related flows
4. final build/status confirmation (only when safe)

Output format:

- checks run
- pass/fail per check
- unresolved risks
- release readiness

---

## @jina

Goal: Execute a full delivery flow in this exact order:

PLAN -> ANALYZE -> DESIGN -> BUILD -> VERIFY -> REVIEW

Execution rules:

1. Follow each mode's constraints and output format in sequence.
2. Do not skip a step unless user explicitly asks.
3. Respect DB safety rules at BUILD/VERIFY steps (warn + confirm when needed).
4. If blocked, stop at the current step and report blocker + next required input.

Output format:

- [PLAN]
- [ANALYZE]
- [DESIGN]
- [BUILD]
- [VERIFY]
- [REVIEW]

Example usage:

@jina admin inquiry page slow response issue
