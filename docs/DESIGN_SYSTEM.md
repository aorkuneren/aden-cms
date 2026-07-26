# Aden CMS - Tasarım Sistemi (Design System & UI Standards)

## 1. Tasarım Prensipleri (2026 Standartları)

* **Kurumsal & Minimal**: Karmaşadan uzak, yüksek hiyerarşiye sahip, okunabilir tipografi.
* **Renk Paleti**:
  - **Ana Accent**: Emerald Green (`emerald-600` / `#059669`).
  - **Arka Plan**: Slate-50 (Aydınlık) / Neutral-950 (Karanlık).
  - **Kart & Yüzey**: Pure White / Neutral-900.
  - **Metin Hiyerarşisi**: Slate-900 / White (Başlıklar), Slate-500 / Slate-400 (İkincil metinler).
* **Dark / Light Tema**: Otomatik ve elle değiştirilebilir tema desteği.

---

## 2. Standart Bileşen Kütüphanesi

### 2.1 Tablo ve Liste Standartları (`DataTable / Cards`)
* Arama çubuğu (`Input` + `Search` ikonu).
* Filtre çipleri ve görünüm seçiciler (Izgara vs Liste).
* Durum Rozetleri (`Badge`):
  - **Aktif**: `bg-emerald-600`
  - **Pasif**: `variant="secondary"`
  - **Süper Yönetici**: `variant="outline"`

### 2.2 Modal & Onay Diyalogları (`Dialog`)
* Silme ve kritik işlemlerde açıklayıcı onay diyaloğu.
* Kaydedilmemiş değişiklik uyarısı (`unsaved changes`).
* İşlem geri bildirimleri (`SaveStatusBanner`).

### 2.3 İkonografik Standartlar (`LucideIcon`)
* Hydration hatalarını engellemek için `components/admin/lucide-icon.tsx` içerisinde statik registry kullanılmıştır.
* Yeni bir ikon eklendiğinde registry haritasına dahil edilir.
