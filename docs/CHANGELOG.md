# Aden CMS - Değişiklik Günlüğü (Changelog)

## [v2.2.0] - 2026-07-27 — SEO by Design (MVP)

### Yeni
- Merkezi polimorfik SEO deposu: `data/seo-meta.json` + `lib/seo/*` (repository/service)
- URL geçmişi ve 301: `data/url-history.json`, middleware + `/api/seo/redirect-lookup`
- Panel SEO sekmesi: SERP/sosyal önizleme, skor, karakter sayaçları (`components/admin/seo/*`)
- Bungalov yayın kilidi: aktif kayıt için meta title/description/odak kelime zorunlu
- Dinamik sitemap (slug URL’ler) ve staging `SEO_NOINDEX` / preview robots
- Backfill: `npx tsx scripts/seo-backfill.ts`
- Editör rehberi: `docs/seo-editor-guide.md`

### Spec / Plan
- `docs/superpowers/specs/2026-07-27-seo-by-design-design.md`
- `docs/superpowers/plans/2026-07-27-seo-by-design.md`

## [v2.1.0] - 2026-07-25 — Menü Yönetim Sistemi

### 🚀 Yeni Eklentiler
- **3-Panel Menü Builder (`/admin/website/menuler`)**: sol içerik seçici (Sayfalar,
  Bungalovlar, Sistem, Özel, Başlık, Dinamik — aramalı), orta hiyerarşik menü ağacı
  (tip rozeti, bozuk bağlantı uyarısı, aktif/pasif, yukarı/aşağı + indent/outdent,
  düzenle/kopyala/sil), öğe ayarları drawer'ı, taslak/yayınla, header/mobil/footer
  önizleme, kaydedilmemiş değişiklik uyarısı, onaylı grup silme.
- **7 menü öğesi türü**: `page`, `bungalow`, `system_route`, `custom_link`, `heading`,
  `dynamic_bungalow_list`, `bungalow_category`. Bağlantılar URL metnine değil kararlı
  **ID/slug/route**'a bağlanır (slug değişse de canlı URL).
- **Dinamik bungalov listesi**: kaynak (tümü/öne çıkan/en yeni) + adet + sıralama.
- **Backend çekirdeği**: `lib/site/menu-model.ts`, `menu-sources.ts`, `menu-resolver.ts`,
  `menu-tree.ts`; `lib/admin/permissions.ts` (RBAC gate).
- **Server actions**: `saveMenuGroupsAction` (yetki+doğrulama+audit),
  `setMenuGroupStatusAction` (taslak/yayın).
- **Frontend header entegrasyonu**: `app/(site)/layout.tsx` resolver kullanır
  (bozuk/pasif içerik gizlenir), legacy fallback korunur.
- **Dokümanlar**: `docs/MENU-MANAGEMENT.md`, `DATABASE-SCHEMA.md`, `API-DOCUMENTATION.md`,
  `ROLES-AND-PERMISSIONS.md`, `FRONTEND-INTEGRATION.md`.

### 🛠️ Değişti / Kaldırıldı
- `siteManagement.menuGroups` şeması geriye-uyumlu genişletildi (öğe türleri, görünürlük,
  hiyerarşi, durum, kullanıcı/tarih damgaları).
- Yayınlama yetkisi `cms.publish` ile ayrıldı (İçerik Editörü yayınlayamaz).
- Eski düz menü editörleri (`menu-editor.tsx`, `menu-groups-editor.tsx`) ve kullanılmayan
  `saveMenuItemsAction` kaldırıldı.

## [v2.0.0] - 2026-07-24

### 🚀 Yeni Eklentiler (New Features)
- **Medya Kütüphanesi (`/admin/medya`)**:
  - Sürükle-bırak (drag and drop) ve dosya seçici ile görsel/doküman yükleme.
  - Sharp kütüphanesi ile otomatik WebP ve AVIF türev üretimi.
  - Izgara (Grid) ve Liste görünüm modları.
  - Medya arama, tür filtreleme (Görsel vs Doküman), alt metin (SEO alt text) ve başlık düzenleme modalı.
  - Tek tıkla görsel URL kopyalama ve diskten güvenli silme.
- **Kullanıcı ve Rol Yönetimi (`/admin/kullanicilar`)**:
  - Yeni admin kullanıcısı ekleme modalı (bcrypt parola hash'leme).
  - Rol ataması (`SUPERADMIN`, `ADMIN`, `CONTENT_EDITOR`, `STAFF`).
  - Kullanıcı aktiflik/pasiflik durumu toggle'ı.
  - Güvenli kullanıcı silme (Kendi hesabını silmeyi engelleyen koruma).
- **Aktivite ve İşlem Logları (`/admin/aktivite`)**:
  - `lib/audit.ts` ile `data/audit-logs.json` kayıt mekanizması.
  - Arama, modül bazlı filtreleme ve detay inceleme modalı.
- **Zenginleştirilmiş Dashboard (`/admin`)**:
  - Canlı içerik metrik kartları (Bungalov, Slider, Galeri, Kullanıcılar).
  - Hızlı yönetim aksiyon barı.
  - Sistem sağlığı ve veri deposu durum indikatörleri.
  - Son 5 denetim kaydını gösteren aktivite akışı.
- **Dokümantasyon Klasörü (`docs/`)**:
  - `docs/ARCHITECTURE.md`
  - `docs/CMS_MODULES.md`
  - `docs/DESIGN_SYSTEM.md`
  - `docs/SECURITY_RBAC.md`
  - `docs/CHANGELOG.md`

### 🛠️ Düzeltmeler & İyileştirmeler (Fixes & Improvements)
- **Dikey Boşluk & Orantı Uyumlaştırması (Vertical Spacing Harmonization)**:
  - Yönetim paneli genelinde (`/admin`) orantısız ve fazla dikey boşluk oluşturan `space-y-6` ve `mb-6` değerleri `space-y-3.5` ve `mb-3` ile uyumlaştırıldı.
  - Sayfa üst başlığı (`AdminPageHeader`) alt marjini azaltıldı ve metin hiyerarşisi dengelendi.
  - Yapışkan üst işlem barları (`sticky top-14`) üst navbar ile tam hizada, boşluk bırakmayacak şekilde entegre edildi.
  - İçerik konteynerlerinin dikey iç padding (padding-top / padding-bottom) oranları optimize edildi.
- **2026 Galeri Yönetimi Revizyonu (`/admin/website/galeri` ve `/admin/website/galeri/[id]`)**:
  - **Grid Liste Sayfası (`/admin/website/galeri`)**: Galeri fotoğrafları duyarlı Grid kartları halinde listelenir. Kartlarda canlı görsel thumbnail, multi-select toplu seçim, kategori etiketi, aktiflik rozeti, büyüteç zoom modalı, sıralama tuşları ve aksiyonlar yer alır.
  - **Ayrı Sayfada Düzenleme (`/admin/website/galeri/[id]`)**: "Düzenle" veya "Yeni Görsel Ekle" butonuna tıklandığında ayrı bir özel düzenleme sayfasına yönlendirilir (`/admin/website/galeri/[id]` veya `/admin/website/galeri/yeni`).
  - **Doğrudan Medya Yükleme (`DirectMediaPicker`)**: Fotoğrafları doğrudan bilgisayardan seçerek veya sürükle-bırak yaparak yükleyebilme.
  - `saveSingleGalleryAction` ve `deleteSingleGalleryAction` audit event logging ve Next.js site revalidation entegrasyonu.
- **Slider Yönetimi Revizyonu (`/admin/website/slider` ve `/admin/website/slider/[id]`)**:
  - **Grid Liste Sayfası (`/admin/website/slider`)**: Eklenen slider'lar 3 sütunlu grid kartları halinde listelenir. Kartlarda kapak görseli/video önizlemesi, sıra numaraları, aktiflik rozetleri, hızlı yukarı/aşağı taşıma, kopyalama ve silme aksiyonları yer alır.
  - **Ayrı Sayfada Düzenleme (`/admin/website/slider/[id]`)**: "Düzenle" veya "Yeni Slayt Ekle" butonuna tıklandığında ayrı bir özel düzenleme sayfasına yönlendirilir (`/admin/website/slider/[id]` veya `/admin/website/slider/yeni`).
- **Server Actions Yükleme Sınırı Artırıldı (100MB Limit)**:
  - Video ve büyük boyutlu medya (MP4/WebM) yüklenirken oluşan `Body exceeded 1 MB limit` hatası giderildi.
  - `next.config.ts` dosyasına `experimental.serverActions.bodySizeLimit: "100mb"` yapılandırması eklenerek video ve yüksek çözünürlüklü medya yüklemeleri 100MB'a kadar desteklendi.
- **2026 Neden Aden (Avantaj Kartları) Revizyonu (`/admin/website/neden-aden` ve `/admin/website/neden-aden/[id]`)**:
  - **Ultra-Minimal Satır Liste Sayfası (`/admin/website/neden-aden`)**: Eklenen avantaj kartları kompakt, yüksekliği az, şık ve minimal yatay satır görünümünde (Ultra-Minimal Row List View) sunulur. Satırlarda 32px ikon/görsel badge, `#1`, `#2` sıra numaraları, başlık, kısa açıklama, kompakt yayın rozeti ve mikro aksiyon butonları yer alır.
  - **Ayrı Sayfada Düzenleme (`/admin/website/neden-aden/[id]`)**: "Düzenle" veya "Yeni Özellik Ekle" butonuna tıklandığında ayrı bir özel düzenleme sayfasına yönlendirilir (`/admin/website/neden-aden/[id]` veya `/admin/website/neden-aden/yeni`).
  - **Görsel İkon Seçici (Interactive Icon Picker)**: `Sparkles`, `Waves`, `ShieldCheck`, `Flame`, `Wifi`, `Trees`, `Heart`, `MapPin`, `Car`, `Coffee`, `Lock`, `Award`, `Smile`, `Star`, `Sun` gibi popüler tesis ikonlarını tek tıkla seçebilme veya özel Lucide ikonu belirleyebilme.
  - **Doğrudan Görsel Yükleyici (`DirectMediaPicker`)**: Kart bazında özel fotoğraf yükleme veya URL girme.
  - `saveSingleWhyAdenAction` ve `deleteSingleWhyAdenAction` audit event logging ve Next.js site revalidation entegrasyonu.
- **2026 SSS (Sıkça Sorulan Sorular) Revizyonu (`/admin/website/sss` ve `/admin/website/sss/[id]`)**:
  - **Ultra-Minimal Satır Liste Sayfası (`/admin/website/sss`)**: Eklenen SSS soruları yüksekliği az, kompakt, şık ve minimal yatay satır görünümünde (Ultra-Minimal Row List View) sunulur. Satırlarda `#1`, `#2` sıra numaraları, soru başlığı, cevap özeti, kategori etiketi, öne çıkan yıldız rozeti, aktiflik rozeti, hızlı sıralama, kopyalama ve silme aksiyonları yer alır.
  - **Ayrı Sayfada Düzenleme (`/admin/website/sss/[id]`)**: "Düzenle" veya "Yeni Soru Ekle" butonuna tıklandığında ayrı bir özel düzenleme sayfasına yönlendirilir (`/admin/website/sss/[id]` veya `/admin/website/sss/yeni`).
  - **Kategori & Şablon Desteği**: Soruları `Genel`, `Rezervasyon & Ödeme`, `Giriş & Çıkış`, `Bungalov Özellikleri`, `Ev Kuralları & İptal` kategorilerine ayırma, kategorilere göre filtreleme ve hazır soru şablonları ekleme.
  - `saveSingleFaqAction` ve `deleteSingleFaqAction` audit event logging ve Next.js site revalidation entegrasyonu.
- **Bungalov Ekle & Düzenle Revizyonu (`/admin/bungalovlar/[id]`)**:
  - 2026 UI Standartlarında sekmeli (Tabs) form mimarisi: **1. Genel & Fiyat**, **2. Görseller & Galeri**, **3. Detay & Özellikler**, **4. Kurallar & Çevre**, **5. SEO & Google Önizleme**.
  - Otomatik URL slug üretici (`slugify`).
  - Kategori bazlı donanım ve özellik seçicileri (Genel, Mutfak, Mobilya, Banyo, Bahçe) hazır öneri çipleri ve özel etiket ekleyici.
  - Medya Kütüphanesi entegrasyonu ve canlı kapak/galeri görsel önizlemeleri.
  - Ev Kuralları ve Çevredeki Gezilecek Yerler için interaktif çip kartları.
  - **Google Arama Sonucu Canlı Önizleme Kartı (Snippet Simulation)**.
  - Sabit (sticky) aksiyon barı, değişen içerik takibi (`isDirty`) ve audit logging entegrasyonu.
- **Bungalov Liste Revizyonu (`/admin/bungalovlar`)**:
  - Izgara (Grid) ve Liste görünüm modları.
  - Durum bazlı (Aktif/Pasif/Tümü) ve isimle arama filtrelemesi.
  - Dialog onaylı güvenli silme işlemi.
