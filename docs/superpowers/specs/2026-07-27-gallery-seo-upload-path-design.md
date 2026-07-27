# Galeri SEO Upload Path + WebP Finalize — Design Spec

**Tarih:** 2026-07-27  
**Durum:** Onaylandı  
**Kapsam:** Galeri yükleme yolu, dosya adlandırma, WebP dönüşümü, kategori id sadeleştirme, mevcut dosya migrasyonu

## Problem

1. Galeri upload klasörü kategori **id**’sinden üretiliyor → `uploads/galeri/gallery-category-bungalovlar/...`
2. Dosya adı orijinal upload adına dayanıyor; title/kategori slug’ı yok
3. Türkçe karakterler (`ı/ş/ğ/ü/ö/ç`) ASCII olmadığı için `safeSegment` onları `-` yapıyor → bozuk slug
4. Format SEO için tutarlı WebP değil
5. Kategori id’leri `gallery-category-` öneki taşıyor; gereksiz

## Hedefler

- Yol: `/uploads/galeri/{kategori-slug}/{image-slug}-{timestamp}.webp`
- Image slug: title varsa title’dan; yoksa kategori label slug’ından
- Türkçe karakterler doğru transliterate edilsin
- Upload geçici; **kaydetmede** WebP + nihai path (finalize)
- Kategori id’leri `gallery-category-` öneki olmadan, label slug’ı olsun
- Mevcut `gallery-category-*` klasörlerindeki dosyalar yeni yapıya taşınsın (WebP + URL güncelleme)

## Non-goals

- Bungalov / slider / CTA / diğer upload scope’larının path değişimi
- Harici URL’lerin (`https://...`) indirilip dönüştürülmesi
- Orphan dosya tarayıcısı / medya kütüphanesi yeniden yazımı
- Soft-delete / purge davranışını değiştirmek (mevcut delete mantığı korunur)

---

## 1. Hedef path ve adlandırma

### Format

```
/uploads/galeri/{kategori-slug}/{image-slug}-{timestamp}.webp
```

### Örnekler

| Durum | Sonuç |
|-------|--------|
| Title: "Aden Aile Suit", kategori: Bungalovlar | `/uploads/galeri/bungalovlar/aden-aile-suit-1785136677955.webp` |
| Title yok, kategori: Bungalovlar | `/uploads/galeri/bungalovlar/bungalovlar-1785136658667.webp` |
| Kategori: Odalar/Suit | klasör: `odalar-suit` |

### Slug kuralları

Ortak `toSeoSlug(input, fallback)`:

1. NFKC normalize
2. Türkçe map: `ç→c, ğ→g, ı→i, İ→i, ö→o, ş→s, ü→u` (+ büyük harf eşleri)
3. Lowercase
4. Alfanümerik dışı → `-`
5. Tekrarlayan `-` birleştir; baş/son `-` kırp
6. Max uzunluk: klasör 60, dosya tabanı 40
7. Boşsa `fallback`

- **Klasör slug** = kategori `name`/`label` üzerinden
- **Dosya tabanı** = trim’li `title` varsa ondan; yoksa klasör slug’ı
- **Suffix** = yalnızca `Date.now()` (random yok)
- **Uzantı** = her zaman `.webp`

---

## 2. Akış — Kaydetmede finalize (yaklaşım A)

```
Upload (DirectMediaPicker)
  → galeri/_staging/{orijinal-slug}-{ts}-{rand}.{ext}
  → imageUrl = /uploads/galeri/_staging/...

Kaydet (saveSingleGalleryAction)
  → imageUrl lokal /uploads ise finalize:
      1. Dosyayı oku
      2. Sharp → WebP (quality ~82)
      3. Hedef: galeri/{kategori-slug}/{image-slug}-{ts}.webp
      4. Yaz, imageUrl güncelle
      5. Eski/staging dosyayı sil (başka referans yoksa)
  → CMS kaydını güncellenmiş imageUrl ile yaz
```

### Kurallar

- `http(s)://` harici URL’lere dokunulmaz
- Finalize başarısızsa kayıt hata döner; staging dosya kalır (retry mümkün)
- Aynı içerik yeniden kaydedilirken: URL zaten hedef formattaysa (`galeri/{slug}/...webp` ve slug’lar güncel) yeniden dönüştürme atlanabilir; title/kategori değiştiyse yeniden adlandır + eskiyi sil
- Upload target `galeri` için `resolveSubdir` → `galeri/_staging` (kategori id klasör olarak kullanılmaz)

---

## 3. Kategori id sadeleştirme

### Yeni kural

- Kategori `id` = `toSeoSlug(name)` (ör. `Bungalovlar` → `bungalovlar`, `Odalar/Suit` → `odalar-suit`)
- `gallery-category-` öneki **hiçbir yerde** üretilmez
- Çakışmada: `odalar-suit-2`, `odalar-suit-3` …

### Dokunulacak defaults / fallbacks

- `lib/site/website-cms-types.ts` — default `galleryManagement.categories`
- `lib/site/gallery-content.ts` — sabit kategori listesi
- `app/(site)/galeri/page.tsx` — fallback kategoriler
- `app/admin/(panel)/website/galeri/page.tsx` — id fallback (`gallery-category-${random}` kaldırılır)
- `gallery-editor` `addCategory`: `rid("cat")` yerine name’den slug id

### CMS veri migrasyonu (id)

Tek seferlik (veya admin galeri yüklenirken / migrate script):

1. Her kategoride `id` `gallery-category-` ile başlıyorsa → prefix’i kaldır **veya** `name`’den yeniden slug üret (tercih: name’den slug; tutarlılık)
2. Tüm `items[].categoryId` eşlemesini güncelle (eski id → yeni id map)
3. Hardcoded fallback listeleri yeni id’lerle hizala

---

## 4. Mevcut dosya migrasyonu

`gallery-category-*` klasörlerindeki görseller yeni yapıya taşınır.

### Algoritma

Tüm galeri item’lar için (soft-delete dahil — geri dönüşüm önizlemesi bozulmasın):

1. `imageUrl` lokal `/uploads/galeri/...` değilse atla
2. Zaten hedef formattaysa (`galeri/{slug}/*.webp` ve klasör `gallery-category-` değil) atla
3. Kategori label slug’ını çöz (silinmiş kategori için item’daki eski id’den prefix strip / slug)
4. Image slug = title || kategori slug
5. Sharp ile WebP üret → `galeri/{kategori-slug}/{image-slug}-{timestamp}.webp`
6. `imageUrl` güncelle
7. Eski dosyayı sil (başka kayıt aynı URL’yi paylaşmıyorsa)
8. Boş kalan `gallery-category-*` klasörlerini temizle

### Ne zaman çalışır

- Tek seferlik script: `scripts/migrate-gallery-seo-paths.ts` (npm script)
- Veya admin `saveGalleryAction` / ilk okuma öncesi idempotent migrate helper
- **Tercih:** script + isteğe bağlı idempotent helper; production’da bir kez çalıştırılır
- Idempotent: zaten `galeri/{slug}/*.webp` ve kategori id’si prefix’sizse no-op

### Not

Migrasyon sırasında timestamp dosya başına bir kez üretilir (orijinal mtime veya `Date.now()`). Aynı basename çakışırsa timestamp/sayaç ile benzersizleştir.

---

## 5. Bileşenler

| Modül | Sorumluluk |
|-------|------------|
| `lib/media/slug.ts` | `toSeoSlug`, Türkçe transliteration |
| `lib/media/upload.ts` | Galeri → `_staging`; diğer scope’lar aynı |
| `lib/media/finalize-gallery.ts` | WebP + hedef path + eski dosya silme |
| `lib/media/migrate-gallery-paths.ts` | Kategori id + dosya/URL migrasyonu |
| `app/admin/.../website/actions.ts` | `saveSingleGalleryAction` içinde finalize |
| `scripts/migrate-gallery-seo-paths.ts` | CLI giriş noktası |
| Unit testler | slug, finalize path üretimi, id remap |

### Bağımlılık

- `sharp` zaten `package.json`’da (`^0.35.0`)

---

## 6. Hata yönetimi

- Staging yazılamazsa upload hata döner (mevcut davranış)
- Finalize’da Sharp/IO hatası → action `{ ok: false, error }`; CMS yazılmaz
- Migrasyon: item bazında try/catch; başarısız item’lar loglanır, diğerleri devam eder; exit code ≠ 0 eğer herhangi biri fail

---

## 7. Test planı

- `toSeoSlug("Aden Aile Suit")` → `aden-aile-suit`
- `toSeoSlug("Bungalovlar")` → `bungalovlar` (Türkçe `ı` → `i`)
- `toSeoSlug("Odalar/Suit")` → `odalar-suit`
- Finalize path: title var / yok senaryoları
- Kategori id remap: `gallery-category-bungalovlar` → `bungalovlar`, item `categoryId` güncellenir
- Staging upload subdir = `galeri/_staging`
- Harici URL finalize’da değişmez

---

## 8. Kararlar (özet)

| Konu | Karar |
|------|--------|
| Ne zaman nihai ad | Kaydetmede finalize |
| Format | Her zaman WebP |
| Klasör | Label slug (`bungalovlar`), id değil |
| Dosya adı | title \|\| kategori slug + timestamp |
| Eski dosyalar | Taşı + WebP + URL güncelle |
| Kategori id | `gallery-category-` yok; label slug |
| Diğer media scope | Değişmez |
