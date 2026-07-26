# CMS Tam Kapsam Tasarımı

**Tarih:** 2026-07-25  
**Durum:** Onaylandı (2026-07-25) · Uygulama Faz 1–5 tamam (2026-07-26)  
**Kapsam:** Site ziyaretçi tarafının panelden %100 yönetilebilir hale getirilmesi; sidebar IA; şema güdümlü kayıt defteri; soft-delete.

---

## 1. Amaç ve başarı kriteri

Aden website ziyaretçi tarafındaki pazarlama içeriği, sayfa SEO’su, ayarlar ve arayüz mikro-metinleri admin panelinden yönetilebilir olacak. Yeni bir sayfa/bölüm eklemek özel form yazmayı değil, kayıt defterine şema eklemeyi gerektirecek.

**Başarı kriteri**

- Ziyaretçiye görünen pazarlama içeriği ve SEO panelden değiştirilebilir.
- Arayüz mikro-metinleri (`ui-strings` sözlüğü) panelden aranıp düzenlenebilir.
- Silinen koleksiyon kayıtları panelde geri getirilebilir; veri kaybı olmaz.
- Sidebar sayfa merkezli ağaçtır; tek mega form yoktur.
- CONTENT_EDITOR / STAFF yetki kısıtları server action’larda gerçekten uygulanır.

**Kapsam dışı (bu çalışma)**

- Medya kütüphanesi (istenmiyor).
- Kullanıcı Sistemi’nin gerçek auth/hesap altyapısı (modül anahtarı iskeleti planlanır; uygulama Faz 5).
- Headless CMS’e geçiş.
- Dil / para birimi admin ekranı (zorunlu değil).

---

## 2. Kararlar özeti

| Konu | Karar |
|---|---|
| Yaklaşım | Şema güdümlü bölüm kayıt defteri (B) |
| Editör UX | Nested sidebar + her alan ayrı sayfa (tek mega form yok) |
| CMS kapsamı | Hibrit: pazarlama + SEO + ayarlar zengin editör; mikro-metinler sözlük |
| Üyelik / hesap | Modüller → Kullanıcı Sistemi (aktif/pasif); şimdi öncelik değil |
| Medya | Mevcut upload picker kalır; kütüphane yok |
| Silme | Soft-delete + Geri Dönüşüm; kalıcı silme ayrı yetki |

---

## 3. İçerik modeli ve tek kaynak

### 3.1 Kayıt defteri

Merkez: `lib/cms/registry/`.

Her sayfa burada tanımlanır: bölümler, alan şeması (ad, tip, etiket, yardım, doğrulama, varsayılan). Bu tanım tek kaynaktır:

- Zod doğrulayıcı
- TypeScript tipi
- Admin form UI
- Site okuma yardımcıları

Alan tipleri: `shortText`, `longText`, `richText`, `image`, `link`, `number`, `boolean`, `select`.

### 3.2 Depo sorumlulukları

| Depo | Sorumluluk |
|---|---|
| `data/page-content.json` | Sayfa bölümü alan değerleri (şema tipleriyle; artık sadece string olmak zorunda değil) |
| `data/cms-config.json` | Koleksiyonlar (slider, galeri, SSS, neden-aden) + menü / header-footer / SEO |
| `data/settings.json` | İşletme ve teknik ayarlar; iletişim bilgisi tek sahibi; `modules.*` |
| `data/ui-strings.json` | Arayüz mikro-metinleri (`namespace.key → string`) |
| `data/bungalovs.json` | Bungalov katalogu (soft-delete alanlarıyla) |

### 3.3 Çakışma çözümleri

1. **Hero:** Tek sahip = slider yönetimi. `page-content.ana-sayfa.hero` kaldırılır.
2. **İletişim bilgisi (telefon, e-posta, adres, WhatsApp):** Tek sahip = `settings.json`. Header, footer, iletişim sayfası buraya referans verir; kopya tutmaz.
3. **Galeri sayfa başlığı:** Kendi sayfa kaydından okunur; anasayfa `gallery` alanından değil.
4. **Kod fallback’leri:** `page.tsx`, `default-site-content.ts`, `b2c.ts` ve bileşen içi sabit yedekler şema varsayılanlarına taşınır.

---

## 4. Sidebar bilgi mimarisi

```
Sayfalar
├── Anasayfa Yönetimi
│   ├── Hero / Slider
│   ├── Hakkımızda Alanı
│   ├── Bungalovlar Alanı
│   ├── Neden Biz
│   ├── Galeri Alanı
│   ├── CTA
│   └── SSS
├── Bungalovlarımız Yönetimi
│   ├── Sayfa Başlığı
│   └── Liste Davranışı        # limit + load-more | sayfalama | infinite scroll
├── Galeri Yönetimi
│   ├── Sayfa Başlığı
│   └── Görseller
├── İletişim Yönetimi
│   ├── Sayfa İçeriği
│   └── Form Ayarları
└── Kurumsal Yönetimi
    ├── Kurumsal Ana Sayfa
    └── Yasal Sayfalar

Katalog
└── Bungalovlar

Site Geneli
├── Menüler
├── Header & Footer
├── SEO                        # global + pageSeoItems gerçek bağlama
├── Sosyal Medya
└── Arayüz Metinleri

Sistem
├── Modüller                   # Kullanıcı Sistemi aktif/pasif
├── Geri Dönüşüm               # soft-delete edilen kayıtlar
├── Ayarlar
├── Kullanıcılar
└── Aktivite
```

**Bilinçli ayrımlar**

- Anasayfa → Galeri Alanı = başlık/CTA; Galeri Yönetimi → Görseller = gerçek CRUD.
- Anasayfa → Bungalovlar Alanı = vitrin; Katalog → Bungalovlar = kayıt CRUD.
- İletişim bilgisi Ayarlar’da; İletişim Yönetimi sayfa metinlerini yönetir.

`AdminNavGroup` nested children destekleyecek şekilde genişletilir (`components/admin/admin-nav.ts`).

---

## 5. Editörler

### 5.1 Jenerik bölüm editörü

Rota: `/admin/sayfalar/[sayfa]/[bolum]`

Kayıt defterinden form üretilir. Kaydetme: tek `saveSectionAction` → kayıt defterinden zod → `mutateCms` → `page-content.json` → revalidate + audit.

Yeni metin bölümü = kayıt defterine şema yazmak.

### 5.2 Koleksiyon editörleri

Slider, Galeri öğeleri, SSS, Neden Biz: mevcut liste + detay editörleri korunur; aynı ağaca, ortak yetki/audit/soft-delete pipeline’ına bağlanır. Sıfırdan yazılmaz.

### 5.3 Arayüz Metinleri sözlüğü

Dosya: `data/ui-strings.json`  
Panel: `/admin/site/arayuz-metinleri` — aranabilir liste.

Site: `t("namespace.key")` yardımcısı.

**Sözlüğe girer:** buton etiketleri, boş durumlar, validasyon mesajları, breadcrumb, 404, bakım modu, lightbox kontrolleri vb.

**Sözlüğe girmez:** sayfaya özgü pazarlama başlıkları / CTA’lar (ilgili bölüm editöründe kalır).

### 5.4 Yazma altyapısı

`mutateCms` sarmalayıcısı tüm CMS yazmaları için:

1. Oturum + `requireCms` (her action’da)
2. Dosya kilidi (eşzamanlı last-write-wins engeli)
3. Soft-delete / restore işlemleri
4. Audit log
5. `revalidateSite`

---

## 6. Soft-delete ve Geri Dönüşüm

**Gereksinim:** Silme işlemi veri kaybına yol açmamalı; silinen içerik panelden geri getirilebilir olmalı.

### 6.1 Model

Koleksiyon kayıtlarına (slider, galeri, SSS, neden-aden, bungalov, menü öğeleri):

```ts
{
  // ...mevcut alanlar
  deletedAt: string | null   // ISO; null = aktif
  deletedBy: string | null   // admin user id
}
```

- **Sil:** `deletedAt` / `deletedBy` set edilir; kayıttan fiziksel olarak çıkarılmaz.
- **Site sorguları:** `deletedAt == null` filtreler.
- **Admin liste:** varsayılan aktifler; “Silinenleri göster” veya Geri Dönüşüm sayfası.
- **Geri yükle:** `deletedAt` / `deletedBy` temizlenir.
- **Kalıcı sil:** yalnızca SUPERADMIN (veya açık `CmsAction` yetkisi); onay diyaloğu; kayıt gerçekten kaldırılır. Bu işlem de audit’e düşer.

Sayfa bölümü alanları (CTA metni vb.) silinmez; boşaltılır / varsayılana döner. Soft-delete koleksiyon ve katalog kayıtları içindir.

### 6.2 Panel

**Sistem → Geri Dönüşüm** (`/admin/sistem/geri-donusum`):

- Tür filtresi (slider, galeri, SSS, bungalov, …)
- Silinme tarihi, silen kullanıcı
- Geri yükle / kalıcı sil aksiyonları

Mevcut hard-delete action’ları (`deleteSingleSliderAction`, `deleteSingleFaqAction`, `deleteSingleGalleryAction`, `deleteSingleWhyAdenAction`, `deleteBungalovAction` vb.) **Faz 1’de** soft-delete’e çevrilir. Menüdeki `archived` status’ü korunabilir; soft-delete ondan bağımsız “çöp kutusu” katmanıdır. Soft-delete edilen kaydın görsel URL’leri korunur; geri yüklemede içerik eksiksiz döner (medya dosyası diskte kalır).

### 6.3 Migrasyon

Mevcut kayıtlara `deletedAt: null`, `deletedBy: null` eklenir. Geçmişte hard-delete edilmiş kayıtlar geri getirilemez (zaten yok); bundan sonraki silmeler korunur.

---

## 7. Modüller — Kullanıcı Sistemi

`settings.json`:

```json
{
  "modules": {
    "userSystem": { "enabled": false }
  }
}
```

- **Pasif (varsayılan):** `/giris`, `/kayit-ol`, `/sifremi-unuttum`, `/hesabim` kapalı veya yönlendirilir; header Giriş/Hesap ve mobil “Hesabım” gizlenir.
- **Aktif:** bu yüzeyler açılır.

Bu çalışmada yalnızca anahtar + route guard iskeleti. Gerçek üyelik/hesap CMS metinleri ve altyapı **Faz 5**.

Panel: **Sistem → Modüller**.

---

## 8. SEO bağlama

`cms-config.siteManagement.pageSeoItems` bugün panelde var ama site metadata üretiminde kullanılmıyor. Her ziyaretçi route’u ilgili `pageSeoItems` kaydını okuyacak; yoksa global SEO + şema varsayılanı.

---

## 9. Uygulama fazları

| Faz | İçerik | Deploy |
|---|---|---|
| **1 — Altyapı** | Kayıt defteri, `saveSectionAction`, `mutateCms`, nested sidebar, soft-delete modeli, Geri Dönüşüm iskeleti, `ui-strings` okuma/yazma | Evet |
| **2 — Anasayfa %100** | Hero sahipliği, CTA, bölüm başlıkları, ölü hero verisi temizliği | Evet |
| **3 — Diğer sayfalar** | Bungalovlarımız (başlık + liste davranışı + frontend), Galeri başlık düzeltmesi, İletişim, Kurumsal, SEO bağlama | Evet |
| **4 — Site geneli + sözlük** | Arayüz Metinleri paneli, mikro-metin migrasyonu, iletişim bilgisi tek kaynak | Evet |
| **5 — Kullanıcı Sistemi** | Modül anahtarı + guard; sonra gerçek auth/hesap (ayrı iş paketi) | Sonra |

Her faz siteyi kırmadan deploy edilebilir.

---

## 10. Bilinçli dışarıda bırakılanlar

- Medya kütüphanesi
- Orphan upload tarayıcısı (isteğe bağlı, zorunlu değil)
- Dil / para birimi admin’i
- Hazır headless CMS
- Üyelik gerçek altyapısı (Faz 5)

---

## 11. Riskler ve azaltımlar

| Risk | Azaltım |
|---|---|
| Mevcut editörlerin kırılması | Faz 1’de mevcut ekranlar yeni omurgaya bağlanır; davranış korunur |
| Çift depo karışıklığı | Tek kaynak kuralları (Hero, iletişim, galeri başlığı) açık migrasyonla uygulanır |
| Soft-delete alanlarının unutulması | Tüm site query’leri ortak `isActiveRecord` filtresinden geçer |
| Yetki yüzeysel kalması | `mutateCms` zorunlu `requireCms`; silme/kalıcı silme ayrımı |
| Sözlük şişmesi | Yalnızca mikro-metin; pazarlama alanları bölüm editöründe |

---

## 12. Doğrulama (yüksek seviye)

- Anasayfa CTA / bölüm başlıkları panelden değişince sitede yansır.
- `/iletisim` `page-content.iletisim` okur; form konu seçenekleri panelden gelir.
- `/galeri` kendi başlığını kullanır.
- `pageSeoItems` route metadata’sını üretir.
- Silinen slayt/galeri/SSS/bungalov Geri Dönüşüm’de görünür ve geri yüklenir; sitede görünmez.
- Kalıcı silme yalnızca yetkili role açıktır.
- Kullanıcı Sistemi pasifken auth linkleri ve route’lar kapalıdır (iskelet).
)
