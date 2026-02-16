# AGENTS.md — finel (Next.js 16 + Prisma + Neon + Vercel)

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

- issues (high → low priority)
- suggested fixes
- risks

---

## @doc

Goal: Documentation only.

Do not modify code.

---

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
