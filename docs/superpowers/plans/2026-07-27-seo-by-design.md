# SEO by Design (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merkezi polimorfik `seo-meta` deposu, panel SEO sekmesi, yayın kilidi, slug→301 ve dinamik metadata/sitemap ile SEO’yu içerik girişinin zorunlu parçası yapmak.

**Architecture:** `lib/seo/` altında Repository + Service katmanı; veri `data/seo-meta.json` + `data/url-history.json`. Admin action’lar doğrudan JSON yazmaz. Site `buildPageMetadata()` ile render; middleware aktif redirect’leri uygular. Legacy `pageSeoItems` / bungalov `seoTitle` salt-okunur fallback + log.

**Tech Stack:** Next.js 16 App Router, React 19, Zod 4, TypeScript, `lib/cms/store.ts` (`mutateJson` + `withFileLock`), Vitest, mevcut Radix admin UI.

**Spec:** `docs/superpowers/specs/2026-07-27-seo-by-design-design.md`

## Global Constraints

- MVP entity tipleri: yalnızca `page` | `bungalow`.
- Tek yazma kaynağı: `seo-meta.json` (yeni yazmalar); legacy alanlara yazma yok.
- Karakter 70/180: soft uyarı; otomatik truncation yok; Unicode sayım.
- Duplicate `metaTitle`: locale bazlı warning, kayıt engeli değil.
- Bungalov canonical URL: `/bungalovlarimiz/{slug}`; eski `{id}` URL → 301.
- `schemaJson` validate/sanitize edilmeden HTML’e basılmaz.
- `canonical` / `robots` / `schemaJson` override: yalnızca ADMIN | SUPERADMIN.
- Commit yalnızca kullanıcı istediğinde; plan adımlarında commit önerilir ama agent onaysız commit atmaz.
- Yanıt dili / UI metinleri Türkçe.
- Mevcut içerik yapısı bozulmaz; backfill zorunlu.

---

## File Structure

| Dosya | Sorumluluk |
|-------|------------|
| `lib/seo/types.ts` | `SeoMetaRecord`, `UrlHistoryRecord`, uyarı tipleri |
| `lib/seo/schemas.ts` | Zod şemaları |
| `lib/seo/path.ts` | `normalizePath`, `slugifyTr`, unicodeLength |
| `lib/seo/page-ids.ts` | Sabit sayfa `entityId` haritası |
| `lib/seo/seo-meta-repository.ts` | JSON CRUD + revision |
| `lib/seo/seo-redirect-repository.ts` | url-history CRUD |
| `lib/seo/seo-redirect-service.ts` | döngü, flatten, oluştur |
| `lib/seo/fallback.ts` | fallback zinciri |
| `lib/seo/schema-templates.ts` | JSON-LD şablonları |
| `lib/seo/schema-validate.ts` | schemaJson doğrulama/sanitize |
| `lib/seo/score.ts` | 0–100 skor |
| `lib/seo/seo-meta-service.ts` | save, resolve, publish gate |
| `lib/seo/resolve-metadata.ts` | Next `Metadata` builder |
| `lib/seo/backfill.ts` | migrasyon + rapor |
| `lib/seo/legacy-log.ts` | legacy-fallback log |
| `data/seo-meta.json` | SEO kayıtları |
| `data/url-history.json` | redirect kayıtları |
| `data/seo-legacy-fallback-log.json` | legacy okuma logu |
| `middleware.ts` | 301/302 uygulama |
| `components/admin/seo/*` | SeoTab, SERP, skor, sosyal |
| `app/admin/(panel)/seo/actions.ts` | SEO server actions |
| `scripts/seo-backfill.ts` | CLI backfill |
| `docs/seo-editor-guide.md` | Editör rehberi |

---

## Faz 1 — Temel yardımcılar

### Task 1: Tipler, Zod, path/slugify (TDD)

**Files:**
- Create: `lib/seo/types.ts`
- Create: `lib/seo/schemas.ts`
- Create: `lib/seo/path.ts`
- Create: `lib/seo/__tests__/path.test.ts`

**Interfaces:**
- Produces:
  - `normalizePath(input: string): string`
  - `slugifyTr(input: string): string`
  - `unicodeLength(input: string): number`
  - `seoMetaRecordSchema` (Zod)
  - `urlHistoryRecordSchema` (Zod)
  - types: `SeoMetaRecord`, `UrlHistoryRecord`, `SeoQualityWarning`

- [ ] **Step 1: Failing test yaz**

`lib/seo/__tests__/path.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { normalizePath, slugifyTr, unicodeLength } from "@/lib/seo/path"

describe("normalizePath", () => {
  it("domain/query/hash temizler ve lower-case yapar", () => {
    expect(normalizePath("https://example.com/Galeri/?page=2#images")).toBe("/galeri")
  })
  it("kök path'i / olarak korur", () => {
    expect(normalizePath("/")).toBe("/")
    expect(normalizePath("")).toBe("/")
  })
  it("sondaki slash'ı kaldırır", () => {
    expect(normalizePath("/bungalovlarimiz/")).toBe("/bungalovlarimiz")
  })
})

describe("slugifyTr", () => {
  it("Türkçe karakterleri dönüştürür", () => {
    expect(slugifyTr("Şömine Göl Evi")).toBe("somine-gol-evi")
  })
  it("boşlukları tire yapar", () => {
    expect(slugifyTr("  Sapanca  Jakuzi  ")).toBe("sapanca-jakuzi")
  })
})

describe("unicodeLength", () => {
  it("emoji ve birleşik karakterleri doğru sayar", () => {
    expect(unicodeLength("abc")).toBe(3)
    expect(unicodeLength("ğüş")).toBe(3)
  })
})
```

- [ ] **Step 2: Testi çalıştır — FAIL beklenir**

Run: `npm test -- lib/seo/__tests__/path.test.ts`  
Expected: FAIL (modül yok)

- [ ] **Step 3: Implementasyon**

`lib/seo/path.ts`:

```ts
export function unicodeLength(input: string): number {
  return Array.from(input).length
}

export function normalizePath(input: string): string {
  let raw = String(input || "").trim()
  if (!raw) return "/"
  try {
    if (/^https?:\/\//i.test(raw)) {
      raw = new URL(raw).pathname
    }
  } catch {
    /* ignore */
  }
  raw = raw.split("?")[0].split("#")[0]
  raw = raw.replace(/\/+/g, "/")
  if (!raw.startsWith("/")) raw = `/${raw}`
  raw = raw.toLocaleLowerCase("tr-TR")
  if (raw.length > 1) raw = raw.replace(/\/+$/, "")
  return raw || "/"
}

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
}

export function slugifyTr(input: string): string {
  const mapped = Array.from(String(input || ""))
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("")
  return mapped
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}
```

`lib/seo/types.ts` — spec §3.1 / §3.2 tiplerini birebir koy (`SeoMetaRecord`, `UrlHistoryRecord`, `SeoQualityWarning` with `level: "warning"`, `code`, `message`).

`lib/seo/schemas.ts` — Zod 4 ile aynı alanlar; `metaTitle`/`metaDescription` string (max length soft — schema’da sert max koyma; boş kontrol service’te). `canonicalUrl` boş string’i `null`’a preprocess et.

- [ ] **Step 4: Test PASS**

Run: `npm test -- lib/seo/__tests__/path.test.ts`  
Expected: PASS

---

### Task 2: Sayfa entityId haritası

**Files:**
- Create: `lib/seo/page-ids.ts`
- Create: `lib/seo/__tests__/page-ids.test.ts`

**Interfaces:**
- Produces:
  - `PAGE_ENTITY_IDS: Record<string, { entityId: string; path: string; label: string; schemaType: ... }>`
  - `getPageDefByPath(path: string)`
  - `getPageDefByEntityId(id: string)`

- [ ] **Step 1: Haritayı mevcut `pageSeoItems.id` değerleriyle yaz**

```ts
// lib/seo/page-ids.ts
export const PAGE_ENTITY_IDS = {
  home: { entityId: "seo-home", path: "/", label: "Anasayfa", schemaType: "WebPage" as const },
  bungalovlarimiz: { entityId: "seo-bungalovlarimiz", path: "/bungalovlarimiz", label: "Bungalovlarımız", schemaType: "CollectionPage" as const },
  galeri: { entityId: "seo-galeri", path: "/galeri", label: "Galeri", schemaType: "CollectionPage" as const },
  kurumsal: { entityId: "seo-kurumsal", path: "/kurumsal", label: "Kurumsal", schemaType: "AboutPage" as const },
  iletisim: { entityId: "seo-iletisim", path: "/iletisim", label: "İletişim", schemaType: "ContactPage" as const },
  // cms-config’teki diğer pageSeoItems id’leri de ekle
} as const
```

Path değişince `entityId` sabit kalır — teknik borç kapanır (mevcut SEO item id’leri kullanılır).

- [ ] **Step 2: Unit test — path ↔ entityId roundtrip**

---

### Task 3: SeoMetaRepository (TDD)

**Files:**
- Create: `lib/seo/seo-meta-repository.ts`
- Create: `lib/seo/__tests__/seo-meta-repository.test.ts`
- Create: `data/seo-meta.json` → `[]`

**Interfaces:**
- Consumes: `readJson` / `mutateJson` from `@/lib/cms/store`, `seoMetaRecordSchema`
- Produces:
  - `listSeoMeta(): Promise<SeoMetaRecord[]>`
  - `findByEntity(entityType, entityId, locale?): Promise<SeoMetaRecord | null>`
  - `findBySlug(entityType, locale, slug): Promise<SeoMetaRecord | null>`
  - `upsertSeoMeta(input, { expectedRevision?, actorId }): Promise<{ record, warnings }>`
  - File: `seo-meta.json`

- [ ] **Step 1: Failing test — revision conflict ve slug uniqueness**

Testte `mutateJson`’u mock’la veya temp data dir kullan (mevcut store test kalıbına bak: `lib/cms/__tests__/`). Tercihen pure fonksiyonları (`assertUniqueSlug`, `applyUpsert`) export edip unit test et; I/O ince sarmalayıcı kalsın.

- [ ] **Step 2: Repository implementasyonu**

Kurallar:
- `(entityType, entityId, locale)` unique
- slug varsa `(entityType, locale, normalize(slug))` unique
- `revision` mismatch → throw `SEO_REVISION_CONFLICT`
- her başarıda `revision += 1`, `updatedAt`, `updatedBy`
- yazma `mutateJson("seo-meta.json", ...)`

- [ ] **Step 3: Test PASS**

---

### Task 4: Redirect repository + service (TDD)

**Files:**
- Create: `lib/seo/seo-redirect-repository.ts`
- Create: `lib/seo/seo-redirect-service.ts`
- Create: `lib/seo/__tests__/seo-redirect-service.test.ts`
- Create: `data/url-history.json` → `[]`

**Interfaces:**
- Produces:
  - `createRedirect(input): Promise<UrlHistoryRecord>`
  - `flattenChains(): Promise<void>` (veya create içinde)
  - `wouldCreateLoop(from, to, existing): boolean`
  - `resolveRedirect(path): Promise<{ toPath, statusCode } | null>`
  - Sistem path reddi: `/admin`, `/api`, `/uploads` prefix

- [ ] **Step 1: Failing tests**

```ts
describe("SeoRedirectService", () => {
  it("A→A reddeder", () => { /* ... */ })
  it("döngü A→B, B→A reddeder", () => { /* ... */ })
  it("zinciri düzleştirir A→B, B→C ⇒ A→C", () => {
    const flat = flattenRedirects([
      { fromPath: "/a", toPath: "/b" },
      { fromPath: "/b", toPath: "/c" },
    ])
    expect(flat.find((r) => r.fromPath === "/a")?.toPath).toBe("/c")
  })
  it("sistem yolunu reddeder", () => { /* /admin/... */ })
})
```

- [ ] **Step 2: Implement `flattenRedirects` + `wouldCreateLoop` pure; service createRedirect çağırır**

- [ ] **Step 3: Test PASS**

---

## Faz 2 — İş kuralları

### Task 5: Fallback + schema template + validate (TDD)

**Files:**
- Create: `lib/seo/fallback.ts`
- Create: `lib/seo/schema-templates.ts`
- Create: `lib/seo/schema-validate.ts`
- Create: `lib/seo/__tests__/fallback.test.ts`
- Create: `lib/seo/__tests__/schema-validate.test.ts`

**Interfaces:**
- Produces:
  - `applySeoFallbacks(record, context): SeoMetaRecord` (boş alanları doldurur; truncation yok — description için kelime sınırlı öneri üretir ama kayıtta kesmez)
  - `buildSchemaJson(type, context): object`
  - `validateSchemaJson(input: unknown): { ok: true, value } | { ok: false, error: string }`
  - Sanitize: `</script>` ve HTML/JS enjeksiyonunu reddet veya escape; `@context` ve `@type` zorunlu; max boyut örn. 50_000 char

- [ ] **Step 1–4: TDD her modül için**

Fallback context örneği:

```ts
type FallbackContext = {
  title: string
  siteName: string
  bodyHtml?: string
  featuredImageUrl?: string
  defaultOgImageUrl?: string
  path: string
  baseUrl: string
}
```

`metaTitle` boşsa: `${title} | ${siteName}`  
`canonicalUrl` null kalır (self); resolve aşamasında absolute üretilir.

---

### Task 6: SEO skor + publish gate (TDD)

**Files:**
- Create: `lib/seo/score.ts`
- Create: `lib/seo/__tests__/score.test.ts`
- Modify: `lib/seo/seo-meta-service.ts` (Task 7’de tam; burada `assertPublishable` pure)

**Interfaces:**
- Produces:
  - `calculateSeoScore(input): { score: number; items: { id, label, passed, weight }[] }`
  - `assertPublishable(record): void` — eksikte throw / `{ ok: false, missing: string[] }`

Yayın için zorunlu (kayıtta dolu): `metaTitle`, `metaDescription`, `focusKeyword`; bungalow için `slug`.

- [ ] **Step 1: Test — boş focusKeyword publish fail**
- [ ] **Step 2: Implement**
- [ ] **Step 3: PASS**

---

### Task 7: SeoMetaService — save / resolve / slug change atomik

**Files:**
- Create: `lib/seo/seo-meta-service.ts`
- Create: `lib/seo/legacy-log.ts`
- Create: `lib/seo/__tests__/seo-meta-service.test.ts`
- Create: `data/seo-legacy-fallback-log.json` → `[]`

**Interfaces:**
- Consumes: repositories, redirect service, fallback, score, validateSchemaJson
- Produces:
  - `resolveSeo(entityType, entityId, locale?): Promise<ResolvedSeo>` — fallback uygulanmış + warnings
  - `saveSeo(input, actor): Promise<{ record, warnings }>`
  - `changeBungalowSlug(entityId, newSlug, actor): Promise<...>` — tek işlem: validate → unique → loop check → upsert seo + sync bungalov.slug → createRedirect → flatten
  - `logLegacyFallback(...)`

Slug değişim sırası (spec §15) birebir uygulanır. SEO + url-history yazımı mümkünse tek `withFileLock` altında sıralı iki `mutateJson` (reentrant yasak — bu yüzden **önce her iki dosyayı oku, bellekte uygula, sonra sırayla yaz** veya tek kilit anahtarı `seo-write` ile her iki dosyayı kapsayan özel transaction helper).

Öneri: `lib/seo/atomic-seo-write.ts`:

```ts
export async function withSeoTransaction<T>(fn: (ctx: {
  seoMeta: SeoMetaRecord[]
  urlHistory: UrlHistoryRecord[]
}) => Promise<{ seoMeta: SeoMetaRecord[]; urlHistory: UrlHistoryRecord[]; result: T }>): Promise<T>
```

İki dosyayı kilit sırası sabit (`seo-meta.json` sonra `url-history.json`) ile güncelle — deadlock önlemek için her zaman aynı sıra.

- [ ] **Step 1: Test slug change → redirect + flatten**
- [ ] **Step 2: Implement service + transaction helper**
- [ ] **Step 3: PASS**

---

### Task 8: Backfill

**Files:**
- Create: `lib/seo/backfill.ts`
- Create: `scripts/seo-backfill.ts`
- Create: `lib/seo/__tests__/backfill.test.ts`

**Interfaces:**
- Produces: `runSeoBackfill(): Promise<BackfillReport>`  
  `BackfillReport = { totalProcessed, created, skipped, conflicts, warnings: string[] }`

- [ ] **Step 1: pageSeoItems → page kayıtları (`entityId` = item.id, `path` = normalize(item.slug))**
- [ ] **Step 2: bungalov seoTitle/Description/slug → bungalow kayıtları; slug yoksa slugify(name)**
- [ ] **Step 3: çakışmaları rapora yaz, sessiz overwrite yok**
- [ ] **Step 4: CLI**

```ts
// scripts/seo-backfill.ts
import { runSeoBackfill } from "@/lib/seo/backfill"
runSeoBackfill().then((r) => {
  console.log(JSON.stringify(r, null, 2))
})
```

Run: `npx tsx scripts/seo-backfill.ts`  
Expected: rapor JSON; `data/seo-meta.json` dolu

- [ ] **Step 5: Spec durumunu güncelle — design.md “Onaylandı”**

---

## Faz 3 — Site çıktısı

### Task 9: `resolve-metadata` + sayfa generateMetadata bağlama

**Files:**
- Create: `lib/seo/resolve-metadata.ts`
- Modify: `app/(site)/layout.tsx` (global fallback)
- Modify: `app/(site)/page.tsx` (varsa metadata)
- Modify: `app/(site)/galeri/page.tsx`
- Modify: `app/(site)/iletisim/page.tsx`
- Modify: `app/(site)/kurumsal/page.tsx`
- Modify: `app/(site)/bungalovlarimiz/page.tsx`
- Modify: `lib/site/page-seo.ts` — `resolvePageSeo` içinden `resolveSeo("page", entityId)` çağır (geçici köprü) veya doğrudan silip çağrıları güncelle

**Interfaces:**
- Produces: `buildPageMetadata(entityType, entityId): Promise<Metadata>`

```ts
export async function buildPageMetadata(
  entityType: "page" | "bungalow",
  entityId: string
): Promise<Metadata> {
  const resolved = await seoMetaService.resolveSeo(entityType, entityId)
  return {
    title: { absolute: resolved.metaTitle },
    description: resolved.metaDescription,
    alternates: { canonical: resolved.canonicalPath },
    robots: {
      index: resolved.robotsIndex,
      follow: resolved.robotsFollow,
    },
    openGraph: {
      title: resolved.ogTitle,
      description: resolved.ogDescription,
      url: resolved.canonicalUrl,
      images: resolved.ogImageUrl ? [{ url: resolved.ogImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: resolved.ogTitle,
      description: resolved.ogDescription,
      images: resolved.ogImageUrl ? [resolved.ogImageUrl] : undefined,
    },
  }
}
```

- [ ] **Step 1: Helper yaz**
- [ ] **Step 2: Her public sayfada `generateMetadata` → `buildPageMetadata("page", PAGE_ENTITY_IDS.x.entityId)`**
- [ ] **Step 3: Smoke — `npm run build` metadata type hataları olmamalı**

---

### Task 10: Bungalov slug route + id 301

**Files:**
- Create: `app/(site)/bungalovlarimiz/[slug]/page.tsx` (mevcut `[id]` içeriğini taşı)
- Modify veya sil: `app/(site)/bungalovlarimiz/[id]/page.tsx`
- Create: `middleware.ts`
- Modify: tüm internal link’ler (`/bungalovlarimiz/${id}` → slug) — grep ile bul

**Strateji (Next çakışması):** Tek dinamik segment `[slug]` kalsın. Sayfa içinde:
1. Önce `findBySlug("bungalow", "tr", param)` veya bungalovQueries slug ile bul
2. Bulunamazsa param’ı id san; kayıt varsa `permanentRedirect` yeni slug URL’ye
3. Yoksa `notFound()`

Ayrıca `middleware.ts` `url-history` aktif kayıtlarını uygulasın (Node runtime gerekirse `export const config` matcher; JSON okuma için edge kısıtı varsa redirect map’i `data/url-history.json`’dan sync edilmiş hafif bir endpoint veya build-time değil runtime `fs` — Next middleware Edge’de `fs` yok).

**Edge çözümü:** `app/api/internal/redirects/route.ts` yok say; bunun yerine middleware’de yalnızca bilinen pattern:

```ts
// middleware.ts — bungalov id yakala
// Eğer path /bungalovlarimiz/:segment ve segment UUID/cuid gibi id ise
// rewrite/redirect için nextResponse.redirect
```

Pratik MVP: redirect logic’i **page içinde** `permanentRedirect` + middleware’de yalnızca `url-history` için küçük bir **precomputed** `lib/seo/redirect-map.json` yazımı (her redirect save’de regenerate). Middleware Edge’de bu JSON’u `import` veya `fetch` etmesin — `NextResponse.redirect` için map’i `lib/seo/redirect-map.ts` olarak generate eden fonksiyon save sonrasında dosyaya yazsın; middleware static import kullanamaz (dinamik). 

**Seçilen yaklaşım:** `middleware.ts` Node.js’e taşınamaz; bu yüzden:

1. `url-history` çözümlemesi: `app/(site)/bungalovlarimiz/[slug]/page.tsx` ve opsiyonel catch-all değil
2. Global redirect’ler için: `next.config.ts` `redirects()` async fonksiyonu `url-history.json` okusun (Node, her request değil build/start — Hostinger’da `redirects` sync sınırlı)

**En uyumlu MVP:** `lib/seo/seo-redirect-service.resolveRedirect`’i **root `proxy`/`middleware` yerine** layout veya küçük bir `app/(site)/[[...redirect]]` kullanma.

Basit ve güvenilir:

- `middleware.ts` matcher: tüm site path’leri
- Redirect map’i `data/url-history.active.json` (yalnızca `{from,to,code}[]`) her yazımda üretilir
- Middleware’de `fetch(`${origin}/api/seo/redirects`)` cache’li — **veya** map’i edge-uyumlu inline tutmak için max N kayıt

**Karar (uygula):** `app/api/seo/redirect-lookup/route.ts` GET `?path=` → `{to,code}|null` + middleware `fetch` short-circuit. Save sonrası `revalidateTag("seo-redirects")`.

- [ ] **Step 1: `[slug]/page.tsx` + id fallback redirect**
- [ ] **Step 2: API lookup + middleware**
- [ ] **Step 3: Link grep fix**
- [ ] **Step 4: Manuel — eski id URL 301**

---

### Task 11: Dinamik sitemap + robots env

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `app/robots.ts`

**Sitemap kuralları:**
- `seo-meta` page kayıtları: `robotsIndex &&` path
- bungalow: AKTIF + seo `robotsIndex` + URL slug
- `priority` / `changeFreq` / `updatedAt` kayıttan
- Auth sayfaları (`/giris` vb.) sitemap’ten çıkar veya `robotsIndex: false` ile hariç

**robots.ts:** `process.env.SEO_NOINDEX === "true"` veya `VERCEL_ENV === "preview"` → `Disallow: /`

- [ ] **Step 1: sitemap.ts yeniden yaz**
- [ ] **Step 2: robots staging noindex**
- [ ] **Step 3: `npm run build` + sitemap fonksiyonu smoke**

---

### Task 12: JSON-LD bağlama

**Files:**
- Modify: `components/site/json-ld.tsx`
- Modify: bungalov detail + ilgili sayfalar

- [ ] **Step 1: `schemaJson` validate edilmişse olduğu gibi bas; değilse `schemaType` template**
- [ ] **Step 2: `</script>` escape (`JSON.stringify` + replace `<` → `\u003c`)**

---

## Faz 4 — Admin UI

### Task 13: SeoTab bileşenleri

**Files:**
- Create: `components/admin/seo/char-counter.tsx`
- Create: `components/admin/seo/serp-preview.tsx`
- Create: `components/admin/seo/social-preview.tsx`
- Create: `components/admin/seo/seo-score-panel.tsx`
- Create: `components/admin/seo/seo-tab.tsx`

**Interfaces:**
- Produces: `<SeoTab value onChange warnings score canEditAdvanced disabledPublish />`

Özellikler:
- Masaüstü/mobil SERP toggle
- Char counter: ideal title 50–60 (sarı &lt;50, yeşil 50–60, kırmızı &gt;70 önerilen); desc 140–160 / 180
- Sosyal kartlar (FB / X / WA)
- Skor paneli Türkçe kalemler
- Gelişmiş alanlar (`canonical`, `robots`, `schemaJson`) `canEditAdvanced` false ise gizli

Mevcut `components/admin/website/seo-editor.tsx` SERP’inden stil uyarla; yeni polymorphic forma taşı.

- [ ] **Step 1: Sunum bileşenleri**
- [ ] **Step 2: SeoTab birleştir**
- [ ] **Step 3: Story yok — admin sayfasında görsel smoke**

---

### Task 14: SEO actions + BungalovForm entegrasyonu

**Files:**
- Create: `app/admin/(panel)/seo/actions.ts`
- Modify: `components/admin/bungalov/bungalov-form.tsx`
- Modify: `app/admin/(panel)/bungalovlar/actions.ts`

**Actions:**

```ts
"use server"
export async function saveEntitySeoAction(input: {
  entityType: "page" | "bungalow"
  entityId: string
  revision: number
  patch: Partial<SeoMetaRecord>
}): Promise<{ ok: true; record; warnings } | { ok: false; error: string }>

export async function publishBungalowAction(id: string): Promise<...>
// içinde assertPublishable
```

- Bungalov kaydet: içerik + SEO service aynı akışta; slug değiştiyse `changeBungalowSlug`
- `status: AKTIF` geçişinde publish gate
- UI: zorunlu boşken Yayınla `disabled`

- [ ] **Step 1: actions**
- [ ] **Step 2: form SEO sekmesi → SeoTab**
- [ ] **Step 3: eski seoTitle input’larını kaldır (gösterim yok)**

---

### Task 15: Sayfa SEO admin

**Files:**
- Modify: `components/admin/website/seo-editor.tsx` veya yeniden yaz
- Modify: `app/admin/(panel)/website/actions.ts` — `saveSeoAction` seo-meta’ya yönlendir
- Modify: `app/admin/(panel)/website/seo/page.tsx`

- Global site title/description (`siteManagement.seoTitle`) kalabilir (fallback zinciri için)
- `pageSeoItems` UI’si `seo-meta` page listesine döner
- Kaydet → `seoMetaService.saveSeo`

- [ ] **Step 1: Editor’ü SeoTab listesine bağla**
- [ ] **Step 2: saveSeoAction migrate**
- [ ] **Step 3: Eski pageSeoItems yazmayı bırak**

---

## Faz 5 — Dokümantasyon ve temizlik

### Task 16: Editör rehberi + deprecation

**Files:**
- Create: `docs/seo-editor-guide.md`
- Modify: `lib/bungalov-seo.ts` — `buildBungalovSeo` fallback.ts’e taşındıysa re-export veya sil
- Modify: `docs/superpowers/specs/2026-07-27-seo-by-design-design.md` — Durum: Onaylandı
- Modify: `docs/CHANGELOG.md` — kısa madde

Rehber başlıkları (1 sayfa):
1. SEO sekmesi nerede?
2. Yayınlamadan önce zorunlu alanlar
3. Karakter renkleri ne anlama gelir?
4. Odak kelime
5. Otomatik doldur
6. Slug değişince ne olur?

- [ ] **Step 1: Rehberi yaz**
- [ ] **Step 2: CHANGELOG**
- [ ] **Step 3: `npm test` + `npm run build` yeşil**

---

## Self-Review (plan)

| Spec bölümü | Task |
|-------------|------|
| Veri modeli seo-meta / url-history | 1–4 |
| path/slug kuralları, locale uniqueness | 1, 3 |
| meta soft length, duplicate warning | 1, 7 |
| schema enum + validate | 5, 12 |
| audit revision | 3, 7 |
| canonical/OG normalize | 5, 7 |
| redirect loop/flatten/atomic slug | 4, 7 |
| backfill + rapor + legacy log | 7, 8 |
| repository/service, no direct JSON from actions | 3, 4, 7, 14 |
| fallback + publish lock | 5, 6, 14 |
| panel SeoTab SERP/skor/sosyal | 13–15 |
| site metadata / JSON-LD / sitemap / robots | 9–12 |
| slug URL + 301 | 10 |
| editör rehberi | 16 |
| Faz B dışarıda | — bilinçli |

Placeholder taraması: Edge middleware için net karar Task 10’da yazılı (API lookup + page-level id redirect).

---

## Execution Handoff

Plan kaydedildi: `docs/superpowers/plans/2026-07-27-seo-by-design.md`.

**İki uygulama seçeneği:**

1. **Subagent-Driven (önerilen)** — Her task için taze subagent, arada review  
2. **Inline Execution** — Bu oturumda `executing-plans` ile batch + checkpoint  

Hangisini istiyorsun?
