# MySQL CMS Migration Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax.

**Goal:** Tüm CMS yazmalarını veri kaybı olmadan Hostinger MySQL’e taşı; dosya yazımını kapat.

**Architecture:** `CmsDocument` = kaynak gerçeği (tam JSON fidelity). Normalize tablolar write sırasında senkron (SQL sorguları için). `lib/cms/store.ts` aynı API.

**Tech Stack:** Prisma 6, MySQL 8, Next.js 16

## Global Constraints

- Secret yalnızca `.env`
- Seed öncesi `data/backup-pre-mysql/` zorunlu
- `DATABASE_URL` yoksa fail-fast
- Medya diskte kalır

---

### Task 1: Prisma schema + env

- Create: `prisma/schema.prisma`
- Create: `.env` (gitignore)
- Modify: `.env.example`, `package.json` scripts

### Task 2: store → MySQL

- Modify: `lib/db.ts` real Prisma client
- Modify: `lib/cms/store.ts` CmsDocument + sync hooks
- Create: `lib/cms/sync-normalized.ts`

### Task 3: Seed + export

- Create: `scripts/seed-mysql-from-json.ts`
- Create: `scripts/export-cms-to-json.ts`
- Create: `scripts/verify-mysql-seed.ts`

### Task 4: Verify

- `prisma migrate deploy` / `db push`
- seed + verify counts
- `npm test` + smoke admin read path
