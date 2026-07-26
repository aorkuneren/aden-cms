# CMS Tam Kapsam Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ziyaretçi sitesinin pazarlama içeriği, SEO, ayarlar ve arayüz mikro-metinlerini şema güdümlü CMS + soft-delete ile panelden %100 yönetilebilir hale getirmek.

**Architecture:** Merkezi `lib/cms/registry/` kayıt defteri alan şemasını tek kaynak yapar; jenerik `/admin/sayfalar/[sayfa]/[bolum]` editörü metin bölümlerini üretir; koleksiyon CRUD’ları mevcut editörlerde kalır ama `mutateCms` + soft-delete pipeline’ına bağlanır. Silinen kayıtlar `deletedAt` ile panoda kalır; **Sistem → Geri Dönüşüm**’den geri yüklenir.

**Tech Stack:** Next.js 16 App Router, React 19, Zod 4, TypeScript, dosya tabanlı JSON store (`lib/cms/store.ts`), Vitest (yeni), mevcut Radix admin UI.

**Spec:** `docs/superpowers/specs/2026-07-25-cms-full-coverage-design.md`

## Global Constraints

- Medya kütüphanesi yok; mevcut `DirectMediaPicker` / `MediaDropzone` kalır.
- Silme soft-delete’tir; kalıcı silme yalnızca SUPERADMIN (`requireCms` + role).
- İletişim bilgisi (telefon/e-posta/adres/WhatsApp) tek kaynak: `settings.json`.
- Hero tek kaynak: `cms-config.sliderManagement` (`page-content.ana-sayfa.hero` kaldırılır — Faz 2).
- Kullanıcı Sistemi gerçek auth’u Faz 5; bu planda yalnızca modül anahtarı + guard iskeleti.
- Commit yalnızca kullanıcı istediğinde; plan adımlarında commit önerilir ama agent kullanıcı onayı olmadan commit atmaz.
- Yanıt dili / UI metinleri Türkçe.

---

## File Structure (yeni / değişecek)

| Dosya | Sorumluluk |
|---|---|
| `lib/cms/soft-delete.ts` | `markDeleted`, `restoreDeleted`, `isActiveRecord`, `purgeRecord` |
| `lib/cms/mutate-cms.ts` | Yetki + kilit + audit sarmalayıcı |
| `lib/cms/store.ts` | Dosya kuyruğu / kilit ekleme |
| `lib/cms/registry/types.ts` | Alan / bölüm / sayfa tipleri |
| `lib/cms/registry/field-zod.ts` | Şemadan Zod üretimi |
| `lib/cms/registry/pages/*.ts` | Sayfa tanımları |
| `lib/cms/registry/index.ts` | `getPage`, `getSection`, `listPages` |
| `lib/cms/ui-strings.ts` | `t()` + okuma/yazma |
| `data/ui-strings.json` | Mikro-metin deposu |
| `components/admin/admin-nav.ts` | Nested nav ağacı |
| `components/admin/admin-sidebar.tsx` | Nested render |
| `components/admin/cms/section-form.tsx` | Jenerik form |
| `app/admin/(panel)/sayfalar/[sayfa]/[bolum]/page.tsx` | Jenerik editör sayfası |
| `app/admin/(panel)/sayfalar/actions.ts` | `saveSectionAction` |
| `app/admin/(panel)/sistem/geri-donusum/page.tsx` | Geri Dönüşüm UI |
| `app/admin/(panel)/sistem/moduller/page.tsx` | Modül anahtarları (Faz 5 iskeleti erken eklenebilir) |
| `lib/data/queries.ts` | Aktif kayıt filtresi |
| Mevcut `website/actions.ts` delete’leri | Soft-delete’e çevir |

---

## Faz 1 — Altyapı

### Task 1: Vitest kurulumu

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/cms/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: `npm test` script → Vitest

- [ ] **Step 1: Vitest’i devDependency olarak ekle**

```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: `vitest.config.ts` yaz**

```ts
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
```

- [ ] **Step 3: Smoke test + script**

`package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

`lib/cms/__tests__/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest"

describe("vitest", () => {
  it("çalışır", () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Çalıştır**

Run: `npm test`  
Expected: PASS (1 test)

---

### Task 2: Soft-delete yardımcıları (TDD)

**Files:**
- Create: `lib/cms/soft-delete.ts`
- Create: `lib/cms/__tests__/soft-delete.test.ts`

**Interfaces:**
- Produces:
  - `type SoftDeletable = { deletedAt?: string | null; deletedBy?: string | null }`
  - `isActiveRecord(record: SoftDeletable): boolean`
  - `markDeleted<T>(record: T, adminId: string, now?: string): T`
  - `restoreDeleted<T>(record: T): T`
  - `filterActive<T extends SoftDeletable>(items: T[]): T[]`
  - `filterDeleted<T extends SoftDeletable>(items: T[]): T[]`

- [ ] **Step 1: Failing test yaz**

```ts
import { describe, expect, it } from "vitest"
import {
  filterActive,
  filterDeleted,
  isActiveRecord,
  markDeleted,
  restoreDeleted,
} from "@/lib/cms/soft-delete"

describe("soft-delete", () => {
  it("aktif kaydı tanır", () => {
    expect(isActiveRecord({ id: "1", deletedAt: null })).toBe(true)
    expect(isActiveRecord({ id: "1" })).toBe(true)
    expect(isActiveRecord({ id: "1", deletedAt: "2026-07-25T00:00:00.000Z" })).toBe(false)
  })

  it("markDeleted alanları set eder", () => {
    const next = markDeleted({ id: "a", title: "x" }, "admin-1", "2026-07-25T12:00:00.000Z")
    expect(next).toEqual({
      id: "a",
      title: "x",
      deletedAt: "2026-07-25T12:00:00.000Z",
      deletedBy: "admin-1",
    })
  })

  it("restoreDeleted alanları temizler", () => {
    const next = restoreDeleted({
      id: "a",
      deletedAt: "2026-07-25T12:00:00.000Z",
      deletedBy: "admin-1",
    })
    expect(next.deletedAt).toBeNull()
    expect(next.deletedBy).toBeNull()
  })

  it("filterActive / filterDeleted ayırır", () => {
    const list = [
      { id: "1", deletedAt: null },
      { id: "2", deletedAt: "2026-07-25T00:00:00.000Z" },
    ]
    expect(filterActive(list).map((x) => x.id)).toEqual(["1"])
    expect(filterDeleted(list).map((x) => x.id)).toEqual(["2"])
  })
})
```

- [ ] **Step 2: Test FAIL doğrula**

Run: `npm test -- lib/cms/__tests__/soft-delete.test.ts`  
Expected: FAIL (modül yok)

- [ ] **Step 3: Implementasyon**

```ts
export type SoftDeletable = {
  deletedAt?: string | null
  deletedBy?: string | null
}

export function isActiveRecord(record: SoftDeletable): boolean {
  return record.deletedAt == null || record.deletedAt === ""
}

export function markDeleted<T extends object>(
  record: T,
  adminId: string,
  now: string = new Date().toISOString()
): T & SoftDeletable {
  return { ...record, deletedAt: now, deletedBy: adminId }
}

export function restoreDeleted<T extends SoftDeletable>(record: T): T {
  return { ...record, deletedAt: null, deletedBy: null }
}

export function filterActive<T extends SoftDeletable>(items: T[]): T[] {
  return items.filter(isActiveRecord)
}

export function filterDeleted<T extends SoftDeletable>(items: T[]): T[] {
  return items.filter((item) => !isActiveRecord(item))
}
```

- [ ] **Step 4: Test PASS**

Run: `npm test -- lib/cms/__tests__/soft-delete.test.ts`  
Expected: PASS

---

### Task 3: `mutateJson` dosya kilidi

**Files:**
- Modify: `lib/cms/store.ts`
- Create: `lib/cms/__tests__/store-lock.test.ts`

**Interfaces:**
- Consumes: mevcut `readJson` / `writeJson`
- Produces: aynı dosyaya ardışık `mutateJson` çağrılarının sıralı çalışması (promise chain per file)

- [ ] **Step 1: Failing concurrency test**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

// Not: store DATA_DIR = cwd/data — test için process.chdir veya
// store'a test hook. Tercih: store.ts içine getDataDir override yok;
// bunun yerine lock kuyruğunu ayrı `lib/cms/file-lock.ts` yapıp onu test et.

import { withFileLock } from "@/lib/cms/file-lock"

describe("withFileLock", () => {
  it("aynı anahtar için işlemleri sıraya dizer", async () => {
    const order: number[] = []
    const slow = withFileLock("a", async () => {
      order.push(1)
      await new Promise((r) => setTimeout(r, 30))
      order.push(2)
    })
    const fast = withFileLock("a", async () => {
      order.push(3)
    })
    await Promise.all([slow, fast])
    expect(order).toEqual([1, 2, 3])
  })
})
```

- [ ] **Step 2: `lib/cms/file-lock.ts` implement et**

```ts
const chains = new Map<string, Promise<unknown>>()

export async function withFileLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve()
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const next = prev.then(() => gate)
  chains.set(
    key,
    next.catch(() => undefined)
  )
  await prev.catch(() => undefined)
  try {
    return await fn()
  } finally {
    release()
    if (chains.get(key) === next) chains.delete(key)
  }
}
```

- [ ] **Step 3: `mutateJson` içinden kilidi kullan**

`lib/cms/store.ts` içinde:

```ts
import { withFileLock } from "@/lib/cms/file-lock"

export async function mutateJson<T>(file: string, updater: (current: T) => T | Promise<T>): Promise<T> {
  return withFileLock(file, async () => {
    const current = await readJson<T>(file)
    const next = await updater(current)
    await writeJson(file, next)
    return next
  })
}
```

- [ ] **Step 4: Test PASS**

Run: `npm test -- lib/cms/__tests__/store-lock.test.ts`  
Expected: PASS

---

### Task 4: `mutateCms` yetki sarmalayıcısı

**Files:**
- Create: `lib/cms/mutate-cms.ts`
- Create: `lib/cms/__tests__/mutate-cms.test.ts` (mock `requireCms` / `logAuditEvent` mümkünse; yoksa tip derlemesi + manuel doğrulama)

**Interfaces:**
- Consumes: `requireCms`, `mutateJson`, `revalidateSite`, `logAuditEvent`
- Produces:

```ts
export type MutateCmsResult<T> =
  | { ok: true; data: T; admin: AdminSessionUser }
  | { ok: false; error: string }

export async function mutateCms<T>(options: {
  action: CmsAction
  file: string
  entityType: string
  entityId?: string
  auditAction: string
  details?: Record<string, unknown>
  updater: (current: T, admin: AdminSessionUser) => T | Promise<T>
  revalidate?: boolean
}): Promise<MutateCmsResult<T>>
```

- [ ] **Step 1: Implementasyon**

```ts
import { requireCms, type CmsAction } from "@/lib/admin/permissions"
import type { AdminSessionUser } from "@/lib/admin/auth"
import { mutateJson, revalidateSite } from "@/lib/cms/store"
import { logAuditEvent } from "@/lib/audit"

export type MutateCmsResult<T> =
  | { ok: true; data: T; admin: AdminSessionUser }
  | { ok: false; error: string }

export async function mutateCms<T>(options: {
  action: CmsAction
  file: string
  entityType: string
  entityId?: string
  auditAction: string
  details?: Record<string, unknown>
  updater: (current: T, admin: AdminSessionUser) => T | Promise<T>
  revalidate?: boolean
}): Promise<MutateCmsResult<T>> {
  const gate = await requireCms(options.action)
  if (!gate.ok) return gate

  const data = await mutateJson<T>(options.file, (current) => options.updater(current, gate.admin))

  await logAuditEvent({
    actorUserId: gate.admin.id,
    actorName: gate.admin.name,
    action: options.auditAction,
    entityType: options.entityType,
    entityId: options.entityId,
    details: options.details,
  })

  if (options.revalidate !== false) revalidateSite()

  return { ok: true, data, admin: gate.admin }
}
```

- [ ] **Step 2: `npx tsc --noEmit` ile tip kontrolü**

Expected: yeni dosyada hata yok

---

### Task 5: Koleksiyon silmelerini soft-delete’e çevir

**Files:**
- Modify: `app/admin/(panel)/website/actions.ts` — `deleteSingleSliderAction`, `deleteSingleFaqAction`, `deleteSingleWhyAdenAction`, `deleteSingleGalleryAction`
- Modify: `app/admin/(panel)/bungalovlar/actions.ts` — `deleteBungalovAction`
- Modify: `lib/data/queries.ts` — bungalov / cms listelerinde `filterActive`
- Modify: `lib/data/schemas.ts` — `deletedAt` / `deletedBy` optional alanları
- Modify: site okuyan sayfalar (slider/faq/gallery/why) — aktif filtre (queries üzerinden tercih)

**Interfaces:**
- Consumes: `markDeleted`, `mutateCms` veya `requireCms("delete")`
- Produces: silinen kayıt JSON’da kalır; sitede görünmez

- [ ] **Step 1: Slider delete örneği (diğerleri aynı kalıp)**

`deleteSingleSliderAction` içinde `list.filter(...)` yerine:

```ts
export async function deleteSingleSliderAction(id: string): Promise<ActionResult> {
  const result = await mutateCms<Record<string, any>>({
    action: "delete",
    file: CMS_CONFIG_FILE,
    entityType: "cms_slider",
    entityId: id,
    auditAction: "Tekil Slayt Silindi (çöp kutusu)",
    updater: (cfg, admin) => {
      const list = Array.isArray(cfg.sliderManagement) ? [...cfg.sliderManagement] : []
      return {
        ...cfg,
        sliderManagement: list.map((s) =>
          String(s.id) === String(id) ? markDeleted(s, admin.id) : s
        ),
      }
    },
  })
  if (!result.ok) return result
  return { ok: true }
}
```

Aynı kalıbı FAQ, WhyAden, Gallery item, Bungalov için uygula.

- [ ] **Step 2: Site sorgularında aktif filtre**

`lib/data/queries.ts` içinde config/bungalov dönerken:

```ts
import { filterActive } from "@/lib/cms/soft-delete"

// getConfig sonrası veya her koleksiyon okumasında:
sliderManagement: filterActive(cfg.sliderManagement ?? [])
// gallery items, faq, whyAden benzer
// getBungalovs: filterActive(list)
```

Admin listelerinde silinenleri gizlemek için editörlerde de `filterActive` kullan; Geri Dönüşüm Task 8’de hepsini birleştirir.

- [ ] **Step 3: Mevcut JSON kayıtlarına alan ekle (migrasyon script veya ilk okumada normalize)**

`lib/cms/normalize-soft-delete.ts`:

```ts
export function ensureSoftDeleteFields<T extends Record<string, unknown>>(item: T): T {
  return {
    ...item,
    deletedAt: item.deletedAt ?? null,
    deletedBy: item.deletedBy ?? null,
  }
}
```

İlk `mutateCms` / query yolunda listeleri map’le.

- [ ] **Step 4: Manuel doğrulama**

1. Admin’de bir SSS sil → `cms-config.json`’da kayıt `deletedAt` dolu kalsın.
2. Anasayfada SSS görünmesin.
3. CONTENT_EDITOR ile silmeyi dene → “yetkiniz yok” (delete action).

---

### Task 6: Kayıt defteri (registry) çekirdeği

**Files:**
- Create: `lib/cms/registry/types.ts`
- Create: `lib/cms/registry/field-zod.ts`
- Create: `lib/cms/registry/pages/ana-sayfa.ts`
- Create: `lib/cms/registry/index.ts`
- Create: `lib/cms/__tests__/registry.test.ts`
- Modify later: migrate away from `CMS_MANAGED_PAGES` string defaults (Faz 2’de hero kaldırılır)

**Interfaces:**
- Produces:

```ts
export type FieldType =
  | "shortText"
  | "longText"
  | "richText"
  | "image"
  | "link"
  | "number"
  | "boolean"
  | "select"

export type FieldDef = {
  name: string
  type: FieldType
  label: string
  help?: string
  required?: boolean
  defaultValue: string | number | boolean
  options?: { label: string; value: string }[] // select
}

export type SectionDef = {
  key: string
  label: string
  kind: "fields" | "collection-link"
  fields?: FieldDef[]
  collectionHref?: string // collection-link için
}

export type PageDef = {
  slug: string
  title: string
  sections: SectionDef[]
}

export function getPage(slug: string): PageDef | undefined
export function getSection(slug: string, sectionKey: string): SectionDef | undefined
export function buildSectionZod(section: SectionDef): z.ZodObject<...>
export function sectionDefaults(section: SectionDef): Record<string, unknown>
```

- [ ] **Step 1: Failing registry test**

```ts
import { describe, expect, it } from "vitest"
import { buildSectionZod, getSection, sectionDefaults } from "@/lib/cms/registry"

describe("registry", () => {
  it("CTA bölümünü döner", () => {
    const section = getSection("ana-sayfa", "cta")
    expect(section?.label).toBe("CTA")
    expect(section?.kind).toBe("fields")
  })

  it("defaults ve zod üretir", () => {
    const section = getSection("ana-sayfa", "cta")!
    const defaults = sectionDefaults(section)
    expect(defaults.title).toBeTruthy()
    const schema = buildSectionZod(section)
    const parsed = schema.safeParse(defaults)
    expect(parsed.success).toBe(true)
  })
})
```

- [ ] **Step 2: `types.ts` + `field-zod.ts` + `pages/ana-sayfa.ts` + `index.ts`**

`ana-sayfa.ts` sections (Faz 1’de en azından): `about`, `featured-bungalows`, `why-aden` (fields: eyebrow/title/description), `gallery` (title/description + CTA fields), `cta` (tüm mevcut defaultContent alanları), `faq` (başlık alanları).  
`hero` registry’de **olmasın** (slider’a ait).  
`kind: "collection-link"` örnekleri: slider → `/admin/website/slider`, why-aden cards → `/admin/website/neden-aden` (sidebar’da ayrı; section formunda link kartı da olabilir).

`buildSectionZod` örneği:

```ts
import { z } from "zod"
import type { FieldDef, SectionDef } from "./types"

function fieldZod(field: FieldDef) {
  switch (field.type) {
    case "number":
      return field.required === false ? z.number().optional() : z.number()
    case "boolean":
      return z.boolean()
    case "select":
      return z.enum(field.options!.map((o) => o.value) as [string, ...string[]])
    default:
      return field.required === false ? z.string().optional() : z.string()
  }
}

export function buildSectionZod(section: SectionDef) {
  if (section.kind !== "fields" || !section.fields) {
    throw new Error(`Bölüm şema üretmez: ${section.key}`)
  }
  const shape: Record<string, z.ZodType> = {}
  for (const field of section.fields) {
    shape[field.name] = fieldZod(field)
  }
  return z.object(shape)
}

export function sectionDefaults(section: SectionDef): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of section.fields ?? []) {
    out[field.name] = field.defaultValue
  }
  return out
}
```

**Not (string uyumu):** Mevcut `page-content.json` değerleri string. Faz 1’de registry `defaultValue`’ları string tutabilir (`"true"`, `"5"`); boolean/number alanları formda coerce edip kaydederken string’e yaz (`String(value)`) — böylece mevcut okuyucular (`getCmsField`) kırılmaz. Tip yükseltmesi Faz 2+’da yapılabilir.

- [ ] **Step 3: Test PASS**

---

### Task 7: Jenerik section form + `saveSectionAction`

**Files:**
- Create: `components/admin/cms/section-form.tsx`
- Create: `app/admin/(panel)/sayfalar/[sayfa]/[bolum]/page.tsx`
- Create: `app/admin/(panel)/sayfalar/actions.ts`
- Reuse: `DirectMediaPicker`, `AdminPageHeader`, `SaveStatus`

**Interfaces:**
- Consumes: `getSection`, `buildSectionZod`, `mutateCms`
- Produces: `saveSectionAction(pageSlug, sectionKey, values)`

- [ ] **Step 1: Action**

```ts
"use server"

import { mutateCms } from "@/lib/cms/mutate-cms"
import { getSection, buildSectionZod } from "@/lib/cms/registry"

const PAGE_CONTENT_FILE = "page-content.json"

export async function saveSectionAction(
  pageSlug: string,
  sectionKey: string,
  values: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const section = getSection(pageSlug, sectionKey)
  if (!section || section.kind !== "fields") {
    return { ok: false, error: "Bölüm bulunamadı." }
  }

  const parsed = buildSectionZod(section).safeParse(values)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }
  }

  // Mevcut string-map uyumu: tüm değerleri string'e normalize et
  const asStrings: Record<string, string> = {}
  for (const [k, v] of Object.entries(parsed.data)) {
    asStrings[k] = typeof v === "string" ? v : String(v)
  }

  const result = await mutateCms<Record<string, Record<string, Record<string, string>>>>({
    action: "update",
    file: PAGE_CONTENT_FILE,
    entityType: "page_section",
    entityId: `${pageSlug}.${sectionKey}`,
    auditAction: "Sayfa bölümü güncellendi",
    updater: (current) => ({
      ...current,
      [pageSlug]: {
        ...(current[pageSlug] ?? {}),
        [sectionKey]: asStrings,
      },
    }),
  })

  if (!result.ok) return result
  return { ok: true }
}
```

- [ ] **Step 2: Page + form**

`page.tsx`: `params` → `getSection`; yoksa `notFound()`. Mevcut `page-content` değerlerini oku (`getPageContent` / `getCmsPageContent`).  
`section-form.tsx`: `fields` map → input; `image` → `DirectMediaPicker`; submit → `saveSectionAction`.

CTA için bu rotayı kullan: `/admin/sayfalar/ana-sayfa/cta` (Faz 2’de sidebar’a bağlanır; Faz 1’de URL ile erişilebilir olmalı).

- [ ] **Step 3: Manuel test**

CTA title değiştir → kaydet → `page-content.json` güncellenir → anasayfa yansır (CTA zaten `getCmsField` okuyorsa).

---

### Task 8: Nested sidebar + Geri Dönüşüm

**Files:**
- Modify: `components/admin/admin-nav.ts`
- Modify: `components/admin/admin-sidebar.tsx` (+ mobil menü aynı kaynağı kullanıyorsa onu da)
- Create: `app/admin/(panel)/sistem/geri-donusum/page.tsx`
- Create: `app/admin/(panel)/sistem/geri-donusum/actions.ts`
- Create: `components/admin/cms/trash-panel.tsx`

**Interfaces:**
- Nav:

```ts
export type AdminNavItem = {
  label: string
  href?: string
  icon: string
  children?: AdminNavItem[]
}
```

- Trash actions: `restoreTrashItemAction(entityType, id)`, `purgeTrashItemAction(entityType, id)` — purge için `requireCms` + yalnızca SUPERADMIN kontrolü ekstra.

- [ ] **Step 1: Nav ağacını spec’teki gibi yaz** (Faz 1’de mevcut route’lara bağla; henüz olmayan sayfalar için jenerik `/admin/sayfalar/...` veya geçici mevcut href)

Örnek parça:

```ts
{
  title: "Sayfalar",
  items: [
    {
      label: "Anasayfa Yönetimi",
      icon: "House",
      children: [
        { label: "Hero / Slider", href: "/admin/website/slider", icon: "GalleryHorizontal" },
        { label: "Hakkımızda Alanı", href: "/admin/website/hakkimizda", icon: "Info" },
        { label: "Bungalovlar Alanı", href: "/admin/website/bungalovlar", icon: "House" },
        { label: "Neden Biz", href: "/admin/website/neden-aden", icon: "Sparkles" },
        { label: "Galeri Alanı", href: "/admin/sayfalar/ana-sayfa/gallery", icon: "Images" },
        { label: "CTA", href: "/admin/sayfalar/ana-sayfa/cta", icon: "MousePointerClick" },
        { label: "SSS", href: "/admin/website/sss", icon: "MessageCircleQuestionMark" },
      ],
    },
    // ... Bungalovlarımız, Galeri, İletişim, Kurumsal — Faz 3’te doldurulacak stub linkler eklenebilir
  ],
},
{
  title: "Sistem",
  items: [
    { label: "Geri Dönüşüm", href: "/admin/sistem/geri-donusum", icon: "Trash2" },
    { label: "Ayarlar", href: "/admin/ayarlar", icon: "Settings" },
    // ...
  ],
}
```

- [ ] **Step 2: Sidebar nested render** — children varsa collapsible; aktif child parent’ı açık tut.

- [ ] **Step 3: Geri Dönüşüm**

Tüm kaynaklardan `filterDeleted` topla:

```ts
type TrashItem = {
  entityType: "cms_slider" | "cms_faq" | "cms_why_aden" | "cms_gallery" | "bungalow"
  id: string
  title: string
  deletedAt: string
  deletedBy: string | null
}
```

Restore: ilgili listede `restoreDeleted`.  
Purge: kaydı listeden çıkar; `admin.role === "SUPERADMIN"` şartı.

- [ ] **Step 4: Manuel test** — sil → Geri Dönüşüm’de gör → geri yükle → sitede görünsün → SUPERADMIN kalıcı silsin.

---

### Task 9: `ui-strings` iskeleti

**Files:**
- Create: `data/ui-strings.json` (`{}` veya birkaç seed key)
- Create: `lib/cms/ui-strings.ts`
- Create: `app/admin/(panel)/site/arayuz-metinleri/page.tsx` (basit liste; dolu migrasyon Faz 4)
- Create: `app/admin/(panel)/site/arayuz-metinleri/actions.ts`
- Modify: `admin-nav.ts` — Site Geneli → Arayüz Metinleri

**Interfaces:**

```ts
export async function getUiStrings(): Promise<Record<string, string>>
export function t(strings: Record<string, string>, key: string, fallback: string): string
export async function saveUiStringAction(key: string, value: string): Promise<ActionResult>
```

- [ ] **Step 1: Seed**

```json
{
  "notFound.title": "Sayfa bulunamadı",
  "maintenance.title": "Bakımdayız"
}
```

- [ ] **Step 2: `t` helper + admin sayfası (key/value tablo + arama input)**

- [ ] **Step 3: Nav’a ekle; sayfa açılıyor mu kontrol et**

---

### Task 10: Faz 1 doğrulama kapısı

- [ ] `npm test` yeşil
- [ ] `npx tsc --noEmit` yeşil
- [ ] Soft-delete + restore + purge (SUPERADMIN) elle doğrulandı
- [ ] `/admin/sayfalar/ana-sayfa/cta` kaydı çalışıyor
- [ ] Nested sidebar görünüyor
- [ ] Spec §6 soft-delete karşılandı

**Faz 1 tamam → deploy edilebilir.**

---

## Faz 2 — Anasayfa %100

### Task 11: Hero sahipliğini slider’a sabitle

**Files:**
- Modify: `app/(site)/page.tsx` — `page-content.hero` fallback’ini kaldır; sadece slider (+ registry/site defaults)
- Modify: `data/page-content.json` — `ana-sayfa.hero` sil
- Modify: `lib/site/cms-page-content.ts` / registry — hero section yok
- Modify: `lib/site/default-site-content.ts` — gerekirse sadeleştir

- [ ] Slider boşsa şema/default slider içeriği
- [ ] “Hero Title” test verisi kalmamalı

### Task 12: Bölüm başlık editörlerini bağla

**Files:**
- Nav zaten `gallery` / why-aden titles / faq titles için `/admin/sayfalar/ana-sayfa/{gallery,why-aden,faq}` 
- Mevcut SSS/Neden Aden list editörlerinde üstte “Bölüm başlığını düzenle” linki ekle
- `about` + `featured-bungalows` mevcut sayfalarını ister jenerik forma taşı ister olduğu gibi bırak (tercih: kademeli — çalışıyorsa Faz 2’de dokunma; sadece CTA + title sections yeni formda)

- [ ] Anasayfa tüm pazarlama alanları panelden değişir
- [ ] Kod içi CTA label zorlaması (`Hızlı Rezervasyon` override) kaldırılır — `app/(site)/page.tsx` ilgili satırlar

### Task 13: Faz 2 kapısı

- [ ] Anasayfa bölümleri panelden uçtan uca güncellenir
- [ ] Hero çift kaynak yok

---

## Faz 3 — Diğer sayfalar

### Task 14: Bungalovlarımız sayfa CMS

**Files:**
- Registry: `lib/cms/registry/pages/bungalovlarimiz.ts` — `listing-hero`, `listing-behavior` (`limit`, `loadMode: "load-more" | "pagination" | "infinite"`)
- Admin: `/admin/sayfalar/bungalovlarimiz/listing-hero`, `.../listing-behavior`
- Modify: `app/(site)/bungalovlarimiz/page.tsx` + `bungalov-listing-controls.tsx` — loadMode davranışını uygula

### Task 15: Galeri sayfa başlığı düzeltmesi

**Files:**
- Registry: `galeri` page (`page-hero`)
- Modify: `app/(site)/galeri/page.tsx` — `ana-sayfa.gallery` yerine `galeri.page-hero` oku

### Task 16: İletişim yönetimi

**Files:**
- Registry: `iletisim` — `page-content`, `form-settings` (konu seçenekleri JSON/select list, başarı/hata metinleri)
- Modify: `app/(site)/iletisim/page.tsx`, `components/site/contact-inquiry-form.tsx` — hardcoded metinleri CMS’ten oku
- `page-content.json` içindeki mevcut `iletisim` seed’ini kullan / tamamla

### Task 17: Kurumsal + SEO bağlama

**Files:**
- Registry: `kurumsal` hero
- Yasal: mevcut `/admin/yasal` → nav’da Kurumsal altına
- Modify: her site `generateMetadata` — `pageSeoItems`’tan path eşleştirerek title/description/og

### Task 18: Faz 3 kapısı

- [ ] `/iletisim` CMS okuyor
- [ ] `/galeri` kendi başlığını kullanıyor
- [ ] Liste loadMode seçeneklerinden biri sitede çalışıyor
- [ ] SEO pageSeoItems metadata’ya yansıyor

---

## Faz 4 — Site geneli + sözlük

### Task 19: İletişim bilgisi tek kaynak

**Files:**
- `settings.json` phone/email/address/whatsapp tek kaynak
- Header/footer/contact sayfası kopya alanları settings’e yönlendir
- Admin Ayarlar formunda bu alanların düzenlendiğini doğrula

### Task 20: Mikro-metin migrasyonu

**Files:**
- `data/ui-strings.json` — listing, galeri UI, 404, bakım, header/footer fallback key’leri
- Bileşenlerde `t(strings, key, fallback)` kullanımı
- Arayüz Metinleri panelinden düzenlenebilir doğrulama

### Task 21: Faz 4 kapısı

- [ ] Telefon değiştirince header + iletişim + footer aynı değeri gösterir
- [ ] 404 / bakım metinleri sözlükten gelir

---

## Faz 5 — Kullanıcı Sistemi modülü (iskelet)

### Task 22: Modül anahtarı + guard

**Files:**
- `settings.json` → `modules.userSystem.enabled: false`
- `app/admin/(panel)/sistem/moduller/page.tsx` — switch
- Site: `lib/site/modules.ts` → `isUserSystemEnabled()`
- Middleware veya layout guard: pasifken `/giris`, `/kayit-ol`, `/sifremi-unuttum`, `/hesabim` → `/` redirect
- Header / mobile-bottom-nav: linkleri gizle

**Not:** Gerçek auth/hesap altyapısı bu planın dışında; ayrı iş paketi.

### Task 23: Faz 5 kapısı

- [ ] Pasifken auth route’ları kapalı, linkler gizli
- [ ] Aktifken route’lar açılır (mevcut sahte/kısmi sayfalar görünür)

---

## Execution notes

- Faz sırası bozulmamalı: 1 → 2 → 3 → 4 → 5.
- Her task sonunda `npm test` + ilgili manuel kontrol.
- Commit mesajları Conventional Commits; kullanıcı istemeden push/commit yok.
- Büyük dosya (`website/actions.ts`) soft-delete dönüşümünde parçalı PR düşünülebilir.

---

## Spec coverage checklist

| Spec bölümü | Task |
|---|---|
| §3 Kayıt defteri / tek kaynak | 6, 11, 19 |
| §4 Sidebar IA | 8, 14–17 |
| §5 Jenerik editör / koleksiyon / sözlük / mutateCms | 4, 7, 5, 9, 20 |
| §6 Soft-delete + Geri Dönüşüm | 2, 5, 8 |
| §7 Modüller | 22 |
| §8 SEO | 17 |
| §9 Fazlar | 1–23 |
| Medya kütüphanesi yok | Global Constraints |
)
