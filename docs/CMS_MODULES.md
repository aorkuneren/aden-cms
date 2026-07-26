# Aden CMS - Modül ve Bilgi Mimarisi Dokümanı (CMS Modules)

## 1. Modül Haritası

Aden CMS aşağıdaki modüllerden oluşur:

| Modül Grubu | Modül Adı | Route | İşlev & Açıklama |
| :--- | :--- | :--- | :--- |
| **Genel** | Dashboard | `/admin` | Genel istatistikler, hızlı aksiyonlar, sistem sağlığı ve son aktivite akışı |
| **Website İçeriği** | Slider Yönetimi | `/admin/website/slider` | Anasayfa hero slider görselleri, başlıkları ve sıralaması |
| | Hakkımızda | `/admin/website/hakkimizda` | Anasayfa Hakkımızda metinleri, 4 görsel ve buton görünürlüğü |
| | Anasayfa Bungalovlar | `/admin/website/bungalovlar` | Vitrin metinleri ve carousel ayarları (adet, otomatik kaydırma) |
| | Galeri Yönetimi | `/admin/website/galeri` | Fotoğraf galerisi ve kategori koleksiyonları |
| | Sıkça Sorulan Sorular | `/admin/website/sss` | SSS soru ve cevap listesi |
| | Neden Aden | `/admin/website/neden-aden` | Tesis özellikleri ve avantaj kartları |
| | Menüler | `/admin/website/menuler` | Header ve footer menü grupları |
| | Header & Footer | `/admin/website/header-footer` | Üst ve alt bilgi alanı ayarları, logo bağlantıları |
| | SEO Yönetimi | `/admin/website/seo` | Sayfa bazlı title, meta description ve keywords ayarları |
| | Sosyal Medya | `/admin/website/sosyal` | Instagram, Facebook vb. sosyal profil bağlantıları |
| **Katalog** | Bungalovlar | `/admin/bungalovlar` | Bungalov konaklama birimleri listesi, ekleme ve düzenleme (görseller `uploads/bungalov/{id}/` altına yüklenir) |
| **Yönetim & Güvenlik** | Kullanıcılar | `/admin/kullanicilar` | Yönetici hesapları, rol atama (SUPERADMIN, ADMIN, CONTENT_EDITOR, STAFF), aktiflik durumu |
| | Aktivite Logları | `/admin/aktivite` | Sistemde yapılan tüm denetim izleri (Audit Logs) ve arama |
| **Sistem** | Yasal Metinler | `/admin/yasal` | KVKK, İptal Politikası, Çerez Politikası metinleri |
| | Ayarlar | `/admin/ayarlar` | Firma bilgileri, rezervasyon kuralları ve sistem parametreleri |

---

## 2. İçerik Yayın ve Onay Akışı

1. **Taslak / Oluşturma**: Editörler veya yöneticiler içeriği hazırlayıp kaydeder.
2. **Atomik Güncelleme**: Kaydedilen içerik doğrudan ilgili `data/*.json` dosyasına yazılır ve `revalidateSite()` çağrılır.
3. **Denetim İzi (Audit Logging)**: Tüm değişiklik yapan admin adı, IP adresi ve işlem zamanı `data/audit-logs.json` dosyasına işlenir.
