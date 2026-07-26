# Frontend Entegrasyonu — Menü Sistemi

Yönetim panelinde oluşturulan menüler web sitesine **dinamik** yansır. Statik kodlama yoktur.

## Resolver

`lib/site/menu-resolver.ts` → `resolveMenu(selector, opts)`:

```ts
const items = await resolveMenu(
  { key: "main-menu", groupId, type },   // öncelik: groupId > key > type
  { device: "desktop", audience: "guest" }
)
```

Resolver garantileri:
- Yalnızca **aktif + yayındaki** grupları getirir.
- **Aktif olmayan** öğeleri gizler; **görünürlüğü** uygular (masaüstü/mobil, misafir/üye).
- **ID/route → canlı URL** çözer (slug değişse bile doğru adres).
- **Bozuk/pasif/silinmiş** içeriği hiç göstermez.
- **Alt menü hiyerarşisini** doğru kurar (≤3 seviye).
- **Dinamik bungalov listelerini** çalıştırır.

## Header entegrasyonu

`app/(site)/layout.tsx`:
```ts
const resolved = await resolveMenu(
  { groupId: cmsConfig?.headerManagement?.menuGroupId,
    type: cmsConfig?.headerManagement?.menuType, key: "main-menu" },
  { device: "desktop", audience: "guest" }
)
// resolved boşsa eski (legacy) çözüm devreye girer — tam geriye uyumluluk.
```

Header'a hangi grubun bağlanacağı **Header & Footer** sayfasından seçilir.
Footer menü sütunları da aynı sayfadan grup atamasıyla yönetilir.

## Cache davranışı

- Resolver ham menüyü **React `cache`** ile okur → aynı istekte tek dosya okuması.
- İçerik değişince mutasyonlar `revalidateSite()` → `revalidatePath("/", "layout")`
  çağırır; public sayfalar bir sonraki istekte taze render olur.
- Public sayfalar `dynamic` render olduğundan menü değişikliği yeniden derleme
  gerektirmez.

## Bilinen sınır (staged)

- Public **header bileşeni şu an düz** (dropdown alt-menü render'ı yok). Resolver
  hiyerarşi üretir; header üst seviyeyi tüketir. Frontend dropdown/mobil açılır
  alt-menü render'ı ayrı bir adımda `site-header.tsx`'e eklenebilir (kırmadan).
