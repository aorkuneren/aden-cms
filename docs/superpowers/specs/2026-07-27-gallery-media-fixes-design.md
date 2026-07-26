# Galeri Medya Düzeltmeleri — Design Spec

**Tarih:** 2026-07-27  
**Durum:** Onaylandı (yaklaşım)  
**Kapsam:** Admin galeri kategorileri, yükleme önizlemesi, soft-delete / purge disk temizliği

## Problem

1. Yeni galeri kategorisi eklendikten sonra “Yeni Görsel” formunda dropdown’da görünmüyor.
2. Yüklenen dosya diske yazılıyor ama admin/site önizlemesi kırık (404).
3. Silinen görsel kaydı soft-delete oluyor; kalıcı silmede (purge) dosya diskte kalıyor. Geri dönüşümde görsel önizlemesi yok.

## Hedefler

- Kategori ekle/düzenle/sil → anında kalıcı; yeni görsel formu güncel listeyi görsün.
- `/uploads/...` URL’leri her zaman okunabilir olsun (yerel + Hostinger).
- Soft-delete dosyayı korusun; Geri Dönüşüm’de önizleme görünsün; purge hem kaydı hem yerel medya dosyasını silsin.

## Non-goals

- Medya kütüphanesi / blob storage yeniden yazımı
- Eski uzak URL’lerin (`adenbungalov.com/upload/...`) migrasyonu
- Soft-delete anında disk silme
- Orphan dosya tarayıcısı / toplu temizlik aracı

---

## 1. Kategori anında kaydet

### Davranış

`GalleryEditor` içinde:

- **Ekle** (`addCategory`): state güncellemesi sonrası hemen `saveGalleryAction({ categories: next, items })`.
- **Sil** (`removeCategory`): kategori + etkilenen item’ların `categoryId` fallback’i hemen kaydedilir.
- **İsim düzenleme:** local state her tuşta güncellenir; persist yalnızca **blur** (veya Enter) sonrası.
- **isActive toggle:** toggle anında persist.

Başarı/hata `status` banner ile gösterilir. Persist başarısızsa state rollback (önceki `categories` / `items` snapshot).

“Tümünü Kaydet” sıralama ve toplu işlemler için kalır; kategori akışı ona bağımlı olmaz.

### Veri akışı

```
addCategory → setCategories(next) → saveGalleryAction → cms-config.json galleryManagement.categories
→ /admin/website/galeri/yeni → readJson → filterActive(categories) → Select
```

### Dokunulan dosyalar

- `components/admin/website/gallery-editor.tsx`
- Mevcut `saveGalleryAction` yeterli; yeni action gerekmez.

---

## 2. Yükleme yolu ve sunum

### Kök neden

- Kod varsayılanı: `./public/uploads` (statik sunuma uygun).
- `.env.example`: `UPLOAD_DIR="./uploads"` → dosya `public` dışında; Next `/uploads/...` 404.
- Runtime yüklemeler için `public` dışı köklerde sunucu route yok.

### Karar

1. **Varsayılan / örnek env:** `UPLOAD_DIR="./public/uploads"` (`.env.example` + `ARCHITECTURE` ile uyumlu).
2. **Serve route (zorunlu):** `app/uploads/[...path]/route.ts` her zaman `resolveUploadRoot()` altından dosya okur. Böylece `UPLOAD_DIR=./uploads` (public dışı) ve `./public/uploads` senaryolarının ikisi de çalışır. Route, static `public` kopyasına bağımlı değildir.
3. **Güvenlik:** path traversal engeli (`..`, mutlak path); yalnızca `resolveUploadRoot()` altındaki dosyalar; uzantıya göre `Content-Type`; `Cache-Control: public, max-age=31536000, immutable`.

### URL sözleşmesi (değişmez)

- Yazılan URL: `/uploads/{scope-path}/{filename}` (ör. `/uploads/galeri/{categoryId}/img-….jpeg`)
- Harici URL’ler (`https://…`) olduğu gibi saklanır; serve route’a düşmez.

### Dokunulan dosyalar

- `lib/media/upload.ts` — varsayılan kök doğrulama / `resolveUploadRoot` export
- `app/uploads/[...path]/route.ts` — yeni GET handler
- `.env.example` — `UPLOAD_DIR="./public/uploads"`
- İsteğe bağlı: `next.config.ts` `/uploads` cache header (route kendi header’ını da set edebilir)

### Operasyon notu

Mevcut üretim `UPLOAD_DIR=./uploads` ise: ya env’i `./public/uploads` yapıp dosyaları taşı, ya da route fallback ile mevcut kökten sun (taşıma zorunlu değil). Spec taşıma script’i içermez.

---

## 3. Soft-delete, geri dönüşüm önizlemesi, purge disk

### Soft-delete (değişmez)

`deleteSingleGalleryAction` → `markDeleted`; `imageUrl` ve disk dosyası korunur. Geri yükleme eksiksiz çalışır.

### Geri Dönüşüm paneli

`TrashItem` genişletmesi (opsiyonel alanlar):

```ts
{
  entityType, id, title, deletedAt, deletedBy,
  previewUrl?: string | null  // galeri / slider / bungalov vb. medya varsa
}
```

- `geri-donusum/page.tsx`: galeri için `item.imageUrl`, slider için kapak/medya URL’si, bungalov için ilk görsel (varsa) `previewUrl` olarak map edilir.
- `TrashPanel`: `previewUrl` varsa 48–64px küçük önizleme; yoksa mevcut metin satırı.
- Filtre/aksiyonlar (Geri Yükle / Kalıcı Sil) aynı kalır; purge hâlâ yalnızca `SUPERADMIN`.

### Purge + disk

`purgeTrashItemAction` içinde, kayıt silinmeden önce ilgili medya URL’leri toplanır; kayıt JSON’dan çıkarıldıktan sonra yerel dosyalar silinir.

Yeni yardımcı: `lib/media/delete.ts` (+ `resolveUploadRoot` export’u `upload.ts`’ten):

```ts
deleteUploadByUrl(url: string): Promise<{ deleted: boolean; reason?: string }>
```

Kurallar:

- Yalnızca göreli path `/uploads/...` ile başlayanlar.
- `https://…` veya `/upload/…` (eski legacy) → no-op (`deleted: false`, hata değil).
- Path `resolveUploadRoot()` altına normalize edilmeli; dışı → no-op.
- Dosya yoksa `{ deleted: true }` (idempotent).
- Disk I/O hatası: loglanır; purge yine JSON kaydını siler ve `{ ok: true }` döner (orphan tercih; hayalet kayıt kalmasın).

Entity → URL çıkarma:

| entityType     | Kaynak alan(lar)                |
|----------------|---------------------------------|
| `cms_gallery`  | `imageUrl`                      |
| `cms_slider`   | `imageUrl`, `videoUrl`          |
| `cms_why_aden` | `imageUrl`                      |
| `bungalow`     | `images[]` / kapak URL alanları |
| `cms_faq`      | medya yok → skip                |

### Dokunulan dosyalar

- `lib/media/upload.ts` (`resolveUploadRoot` export)
- `lib/media/delete.ts` (yeni)
- `app/admin/(panel)/sistem/geri-donusum/actions.ts`
- `app/admin/(panel)/sistem/geri-donusum/page.tsx`
- `components/admin/cms/trash-panel.tsx`
- Unit testler (`geri-donusum/__tests__`, `lib/media` delete test)

---

## 4. Test planı

1. **Kategori:** Yeni kategori ekle → “Yeni Görsel” → dropdown’da görünür; sayfa yenilemede de kalır.
2. **Önizleme:** Dosya yükle → formda anında görünür; kaydet → liste kartında görünür; public URL 200 döner.
3. **UPLOAD_DIR dışı:** `UPLOAD_DIR=./uploads` ile yükle → route üzerinden 200; traversal (`/uploads/../…`) 400/404.
4. **Soft-delete:** Sil → galeri listesinde yok; dosya diskte; Geri Dönüşüm’de başlık + önizleme.
5. **Restore:** Geri yükle → galeri ve önizleme geri gelir.
6. **Purge:** SUPERADMIN kalıcı sil → kayıt yok + `/uploads/...` dosya yok; harici URL’li kayıtta disk’e dokunulmaz.

---

## 5. Riskler

- Üretimde env hâlâ `./uploads` ise yalnızca static `public` yolu yetmez → serve route zorunlu teslimat.
- Purge yalnızca kayıtta saklanan URL’yi siler; aynı dosyayı iki kaydın paylaşması pratikte beklenmez (timestamp+rand).
- `app/uploads` route ile `public/uploads` çakışırsa route kazanır; her iki kök de `resolveUploadRoot()` ile okunduğu için tutarlıdır.
