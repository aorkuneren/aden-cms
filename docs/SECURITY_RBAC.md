# Aden CMS - Güvenlik ve Yetkilendirme Dokümanı (Security & RBAC)

## 1. Güvenlik Politikaları

### 1.1 Kimlik Doğrulama (Authentication)
* Oturumlar `aden_admin` adlı `httpOnly`, `sameSite=lax` cookie ile saklanır.
* Cookie payload'ı `AUTH_SECRET` ile HMAC-SHA256 imzalanır.
* 12 saatlik otomatik zaman aşımı uygulanır.

### 1.2 Parola Güvenliği
* Tüm kullanıcı parolaları `bcryptjs` algoritması ile tuzlanarak hash'lenir (10 salt round).
* Düz metin (plain-text) parola hiçbir yerde saklanmaz veya loglanmaz.

---

## 2. Rol ve İzin Matrisi (RBAC)

Sistemde aşağıdaki yetki dereceleri tanımlıdır:

| Rol | Rol Tanımı | Yetki Kapsamı |
| :--- | :--- | :--- |
| `SUPERADMIN` | Süper Yönetici | Tüm sistem, kullanıcı yönetimi, içerik, medya ve ayarlar (Sınırsız) |
| `ADMIN` | Firma Yöneticisi | İçerik, katalog, medya, ayarlar ve raporlama yetkileri |
| `CONTENT_EDITOR` | İçerik Editörü | Slider, Galeri, SSS ve Neden Aden yönetimi |
| `STAFF` | Personel | Salt-okunur dashboard ve temel içerik görüntüleme |

---

## 3. Denetim İzi (Audit Logging)

Sistemdeki tüm kritik eylemler (Kullanıcı oluşturma/silme, medya yükleme/silme, içerik güncelleme vb.) `lib/audit.ts` aracılığıyla `data/audit-logs.json` dosyasına kaydedilir ve `/admin/aktivite` ekranından izlenebilir.
