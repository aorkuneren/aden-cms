# Açılış Hızı & Performans Implementation Plan

> **For agentic workers:** Adımlar checkbox (`- [ ]`) ile takip edilir. Her fazın sonunda "Doğrulama" adımı zorunludur — ölçmeden bir sonraki faza geçilmez.

**Goal:** Ziyaretçi sitesinin ilk açılış performansını, ölçülen temel değerlerden yola çıkarak somut hedeflere taşımak: ilk yük JS'ini ~307 KB'den ~120 KB altına indirmek, ekran altı içeriği sunucu HTML'ine geri koymak ve görsel yükünü optimize etmek.

**Yöntem:** Her değişiklik ölçüme dayanır. Faz 0'da tekrarlanabilir bir ölçüm betiği kurulur; sonraki her faz aynı betikle önce/sonra karşılaştırılır.

**Tech Stack:** Next.js 16.2 App Router (webpack), React 19.2, Tailwind v4, dosya tabanlı JSON store (`lib/cms/store.ts`).

---

## Ölçülen Temel Değerler (2026-07-26, production build)

Aşağıdaki sayılar tahmin değil, bu repoda `next build` + `next start` ile ölçüldü.

| Metrik | Ölçülen değer | Hedef |
|---|---|---|
| Ana sayfa ilk yük JS (gzip) | **307 KB** / 23 chunk / 54 `<script>` | < 120 KB |
| Ana sayfa CSS (gzip / ham) | **23 KB / 139 KB** — tek dosya, admin + site birlikte | site için < 10 KB gzip |
| Sunucu HTML'inde `<h2>` sayısı | **0** (6 adet `animate-pulse` iskelet) | tüm bölümler HTML'de |
| Sunucu HTML boyutu | 122 KB ham / 23,5 KB gzip | < 60 KB ham |
| Font dosyası | **17 woff2 / 404 KB**, 3 aile, **0 preload** | 1–2 aile, kritik font preload'lu |
| TTFB (yerel prod) | 14–20 ms | mevcut durum korunmalı |
| Statik olarak üretilen rota | **46 rotanın 4'ü** | public rotalar ISR |
| En büyük upload görseli | **1,87 MB** (`.avif`), ayrıca 2,0 MB `.mp4` | < 300 KB |

### En büyük tekil JS kalemleri (gzip)

| Chunk | Boyut | İçerik |
|---|---|---|
| `4bd1b696-*` | 61 KB | react-dom (zorunlu) |
| `3794-*` | 59 KB | Next/React istemci çalışma zamanı (zorunlu) |
| `polyfills-*` | **38 KB** | eski tarayıcı polyfill'leri — kaldırılabilir |
| `8494-*` | **26 KB** | `next-nprogress-bar` — değiştirilebilir |
| `c15bf2b0-*` | **19 KB** | `gsap` — kaldırılabilir |

Yani ~120 KB React/Next tabanı zorunlu; **~83 KB'lik kısım doğrudan kaldırılabilir durumda.**

### Darboğaz OLMAYAN şeyler (ölçüldü, elenmesi için kayda geçiriliyor)

Veri katmanı için yaygın "JSON + Zod yavaştır" varsayımı bu projede **geçerli değil.** 300 çağrılık ölçüm:

| İşlem | Süre |
|---|---|
| `readJson("cms-config.json")` (mtime cache hit) | 0,015 ms |
| `websiteCmsQueries.getConfig()` (Zod parse dahil) | 0,065 ms |
| `bungalovQueries.findMany()` (Zod parse dahil) | 0,080 ms |
| `settingsQueries.findFirst()` (Zod parse dahil) | 0,041 ms |

TTFB zaten 14–20 ms. **Bu yüzden veri katmanı yeniden yazımı, SQLite'a geçiş veya Zod'un çıkarılması bu planda YOK.** Kazanç tamamen istemci tarafında.

---

## Global Kısıtlar

- Görsel davranış ve tasarım değişmez; bu bir performans planıdır, redesign değil.
- Erişilebilirlik gerilemesi kabul edilmez (`prefers-reduced-motion`, klavye odağı, dokunma hedefleri korunur).
- Admin paneli performansı ikinci önceliktir; ziyaretçi sitesi önce gelir.
- Her faz bağımsız merge edilebilir olmalı; geri alınabilirlik korunur.
- Commit yalnızca kullanıcı istediğinde atılır.

---

## Faz 0 — Ölçüm altyapısı

Kanıt olmadan optimizasyon yapılmaz. Bu faz kod davranışını değiştirmez.

### Task 0.1: Tekrarlanabilir ölçüm betiği

**Files:**
- Create: `scripts/perf-report.mjs`
- Modify: `package.json` (`"perf": "node scripts/perf-report.mjs"`)

**Yapacağı iş:**
- `next build` çıktısındaki `.next/static` üzerinden ana sayfanın ilk yük JS'ini gzip cinsinden toplar (HTML'deki `/_next/static/chunks/*.js` referanslarını izleyerek).
- CSS gzip/ham boyutu, woff2 sayısı ve toplam font ağırlığı.
- `next start` ile ana sayfayı çeker; TTFB, HTML boyutu, `<script>` sayısı, `<h2>` sayısı, `animate-pulse` sayısını raporlar.
- Çıktıyı `perf-baseline.json` olarak yazar ve varsa öncekiyle farkı gösterir.

- [ ] Betik yazıldı
- [ ] `npm run perf` çalışıyor ve yukarıdaki temel değerleri üretiyor
- [ ] `perf-baseline.json` repoya işlendi (referans nokta)

### Task 0.2: Performans bütçesi

**Files:**
- Create: `perf-budget.json`

Bütçe: ilk yük JS ≤ 130 KB gzip, site CSS ≤ 12 KB gzip, font ≤ 120 KB, sunucu HTML `<h2>` ≥ 5.

- [ ] Bütçe dosyası eklendi
- [ ] `npm run perf` bütçe aşımında non-zero exit veriyor

---

## Faz 1 — İstemci JS'i (en yüksek etki, düşük risk)

Hedef: 307 KB → ~150 KB. Bu fazın tamamı bağımlılık kaldırma; iş mantığı değişmez.

### Task 1.1: `DeferredSection` yerine `content-visibility`

**Sorun:** `components/site/deferred-section.tsx` ana sayfada 6 kez kullanılıyor ve `isVisible` false iken `children`'ı hiç render etmiyor. Sonuç: sunucu HTML'inde tek bir `<h2>` bile yok, içerik yalnızca RSC payload'ında string olarak duruyor ve istemcide çiziliyor. Bu hem SEO riski hem de gereksiz istemci işi. Ayrıca bu bileşen GSAP'i ana sayfaya sokan yerlerden biri.

**Çözüm:** Bileşeni, çocuklarını **her zaman** render eden ama tarayıcıya çizimi erteleten bir sarmalayıcıya çevir:

```css
.deferred-section { content-visibility: auto; contain-intrinsic-size: auto 540px; }
```

`placeholderClassName`'deki `min-h-*` değerleri `contain-intrinsic-size`'a taşınır, böylece kaydırma çubuğu sıçraması olmaz.

**Files:**
- Modify: `components/site/deferred-section.tsx` (client → server bileşeni, `gsap`/`IntersectionObserver`/`useState` kaldırılır)
- Modify: `app/globals.css` (`.deferred-section` yardımcı sınıfı)
- Modify: `app/(site)/page.tsx` (`placeholderClassName` → `intrinsicSize` prop'u)

- [ ] Bileşen sunucu bileşenine çevrildi
- [ ] Ana sayfa HTML'inde `<h2>` sayısı ≥ 5 (ölçüldü)
- [ ] Görsel olarak kaydırma sırasında sıçrama (CLS) yok
- [ ] `npm run perf` ile JS düşüşü kaydedildi

### Task 1.2: GSAP'i kaldır (−19 KB)

**Sorun:** `gsap` yalnızca iki yerde kullanılıyor: `deferred-section.tsx` (fade+translate giriş) ve `home-gsap-animations.tsx` (hero görselinde 1.08→1 ölçek, metinlerde kademeli fade). İkisi de CSS ile birebir yapılabilir.

**Çözüm:**
- Giriş animasyonu: `@keyframes` + `animation-timeline: view()` destekli tarayıcılarda; desteklemeyende animasyonsuz görünür (progressive enhancement).
- Hero ölçek/metin animasyonu: saf CSS `@keyframes` + `animation-delay` ile kademeleme.
- Her ikisi de `@media (prefers-reduced-motion: reduce)` altında kapalı (globals.css'te zaten global kural var, korunacak).

**Files:**
- Modify: `app/globals.css` (animasyon keyframe'leri)
- Modify: `components/site/hero-section.tsx` (`data-hero-copy` öğelerine CSS sınıfı)
- Delete: `components/site/home-gsap-animations.tsx`
- Modify: `app/(site)/page.tsx` (`HomeGsapAnimations` kaldırılır)
- Modify: `package.json` (`gsap` bağımlılıktan çıkar)

- [ ] GSAP importu kalmadı (`rg "from \"gsap\"" components app` boş)
- [ ] `gsap` package.json'dan kaldırıldı
- [ ] Hero ve bölüm girişleri görsel olarak eşdeğer
- [ ] `prefers-reduced-motion: reduce` ile animasyon yok

### Task 1.3: `next-nprogress-bar` yerine yerel ilerleme çubuğu (−26 KB)

**Sorun:** Sadece 3px'lik bir yükleme çubuğu için 26 KB gzip. Next 16'da `useLinkStatus` ile bu birkaç satırda yapılır.

**Çözüm:** `useLinkStatus` tabanlı, ~1 KB'lik bir bileşen. Kök layout'a değil, `Link` sarmalayıcısına bağlanır; ayrıca rota geçişlerinde `loading.tsx` iskeletleri devreye girer (Task 4.2).

**Files:**
- Modify: `components/providers/progress-bar-provider.tsx`
- Modify: `package.json` (`next-nprogress-bar` kaldır)

- [ ] Rota geçişinde ilerleme göstergesi hâlâ çalışıyor
- [ ] `next-nprogress-bar` bağımlılıktan kaldırıldı

### Task 1.4: Polyfill yükünü düşür (−38 KB)

**Sorun:** 38 KB gzip polyfill, hedeflenen tarayıcı listesi belirtilmediği için varsayılan geniş desteğe göre üretiliyor.

**Çözüm:** `package.json`'a modern bir `browserslist` ekle (ör. `"> 0.5%, last 2 versions, not dead, not op_mini all"` veya daha net: `"supports es6-module"`). Analytics'te gerçek ziyaretçi tarayıcı dağılımı varsa ona göre daralt.

**Files:**
- Modify: `package.json` (`browserslist` alanı)

- [ ] `browserslist` eklendi
- [ ] Polyfill chunk boyutu ölçülüp raporlandı
- [ ] Hedef tarayıcılarda (Safari iOS son 2 sürüm dahil) duman testi yapıldı

### Task 1.5: Paket import optimizasyonu

**Files:**
- Modify: `next.config.ts`

```ts
experimental: {
  optimizePackageImports: ["lucide-react", "radix-ui", "@radix-ui/react-dialog", "date-fns"],
}
```

- [ ] Ayar eklendi
- [ ] Build başarılı, ikon/dialog'lar çalışıyor
- [ ] JS farkı ölçüldü

### Faz 1 Doğrulama

- [ ] `npm run perf`: ilk yük JS ≤ 170 KB gzip
- [ ] Sunucu HTML'inde tüm bölüm başlıkları var
- [ ] `npm run build` + `npm test` yeşil

---

## Faz 2 — Görsel ve font

Faz 1 JS'i azaltır; bu faz LCP'yi ve gerçek bant genişliğini azaltır.

### Task 2.1: Ham `<img>` etiketlerini `next/image`'a taşı

**Sorun:** 13 yerde ham `<img>` var ve bunlar Next görsel optimizasyonunu tamamen atlıyor. `public/uploads` altındaki orijinaller **1,87 MB'a kadar** çıkıyor. Özellikle `about-intro-section.tsx` ana sayfada 4 büyük görseli optimize etmeden yüklüyor.

**Öncelik sırası (etkiye göre):**
1. `components/site/about-intro-section.tsx` (5 adet, ana sayfa)
2. `app/(site)/page.tsx:621,633` (CTA görselleri, ana sayfa)
3. `components/site/bungalow-detail-gallery.tsx` (3 adet, detay sayfası)
4. `components/site/site-header.tsx:429`, `components/site/site-footer.tsx:336,487` (logolar — `width`/`height` şart, CLS kaynağı)

Admin önizleme (`preview-primitives.tsx`) ham `<img>` olarak kalabilir; ziyaretçiye servis edilmiyor.

- [ ] Ana sayfadaki tüm görseller `next/image` üzerinden
- [ ] Her `<Image>` için doğru `sizes` verildi (varsayılan `100vw` bırakılmadı)
- [ ] Logolarda sabit `width`/`height` var, CLS yok
- [ ] Detay galerisi taşındı

### Task 2.2: Görsel optimizasyon ayarları

**Files:**
- Modify: `next.config.ts`

```ts
images: {
  formats: ["image/avif", "image/webp"],
  minimumCacheTTL: 31536000,
  remotePatterns: [/* mevcut */],
}
```

Mevcut yapılandırmada `formats` tanımlı değil, yani AVIF üretilmiyor.

- [ ] AVIF açıldı, üretilen boyutlar karşılaştırıldı
- [ ] `minimumCacheTTL` ayarlandı

### Task 2.3: Yükleme boru hattında görsel sıkıştırma

**Sorun:** Panelden yüklenen orijinaller olduğu gibi diske yazılıyor (1,87 MB avif, 2,0 MB mp4). `sharp` zaten `overrides`'ta mevcut.

**Files:**
- Modify: `lib/media/upload.ts`

Yükleme anında: uzun kenarı 2560 px'e indir, AVIF/WebP olarak yeniden kodla, hedef < 300 KB. Mevcut dosyalar için tek seferlik bir `scripts/optimize-uploads.mjs` betiği (orijinalleri yedekleyerek).

- [ ] Yeni yüklemeler sıkıştırılıyor
- [ ] Geçmiş dosyalar için betik yazıldı ve çalıştırıldı
- [ ] `du -sh public/uploads` öncesi/sonrası raporlandı

### Task 2.4: Font stratejisi

**Sorun:** 3 aile (Inter, Playfair Display, Geist Mono) → 17 woff2 / 404 KB ve **hiç preload yok**.

**Adımlar:**
1. `Geist_Mono` kullanımını doğrula (`--font-geist-mono` yalnızca `globals.css`'te `--font-mono` olarak geçiyor; ziyaretçi sitesinde monospace kullanımı yoksa **kaldır**).
2. Playfair Display yalnızca `h1`–`h6` için kullanılıyor → ağırlıkları gerçekten kullanılanlarla sınırla.
3. `latin-ext` alt kümesinin Türkçe karakterler için gerekliliğini doğrula (ş, ğ, ı, İ). Gerekliyse kalır — bu bir doğrulama adımı, kaldırma adımı değil.
4. Kritik fontu preload et (`preload: true`, Next varsayılanı ama `variable` kullanımıyla birlikte HTML'de preload üretilmediği ölçüldü — nedeni araştırılıp düzeltilecek).

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] Geist Mono kullanımı doğrulandı, kullanılmıyorsa kaldırıldı
- [ ] Ana sayfa HTML'inde `as="font"` preload > 0
- [ ] Font toplam ağırlığı ölçülüp raporlandı
- [ ] FOUT görsel olarak kontrol edildi

### Task 2.5: Hero'da yalnızca gerekli slaytları yükle

**Sorun:** `hero-section.tsx` tüm slaytları aynı anda DOM'a basıyor (`opacity-0` ile gizli). Şu an CMS'te 1 aktif slayt var, dolayısıyla sorun görünmüyor; panelden 5 slayt eklendiği anda 5 tam ekran görsel birden inecek.

**Çözüm:** Yalnızca aktif + bir sonraki slaytı render et; diğerlerini `loading="lazy"` bırak. İlk slaytta `priority` + `fetchPriority="high"` zaten olmalı — ölçümde `fetchpriority="high"` sayısı 0 çıktı, doğrulanacak.

**Files:**
- Modify: `components/site/hero-section.tsx`

- [ ] Yalnızca aktif + komşu slayt render ediliyor
- [ ] İlk slaytta `fetchpriority="high"` HTML'de görünüyor
- [ ] 5 slaytlı senaryoda ağ sekmesinde tek görsel iniyor

### Faz 2 Doğrulama

- [ ] Lighthouse mobil LCP ölçüldü, önce/sonra kaydedildi
- [ ] Ana sayfa toplam transfer boyutu raporlandı

---

## Faz 3 — CSS ve sunucu/istemci sınırı

### Task 3.1: Admin CSS'ini site CSS'inden ayır

**Sorun:** Tek bir 139 KB (23 KB gzip) CSS dosyası hem siteye hem panele servis ediliyor. `admin-sidebar`, `admin-scrollbar`, `admin-animate-in`, `cms-management-font` sınıflarının ziyaretçi CSS'inde olduğu doğrulandı.

**Çözüm:** Admin'e özel token ve yardımcıları `app/admin/admin.css`'e taşı, yalnızca `app/admin/layout.tsx` içinden import et.

**Files:**
- Create: `app/admin/admin.css`
- Modify: `app/globals.css`
- Modify: `app/admin/layout.tsx`

- [ ] Admin sınıfları site CSS'inde yok (grep ile doğrulandı)
- [ ] Site CSS'i ≤ 12 KB gzip
- [ ] Admin paneli görsel olarak bozulmadı

### Task 3.2: Header ve footer'ı sunucu bileşenine çevir

**Sorun:** `site-header.tsx` (683 satır) ve `site-footer.tsx` (498 satır) tamamen `"use client"`. Bu iki dosya her sayfada istemciye iniyor; footer'ın etkileşimi neredeyse yok.

**Çözüm:** Sunucu bileşenine çevir, yalnızca gerçekten etkileşimli parçaları küçük istemci adacıklarına ayır (mobil menü aç/kapa, kaydırmada sabitlenen başlık, dil/para birimi seçici).

**Files:**
- Modify: `components/site/site-header.tsx` → + `components/site/site-header-mobile-menu.tsx` (client)
- Modify: `components/site/site-footer.tsx` (server)

- [ ] Footer'da `"use client"` yok
- [ ] Header'ın istemci kısmı yalnızca etkileşimli adacıklar
- [ ] `(site)/layout` chunk'ı küçüldü (ölçüldü)
- [ ] Mobil menü, sabit başlık, seçiciler çalışıyor

### Faz 3 Doğrulama

- [ ] `npm run perf`: ilk yük JS ≤ 130 KB gzip (ana hedef)

---

## Faz 4 — Sunucu tarafı ve önbellek

**Not:** TTFB zaten 14–20 ms olduğu için bu fazın kazancı Faz 1–3'ten küçüktür. Amaç mevcut hızı **yük altında** korumak ve algılanan gecikmeyi azaltmak. Bu yüzden en sona bırakıldı.

### Task 4.1: `force-dynamic` yerine etiket tabanlı ISR

**Sorun:** 46 rotanın 42'si `force-dynamic`. Public sayfaların hiçbiri önbelleklenmiyor; her ziyaretçi için tam render yapılıyor. Oysa içerik yalnızca panelden değiştiğinde değişiyor ve `lib/cms/store.ts` içinde zaten bir `revalidateSite()` kancası var.

**Çözüm:** Public rotalarda (`app/(site)/page.tsx`, `bungalovlarimiz`, `bungalovlarimiz/[id]`, `galeri`, `kurumsal`, `kurumsal/[slug]`, `iletisim`) `force-dynamic` kaldırılır; veri okumaları `cacheTag` ile etiketlenir; `revalidateSite()` `revalidateTag` kullanacak şekilde genişletilir.

**Kapsam dışı:** `giris`, `kayit-ol`, `hesabim`, `sifremi-unuttum` — oturum bağımlı, dinamik kalır. Tüm `/admin/*` dinamik kalır.

**Files:**
- Modify: `lib/cms/store.ts` (`revalidateSite` → etiket bazlı)
- Modify: `lib/data/queries.ts` (okumalara `cacheTag`)
- Modify: yukarıdaki public sayfa dosyaları

- [ ] Public rotalar ISR ile üretiliyor (`next build` çıktısında ○/● işareti)
- [ ] Panelden içerik değişikliği sonrası site **anında** güncelleniyor (manuel test)
- [ ] Bakım modu anahtarı hâlâ anında etki ediyor
- [ ] Oturumlu sayfalar yanlışlıkla önbelleğe alınmıyor (farklı kullanıcılarla test)

### Task 4.2: `loading.tsx` ve akış (streaming)

**Sorun:** Projede hiç `loading.tsx`, `error.tsx` veya Suspense sınırı yok. Rota geçişleri tamamlanana kadar ekranda hiçbir geri bildirim olmuyor.

**Files:**
- Create: `app/(site)/loading.tsx`, `app/(site)/bungalovlarimiz/loading.tsx`, `app/admin/(panel)/loading.tsx`
- Create: `app/(site)/error.tsx`

- [ ] İskelet ekranlar mevcut tasarımla tutarlı
- [ ] Rota geçişinde anında geri bildirim var

### Task 4.3: Statik varlık önbellek başlıkları

**Files:**
- Modify: `next.config.ts` (`headers()`)

`/uploads/:path*` için uzun ömürlü `Cache-Control` (dosya adları zaten zaman damgalı, güvenli). `_next/static` Next tarafından zaten doğru ayarlanıyor — doğrulanacak.

- [ ] `/uploads` için `immutable` önbellek başlığı var
- [ ] `sw.js` ve `manifest.webmanifest` için mevcut `no-cache` kuralları korundu

### Task 4.4: Turbopack'e geçişi değerlendir

`package.json` şu an `next dev --webpack` ve `next build --webpack` kullanıyor. Turbopack build hem derleme süresini hem chunk bölmeyi iyileştirebilir.

- [ ] `next build` (Turbopack) denendi, çıktı boyutları webpack ile karşılaştırıldı
- [ ] Fark anlamlıysa geçiş yapıldı, değilse gerekçesi bu dosyaya not edildi

---

## Faz 5 — Kalıcılık

### Task 5.1: CI'da performans bütçesi

- [ ] `npm run perf` CI'da çalışıyor
- [ ] Bütçe aşımı build'i kırıyor

### Task 5.2: Sonuç raporu

- [ ] Tüm temel değerler yeniden ölçüldü
- [ ] Önce/sonra tablosu bu dosyanın başına eklendi
- [ ] Gerçek cihaz (mobil, 4G kısıtlı) üzerinde Lighthouse doğrulaması yapıldı

---

## Beklenen Toplam Kazanç

| Kalem | Kazanç (gzip) | Faz |
|---|---|---|
| Polyfill daraltma | −38 KB | 1.4 |
| `next-nprogress-bar` → yerel | −26 KB | 1.3 |
| GSAP kaldırma | −19 KB | 1.2 |
| Admin CSS ayrımı | −13 KB (CSS) | 3.1 |
| Header/footer sunucuya taşıma | −10…20 KB (tahmini) | 3.2 |
| `optimizePackageImports` | ölçülecek | 1.5 |
| **İlk yük JS** | **307 KB → ~120 KB** | 1+3 |

Bunlara ek olarak ölçülemeyen ama önemli iki kazanç: ekran altı içeriğin sunucu HTML'ine dönmesi (Task 1.1) ve 1,87 MB'lık görsellerin optimize edilmesi (Task 2.1–2.3).
