# Public Site — Mobile-First Responsive Dönüşüm

**Tarih:** 2026-07-26  
**Durum:** Uygulama tamamlandı — manuel cihaz onayı bekleniyor  
**Kapsam:** Yalnızca ziyaretçi sitesi (`app/(site)/**`, `components/site/**`, `app/globals.css`, `app/layout.tsx`)  
**Yaklaşım:** Token + shell merkezli sistem (A)  
**Kısıt:** Mevcut tasarım dili, marka renkleri ve içerik hiyerarşisi korunur; yeni harici kütüphane eklenmez.

## Problem

Public site kısmen responsive: viewport meta, hamburger Sheet, `pb-safe`, focus ring ve `prefers-reduced-motion` mevcut. Ancak 320–3840 px aralığında sistematik bir fluid token katmanı yok. Sabit yükseklikler, dar ekranda tipografi taşması, alt sabit katman çakışmaları, eksik safe-area (üst/yan) ve ultra-wide ölçek boşluğu düzeni kırıyor.

## Hedef

320–3840 px arasında her genişlikte:

1. Düzen bozulmadan çalışır.
2. İçerik kesilmez, üst üste binmez, yatay taşma olmaz.
3. Masaüstünde tam menü, mobilde hamburger / off-canvas.
4. WCAG 2.1 AA (kontrast, klavye, odak, touch ≥44×44).
5. Core Web Vitals: LCP &lt; 2.5s, CLS &lt; 0.1, INP &lt; 200ms hedeflenir.
6. Görsel dil aynı kalır; yalnızca responsive davranış güçlenir.

## Kapsam dışı

- `/admin` paneli ve admin bileşenleri
- Marka renk / font / hero kompozisyon yeniden tasarımı
- Yeni UI kütüphanesi veya CSS framework değişikliği
- İçerik / CMS veri modeli değişiklikleri
- Playwright/Cypress kurulumu (manuel + mevcut Vitest ile doğrulama)

## Mimari

```
globals.css (token + utilities)
    ↓
app/layout.tsx (viewport — zaten mevcut)
    ↓
app/(site)/layout.tsx (shell: header, main, footer, bottom nav, cookie)
    ↓
SiteSection / tipografi / spacing token tüketicileri
    ↓
Sayfa bileşenleri (hero, listing, detail, gallery, contact, auth)
```

**İlke:** Önce token ve shell düzeltilir; sayfalar bu token’lara bağlanır. Sayfa bazlı yama yapılmaz.

## Breakpoint eşlemesi

İstenen matris, mevcut Tailwind 4 varsayılanlarına davranış olarak oturtulur (özel kütüphane yok):

| Segment | Aralık | Uygulama |
|---------|--------|----------|
| Küçük mobil | 320–479 px | base stiller |
| Mobil | 480–767 px | base + `sm` (640+) |
| Tablet | 768–1023 px | `md` |
| Laptop | 1024–1439 px | `lg` / `xl` |
| Masaüstü | 1440–1919 px | `xl` + container |
| Geniş / 4K | 1920+ px | `2xl` kullanımı gerektiğinde; içerik `max-w-7xl` içinde kalır, kenar boşluğu artar |

**Not:** Container marka genişliği (`max-w-7xl`) korunur. Ultra-wide’da içerik şişirilmez; okunabilir ölçü ve boşluk artışı tercih edilir.

## Token sistemi (`app/globals.css`)

### Tipografi

- Gövde: minimum `1rem` (16px) mobilde.
- Başlıklar: `clamp()` ile akışkan ölçek (mevcut Playfair hiyerarşisi korunur).
- Hero başlık örneği: sabit `text-[2.35rem]` / `sm:text-[3.05rem]` / `md:text-[3.7rem]` → `clamp(1.75rem, 4vw + 1rem, 3.7rem)` benzeri akışkan değer; görsel boyut aralığı aynı kalır.

### Spacing / container

- Yatay padding: `px-4 sm:px-6` korunur. 320 px’de içerik sıkışırsa yatay padding `clamp(0.75rem, 4vw, 1.5rem)` ile daraltılır; masaüstü değeri değişmez.
- Alt sabit katman yüksekliği için tek token: `--site-bottom-chrome` (bottom nav + safe-area + cookie ofseti). `MobileBottomNav`, cookie banner ve sayfa `pb-*` değerleri bunu paylaşır.

### Safe-area

- Mevcut: yalnızca `pb-safe` (`safe-area-inset-bottom`).
- Eklenecek: `pt-safe`, `px-safe` / `env(safe-area-inset-top|left|right)` — fixed header ve bottom nav’da.
- `viewportFit: "cover"` zaten `app/layout.tsx` içinde; korunur.

### Touch / a11y utilities

- `.touch-target` (min 44×44) korunur ve eksik kontrollere uygulanır.
- Global `:focus-visible` korunur.
- Hero slayt noktalarındaki `focus-visible:outline-none` kaldırılır.
- `prefers-reduced-motion`: mevcut global kural korunur; hero/carousel autoplay bu tercihte durur.

### Overflow

- Shell `overflow-x-clip` korunur.
- Geniş içerik / thumbs: `overflow-x-auto` + `min-w-0` (bilinçli yatay kaydırma yalnızca gallery thumbs gibi bileşenlerde).
- Yanıltıcı `.aspect-square { aspect-ratio: 1.5 / 1 }` → mevcut oranı bozmadan doğru yardımcı sınıfa taşınır (isim düzeltmesi; görsel değişmez).

## Shell ve navigasyon

### Header (`components/site/site-header.tsx`)

- Home: `fixed`; iç sayfalar: `sticky` — davranış korunur.
- Desktop (`lg+`): yatay menü + aksiyonlar.
- Tablet (`md`–`lg`): aksiyonlar görünür, menü Sheet’te (mevcut mantık; sıkışma giderilir).
- Mobil (`md` altı): hamburger + Sheet; touch ≥44×44; safe-area.
- Top header 320–479: truncate / kontrollü kırılma; logo `max-width` dar ekranda küçülür, oran korunur.
- Anasayfa top-bar scroll gizlenme korunur; hero üst boşluğu buna göre tutarlı kalır.

### Bottom chrome

- `MobileBottomNav` + cookie banner tek spacing token’ı paylaşır.
- Sayfa `pb-24` / `pb-28` tutarsızlıkları token’a bağlanır; içerik alt sabit UI altında kalmaz.
- Landscape + çentik: safe-area insets uygulanır.

### SiteSection

- `max-w-7xl px-4 sm:px-6` korunur.
- Gerekirse geniş ekran dikey ritmi için mevcut section padding’leri akışkan hale getirilir (görsel hiyerarşi aynı).

## Sayfa düzenleri

### Ana sayfa (`app/(site)/page.tsx` + site bileşenleri)

- Hero: full-bleed kompozisyon aynı; yükseklik `aspect` / `min()` / `svh` ile akışkan; `next/image` + `sizes="100vw"`; yalnızca ilk slayt `priority`.
- About collage: masaüstü absolute yerleşim korunur; mobilde mevcut 2 sütun grid.
- Featured / why / gallery / FAQ: mobile-first grid; mevcut sütun kırılmaları korunur.
- CTA görselleri: sabit `h-[290px]` vb. → akışkan yükseklik + `aspect-ratio` / `object-cover`; `loading="lazy"`.

### Bungalov listesi

- Kart grid mobile-first.
- Showcase kart sabit `h-[340px]/360px` → `min-h` + aspect; görsel dil aynı.
- Feature marquee: viewport içinde kalır; yatay taşma yok.

### Bungalov detay

- Galeri mosaic: mobil 2 sütun, `md+` mevcut 4’lü; sabit `h-[290px]/544px]` akışkan hale gelir.
- Sticky rezervasyon: `lg+` yan sütun; mobilde mevcut drawer.
- Drawer kapatma ve ± misafir butonları touch ≥44×44 (görsel boyut aynı, hit alanı genişler).
- Drawer `top-*` değeri gerçek header yüksekliği ile hizalanır; bottom nav ile çakışmaz.

### Galeri / iletişim / kurumsal / auth

- Ortak `SiteSection` + tipografi token’ları.
- Harita/iframe: `max-width:100%`, yükseklik akışkan veya kontrollü `min()` ile.

## Görseller

| Kural | Uygulama |
|-------|----------|
| `max-width:100%`, `height:auto` | Ham `<img>` ve içerik medyası |
| `sizes` | Grid gerçek genişliğine göre düzeltilir (kartlarda `100vw` yerine uygun oran) |
| Lazy | Below-fold; hero ilk slayt hariç |
| Format | `next/image` WebP/AVIF; CMS ham URL’lerde format zorlanmaz, oran rezervasyonu yapılır |
| CLS | Medya alanlarında aspect / width-height rezervasyonu |

## Performans

- LCP: hero ilk medya öncelikli, alan rezerve.
- CLS &lt; 0.1: aspect rezervasyonu + `DeferredSection` placeholder yüksekliklerinin içerikle hizalanması.
- INP: mevcut GSAP/Embla korunur; scroll dinleyicileri `passive` kalır.
- Yeni bağımlılık yok.

## Dosya önceliği

1. `app/globals.css` — token, safe-area, touch, motion, aspect rename
2. `app/layout.tsx` — viewport doğrulama (`device-width`, `initialScale: 1`, `viewportFit: cover` korunur; değişiklik yalnızca eksik/yanlışsa)
3. `app/(site)/layout.tsx` — shell spacing, bottom chrome
4. `components/site/site-header.tsx`
5. `components/site/mobile-bottom-nav.tsx` + `cookie-consent-manager.tsx`
6. `components/site/hero-section.tsx`
7. `components/site/site-section.tsx` / `page-intro.tsx` / `site-footer.tsx`
8. `components/site/sticky-reservation-card.tsx` (+ ilgili date picker)
9. `components/site/bungalow-card.tsx` / `featured-bungalows-carousel.tsx`
10. `components/site/gallery-section.tsx` / `gallery-page-content.tsx` / `bungalow-detail-gallery.tsx` / `about-intro-section.tsx`
11. Sayfalar: `app/(site)/page.tsx`, `bungalovlarimiz/[id]/page.tsx`, `iletisim/page.tsx`, diğer public route’lar

## Test ve kabul

### Manuel viewport matrisi

320, 360, 390, 414, 480, 768, 834, 1024, 1280, 1440, 1920, 2560, 3840.

Her genişlikte kontrol:

- [ ] Yatay sayfa kaydırması yok
- [ ] İçerik kesilmiyor / üst üste binmiyor
- [ ] Header menü doğru modda (desktop tam / mobil Sheet)
- [ ] Alt sabit katmanlar içeriği örtmüyor
- [ ] Portrait + landscape okunabilir
- [ ] Çentikli cihazda safe-area

### Erişilebilirlik

- [ ] Skip link çalışır
- [ ] Klavye: header → Sheet → lightbox → form
- [ ] Odak halkası görünür
- [ ] Touch hedefleri ≥44×44
- [ ] `prefers-reduced-motion`: içerik görünür, autoplay kapalı

### Komutlar

- `npm run lint`
- `npm test`
- `npm run build`
- DevTools / Lighthouse mobil hedefi: performans skoru 90+. CMS/CDN görselleri LCP’yi düşürürse kaynak boyut/`sizes` ile optimize edilir; dış CDN kontrolü dışında kalan gecikme kabul notuna yazılır.

## Riskler ve azaltma

| Risk | Azaltma |
|------|---------|
| `clamp` tipografi “yeniden tasarım” gibi algılanır | Mevcut boyut aralıkları korunur; yalnızca akışkan geçiş |
| Ultra-wide’da boş kenarlar | Bilinçli; `max-w-7xl` marka ölçüsü korunur |
| `overflow-x-clip` sticky etkileşimi | Sticky alanlar shell içinde `min-w-0` ile test edilir |
| Cookie + bottom nav magic number | Tek `--site-bottom-chrome` token |
| Git yok | Spec dosyası yazılır; commit için `git init` kullanıcı onayı gerekir |

## Başarı tanımı

Public site 320–3840 px aralığında bozulmadan çalışır; mevcut marka görünümü korunur; kabul checklist’i geçer; lint/test/build yeşil.
