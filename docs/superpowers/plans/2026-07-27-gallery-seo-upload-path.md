# Galeri SEO Upload Path + WebP Finalize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Galeri görsellerini `uploads/galeri/{kategori-slug}/{image-slug}-{timestamp}.webp` yoluna kaydetmek; kategori id’lerinden `gallery-category-` önekini kaldırmak; mevcut dosyaları taşımak.

**Architecture:** Upload geçici olarak `galeri/_staging` yazar. `saveSingleGalleryAction` kaydetmeden önce `finalizeGalleryImage` ile Sharp WebP + SEO path üretir. Ortak `toSeoSlug` Türkçe transliterate yapar. Tek seferlik `migrateGallerySeoPaths` kategori id remap + disk taşıma yapar.

**Tech Stack:** Next.js 16, TypeScript, Sharp (`^0.35.0`), Vitest, mevcut `lib/media/*` + `saveSingleGalleryAction`.

**Spec:** `docs/superpowers/specs/2026-07-27-gallery-seo-upload-path-design.md`

## Global Constraints

- Nihai path yalnızca **kaydetmede** finalize edilir (upload = staging).
- Format her zaman `.webp` (Sharp quality ~82).
- Klasör = kategori **name** slug’ı; kategori id path’te kullanılmaz.
- Dosya tabanı = trim’li title varsa title slug; yoksa kategori name slug; suffix = `Date.now()` (random yok).
- `gallery-category-` öneki hiçbir yeni id/path’te üretilmez.
- Harici `http(s)://` URL’lere dokunulmaz.
- Diğer upload scope’ları (bungalov, slider, …) değişmez.
- Soft-delete / purge davranışı değişmez; migrasyon soft-delete item’ları da kapsar.
- Commit yalnızca kullanıcı istediğinde; plan adımlarında commit önerilir ama agent onaysız commit atmaz.
- Yanıt dili / UI metinleri Türkçe.

---

## File Structure

| Dosya | Sorumluluk |
|-------|------------|
| `lib/media/slug.ts` | `toSeoSlug`, `uniqueCategoryId` |
| `lib/media/__tests__/slug.test.ts` | slug + unique id testleri |
| `lib/media/upload.ts` | galeri → `galeri/_staging` |
| `lib/media/__tests__/upload-galeri-staging.test.ts` | staging subdir |
| `lib/media/finalize-gallery.ts` | WebP + hedef path + eski dosya silme |
| `lib/media/__tests__/finalize-gallery.test.ts` | finalize davranışı |
| `lib/media/migrate-gallery-paths.ts` | kategori id remap + dosya migrasyonu |
| `lib/media/__tests__/migrate-gallery-paths.test.ts` | remap + idempotent |
| `scripts/migrate-gallery-seo-paths.ts` | CLI |
| `package.json` | `db:migrate-gallery-seo` script |
| `app/admin/(panel)/website/actions.ts` | `saveSingleGalleryAction` finalize |
| `lib/site/website-cms-types.ts` | default kategori id’leri |
| `lib/site/gallery-content.ts` | `DEFAULT_GALLERY_CATEGORY_TABS` |
| `app/(site)/galeri/page.tsx` | fallback kategoriler |
| `app/admin/(panel)/website/galeri/page.tsx` | id fallback |
| `components/admin/website/gallery-editor.tsx` | `addCategory` slug id |

---

### Task 1: `toSeoSlug` + `uniqueCategoryId`

**Files:**
- Create: `lib/media/slug.ts`
- Create: `lib/media/__tests__/slug.test.ts`

**Interfaces:**
- Produces:
  - `toSeoSlug(input: string, fallback?: string, maxLen?: number): string`
  - `uniqueCategoryId(name: string, existingIds: Iterable<string>): string`

- [ ] **Step 1: Write the failing test**

```ts
// lib/media/__tests__/slug.test.ts
import { describe, expect, it } from "vitest"
import { toSeoSlug, uniqueCategoryId } from "../slug"

describe("toSeoSlug", () => {
  it("başlığı slug yapar", () => {
    expect(toSeoSlug("Aden Aile Suit")).toBe("aden-aile-suit")
  })

  it("Türkçe karakterleri transliterate eder", () => {
    expect(toSeoSlug("Bungalovlar")).toBe("bungalovlar")
    expect(toSeoSlug("Şömine & Göl")).toBe("somine-gol")
  })

  it("Odalar/Suit → odalar-suit", () => {
    expect(toSeoSlug("Odalar/Suit")).toBe("odalar-suit")
  })

  it("boş girişte fallback döner", () => {
    expect(toSeoSlug("   ", "genel")).toBe("genel")
  })

  it("maxLen uygular", () => {
    expect(toSeoSlug("a".repeat(100), "x", 40).length).toBeLessThanOrEqual(40)
  })
})

describe("uniqueCategoryId", () => {
  it("name'den slug üretir", () => {
    expect(uniqueCategoryId("Bungalovlar", [])).toBe("bungalovlar")
  })

  it("çakışmada -2, -3 ekler", () => {
    expect(uniqueCategoryId("Odalar/Suit", ["odalar-suit"])).toBe("odalar-suit-2")
    expect(uniqueCategoryId("Odalar/Suit", ["odalar-suit", "odalar-suit-2"])).toBe("odalar-suit-3")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/media/__tests__/slug.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/media/slug.ts
const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i", İ: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
}

export function toSeoSlug(input: string, fallback = "genel", maxLen = 60): string {
  const mapped = String(input || "")
    .normalize("NFKC")
    .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (ch) => TR_MAP[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "")
  return mapped || fallback
}

export function uniqueCategoryId(name: string, existingIds: Iterable<string>): string {
  const used = new Set(Array.from(existingIds, String))
  const base = toSeoSlug(name, "kategori")
  if (!used.has(base)) return base
  let n = 2
  while (used.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/media/__tests__/slug.test.ts`
Expected: PASS

- [ ] **Step 5: Commit (kullanıcı isterse)**

```bash
git add lib/media/slug.ts lib/media/__tests__/slug.test.ts
git commit -m "feat(media): SEO slug ve benzersiz kategori id"
```

---

### Task 2: Galeri upload → `_staging`

**Files:**
- Modify: `lib/media/upload.ts` (`resolveSubdir` galeri case)
- Create: `lib/media/__tests__/upload-galeri-staging.test.ts`

**Interfaces:**
- Consumes: mevcut `saveUpload`, `UploadTarget`
- Produces: galeri scope → göreli klasör `galeri/_staging`

- [ ] **Step 1: Write the failing test**

```ts
// lib/media/__tests__/upload-galeri-staging.test.ts
import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("saveUpload galeri staging", () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aden-up-"))
    vi.stubEnv("UPLOAD_DIR", tmpRoot)
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    await fs.rm(tmpRoot, { recursive: true, force: true })
  })

  it("galeri yüklemeyi _staging altına yazar", async () => {
    const { saveUpload } = await import("../upload")
    const result = await saveUpload(
      Buffer.from("fake"),
      "Fotoğraf.jpg",
      "image/jpeg",
      { scope: "galeri", category: "gallery-category-bungalovlar" }
    )
    expect(result.url).toMatch(/^\/uploads\/galeri\/_staging\//)
    expect(result.url).not.toContain("gallery-category-")
    const abs = path.join(tmpRoot, result.url.replace("/uploads/", ""))
    await expect(fs.access(abs)).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/media/__tests__/upload-galeri-staging.test.ts`
Expected: FAIL (URL `galeri/gallery-category-...` içerir)

- [ ] **Step 3: Update `resolveSubdir`**

In `lib/media/upload.ts`, change galeri case:

```ts
case "galeri":
  return path.join("galeri", "_staging")
```

Keep `UploadTarget` type with `category` for formData uyumu (kullanılmasa da zarar yok).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/media/__tests__/upload-galeri-staging.test.ts`
Expected: PASS

- [ ] **Step 5: Commit (kullanıcı isterse)**

```bash
git add lib/media/upload.ts lib/media/__tests__/upload-galeri-staging.test.ts
git commit -m "feat(media): galeri upload staging klasörü"
```

---

### Task 3: `finalizeGalleryImage`

**Files:**
- Create: `lib/media/finalize-gallery.ts`
- Create: `lib/media/__tests__/finalize-gallery.test.ts`

**Interfaces:**
- Consumes: `toSeoSlug`, `resolveUploadRoot`, `deleteUploadByUrl`, `isUploadUrlReferencedElsewhere`, `sharp`
- Produces:

```ts
export type FinalizeGalleryInput = {
  imageUrl: string
  title: string
  categoryName: string
  /** Referans tarama için; eski dosya silinirken bu item hariç tutulur */
  itemId?: string
  /** Test/deterministik isim için opsiyonel; yoksa Date.now() */
  timestamp?: number
}

export type FinalizeGalleryResult = {
  imageUrl: string
  changed: boolean
}

export function buildGallerySeoUrl(opts: {
  categoryName: string
  title: string
  timestamp: number
}): string

export async function finalizeGalleryImage(
  input: FinalizeGalleryInput
): Promise<FinalizeGalleryResult>
```

- [ ] **Step 1: Write the failing tests**

```ts
// lib/media/__tests__/finalize-gallery.test.ts
import fs from "fs/promises"
import os from "os"
import path from "path"
import sharp from "sharp"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("finalizeGalleryImage", () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aden-fin-"))
    vi.stubEnv("UPLOAD_DIR", tmpRoot)
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    await fs.rm(tmpRoot, { recursive: true, force: true })
  })

  it("harici URL için no-op", async () => {
    const { finalizeGalleryImage } = await import("../finalize-gallery")
    const res = await finalizeGalleryImage({
      imageUrl: "https://cdn.example.com/a.jpg",
      title: "Aden",
      categoryName: "Bungalovlar",
    })
    expect(res).toEqual({ imageUrl: "https://cdn.example.com/a.jpg", changed: false })
  })

  it("staging jpeg → galeri/bungalovlar/title-ts.webp", async () => {
    const stagingRel = path.join("galeri", "_staging", "foto.jpg")
    const stagingAbs = path.join(tmpRoot, stagingRel)
    await fs.mkdir(path.dirname(stagingAbs), { recursive: true })
    await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 10, g: 20, b: 30 } },
    })
      .jpeg()
      .toFile(stagingAbs)

    const { finalizeGalleryImage, buildGallerySeoUrl } = await import("../finalize-gallery")
    const ts = 1785136677955
    const res = await finalizeGalleryImage({
      imageUrl: "/uploads/galeri/_staging/foto.jpg",
      title: "Aden Aile Suit",
      categoryName: "Bungalovlar",
      timestamp: ts,
      itemId: "gal-1",
    })

    const expected = buildGallerySeoUrl({
      categoryName: "Bungalovlar",
      title: "Aden Aile Suit",
      timestamp: ts,
    })
    expect(res.imageUrl).toBe(expected)
    expect(res.changed).toBe(true)
    expect(expected).toBe("/uploads/galeri/bungalovlar/aden-aile-suit-1785136677955.webp")

    const abs = path.join(tmpRoot, expected.replace("/uploads/", ""))
    await expect(fs.access(abs)).resolves.toBeUndefined()
    await expect(fs.access(stagingAbs)).rejects.toMatchObject({ code: "ENOENT" })
  })

  it("title yoksa kategori slug kullanır", async () => {
    const stagingRel = path.join("galeri", "_staging", "x.png")
    const stagingAbs = path.join(tmpRoot, stagingRel)
    await fs.mkdir(path.dirname(stagingAbs), { recursive: true })
    await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .png()
      .toFile(stagingAbs)

    const { finalizeGalleryImage } = await import("../finalize-gallery")
    const res = await finalizeGalleryImage({
      imageUrl: "/uploads/galeri/_staging/x.png",
      title: "  ",
      categoryName: "Bungalovlar",
      timestamp: 1785136658667,
    })
    expect(res.imageUrl).toBe("/uploads/galeri/bungalovlar/bungalovlar-1785136658667.webp")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/media/__tests__/finalize-gallery.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Write implementation**

```ts
// lib/media/finalize-gallery.ts
import fs from "fs/promises"
import path from "path"
import sharp from "sharp"
import { toSeoSlug } from "@/lib/media/slug"
import { resolveUploadRoot } from "@/lib/media/upload"
import {
  deleteUploadByUrl,
  isUploadUrlReferencedElsewhere,
  normalizeUploadUrl,
} from "@/lib/media/delete"

export type FinalizeGalleryInput = {
  imageUrl: string
  title: string
  categoryName: string
  itemId?: string
  timestamp?: number
}

export type FinalizeGalleryResult = {
  imageUrl: string
  changed: boolean
}

export function buildGallerySeoUrl(opts: {
  categoryName: string
  title: string
  timestamp: number
}): string {
  const categorySlug = toSeoSlug(opts.categoryName, "genel")
  const titleTrim = String(opts.title || "").trim()
  const base = titleTrim
    ? toSeoSlug(titleTrim, categorySlug, 40)
    : categorySlug
  return `/uploads/galeri/${categorySlug}/${base}-${opts.timestamp}.webp`
}

function isLocalUploadsUrl(url: string): boolean {
  const n = normalizeUploadUrl(url)
  return !!n && n.startsWith("/uploads/")
}

function urlToAbs(url: string): string | null {
  const n = normalizeUploadUrl(url)
  if (!n || !n.startsWith("/uploads/")) return null
  const rel = n.slice("/uploads/".length)
  const root = resolveUploadRoot()
  const abs = path.resolve(root, rel)
  const rootResolved = path.resolve(root)
  if (abs !== rootResolved && !abs.startsWith(rootResolved + path.sep)) return null
  return abs
}

export async function finalizeGalleryImage(
  input: FinalizeGalleryInput
): Promise<FinalizeGalleryResult> {
  const rawUrl = String(input.imageUrl || "").trim()
  if (!rawUrl) return { imageUrl: rawUrl, changed: false }
  if (/^https?:\/\//i.test(rawUrl)) return { imageUrl: rawUrl, changed: false }
  if (!isLocalUploadsUrl(rawUrl)) return { imageUrl: rawUrl, changed: false }

  const timestamp = input.timestamp ?? Date.now()
  const targetUrl = buildGallerySeoUrl({
    categoryName: input.categoryName,
    title: input.title,
    timestamp,
  })

  const normalizedCurrent = normalizeUploadUrl(rawUrl) || rawUrl
  if (normalizedCurrent === targetUrl) {
    return { imageUrl: targetUrl, changed: false }
  }

  // Aynı SEO klasöründe zaten webp ve basename uyumluysa (yalnızca ts farklı değilse)
  // — title/kategori değiştiyse her zaman yeniden üret.
  // Basit kural: hedef URL farklıysa her zaman dönüştür/taşı.

  const srcAbs = urlToAbs(rawUrl)
  if (!srcAbs) throw new Error("Geçersiz görsel yolu.")

  const root = resolveUploadRoot()
  const destRel = targetUrl.slice("/uploads/".length)
  const destAbs = path.join(root, destRel)
  await fs.mkdir(path.dirname(destAbs), { recursive: true })

  await sharp(srcAbs).webp({ quality: 82 }).toFile(destAbs)

  const referenced = await isUploadUrlReferencedElsewhere(rawUrl, {
    excludeEntityType: "cms_gallery",
    excludeId: input.itemId,
  })
  if (!referenced && normalizedCurrent !== targetUrl) {
    await deleteUploadByUrl(rawUrl)
  }

  return { imageUrl: targetUrl, changed: true }
}
```

**Not:** `isUploadUrlReferencedElsewhere` CMS’i okur; unit testte staging dosyası silinir çünkü başka referans yok (boş CMS). Mock gerekirse `vi.mock` ile `delete` modülünü stub’layın — mevcut delete testleri gibi dinamik import kullanın.

Eğer testte CMS dosyası staging URL’yi tutuyorsa silme engellenir. Test ortamında `readJson` boş dönerse sorun yok. Gerekirse:

```ts
vi.mock("@/lib/cms/store", () => ({
  readJson: vi.fn().mockResolvedValue(null),
}))
```

test dosyasının başına ekleyin (diğer media testleriyle uyumlu şekilde).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/media/__tests__/finalize-gallery.test.ts`
Expected: PASS

- [ ] **Step 5: Commit (kullanıcı isterse)**

```bash
git add lib/media/finalize-gallery.ts lib/media/__tests__/finalize-gallery.test.ts
git commit -m "feat(media): galeri WebP SEO finalize"
```

---

### Task 4: `saveSingleGalleryAction` içinde finalize

**Files:**
- Modify: `app/admin/(panel)/website/actions.ts` (`saveSingleGalleryAction`, ~408–441)

**Interfaces:**
- Consumes: `finalizeGalleryImage`, CMS `galleryManagement.categories` (categoryName çözümü)

- [ ] **Step 1: Helper — kategori adını çöz**

`actions.ts` içinde (veya finalize yanında) kaydetmeden önce:

```ts
import { finalizeGalleryImage } from "@/lib/media/finalize-gallery"
import { readJson } from "@/lib/cms/store"

// saveSingleGalleryAction içinde, mutateJson öncesi:
const cfg = await readJson<Record<string, any>>("cms-config.json").catch(() => ({}))
const categories = Array.isArray(cfg?.galleryManagement?.categories)
  ? cfg.galleryManagement.categories
  : []
const cat = categories.find((c: any) => String(c.id) === String(item.categoryId))
const categoryName = String(cat?.name || item.categoryId || "genel")

let imageUrl = item.imageUrl
try {
  const finalized = await finalizeGalleryImage({
    imageUrl: item.imageUrl,
    title: item.title,
    categoryName,
    itemId: item.id,
  })
  imageUrl = finalized.imageUrl
} catch (err) {
  const message = err instanceof Error ? err.message : "Görsel işlenemedi."
  return { ok: false, error: message }
}

const itemToSave = { ...item, imageUrl }
// mutateJson ... itemToSave kullan
```

- [ ] **Step 2: Manuel / smoke kontrol listesi**

1. Admin → Galeri → Yeni görsel
2. Kategori seç, görsel yükle → URL `/uploads/galeri/_staging/...` olmalı
3. Title gir → Kaydet
4. Diskte `/uploads/galeri/{slug}/{title-slug}-{ts}.webp` oluşmalı
5. Staging dosya silinmiş olmalı
6. Title boş kaydet → dosya adı kategori slug + ts

- [ ] **Step 3: Commit (kullanıcı isterse)**

```bash
git add app/admin/\(panel\)/website/actions.ts
git commit -m "feat(galeri): kaydetmede SEO WebP finalize"
```

---

### Task 5: Kategori id üretimi (defaults + UI)

**Files:**
- Modify: `lib/site/website-cms-types.ts` (default categories ~512–522)
- Modify: `lib/site/gallery-content.ts` (`DEFAULT_GALLERY_CATEGORY_TABS`)
- Modify: `app/(site)/galeri/page.tsx` (fallback id’ler)
- Modify: `app/admin/(panel)/website/galeri/page.tsx` (id fallback satır ~23)
- Modify: `components/admin/website/gallery-editor.tsx` (`addCategory`)

**Interfaces:**
- Consumes: `uniqueCategoryId` / `toSeoSlug`

- [ ] **Step 1: Defaults güncelle**

```ts
// website-cms-types.ts & gallery-content.ts & app/(site)/galeri/page.tsx
{ id: "bungalovlar", name/label: "Bungalovlar", ... }
{ id: "odalar-suit", name/label: "Odalar/Suit", ... }
```

`galeri/page.tsx` içindeki lokal fallback listesini aynı id’lere çek.

- [ ] **Step 2: Admin page fallback**

```ts
// app/admin/(panel)/website/galeri/page.tsx
id: String(c?.id ?? `kategori-${Math.random().toString(36).slice(2, 8)}`),
```

(`gallery-category-` kullanma)

- [ ] **Step 3: `addCategory` slug id**

```ts
// gallery-editor.tsx
import { uniqueCategoryId } from "@/lib/media/slug"

const addCategory = () => {
  if (!newCatName.trim()) return
  const snapshot = { categories, items }
  const freshCat: GalleryCategory = {
    id: uniqueCategoryId(
      newCatName.trim(),
      categories.map((c) => c.id)
    ),
    name: newCatName.trim(),
    isActive: true,
  }
  // ... mevcut persist
}
```

- [ ] **Step 4: Commit (kullanıcı isterse)**

```bash
git add lib/site/website-cms-types.ts lib/site/gallery-content.ts \
  app/\(site\)/galeri/page.tsx \
  app/admin/\(panel\)/website/galeri/page.tsx \
  components/admin/website/gallery-editor.tsx
git commit -m "feat(galeri): kategori id'lerini label slug yap"
```

---

### Task 6: Migrasyon — kategori id remap + dosya taşıma

**Files:**
- Create: `lib/media/migrate-gallery-paths.ts`
- Create: `lib/media/__tests__/migrate-gallery-paths.test.ts`
- Create: `scripts/migrate-gallery-seo-paths.ts`
- Modify: `package.json` (script)

**Interfaces:**
- Consumes: `toSeoSlug`, `uniqueCategoryId`, `finalizeGalleryImage` / `buildGallerySeoUrl`, `readJson`/`mutateJson` veya doğrudan CMS yazma
- Produces:

```ts
export type GalleryMigrateResult = {
  categoriesRemapped: number
  filesMigrated: number
  errors: string[]
}

export function remapGalleryCategoryIds(
  categories: Array<{ id: string; name: string; [k: string]: unknown }>,
  items: Array<{ categoryId: string; [k: string]: unknown }>
): {
  categories: typeof categories
  items: typeof items
  idMap: Record<string, string>
}

export async function migrateGallerySeoPaths(): Promise<GalleryMigrateResult>
```

- [ ] **Step 1: Write failing remap test**

```ts
// lib/media/__tests__/migrate-gallery-paths.test.ts
import { describe, expect, it } from "vitest"
import { remapGalleryCategoryIds } from "../migrate-gallery-paths"

describe("remapGalleryCategoryIds", () => {
  it("gallery-category- önekini name slug'a çevirir ve item'ları günceller", () => {
    const { categories, items, idMap } = remapGalleryCategoryIds(
      [
        { id: "gallery-category-bungalovlar", name: "Bungalovlar", isActive: true },
        { id: "gallery-category-odalar-suit", name: "Odalar/Suit", isActive: true },
      ],
      [
        { id: "g1", categoryId: "gallery-category-bungalovlar", imageUrl: "/uploads/x.jpg" },
      ]
    )
    expect(idMap["gallery-category-bungalovlar"]).toBe("bungalovlar")
    expect(idMap["gallery-category-odalar-suit"]).toBe("odalar-suit")
    expect(categories.map((c) => c.id)).toEqual(["bungalovlar", "odalar-suit"])
    expect(items[0].categoryId).toBe("bungalovlar")
  })

  it("zaten slug olan id'ye dokunmaz", () => {
    const { categories, idMap } = remapGalleryCategoryIds(
      [{ id: "bungalovlar", name: "Bungalovlar", isActive: true }],
      []
    )
    expect(categories[0].id).toBe("bungalovlar")
    expect(Object.keys(idMap)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run lib/media/__tests__/migrate-gallery-paths.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement remap + migrate**

```ts
// lib/media/migrate-gallery-paths.ts (özet mantık)

export function remapGalleryCategoryIds(categories, items) {
  const idMap: Record<string, string> = {}
  const used = new Set<string>()
  const nextCategories = categories.map((c) => {
    const desired = toSeoSlug(String(c.name || ""), "kategori")
    // zaten desired veya unique
    let nextId = desired
    if (used.has(nextId) && String(c.id) !== nextId) {
      nextId = uniqueCategoryId(String(c.name || ""), used)
    }
    // Eğer eski id desired ile aynıysa olduğu gibi bırak
    if (String(c.id) !== nextId) {
      // çakışma: başka kategori nextId kullanıyorsa uniqueCategoryId
      if (used.has(nextId)) nextId = uniqueCategoryId(String(c.name || ""), used)
      idMap[String(c.id)] = nextId
    }
    used.add(nextId)
    return { ...c, id: nextId }
  })
  const nextItems = items.map((it) => ({
    ...it,
    categoryId: idMap[String(it.categoryId)] ?? it.categoryId,
  }))
  return { categories: nextCategories, items: nextItems, idMap }
}

export async function migrateGallerySeoPaths(): Promise<GalleryMigrateResult> {
  // 1. read cms-config galleryManagement
  // 2. remap ids → write back
  // 3. her item için finalizeGalleryImage({ imageUrl, title, categoryName, itemId, timestamp: Date.now()+index })
  //    - zaten hedef formattaysa finalize changed:false
  // 4. boş gallery-category-* klasörlerini fs.rmdir
  // 5. güncellenmiş items'ı CMS'e yaz
  // 6. { categoriesRemapped: Object.keys(idMap).length, filesMigrated, errors }
}
```

**Klasör temizliği:**

```ts
const galeriRoot = path.join(resolveUploadRoot(), "galeri")
const entries = await fs.readdir(galeriRoot, { withFileTypes: true })
for (const ent of entries) {
  if (ent.isDirectory() && ent.name.startsWith("gallery-category-")) {
    const dir = path.join(galeriRoot, ent.name)
    const left = await fs.readdir(dir)
    if (left.length === 0) await fs.rmdir(dir)
  }
}
```

- [ ] **Step 4: CLI + npm script**

```ts
// scripts/migrate-gallery-seo-paths.ts
import { migrateGallerySeoPaths } from "../lib/media/migrate-gallery-paths"

async function main() {
  const result = await migrateGallerySeoPaths()
  console.log(JSON.stringify(result, null, 2))
  if (result.errors.length) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

`package.json`:

```json
"db:migrate-gallery-seo": "tsx scripts/migrate-gallery-seo-paths.ts"
```

- [ ] **Step 5: Run unit tests**

Run: `npx vitest run lib/media/__tests__/migrate-gallery-paths.test.ts lib/media/__tests__/slug.test.ts lib/media/__tests__/finalize-gallery.test.ts lib/media/__tests__/upload-galeri-staging.test.ts`
Expected: all PASS

- [ ] **Step 6: Commit (kullanıcı isterse)**

```bash
git add lib/media/migrate-gallery-paths.ts lib/media/__tests__/migrate-gallery-paths.test.ts \
  scripts/migrate-gallery-seo-paths.ts package.json
git commit -m "feat(galeri): SEO path ve kategori id migrasyonu"
```

---

### Task 7: Uçtan uca doğrulama

**Files:** (değişiklik yok — doğrulama)

- [ ] **Step 1: Tüm ilgili testler**

Run: `npx vitest run lib/media/__tests__`
Expected: PASS

- [ ] **Step 2: Migrasyonu yerel çalıştır (UPLOAD_DIR ayarlı ortamda)**

Run: `npm run db:migrate-gallery-seo`
Expected: JSON özet; `errors: []`

- [ ] **Step 3: Manuel checklist**

- [ ] Yeni kategori ekle → id `bungalovlar` tarzı slug, `gallery-category-` yok
- [ ] Yeni görsel: staging → kaydet → `galeri/{slug}/{name}-{ts}.webp`
- [ ] Title yok → `{kategori-slug}-{ts}.webp`
- [ ] Eski `gallery-category-*` klasörleri boş/silinmiş; item URL’leri güncel
- [ ] Site `/galeri` sekmeleri doğru (bungalovlar / odalar-suit)
- [ ] Soft-delete + geri dönüşüm önizlemesi hâlâ çalışıyor

---

## Spec coverage checklist

| Spec gereksinimi | Task |
|------------------|------|
| SEO path formatı | 3, 4 |
| Title / kategori slug | 1, 3 |
| Türkçe transliterate | 1 |
| Staging upload | 2 |
| Kaydetmede WebP finalize | 3, 4 |
| Kategori id slug, önek yok | 5, 6 |
| Mevcut dosya taşıma | 6 |
| Soft-delete item migrasyonu | 6 |
| Harici URL no-op | 3 |
| Diğer scope değişmez | 2 (yalnız galeri case) |

## Self-review notes

- Placeholder yok; imzalar Task 1–6’da tanımlı.
- `finalizeGalleryImage` hem kaydetmede hem migrasyonda yeniden kullanılır (DRY).
- Commit adımları opsiyonel (kullanıcı onayı).
