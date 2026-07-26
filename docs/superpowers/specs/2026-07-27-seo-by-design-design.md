# SEO by Design — Tasarım Spec (MVP)

**Tarih:** 2026-07-27  
**Durum:** Onaylandı (2026-07-27) · MVP uygulandı (2026-07-27)  
**Kapsam:** Merkezi polimorfik SEO deposu, panel SEO deneyimi, fallback/doğrulama, slug→301, dinamik sitemap/meta render. Mevcut JSON CMS mimarisi korunur.

---

## 1. Amaç ve başarı kriteri

SEO, panel içerik giriş sürecinin ayrılmaz parçasıdır. Editörün teknik SEO bilgisi varsayılmaz; doğru olan kolay, yanlış olan zordur. Kurallar dokümantasyonda değil; şema, servis doğrulaması ve yayın akışında zorunlu kılınır.

**Başarı kriterleri (MVP kabul)**

1. SEO alanları eksik hiçbir bungalov `AKTIF` yayına alınamaz.
2. Yayındaki her URL benzersiz `metaTitle` hedefi (uyarı), dolu description ve geçerli canonical’a sahiptir.
3. Slug değişen her bungalov için otomatik 301 kaydı oluşur; zincir düzleştirilir.
4. Meta / OG / JSON-LD panel verisinden render anında üretilir; hard-code edilmez.
5. `sitemap.xml` yalnızca indekslenebilir, yayında, 200 beklenen URL’leri içerir (slug tabanlı bungalov URL’leri).
6. Legacy SEO alanlarından okuma loglanır; yeni yazmalar yalnızca `seo-meta.json`’a gider.

**Kapsam dışı (MVP sonrası / Faz B)**

- Yönlendirme yöneticisi UI (toplu import, zincir görselleştirme)
- 404 günlüğü
- SEO Sağlık Paneli
- WebP/AVIF dönüşüm pipeline
- WYSIWYG H1 engeli (rich text editör yoksa N/A)
- Görsel `alt` zorunluluğu medya kütüphanesi ile
- Gerçek SQL / Prisma geçişi
- Tam i18n içerik (`/en/...` route’ları)
- FAQ / galeri kategorisi ayrı `seoable` kayıtları

---

## 2. Kararlar özeti

| Konu | Karar |
|------|--------|
| Kapsam | MVP (A): sayfa + bungalov |
| Depo | Merkezi `data/seo-meta.json` (polimorfik) |
| Migrasyon | Tek kaynak; backfill + legacy salt-okunur fallback |
| Bungalov URL | Slug; eski `/bungalovlarimiz/{id}` → 301 |
| Karakter aralığı | Soft uyarı (70 / 180 önerilen); boş = yayın engeli |
| Yinelenen title | Locale bazlı uyarı; kayıt engellenmez |
| Yaklaşım | Repository + Service; action doğrudan JSON yazmaz |

---

## 3. Veri modeli

### 3.1 `data/seo-meta.json`

```ts
type SeoSchemaType =
  | "WebPage"
  | "AboutPage"
  | "ContactPage"
  | "CollectionPage"
  | "LodgingBusiness"
  | "FAQPage"
  | "Organization"
  | null

type SeoChangeFreq =
  | "always" | "hourly" | "daily" | "weekly"
  | "monthly" | "yearly" | "never"

type SeoMetaRecord = {
  id: string
  entityType: "page" | "bungalow"
  entityId: string          // sabit sistem kimliği
  locale: "tr"              // servis locale-aware; MVP tek dil

  path: string | null       // page zorunlu; bungalow slug’dan türetilir
  slug: string | null       // bungalow zorunlu; page null / kilitli

  metaTitle: string
  metaDescription: string
  focusKeyword: string | null

  canonicalUrl: string | null  // null = self-canonical

  robotsIndex: boolean         // default true
  robotsFollow: boolean        // default true

  ogTitle: string | null
  ogDescription: string | null
  ogImageUrl: string | null

  schemaType: SeoSchemaType
  schemaJson: Record<string, unknown> | null  // @graph serbest; validate şart

  priority: number
  changeFreq: SeoChangeFreq

  createdAt: string
  updatedAt: string
  updatedBy: string | null
  revision: number
}
```

**Kimlik kuralları**

- `entityId` değişmeyen sistem kimliğidir.
- `path` değiştirilebilir URL yoludur.
- Menü / sayfa / SEO / URL geçmişi aynı `entityId` üzerinden ilişkilendirilir.
- **Teknik borç (MVP):** Sistem sayfalarında bugün sabit `entityId` yok. Backfill’de `entityId` geçici olarak normalize path’ten türetilir (örn. `page:/galeri`). Kalıcı slug-id haritası (`PAGE_ENTITY_IDS`) kodda sabitlenir ve dokümante edilir; path değişince `entityId` değişmez.

**URL alanları**

| Entity | path | slug |
|--------|------|------|
| `page` | zorunlu | `null` (veya path’ten türetilmiş salt-okunur; panelde düzenlenmez) |
| `bungalow` | `/bungalovlarimiz/{slug}` sistem üretir | zorunlu, benzersiz `(entityType, locale, slug)` |

**Benzersizlik**

- Kayıt: `(entityType, entityId, locale)` unique
- Slug: `(entityType, locale, slug)` — normalize + lower-case + TR karakter dönüşümü
- `metaTitle` tekrarı: `(normalize(metaTitle), locale)` → **warning**, engel değil

**Uzunluk**

- Önerilen max: title 70, description 180
- Aşımda uyarı; otomatik truncation / veri kesme yok
- Sayım: Unicode (`[...str].length` veya eşdeğeri)

**Canonical**

- `null` = self-canonical
- Boş string kaydedilmez → `null`
- Doluysa absolute HTTPS URL; trim; self-URL ise `null`’a normalize
- Geçersiz protokol → sert hata

**OG görsel**

- Absolute URL veya `/uploads/...` standart yol
- Boş string → `null`
- Mümkünse medya picker; fallback: öne çıkan → marka varsayılan OG
- MVP: boyut soft uyarı (1200×630 hedef); sert engel yok (medya metadata sınırlı)

**Schema**

- `schemaType` enum select; entity’ye göre öneriler (bungalow → `LodgingBusiness`, sayfa → `WebPage` vb.)
- `schemaJson` kaydedilmeden ve HTML’e basılmadan validate + sanitize
- Override: yalnızca `SUPERADMIN` / `ADMIN` (SEO yetkisi); `CONTENT_EDITOR` görmez/düzenleyemez
- MVP tek `schemaType`; `schemaJson` içinde `@graph` serbest

**Audit / concurrency**

- `createdAt`, `updatedAt`, `updatedBy`, `revision`
- Eski `revision` ile güncelleme reddedilir (optimistic lock)

### 3.2 `data/url-history.json`

```ts
type UrlHistoryRecord = {
  id: string
  fromPath: string
  toPath: string
  statusCode: 301 | 302
  entityType: "page" | "bungalow" | null
  entityId: string | null
  reason: "slug-change" | "page-move" | "manual"
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### 3.3 Path normalizasyonu

Tüm path’ler ortak `normalizePath()`:

- `/` ile başlar
- Sondaki `/` kalkar (kök `/` hariç)
- Query / hash / domain yok
- Çift slash düzeltilir
- Lower-case (TR locale)

Örnek: `https://example.com/Galeri/?page=2#images` → `/galeri`

### 3.4 Redirect kuralları (`SeoRedirectService`)

Reddedilir:

- `fromPath === toPath`
- Aktif `fromPath` çakışması
- Döngü: A→B→A, A→B→C→A
- Sistem yolları: `/admin`, `/api`, `/uploads` (veya `/assets`) hedef/kaynak kısıtları

Zorunlu:

- Yeni redirect’te zincir düzleştirme (`A→B`, `B→C` ⇒ `A→C`, `B→C`)
- Slug değişimi + SEO update + history **tek atomik işlem**
- Hedef yoksa soft uyarı (MVP’de engel değil)

### 3.5 Legacy alanlar

| Eski | Yeni |
|------|------|
| `cms-config.siteManagement.pageSeoItems` | `seo-meta` `entityType: "page"` |
| `bungalovs[].seoTitle`, `seoDescription`, `slug` | `seo-meta` + bungalow `slug` tek kaynak `seo-meta.slug` (bungalov satırındaki slug sync veya deprecate) |

**Bungalov slug senkronu:** URL routing bugün entity `slug` veya `id` kullanıyor olabilir. MVP’de bungalov kaydındaki `slug` alanı `seo-meta.slug` ile **service üzerinden senkron** tutulur (tek yazma kapısı); panelde tek input. Uzun vadede entity’den kaldırma ayrı iş.

Yeni yazma: yalnızca `seo-meta`. Okuma: önce `seo-meta`, yoksa legacy + `legacy-fallback` log.

---

## 4. Mimari katmanlar

```
Admin UI / Server Actions
        ↓
SeoMetaService / SeoRedirectService   (iş kuralları, yetki, skor, publish gate)
        ↓
SeoMetaRepository / SeoRedirectRepository
        ↓
mutateJson + file-lock + backup + revision   (lib/cms/store)
        ↓
data/seo-meta.json | data/url-history.json
```

**Repository:** okuma, doğrulama (Zod), bulma, benzersizlik, atomik yazma, yedek, rollback.  
**Service:** slugify, fallback, publish assert, redirect oluşturma, flatten, kalite uyarıları, backfill.  
**Action:** ince sarmalayıcı; doğrudan JSON yazmaz.

Mevcut `withFileLock` + `mutateJson` kullanılır; SEO yazımlarında:

1. Kilit al  
2. Revision kontrol  
3. Bellekte uygula  
4. Zod doğrula  
5. Temp yaz → parse doğrula → backup → atomic rename  
6. `revalidateSite()` + ilgili path’ler  

### 4.1 Dosya yerleşimi (öneri)

```
lib/seo/
  types.ts
  schemas.ts              # Zod
  path.ts                 # normalizePath, slugifyTr
  score.ts                # 0–100 skor
  fallback.ts
  schema-templates.ts     # JSON-LD şablonları
  schema-validate.ts      # schemaJson sanitize/validate
  seo-meta-repository.ts
  seo-meta-service.ts
  seo-redirect-repository.ts
  seo-redirect-service.ts
  resolve-metadata.ts     # Next Metadata builder
  backfill.ts
  legacy-log.ts
data/
  seo-meta.json
  url-history.json
  seo-legacy-fallback-log.json   # veya audit-logs’a kanal
components/admin/seo/
  seo-tab.tsx
  serp-preview.tsx
  social-preview.tsx
  char-counter.tsx
  seo-score-panel.tsx
middleware.ts             # url-history 301/302
docs/seo-editor-guide.md  # 1 sayfalık editör rehberi
```

---

## 5. Fallback, doğrulama, yayın kilidi

### 5.1 Fallback zinciri

| Alan | Zincir |
|------|--------|
| metaTitle | kayıt → `{başlık} \| {siteAdı}` → global site title |
| metaDescription | kayıt → stripHtml(içerik) ~155 → global description |
| og* | kayıt → çözülmüş meta* |
| ogImageUrl | kayıt → featured → marka default |
| canonicalUrl | kayıt → self from path |
| slug (bungalow) | kayıt → slugify(name); çakışmada `-2`… |
| schemaJson | validate geçmiş kayıt → template(schemaType) |
| robots | default index,follow |

### 5.2 Sert vs yumuşak

**Sert (yayın / kaydet engeli):** zorunlu boş meta (yayın); geçersiz canonical; geçersiz/tehlikeli schemaJson; revision çakışması; redirect döngüsü; slug benzersizlik ihlali.

**Yumuşak:** karakter ideal dışı; focus keyword eksik eşleşme; duplicate metaTitle; OG boyut; hedef 404 riski.

### 5.3 Yayın kilidi

- Bungalov `AKTIF`: `assertPublishable()` — metaTitle, metaDescription, slug, focusKeyword dolu (fallback sonrası bile editörün kaydettiği değerler zorunlu alan listesinde; otomatik fallback taslakta UI’yi doldurabilir ama yayın öncesi onaylanmış kayıt gerekir).
- **Net kural:** Yayın için kayıttaki `metaTitle`, `metaDescription`, `focusKeyword`, bungalow `slug` boş olamaz. Form “Otomatik doldur” ile fallback değerlerini yazabilir; boş bırakıp yayınlanamaz.
- Taslak / pasif: her zaman kaydedilebilir.
- UI: Yayınla pasif; backend gate zorunlu.

### 5.4 SEO skoru (0–100)

Kalemler: focus keyword in title / description / H1(başlık) / URL / ilk paragraf; içerik uzunluğu; görsel alt doluluğu (mevcut alanlar); iç link sayısı; basit okunabilirlik. Skor yayın engeli değildir.

---

## 6. Panel arayüzü

### 6.1 Ortak `<SeoTab />`

Her bungalov formunda ve sayfa SEO yönetiminde SEO sekmesi:

- Canlı Google SERP (masaüstü / mobil toggle)
- Karakter sayaçları: kısa=sarı, ideal=yeşil, uzun=kırmızı; Unicode
- SEO skoru + trafik ışığı + kalem listesi (Türkçe açıklamalar)
- Sosyal önizleme: Facebook / X / WhatsApp kart
- Alanlar: meta title/desc, focus keyword, slug (bungalow), OG alanları, robots (ADMIN+), canonical (ADMIN+), schema (ADMIN+)

Dil: sade Türkçe etiketler ve yardım metinleri.

### 6.2 Mevcut UI entegrasyonu

- `BungalovForm` SEO sekmesi → `<SeoTab entityType="bungalow" />`
- `/admin/website/seo` → page listesi `seo-meta` üzerinden; global site title/description ayrı (siteManagement’ta kalabilir veya `entityId: site-global`)

### 6.3 Roller

| Alan | CONTENT_EDITOR | ADMIN / SUPERADMIN |
|------|----------------|-------------------|
| meta*, focus, slug, og* | evet | evet |
| canonical, robots, schemaJson override | hayır | evet |

---

## 7. Site tarafı çıktı

### 7.1 Metadata

`lib/seo/resolve-metadata.ts` → `buildPageMetadata(entityType, entityId)`:

- title (absolute), description
- alternates.canonical
- robots
- openGraph (+ image)
- twitter card

Tüm public `generateMetadata` bu helper’ı kullanır. `resolvePageSeo` deprecate → wrapper veya silinir.

### 7.2 JSON-LD

Mevcut `components/site/json-ld.tsx` şablonları `schemaType` / validate edilmiş `schemaJson` ile beslenir. BreadcrumbList kategori/yol hiyerarşisinden.

### 7.3 Bungalov route

- Canonical path: `/bungalovlarimiz/[slug]`
- `[id]` route: middleware veya sayfa içinde id→slug 301 (url-history + lookup)
- Sitemap: yalnızca slug URL’leri, `robotsIndex === true`, `status === AKTIF`

### 7.4 robots.txt

Mevcut `app/robots.ts` korunur; staging ortamında `noindex` (env `VERCEL_ENV` / `NODE_ENV` / özel `SEO_NOINDEX=true`). Panelden tam robots editörü Faz B.

### 7.5 Redirect runtime

`middleware.ts`: `url-history` aktif kayıtlarına göre 301/302. Performans: in-memory / kısa TTL cache; yazmada invalidate.

---

## 8. Backfill

Sıra:

1. `seo-meta.json` / `url-history.json` yoksa oluştur; mevcut JSON yedeği
2. `pageSeoItems` → page kayıtları (`PAGE_ENTITY_IDS` map)
3. Bungalov SEO + slug → bungalow kayıtları
4. Meta title / slug çakışmalarını raporla
5. Eksikleri fallback ile doldur
6. Zod validate
7. Rapor: `{ totalProcessed, created, skipped, conflicts, warnings }`
8. Yeni yazmaları seo-meta’ya yönlendir; legacy salt-okunur

Çalıştırma: `npx tsx scripts/seo-backfill.ts` veya admin-only server action (SUPERADMIN).

---

## 9. Editör rehberi

`docs/seo-editor-guide.md` — 1 sayfa, Türkçe:

- SEO sekmesi nerede
- Zorunlu alanlar / Yayınla neden pasif
- Karakter renkleri
- Odak kelime nedir
- Otomatik doldur ne yapar
- Slug değiştirince eski linklerin yönlendiği

---

## 10. Performans

- Sayfa render’da SEO eager: ilgili kayıt id ile O(1)/O(n) tek okuma + process cache (`readJson` mtime cache)
- N+1 yok: liste sayfalarında toplu map
- Middleware redirect listesi cache’li

---

## 11. Test planı (özet)

- Unit: slugifyTr, normalizePath, flatten redirects, döngü tespiti, fallback, score, schema validate
- Unit: publish gate, revision conflict, duplicate title warning
- Integration: backfill rapor şekli; save bungalow slug change → url-history
- Manual: SERP önizleme, sitemap slug, id URL 301, Rich Results (bungalow LodgingBusiness)

---

## 12. Riskler ve teknik borç

| Madde | Not |
|-------|-----|
| Page `entityId` = path türevi | Kalıcı ID haritası kodda; path değişiminde id sabit kalmalı |
| Medya boyut doğrulama | Soft; tam pipeline Faz B |
| Concurrent JSON yazma | file-lock + revision mevcut kalıpla |
| middleware + json okuma | Edge kısıtı: redirect map’i build/sync veya Node runtime middleware |

---

## 13. Self-review (2026-07-27)

- [x] Placeholder yok
- [x] Kararlar tutarlı (tek kaynak, slug URL, soft char, locale-aware uniqueness)
- [x] Kullanıcı düzeltmeleri (1–20) modele işlendi
- [x] Kapsam MVP ile sınırlı; Faz B açıkça dışarıda
- [x] Mevcut `mutateJson` / file-lock ile uyumlu
- [x] Çelişki giderildi: “fallback yayın yeter” vs “zorunlu alan” → yayın için kayıt dolu olmalı; otomatik doldur UI yardımcı
