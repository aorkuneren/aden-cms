# Galeri Medya Düzeltmeleri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Galeri kategorilerinin anında kaydı, `/uploads` dosyalarının güvenilir sunumu ve soft-delete sonrası Geri Dönüşüm önizlemesi + purge’da disk temizliği.

**Architecture:** Medya I/O `lib/media/upload.ts` + yeni `lib/media/delete.ts` altında toplanır. `/uploads/[...path]` Route Handler her zaman `resolveUploadRoot()` üzerinden okur. Galeri kategori mutasyonları `saveGalleryAction` ile anında persist edilir. Purge, JSON kaydını silmeden önce medya URL’lerini toplar ve yalnızca `/uploads/...` path’lerini diskten siler.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, mevcut admin UI (`gallery-editor`, `trash-panel`).

**Spec:** `docs/superpowers/specs/2026-07-27-gallery-media-fixes-design.md`

## Global Constraints

- Soft-delete dosyayı diskten silmez; yalnızca purge siler.
- Yalnızca göreli `/uploads/...` path’leri diskten silinir; `https://…` ve legacy `/upload/…` no-op.
- Path traversal yasak; dosya erişimi yalnızca `resolveUploadRoot()` altı.
- Purge JSON silmesini disk hatası engellemez (orphan tercih).
- Kategori: ekle/sil hemen persist; isim blur/Enter; isActive toggle anında.
- `.env.example` `UPLOAD_DIR="./public/uploads"`.
- Commit yalnızca kullanıcı istediğinde; plan adımlarında commit önerilir ama agent onaysız commit atmaz.
- Yanıt dili / UI metinleri Türkçe.

---

## File Structure

| Dosya | Sorumluluk |
|-------|------------|
| `lib/media/upload.ts` | `resolveUploadRoot` export; mevcut `saveUpload` |
| `lib/media/delete.ts` | `deleteUploadByUrl`, `collectMediaUrls` |
| `lib/media/__tests__/delete.test.ts` | delete URL kuralları |
| `lib/media/serve.ts` | path resolve + MIME (route’un test edilebilir çekirdeği) |
| `lib/media/__tests__/serve.test.ts` | traversal / resolve testleri |
| `app/uploads/[...path]/route.ts` | GET → dosya stream |
| `.env.example` | UPLOAD_DIR düzeltmesi |
| `components/admin/website/gallery-editor.tsx` | kategori anında kaydet |
| `app/admin/(panel)/sistem/geri-donusum/actions.ts` | purge + disk |
| `app/admin/(panel)/sistem/geri-donusum/page.tsx` | `previewUrl` map |
| `components/admin/cms/trash-panel.tsx` | küçük önizleme |
| `app/admin/(panel)/sistem/geri-donusum/__tests__/actions.test.ts` | purge disk mock |

---

### Task 1: `deleteUploadByUrl` + `resolveUploadRoot` export

**Files:**
- Modify: `lib/media/upload.ts`
- Create: `lib/media/delete.ts`
- Create: `lib/media/__tests__/delete.test.ts`

**Interfaces:**
- Consumes: `resolveUploadRoot()` from upload.ts
- Produces:
  - `export function resolveUploadRoot(): string` (upload.ts)
  - `export async function deleteUploadByUrl(url: string): Promise<{ deleted: boolean; reason?: string }>`
  - `export function collectMediaUrls(entityType: string, record: Record<string, unknown>): string[]`

- [ ] **Step 1: Write the failing test**

Create `lib/media/__tests__/delete.test.ts`:

```ts
import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("deleteUploadByUrl", () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aden-upload-"))
    vi.stubEnv("UPLOAD_DIR", tmpRoot)
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    await fs.rm(tmpRoot, { recursive: true, force: true })
  })

  it("harici URL için no-op döner", async () => {
    const { deleteUploadByUrl } = await import("../delete")
    await expect(deleteUploadByUrl("https://cdn.example.com/a.jpg")).resolves.toEqual({
      deleted: false,
      reason: "external",
    })
  })

  it("legacy /upload/ path için no-op döner", async () => {
    const { deleteUploadByUrl } = await import("../delete")
    await expect(deleteUploadByUrl("/upload/eski.webp")).resolves.toEqual({
      deleted: false,
      reason: "not-managed",
    })
  })

  it("/uploads altındaki dosyayı siler", async () => {
    const rel = path.join("galeri", "bungalovlar", "img-1.jpeg")
    const abs = path.join(tmpRoot, rel)
    await fs.mkdir(path.dirname(abs), { recursive: true })
    await fs.writeFile(abs, "x")

    const { deleteUploadByUrl } = await import("../delete")
    const result = await deleteUploadByUrl("/uploads/galeri/bungalovlar/img-1.jpeg")
    expect(result).toEqual({ deleted: true })
    await expect(fs.access(abs)).rejects.toThrow()
  })

  it("olmayan dosya için deleted: true (idempotent)", async () => {
    const { deleteUploadByUrl } = await import("../delete")
    await expect(deleteUploadByUrl("/uploads/yok.jpeg")).resolves.toEqual({ deleted: true })
  })

  it("path traversal engeller", async () => {
    const { deleteUploadByUrl } = await import("../delete")
    await expect(deleteUploadByUrl("/uploads/../../etc/passwd")).resolves.toEqual({
      deleted: false,
      reason: "invalid-path",
    })
  })

  it("collectMediaUrls galeri ve bungalov alanlarını toplar", async () => {
    const { collectMediaUrls } = await import("../delete")
    expect(collectMediaUrls("cms_gallery", { imageUrl: "/uploads/a.jpg" })).toEqual(["/uploads/a.jpg"])
    expect(
      collectMediaUrls("cms_slider", { imageUrl: "/uploads/i.jpg", videoUrl: "/uploads/v.mp4" })
    ).toEqual(["/uploads/i.jpg", "/uploads/v.mp4"])
    expect(
      collectMediaUrls("bungalow", {
        image: "/uploads/cover.jpg",
        galleryImages: ["/uploads/g1.jpg", "https://x.com/y.jpg"],
      })
    ).toEqual(["/uploads/cover.jpg", "/uploads/g1.jpg", "https://x.com/y.jpg"])
    expect(collectMediaUrls("cms_faq", { question: "x" })).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/media/__tests__/delete.test.ts`
Expected: FAIL (module not found / export missing)

- [ ] **Step 3: Export `resolveUploadRoot` from upload.ts**

`resolveUploadRoot` her çağrıda env okusun (test stub için):

```ts
function getUploadDirEnv(): string {
  return process.env.UPLOAD_DIR || "./public/uploads"
}

export function resolveUploadRoot(): string {
  const UPLOAD_DIR = getUploadDirEnv()
  return path.isAbsolute(UPLOAD_DIR)
    ? UPLOAD_DIR
    : path.join(process.cwd(), UPLOAD_DIR.replace(/^\.\//, ""))
}
```

Üstteki `const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads"` kaldırılır; `saveUpload` `resolveUploadRoot()` kullanmaya devam eder.

- [ ] **Step 4: Implement `lib/media/delete.ts`**

```ts
import fs from "fs/promises"
import path from "path"
import { resolveUploadRoot } from "@/lib/media/upload"

export type DeleteUploadResult = { deleted: boolean; reason?: string }

function isManagedUploadUrl(url: string): boolean {
  return typeof url === "string" && url.startsWith("/uploads/")
}

function urlToAbsolutePath(url: string): string | null {
  if (!isManagedUploadUrl(url)) return null
  const rel = url.slice("/uploads/".length)
  if (!rel || rel.includes("\0")) return null
  const root = resolveUploadRoot()
  const abs = path.resolve(root, rel)
  const rootResolved = path.resolve(root)
  if (abs !== rootResolved && !abs.startsWith(rootResolved + path.sep)) {
    return null
  }
  return abs
}

export async function deleteUploadByUrl(url: string): Promise<DeleteUploadResult> {
  if (!url || typeof url !== "string") return { deleted: false, reason: "empty" }
  if (/^https?:\/\//i.test(url)) return { deleted: false, reason: "external" }
  if (url.startsWith("/upload/") && !url.startsWith("/uploads/")) {
    return { deleted: false, reason: "not-managed" }
  }
  if (!isManagedUploadUrl(url)) return { deleted: false, reason: "not-managed" }

  const abs = urlToAbsolutePath(url)
  if (!abs) return { deleted: false, reason: "invalid-path" }

  try {
    await fs.unlink(abs)
    return { deleted: true }
  } catch (err: any) {
    if (err?.code === "ENOENT") return { deleted: true }
    console.error("[media] deleteUploadByUrl failed", url, err)
    return { deleted: false, reason: "io-error" }
  }
}

export function collectMediaUrls(entityType: string, record: Record<string, unknown>): string[] {
  const urls: string[] = []
  const push = (v: unknown) => {
    if (typeof v === "string" && v.trim()) urls.push(v.trim())
  }

  switch (entityType) {
    case "cms_gallery":
    case "cms_why_aden":
      push(record.imageUrl)
      break
    case "cms_slider":
      push(record.imageUrl)
      push(record.videoUrl)
      break
    case "bungalow":
      push(record.image)
      if (Array.isArray(record.galleryImages)) {
        for (const u of record.galleryImages) push(u)
      }
      break
    default:
      break
  }
  return urls
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/media/__tests__/delete.test.ts`
Expected: PASS

- [ ] **Step 6: Commit (kullanıcı onayıyla)**

```bash
git add lib/media/upload.ts lib/media/delete.ts lib/media/__tests__/delete.test.ts
git commit -m "$(cat <<'EOF'
feat(media): yerel /uploads dosyalarını URL ile sil

Purge akışı için güvenli path çözümleme ve managed URL kuralları.
EOF
)"
```

---

### Task 2: `/uploads/[...path]` serve route + env

**Files:**
- Create: `lib/media/serve.ts`
- Create: `lib/media/__tests__/serve.test.ts`
- Create: `app/uploads/[...path]/route.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `resolveUploadRoot()` from Task 1
- Produces:
  - `export function resolveUploadFilePath(segments: string[]): string | null`
  - `export function guessMimeType(filename: string): string`
  - `GET` handler at `/uploads/*`

- [ ] **Step 1: Write failing serve tests**

Create `lib/media/__tests__/serve.test.ts`:

```ts
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("resolveUploadFilePath", () => {
  beforeEach(() => {
    vi.stubEnv("UPLOAD_DIR", "/var/uploads")
    vi.resetModules()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("geçerli segmentleri root altına çözer", async () => {
    const { resolveUploadFilePath } = await import("../serve")
    const abs = resolveUploadFilePath(["galeri", "cat", "a.jpg"])
    expect(abs).toBe(path.join("/var/uploads", "galeri", "cat", "a.jpg"))
  })

  it(".. segmentini reddeder", async () => {
    const { resolveUploadFilePath } = await import("../serve")
    expect(resolveUploadFilePath(["galeri", "..", "secret"])).toBeNull()
  })

  it("boş segment reddeder", async () => {
    const { resolveUploadFilePath } = await import("../serve")
    expect(resolveUploadFilePath([])).toBeNull()
    expect(resolveUploadFilePath(["galeri", ""])).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run lib/media/__tests__/serve.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `lib/media/serve.ts`**

```ts
import path from "path"
import { resolveUploadRoot } from "@/lib/media/upload"

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".svg": "image/svg+xml",
}

export function resolveUploadFilePath(segments: string[]): string | null {
  if (!segments.length) return null
  if (segments.some((s) => !s || s === "." || s === ".." || s.includes("\0") || s.includes("/") || s.includes("\\"))) {
    return null
  }
  const root = path.resolve(resolveUploadRoot())
  const abs = path.resolve(root, ...segments)
  if (abs !== root && !abs.startsWith(root + path.sep)) return null
  return abs
}

export function guessMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return MIME[ext] || "application/octet-stream"
}
```

- [ ] **Step 4: Implement route**

Create `app/uploads/[...path]/route.ts`:

```ts
import fs from "fs/promises"
import { NextResponse } from "next/server"
import { guessMimeType, resolveUploadFilePath } from "@/lib/media/serve"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params
  const abs = resolveUploadFilePath(segments)
  if (!abs) {
    return new NextResponse("Not Found", { status: 404 })
  }

  try {
    const data = await fs.readFile(abs)
    const filename = segments[segments.length - 1] || "file"
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": guessMimeType(filename),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return new NextResponse("Not Found", { status: 404 })
    }
    console.error("[uploads] serve failed", abs, err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
```

- [ ] **Step 5: Fix `.env.example`**

```
UPLOAD_DIR="./public/uploads"
```

- [ ] **Step 6: Run serve tests**

Run: `npx vitest run lib/media/__tests__/serve.test.ts`
Expected: PASS

- [ ] **Step 7: Manual smoke (dev server açıksa)**

1. `UPLOAD_DIR=./uploads` ile mevcut bir dosya için `curl -I http://localhost:3000/uploads/<rel-path>` → 200
2. Traversal denemesi → 404

- [ ] **Step 8: Commit (kullanıcı onayıyla)**

```bash
git add lib/media/serve.ts lib/media/__tests__/serve.test.ts "app/uploads/[...path]/route.ts" .env.example
git commit -m "$(cat <<'EOF'
feat(media): /uploads route ile yükleme dosyalarını sun

UPLOAD_DIR public dışında olsa bile önizleme URL’leri 200 döner.
EOF
)"
```

---

### Task 3: Galeri kategori anında kaydet

**Files:**
- Modify: `components/admin/website/gallery-editor.tsx`

**Interfaces:**
- Consumes: mevcut `saveGalleryAction({ categories, items })`
- Produces: `persistGalleryConfig` helper; blur/toggle bağları

- [ ] **Step 1: `persistGalleryConfig` helper ekle**

```tsx
const persistGalleryConfig = (
  nextCategories: GalleryCategory[],
  nextItems: GalleryItem[],
  successMsg: string,
  rollback?: { categories: GalleryCategory[]; items: GalleryItem[] }
) => {
  startTransition(async () => {
    const res = await saveGalleryAction({ categories: nextCategories, items: nextItems })
    if (res.ok) {
      setStatus({ type: "ok", msg: successMsg })
      router.refresh()
    } else {
      if (rollback) {
        setCategories(rollback.categories)
        setItems(rollback.items)
      }
      setStatus({ type: "err", msg: res.error })
    }
  })
}
```

- [ ] **Step 2: `addCategory` hemen persist**

```tsx
const addCategory = () => {
  if (!newCatName.trim()) return
  const snapshot = { categories, items }
  const freshCat: GalleryCategory = {
    id: rid("cat"),
    name: newCatName.trim(),
    isActive: true,
  }
  const nextCategories = [...categories, freshCat]
  setCategories(nextCategories)
  setNewCatName("")
  clearStatus()
  persistGalleryConfig(nextCategories, items, "Kategori eklendi.", snapshot)
}
```

- [ ] **Step 3: `removeCategory` hemen persist**

```tsx
const removeCategory = (id: string) => {
  const snapshot = { categories, items }
  const nextCategories = categories.filter((c) => c.id !== id)
  const fallbackId = nextCategories[0]?.id || "genel"
  const nextItems = items.map((i) => (i.categoryId === id ? { ...i, categoryId: fallbackId } : i))
  setCategories(nextCategories)
  setItems(nextItems)
  clearStatus()
  persistGalleryConfig(nextCategories, nextItems, "Kategori silindi.", snapshot)
}
```

- [ ] **Step 4: İsim blur’da / isActive toggle’da persist**

`updateCategory` yalnızca local state:

```tsx
const updateCategory = (id: string, patch: Partial<GalleryCategory>) => {
  setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  clearStatus()
}

const toggleCategoryActive = (id: string, isActive: boolean) => {
  const snapshot = { categories, items }
  const nextCategories = categories.map((c) => (c.id === id ? { ...c, isActive } : c))
  setCategories(nextCategories)
  clearStatus()
  persistGalleryConfig(nextCategories, items, isActive ? "Kategori aktif." : "Kategori pasif.", snapshot)
}
```

Dialog Input (blur’da isim + persist — stale closure’dan kaçınmak için input value kullan):

```tsx
<Input
  value={cat.name}
  onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
  onBlur={(e) => {
    const name = e.target.value.trim()
    const snapshot = { categories, items }
    const nextCategories = categories.map((c) =>
      c.id === cat.id ? { ...c, name: name || c.name } : c
    )
    setCategories(nextCategories)
    persistGalleryConfig(nextCategories, items, "Kategori güncellendi.", snapshot)
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      ;(e.target as HTMLInputElement).blur()
    }
  }}
  className="h-8 text-xs font-medium"
/>
<Switch
  checked={cat.isActive}
  onCheckedChange={(v) => toggleCategoryActive(cat.id, v)}
/>
```

- [ ] **Step 5: Manuel doğrulama**

1. Admin → Galeri → Kategorileri Yönet → yeni kategori Ekle
2. “Yeni Görsel Ekle” → dropdown’da yeni kategori var
3. Sayfa yenile → kategori hâlâ var

- [ ] **Step 6: Commit (kullanıcı onayıyla)**

```bash
git add components/admin/website/gallery-editor.tsx
git commit -m "$(cat <<'EOF'
fix(galeri): kategori ekle/sil/güncelle anında kaydet

Yeni görsel formunun sunucudan güncel kategori listesini okumasını sağlar.
EOF
)"
```

---

### Task 4: Geri Dönüşüm önizleme + purge disk

**Files:**
- Modify: `app/admin/(panel)/sistem/geri-donusum/page.tsx`
- Modify: `components/admin/cms/trash-panel.tsx`
- Modify: `app/admin/(panel)/sistem/geri-donusum/actions.ts`
- Modify: `app/admin/(panel)/sistem/geri-donusum/__tests__/actions.test.ts`

**Interfaces:**
- Consumes: `collectMediaUrls`, `deleteUploadByUrl` from Task 1
- Produces: `TrashItem.previewUrl?: string | null`; purge disk cleanup

- [ ] **Step 1: Extend purge test**

`actions.test.ts` başına (mevcut mock pattern’ine uygun):

```ts
const deleteUploadByUrl = vi.fn().mockResolvedValue({ deleted: true })
const collectMediaUrls = vi.fn().mockReturnValue(["/uploads/galeri/x.jpg"])

vi.mock("@/lib/media/delete", () => ({
  deleteUploadByUrl,
  collectMediaUrls,
}))
```

Yeni test:

```ts
it("SUPERADMIN purge sonrası yerel medya URL’lerini siler", async () => {
  requireCms.mockResolvedValue({
    ok: true,
    admin: { id: "superadmin-1", role: "SUPERADMIN", isActive: true },
  })

  mutateCms.mockImplementation(async (options: any) => {
    const current = {
      galleryManagement: {
        items: [{ id: "gal-1", imageUrl: "/uploads/galeri/x.jpg", deletedAt: "2026-07-27" }],
      },
    }
    options.updater(current)
    return { ok: true, data: {}, admin: {} }
  })

  const result = await purgeTrashItemAction("cms_gallery", "gal-1")
  expect(result).toEqual({ ok: true })
  expect(collectMediaUrls).toHaveBeenCalled()
  expect(deleteUploadByUrl).toHaveBeenCalledWith("/uploads/galeri/x.jpg")
})
```

- [ ] **Step 2: Run test — expect fail**

Run: `npx vitest run "app/admin/(panel)/sistem/geri-donusum/__tests__/actions.test.ts"`
Expected: FAIL (deleteUploadByUrl not called)

- [ ] **Step 3: Update `purgeTrashItemAction`**

```ts
import { collectMediaUrls, deleteUploadByUrl } from "@/lib/media/delete"

export async function purgeTrashItemAction(entityType: string, id: string): Promise<TrashActionResult> {
  if (!isTrashEntityType(entityType) || !id) return { ok: false, error: "Geçersiz geri dönüşüm kaydı." }

  const gate = await requireCms("delete")
  if (!gate.ok) return gate
  if (gate.admin.role !== "SUPERADMIN") {
    return { ok: false, error: "Kalıcı silme işlemi yalnızca süper yönetici tarafından yapılabilir." }
  }

  const source = sourceFor(entityType)
  let mediaUrls: string[] = []

  const result = await mutateCms<any>({
    action: "delete",
    file: source.file,
    entityType,
    entityId: id,
    auditAction: "Geri Dönüşüm Kaydı Kalıcı Olarak Silindi",
    updater: (current) => {
      const items = source.collection(current)
      const target = items.find((item) => String(item.id) === String(id))
      if (target) {
        mediaUrls = collectMediaUrls(entityType, target)
      }
      return source.replaceCollection(
        current,
        items.filter((item) => String(item.id) !== String(id))
      )
    },
  })

  if (result.ok) {
    for (const url of mediaUrls) {
      await deleteUploadByUrl(url)
    }
  }

  return result.ok ? { ok: true } : result
}
```

- [ ] **Step 4: `TrashItem` + page preview mapping**

`trash-panel.tsx` type:

```ts
export type TrashItem = {
  entityType: TrashEntityType
  id: string
  title: string
  deletedAt: string
  deletedBy: string | null
  previewUrl?: string | null
}
```

List row (başlığın soluna):

```tsx
{item.previewUrl ? (
  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-neutral-800">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={item.previewUrl} alt="" className="size-full object-cover" />
  </div>
) : null}
```

`page.tsx`:

```ts
function toTrashItems(
  entityType: TrashItem["entityType"],
  records: unknown,
  titleFor: (record: any) => string,
  previewFor?: (record: any) => string | null
): TrashItem[] {
  if (!Array.isArray(records)) return []

  return filterDeleted(records).flatMap((record: any) => {
    if (!record?.id || !record.deletedAt) return []
    return [
      {
        entityType,
        id: String(record.id),
        title: titleFor(record).trim() || "Başlıksız kayıt",
        deletedAt: String(record.deletedAt),
        deletedBy: record.deletedBy ? String(record.deletedBy) : null,
        previewUrl: previewFor ? previewFor(record) : null,
      },
    ]
  })
}

const items = [
  ...toTrashItems("cms_slider", config.sliderManagement, (item) => item.title, (item) => item.imageUrl || null),
  ...toTrashItems("cms_faq", config.faqManagement, (item) => item.question),
  ...toTrashItems("cms_why_aden", config.whyAdenManagement, (item) => item.title, (item) => item.imageUrl || null),
  ...toTrashItems("cms_gallery", config.galleryManagement?.items, (item) => item.title, (item) => item.imageUrl || null),
  ...toTrashItems("bungalow", bungalows, (item) => item.name, (item) => item.image || item.galleryImages?.[0] || null),
].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())
```

- [ ] **Step 5: Run related tests**

```bash
npx vitest run lib/media/__tests__/delete.test.ts lib/media/__tests__/serve.test.ts "app/admin/(panel)/sistem/geri-donusum/__tests__/actions.test.ts"
```

Expected: PASS

- [ ] **Step 6: Manuel doğrulama**

1. Galeri görseli sil → Geri Dönüşüm’de thumbnail; dosya diskte
2. Geri Yükle → galeri + önizleme döner
3. Kalıcı Sil (SUPERADMIN) → kayıt yok + yerel dosya yok
4. Harici URL’li kayıt purge → disk’e dokunulmaz

- [ ] **Step 7: Commit (kullanıcı onayıyla)**

```bash
git add "app/admin/(panel)/sistem/geri-donusum/actions.ts" "app/admin/(panel)/sistem/geri-donusum/page.tsx" "app/admin/(panel)/sistem/geri-donusum/__tests__/actions.test.ts" components/admin/cms/trash-panel.tsx
git commit -m "$(cat <<'EOF'
feat(geri-donusum): önizleme ve purge disk temizliği

Soft-delete dosyayı korur; kalıcı silmede yerel /uploads medyası silinir.
EOF
)"
```

---

### Task 5: Uçtan uca doğrulama

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: yeşil

- [ ] **Step 2: Spec §4 checklist**

Spec test planı maddeleri 1–6 karşılandı mı doğrula.

---

## Self-Review (plan)

| Spec gereksinimi | Task |
|------------------|------|
| Kategori ekle/sil hemen persist | Task 3 |
| İsim blur, isActive toggle | Task 3 |
| UPLOAD_DIR public/uploads örnek | Task 2 |
| Serve route zorunlu | Task 2 |
| Soft-delete disk korur | mevcut; Task 4 değiştirmez |
| Trash previewUrl | Task 4 |
| Purge + deleteUploadByUrl | Task 1 + 4 |
| External/legacy no-op | Task 1 |
| Path traversal engeli | Task 1 + 2 |

Placeholder yok. Tipler tutarlı: `deleteUploadByUrl`, `collectMediaUrls`, `resolveUploadFilePath`, `TrashItem.previewUrl`.
