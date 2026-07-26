# Public Site Mobile-First Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ziyaretçi sitesini 320–3840 px aralığında, mevcut tasarım dilini bozmadan, token + shell merkezli mobile-first responsive mimariye taşımak.

**Architecture:** Önce `globals.css` içinde fluid tipografi, safe-area, bottom-chrome ve touch token’ları kurulur; ardından site shell (layout, header, bottom nav, cookie) bu token’lara bağlanır; son olarak hero, kart, galeri, detay ve diğer public sayfa bileşenlerindeki sabit `px`/yükseklik kırılmaları akışkan birimlere çevrilir. Admin paneline dokunulmaz.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, mevcut Radix Sheet/Dialog, `next/image`, Vitest (node). Yeni kütüphane yok.

**Spec:** `docs/superpowers/specs/2026-07-26-public-site-responsive-design.md`

## Global Constraints

- Yalnızca ziyaretçi sitesi: `app/(site)/**`, `components/site/**`, `app/globals.css`, `app/layout.tsx`.
- Mevcut tasarım dili, marka renkleri (`#f6f3ee`, `#1f3a2e`, `#18261e`) ve içerik hiyerarşisi korunur.
- Yeni harici kütüphane eklenmez.
- Mobile-first: base mobil, `min-width` ile yukarı.
- Container marka genişliği `max-w-7xl` korunur; ultra-wide’da içerik şişirilmez.
- Viewport: `width=device-width, initial-scale=1` korunur (`maximumScale: 5`, `viewportFit: cover` kalır).
- Touch hedefleri minimum 44×44 px (görsel boyut aynı kalabilir, hit alanı genişler).
- Yatay sayfa kaydırması hiçbir çözünürlükte olmamalı.
- `prefers-reduced-motion` ve mevcut `:focus-visible` gerilemez.
- Commit yalnızca kullanıcı istediğinde; bu klasör şu an git deposu değil.

---

## File Map

| Dosya | Sorumluluk |
|-------|------------|
| `app/globals.css` | Token’lar, safe-area helpers, bottom-chrome, aspect rename, reduced-motion autoplay hook |
| `app/layout.tsx` | Viewport doğrulama (değişiklik yalnızca gerekirse) |
| `app/(site)/layout.tsx` | Shell overflow, main/content alt boşluk token’ı |
| `components/site/site-section.tsx` | Ortak container + akışkan yatay padding |
| `components/site/site-header.tsx` | Nav breakpoint, logo max-width, safe-area top, Sheet touch |
| `components/site/mobile-bottom-nav.tsx` | Bottom chrome + safe-area |
| `components/site/cookie-consent-manager.tsx` | Magic `bottom-[5.45rem]` → token |
| `components/site/hero-section.tsx` | Fluid tipografi, focus, reduced-motion autoplay, alt chrome offset |
| `components/site/bungalow-card.tsx` | Showcase yükseklik → aspect/min-h |
| `components/site/bungalow-detail-gallery.tsx` | Mosaic yükseklikleri akışkan |
| `components/site/sticky-reservation-card.tsx` | Drawer top/bottom hizası, touch 44px |
| `components/site/about-intro-section.tsx` | Collage; mobilde taşma yok |
| `app/(site)/page.tsx` | CTA img yükseklikleri, pb token |
| `app/(site)/bungalovlarimiz/[id]/page.tsx` | pb token, grid min-w-0 |
| `app/(site)/iletisim/page.tsx` | iframe max-width / akışkan yükseklik |
| Diğer public sayfalar | `pb-*` tutarlılığı (`auth-shell`, `legal-page-layout`, listing) |

---

### Task 1: Responsive token katmanı (`globals.css`)

**Files:**
- Modify: `app/globals.css`
- Test: manuel (DevTools) + `npm run lint`

**Interfaces:**
- Consumes: mevcut `@layer utilities` (`.touch-target`, `.pb-safe`)
- Produces: CSS custom properties `--site-bottom-chrome`, `--site-gutter-x`, safe-area helpers (`.pt-safe`, `.px-safe`, `.pb-safe` güçlendirilmiş), `.site-media` (max-width/height auto), `.aspect-card-3-2` (eski `.aspect-square` oranını koruyan yeniden adlandırma), `.text-hero` clamp utility (opsiyonel class veya dokümante edilmiş clamp değeri)

- [ ] **Step 1: Mevcut yardımcıları oku**

`app/globals.css` içinde `/* ─── Mobile-First & WCAG` bloğunu aç. `.touch-target`, `.pb-safe`, `:focus-visible`, `prefers-reduced-motion` satırlarını değiştirmeden genişlet.

- [ ] **Step 2: Token’ları `:root` altına ekle**

```css
:root {
  --site-gutter-x: clamp(0.75rem, 4vw, 1.5rem);
  /* bottom nav ~56px + py + safe-area; cookie ofseti bunu kullanır */
  --site-bottom-chrome: calc(4.25rem + env(safe-area-inset-bottom, 0px));
  --site-header-safe-top: env(safe-area-inset-top, 0px);
}
```

- [ ] **Step 3: Safe-area ve media utility’lerini ekle**

```css
@layer utilities {
  .pt-safe {
    padding-top: max(0px, env(safe-area-inset-top, 0px));
  }
  .px-safe {
    padding-left: max(0px, env(safe-area-inset-left, 0px));
    padding-right: max(0px, env(safe-area-inset-right, 0px));
  }
  .pb-safe {
    padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
  }
  .site-media {
    max-width: 100%;
    height: auto;
  }
  .aspect-card-3-2 {
    aspect-ratio: 1.5 / 1;
  }
}
```

Eski `.aspect-square { aspect-ratio: 1.5 / 1 }` bloğunu kaldır; projede `aspect-square` class kullanımını ara (`rg "aspect-square" app components`) ve `aspect-card-3-2` ile değiştir (görsel oran aynı kalır).

- [ ] **Step 4: Body tipografi tabanı**

`@layer base` body kuralına `font-size: 1rem;` ve `line-height: 1.5;` ekle (mobil minimum 16px). Marka font stack’i değiştirme.

- [ ] **Step 5: Doğrula**

Run: `npm run lint`  
Expected: yeni hata yok.  
Manuel: DevTools’ta 320 px — body computed font-size ≥ 16px.

---

### Task 2: Shell — layout, SiteSection, bottom chrome

**Files:**
- Modify: `app/(site)/layout.tsx`
- Modify: `components/site/site-section.tsx`
- Modify: `components/site/mobile-bottom-nav.tsx`
- Modify: `components/site/cookie-consent-manager.tsx`
- Modify: `components/site/legal-page-layout.tsx` (pb)
- Modify: `components/site/auth/auth-shell.tsx` (pb)
- Modify: `app/(site)/page.tsx` (kök `pb-24 md:pb-0`)
- Modify: `app/(site)/bungalovlarimiz/[id]/page.tsx` (`pb-28`)

**Interfaces:**
- Consumes: `--site-bottom-chrome`, `--site-gutter-x`, `.px-safe`, `.pb-safe`
- Produces: tutarlı alt içerik boşluğu; cookie `bottom` ofseti token üzerinden

- [ ] **Step 1: SiteSection gutter**

`components/site/site-section.tsx` içinde sabit `px-4 sm:px-6` yerine:

```tsx
className={cn("mx-auto w-full max-w-7xl px-[var(--site-gutter-x)]", className)}
```

(Görsel olarak 16–24 px aralığı korunur.)

- [ ] **Step 2: MobileBottomNav safe-area yan**

`mobile-bottom-nav.tsx` nav class’ına `px-safe` ekle; `pb-safe` kalsın. `z-50` ve `md:hidden` korunur.

- [ ] **Step 3: Cookie banner magic number kaldır**

`cookie-consent-manager.tsx` satır ~83:

```tsx
className="fixed inset-x-0 bottom-[var(--site-bottom-chrome)] z-[70] ... md:bottom-0 ..."
```

`bottom-[5.45rem]` tamamen silinsin.

- [ ] **Step 4: Sayfa alt boşluklarını hizala**

Mobilde bottom nav varken içerik için ortak pattern:

```tsx
className="... pb-[calc(var(--site-bottom-chrome)+1rem)] md:pb-12"
```

Uygula:
- `app/(site)/page.tsx` kök div (`pb-24 md:pb-0` → token; `md:pb-0` kalabilir)
- `bungalovlarimiz/[id]/page.tsx` (`pb-28` → token)
- `legal-page-layout.tsx`, `auth-shell.tsx`

- [ ] **Step 5: Doğrula**

Manuel 390 px: ana sayfa, detay, auth — son CTA/footer bottom nav altında kalmamalı; cookie açıkken banner nav’ın üstünde, üst üste binmemeli.  
Run: `npm run lint`

---

### Task 3: Header responsive ve safe-area

**Files:**
- Modify: `components/site/site-header.tsx`

**Interfaces:**
- Consumes: `.pt-safe`, `.px-safe`, `.touch-target`, `--site-gutter-x`
- Produces: dar ekranda taşmayan logo/top bar; `lg+` tam menü; mobil Sheet

- [ ] **Step 1: Header dış sarmalayıcıya safe-area**

Ana `<header>` class’ına `pt-safe` ekle (fixed home header çentik altına girmez).

- [ ] **Step 2: İç container gutter**

Top bar ve ana bar içindeki `px-4 sm:px-6` → `px-[var(--site-gutter-x)]` (iki yer: ~237 ve ~424).

- [ ] **Step 3: Logo dar ekran**

Logo img `max-w-[220px]` → `max-w-[min(220px,55vw)]` (veya `max-w-[55vw] sm:max-w-[220px]`). Oran `h-full w-auto object-contain` kalsın.

- [ ] **Step 4: Top header 320 px**

Sol items satırında `min-w-0` zaten var; her item text’e `max-w-[40vw] sm:max-w-none` truncate koru. Sağ dil/para butonları `h-8` → touch için `min-h-11 min-w-11` hit alanı (görsel padding artırılabilir; stil aynı pill kalsın).

- [ ] **Step 5: Sheet menü link touch**

Mobil menü link class’ına `min-h-11` ekle (`py-2` yetmeyebilir). Sheet `w-[88vw]` kalsın; `pb-safe` SheetContent altına ekle.

- [ ] **Step 6: Doğrula**

Manuel: 320 / 768 / 1024 / 1440 — 1024+ tam nav, &lt;1024 hamburger veya mevcut md/lg ayrımı korunur. Yatay taşma yok. Landscape iPhone simülasyonu: header çentik altında değil.

---

### Task 4: Hero — fluid tipografi, focus, motion

**Files:**
- Modify: `components/site/hero-section.tsx`

**Interfaces:**
- Consumes: `--site-gutter-x`, `--site-bottom-chrome`, reduced-motion media
- Produces: 320 px’de kesilmeyen başlık; erişilebilir slayt noktaları; reduced-motion’da autoplay kapalı

- [ ] **Step 1: Autoplay reduced-motion**

`useEffect` autoplay bloğunun başına:

```ts
const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
if (prefersReduced) return
```

- [ ] **Step 2: Başlık clamp**

`h1` class:

```tsx
className="text-[clamp(1.75rem,4vw+1rem,3.7rem)] font-semibold leading-[1.03] tracking-[-0.025em] text-white"
```

Sabit `text-[2.35rem] sm:text-[3.05rem] md:text-[3.7rem]` kaldırılır. Görsel aralık aynı.

- [ ] **Step 3: İçerik offset**

Hero iç container: `px-[var(--site-gutter-x)]`. Alt padding mobilde bottom chrome’u hesaba katsın:

```tsx
pb-[calc(var(--site-bottom-chrome)+1.5rem)] md:pb-32
```

(Üst `pt-32` / header boşluğu korunur; gerekirse `sm:pt-36` kalır.)

- [ ] **Step 4: Aspect korunarak akışkan yükseklik**

Mevcut:
`aspect-[9/16] sm:aspect-[16/9] lg:aspect-auto lg:h-[min(100svh,56.25vw)]`  
Korunur; 320 px’de `max-h-[100svh]` ekle ki uzun portrait hero ekranı kilitlemesin:

```tsx
className="relative isolate w-full overflow-hidden aspect-[9/16] max-h-[100svh] sm:aspect-[16/9] sm:max-h-none lg:aspect-auto lg:h-[min(100svh,56.25vw)]"
```

- [ ] **Step 5: Focus ring**

Slayt nokta butonundan `focus-visible:outline-none` kaldır. Global `:focus-visible` devreye girsin. `touch-target` kalsın.

- [ ] **Step 6: Doğrula**

320 / 390 / 768 / 1440: başlık taşmıyor, CTA tıklanabilir, noktalar klavye ile odaklanıyor. Reduced-motion açıkken slayt otomatik değişmiyor; içerik görünür (`data-hero-animated` / FOUC kuralları bozulmamalı).

---

### Task 5: Kartlar ve ana sayfa CTA / about

**Files:**
- Modify: `components/site/bungalow-card.tsx`
- Modify: `components/site/about-intro-section.tsx`
- Modify: `app/(site)/page.tsx` (CTA `<img>` yükseklikleri)
- Modify: `components/site/featured-bungalows-carousel.tsx` (sizes kontrolü)

**Interfaces:**
- Consumes: `.site-media`, aspect helpers
- Produces: sabit yükseklik kırılmalarının akışkan karşılıkları

- [ ] **Step 1: Showcase kart**

`bungalow-card.tsx` showcase `CardContent`:

```tsx
className="relative flex min-h-[340px] aspect-[4/5] sm:min-h-[360px] sm:aspect-auto sm:h-[360px] flex-col justify-between p-4"
```

Görsel alan zaten `absolute inset-0`; kart oranı bozulmadan dar ekranda sıkışmayı önler. Default variant `h-56` kalabilir veya `aspect-[16/10] h-auto min-h-56` yapılır.

- [ ] **Step 2: Image sizes**

Default card Image `sizes="(max-width: 768px) 100vw, 33vw"` kontrol et; showcase `(max-width: 768px) 100vw, 50vw` kalsın. Featured carousel içindeki Image `sizes` gerçek slide genişliğine uyumlu olsun.

- [ ] **Step 3: CTA img (ana sayfa)**

`app/(site)/page.tsx` CTA görselleri:

```tsx
className="site-media h-auto w-full aspect-[3/4] object-cover sm:aspect-[3/4] lg:aspect-[3/4]"
```

Sabit `h-[290px] sm:h-[340px] lg:h-[380px]` ve ikinci görsel `h-[150px]...` kaldırılır; ikinci görsel için `aspect-[16/10]` kullan. `loading="lazy"` `decoding="async"` kalsın.

- [ ] **Step 4: About collage**

Masaüstü `h-[470px]` absolute collage korunur (`hidden md:block`). Mobil grid’de img’lere `site-media` + `w-full object-cover` doğrula; yatay taşma yok.

- [ ] **Step 5: Doğrula**

Ana sayfa 320–1440: about, featured, CTA — üst üste binme / yatay scroll yok. Hover marquee kart içinde kalır.

---

### Task 6: Detay galeri + sticky rezervasyon drawer

**Files:**
- Modify: `components/site/bungalow-detail-gallery.tsx`
- Modify: `components/site/sticky-reservation-card.tsx`
- Modify: `app/(site)/bungalovlarimiz/[id]/page.tsx`

**Interfaces:**
- Consumes: `--site-bottom-chrome`, touch-target
- Produces: akışkan mosaic; drawer header/bottom nav ile çakışmaz

- [ ] **Step 1: Mosaic yükseklikleri**

`bungalow-detail-gallery.tsx` img class:

```tsx
slotIndex === 0
  ? "aspect-[4/3] h-auto w-full object-cover md:aspect-auto md:h-[min(544px,50vw)]"
  : "aspect-[4/3] h-auto w-full object-cover md:aspect-auto md:h-[min(268px,25vw)]"
```

Grid yapısı (`grid-cols-2 md:grid-cols-4`) korunur.

- [ ] **Step 2: Drawer dikey hiza**

`sticky-reservation-card.tsx` panel:

```tsx
className={cn(
  "fixed inset-x-0 bottom-0 z-50 w-full ... top-[calc(4rem+env(safe-area-inset-top,0px))] sm:top-[calc(5rem+env(safe-area-inset-top,0px))]",
  ...
)}
```

İçerik alanı `pb-[var(--site-bottom-chrome)]` veya `pb-safe` alsın ki mobilde son buton bottom nav altında kalmasın (`md:` üstünde bottom nav yok).

- [ ] **Step 3: Touch hedefleri**

Kapat butonu `h-9 w-9` → `touch-target h-11 w-11`. Misafir ± butonları `h-9 w-9` → `h-11 w-11` (veya `touch-target`).

- [ ] **Step 4: Detail sayfa grid**

`bungalovlarimiz/[id]/page.tsx` article zaten `min-w-0`; aside sticky `lg:top-24` kalsın. Kök pb Task 2’deki token ile uyumlu olsun.

- [ ] **Step 5: Doğrula**

Detay 320 / 390 landscape / 1024 / 1440: galeri bozulmuyor; drawer açılınca kaydırılabilir; WhatsApp CTA görünür; lightbox thumbs `overflow-x-auto` bilinçli yatay kaydırma (sayfa değil).

---

### Task 7: İletişim, galeri sayfası, footer gutter tutarlılığı

**Files:**
- Modify: `app/(site)/iletisim/page.tsx`
- Modify: `components/site/site-footer.tsx` (gutter)
- Modify: `components/site/gallery-page-content.tsx` / `gallery-section.tsx` (sizes / overflow kontrol)
- Modify: `components/site/page-intro.tsx` (gerekirse clamp başlık)

**Interfaces:**
- Consumes: `--site-gutter-x`, `.site-media`
- Produces: public rotalarda tutarlı yatay boşluk; iframe taşmaz

- [ ] **Step 1: İletişim haritası**

iframe sarmalayıcıya `w-full overflow-hidden`; iframe:

```tsx
className="block h-[min(430px,70vw)] w-full max-w-full border-0"
```

- [ ] **Step 2: Footer gutter**

`site-footer.tsx` `px-4 sm:px-6` → `px-[var(--site-gutter-x)]`.

- [ ] **Step 3: Galeri lightbox kontrolleri**

Zaten `h-11 w-11`; dokunma OK. Grid img’lerde `max-w-full` / object-cover doğrula.

- [ ] **Step 4: PageIntro**

Uzun CMS başlıkları için `text-3xl md:text-4xl lg:text-5xl` → isteğe bağlı clamp:

```tsx
text-[clamp(1.75rem,2vw+1rem,3rem)]
```

Marka Playfair heading class’ları korunur.

- [ ] **Step 5: Doğrula**

`/iletisim`, `/galeri`, `/kurumsal`, `/giris` — 320 ve 1920’de yatay scroll yok.

---

### Task 8: Son doğrulama checklist

**Files:** yok (doğrulama)

- [ ] **Step 1: Otomatik kontroller**

```bash
npm run lint
npm test
npm run build
```

Expected: hepsi geçsin.

- [ ] **Step 2: Viewport matrisi (DevTools)**

320, 360, 390, 414, 480, 768, 834, 1024, 1280, 1440, 1920, 2560, 3840:

- [ ] Yatay sayfa kaydırması yok
- [ ] Header doğru mod
- [ ] Bottom nav + cookie çakışması yok
- [ ] Hero / listing / detail / contact OK

- [ ] **Step 3: A11y + motion**

- [ ] Skip link
- [ ] Klavye Sheet + lightbox + form
- [ ] Focus ring görünür (hero dots dahil)
- [ ] Reduced-motion: autoplay kapalı, içerik görünür

- [ ] **Step 4: Spec durumu güncelle**

`docs/superpowers/specs/2026-07-26-public-site-responsive-design.md` içinde **Durum:** `Uygulandı` veya `Uygulama tamamlandı — manuel cihaz onayı bekleniyor` yap.

- [ ] **Step 5: Kullanıcıya özet**

Uygulanan strateji, breakpoint değişiklik listesi ve test checklist’ini kullanıcı çıktı formatında sun.

---

## Spec coverage (self-review)

| Spec gereksinimi | Task |
|------------------|------|
| Token + shell yaklaşımı | 1–2 |
| Breakpoint matrisi / Tailwind eşlemesi | 3–7 (min-width utilities) |
| Viewport meta | mevcut; Task 1/layout doğrulama |
| Fluid tipografi clamp / 16px body | 1, 4, 7 |
| Safe-area | 1–3, 6 |
| Hamburger / desktop menü | 3 |
| Görseller max-width / sizes / lazy | 4–7 |
| Touch 44×44 | 3, 4, 6 |
| Yatay taşma yok | 2–7 + 8 |
| Bottom chrome tutarlılığı | 2 |
| Reduced-motion / focus | 1, 4 |
| Admin hariç | Global Constraints |
| Yeni lib yok | Global Constraints |
| 320–3840 kabul | Task 8 |

**Placeholder scan:** TBD/TODO yok.  
**Commit adımları:** Bilinçli olarak yok (git deposu yok; kullanıcı istemeden commit yok).
