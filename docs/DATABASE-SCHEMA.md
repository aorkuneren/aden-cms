# Veri Şeması — Menü Sistemi

> **Not:** Runtime kaynak gerçeği MySQL `cms_documents` + normalize tablolardır.
> Aşağıdaki yapı panel API uyumluluğu için JSON şeklini tanımlar (`cms-config.json` key).

## `menuGroups[]` (SQL: `menu_groups` + `menu_items`)

```jsonc
{
  "id": "menu-group-ana-menu",     // benzersiz
  "key": "main-menu",              // benzersiz sistem anahtarı (frontend erişimi)
  "title": "Ana Menü",             // name
  "type": "ANA_MENU",              // eski grup tipi (geriye uyumluluk)
  "location": "HEADER",            // HEADER|MOBILE|FOOTER|TOP|OTHER
  "description": "",
  "status": "published",           // draft|published|passive|archived
  "isActive": true,
  "createdBy": "admin-...",
  "updatedBy": "admin-...",
  "createdAt": "2026-...Z",
  "updatedAt": "2026-...Z",
  "publishedAt": "2026-...Z",
  "items": [ /* MenuItem[] */ ]
}
```

## `items[]` (SQL karşılığı: `menu_items`)

`parent_id` / `sort_order` / `depth` alanları, JSON'da **iç içe `children[]`**
ve **dizi sırası** ile temsil edilir (normalizasyon kararı: ağaç yapısı, bu
boyuttaki veri için ilişkisel tablodan daha uygun ve döngü-güvenlidir).

```jsonc
{
  "id": "page-...",                // benzersiz
  "itemType": "page",              // page|bungalow|bungalow_category|system_route|custom_link|heading|dynamic_bungalow_list
  "referenceId": "hakkimizda",     // page slug / bungalow id / category id
  "routeName": null,               // system_route için (SYSTEM_ROUTES.key)
  "title": "Hakkımızda",           // menüde görünen başlık (kaynağı ezer)
  "url": null,                     // custom_link için
  "target": "SELF",                // SELF|BLANK
  "nofollow": false,
  "icon": null,
  "description": null,
  "cssClass": null,
  "isActive": true,
  "showOnDesktop": true,
  "showOnMobile": true,
  "showForGuests": true,
  "showForAuthenticated": true,
  "isHighlighted": false,
  "displayStyle": "link",          // link|primary_button|secondary_button|highlight
  "dynamicSettings": null,         // dynamic_bungalow_list için { source, limit, sort }
  "children": [ /* MenuItem[] (max 3 seviye) */ ]
}
```

## Bütünlük kuralları (kod tarafında uygulanır)

- **Grup anahtarı benzersiz** — `validateMenuGroups()`.
- **Öğe ID benzersiz** — `validateMenuGroups()`.
- **Döngü yok** — ağaç yapısı gereği bir düğüm kendi alt ağacına eklenemez (`lib/site/menu-tree.ts`).
- **Derinlik ≤ 3** — `MAX_MENU_DEPTH`.
- **Güvenli URL** — `custom_link` için `isSafeHref()` (javascript:, data: engellenir).
- **Atomik yazım** — `lib/cms/store.ts` (temp dosya + rename).

## Eski (legacy) öğe uyumluluğu

`itemType` yoksa öğe `custom_link` kabul edilir; başlık `title ?? text`, bağlantı
`url ?? href` alanlarından okunur. Böylece eski `menuGroups` verisi bozulmadan çalışır.
