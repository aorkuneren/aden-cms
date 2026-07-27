# Menü Yönetim Sistemi

Aden Bungalov yönetim panelindeki **Menüler** modülünün teknik dokümantasyonu.

## Amaç

Yönetim panelinden oluşturulan menüler, web sitesine **dinamik** olarak yansır.
Menüler frontend'de statik kodlanmaz; site header/footer/mobil navigasyon, kaydedilen
menü gruplarını çalışma anında okur.

## Mimari notu (önemli)

Bu proje **MySQL tabanlı bir CMS**'tir (`lib/cms/store.ts` → `cms_documents` +
`menu_groups` / `menu_items`). Şartnamedeki SQL tabloları, **`cms-config` belgesi
→ `siteManagement.menuGroups`** JSON şekliyle senkron tutulur.
Alan adları şartnameyle birebir eşleşir (JSON'da camelCase). Migration yerine
**geriye-uyumlu şema evrimi** kullanılır: eski `{text, href, isActive}` öğeleri
`custom_link` olarak çözümlenir.

Ayrıntılı şema: [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md).

## Menü grupları

Her grup bir `location` (HEADER/MOBILE/FOOTER/TOP/OTHER) ve benzersiz `key`
(örn. `main-menu`, `footer-menu`) taşır. Frontend gruba **id**, **key** veya
**type** ile erişebilir.

Alanlar: `id`, `key`, `title`, `location`, `description`, `status`
(`draft|published|passive|archived`), `isActive`, `items[]`, `createdBy`,
`updatedBy`, `createdAt`, `updatedAt`, `publishedAt`.

- **Sistem anahtarı benzersizdir** (kaydederken doğrulanır).
- Grup silinmeden önce panelde **içindeki öğe sayısı** ve geri alınamazlık uyarısı gösterilir.

## Menü öğesi türleri (`itemType`)

| Tür | Kaynak | Bağlama |
|-----|--------|---------|
| `page` | Kurumsal/CMS sayfası | `referenceId` = slug |
| `bungalow` | `bungalovs.json` kaydı | `referenceId` = id |
| `system_route` | Uygulama route'u | `routeName` (bkz. `SYSTEM_ROUTES`) |
| `custom_link` | Serbest URL | `url` (güvenlik doğrulaması) |
| `heading` | Tıklanamaz başlık | — (yalnızca alt menü gruplama) |
| `dynamic_bungalow_list` | Otomatik bungalov listesi | `dynamicSettings` |
| `bungalow_category` | (bu projede kategori taksonomisi yok) | dinamik listeye eşlenir |

**Kritik iş kuralı:** Sayfa/bungalov bağlantısı URL metnine değil, kararlı
**ID/slug/route** değerine bağlanır. İçeriğin slug'ı değişse bile menü canlı URL'i
otomatik kullanır (`lib/site/menu-resolver.ts`).

## Dinamik bungalov listesi

`dynamicSettings = { source, limit, sort }`
- `source`: `all_active | all_published | featured | newest`
- `limit`: 1–50
- `sort`: `manual | name | price | created`

Yeni bir bungalov eklendiğinde ve kriterleri karşıladığında menüye **otomatik**
dahil olur (resolver render anında çalıştırır).

## Menü öğesi ayarları

Görünen başlık, kaynak ID, özel URL, route adı, ikon, açıklama, CSS sınıfı,
hedef (`SELF/BLANK`), `nofollow`, aktif/pasif, masaüstü/mobil görünürlük,
misafir/üye görünürlük, vurgu, **buton görünümü** (`displayStyle`:
`link | primary_button | secondary_button | highlight`).

## Hiyerarşi ve sıralama

- Maksimum derinlik **3 seviye** (`MAX_MENU_DEPTH`).
- Öğeler `children[]` ile iç içe tutulur (parent-child).
- UI'de: yukarı/aşağı taşıma + **indent/outdent** (alt menü yapma / üst seviyeye
  çıkarma). Ağaç yapısı gereği **döngüsel ilişki imkânsızdır** (bir düğüm kendi
  alt ağacına taşınamaz).
- Sıralama, kullanıcı **Kaydet** dediğinde toplu (atomik dosya yazımı) kaydedilir —
  her hareket için ayrı istek gönderilmez.

## Taslak / yayınlama

Durumlar: `draft`, `published`, `passive`, `archived`.
- **Taslak Kaydet**: öğeleri yazar (durumu değiştirmez) — `cms.update` yetkisi.
- **Yayınla**: önce kaydeder, sonra durumu `published` yapar — `cms.publish` yetkisi.
- Yalnızca `published` + `isActive` gruplar frontend'de görünür.

## Bozuk bağlantı kontrolü

Panelde her öğe, bağlı içeriğe göre kontrol edilir; sorunluysa kırmızı uyarı gösterilir
(“Sayfa bulunamadı”, “Bungalov pasif”, “Route yok”). Frontend, bozuk/pasif/silinmiş
içeriğe giden bağlantıları **hiç göstermez** (resolver filtreler).

## Frontend entegrasyonu

Bkz. [FRONTEND-INTEGRATION.md](./FRONTEND-INTEGRATION.md). Özet:
- Header: seçili grup (`headerManagement.menuGroupId`/`menuType`) veya `main-menu` anahtarı.
- Resolver, React `cache` ile istek başına tek okuma yapar; içerik değişince
  `revalidatePath("/", "layout")` ile önbellek temizlenir.

## Yeni bir menü türü ekleme

1. `lib/site/menu-model.ts` → `MenuItemType` ve `MENU_ITEM_TYPE_LABELS`'a ekle.
2. `lib/site/menu-resolver.ts` → `resolveItem` içine URL çözümünü ekle.
3. `lib/site/menu-sources.ts` → gerekiyorsa kaynak listeleyici ekle.
4. `components/admin/website/menu-builder.tsx` → sol panel seçicisine ekleme aksiyonu ekle.
5. `app/admin/(panel)/website/actions.ts` → `menuItemTypeEnum` zaten `MENU_ITEM_TYPES`'tan beslenir.
