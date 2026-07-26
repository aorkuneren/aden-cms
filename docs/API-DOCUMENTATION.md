# API — Menü Sistemi (Next.js Server Actions)

> Bu projede REST controller yerine **Next.js Server Actions** kullanılır
> (mevcut mimari). Tümü `app/admin/(panel)/website/actions.ts` içindedir ve
> yetki + doğrulama backend'de zorunlu tutulur.

## Yazma işlemleri (mutations)

### `saveMenuGroupsAction(groups): ActionResult`
Tüm menü gruplarını (öğeleriyle) kaydeder — taslak kaydı.
- Yetki: `cms.update` (`requireCms`).
- Doğrulama: zod şeması + `validateMenuGroups` (anahtar/ID benzersizliği, derinlik ≤3, güvenli URL).
- `createdBy/updatedBy/…` damgalar, `logAuditEvent` ile loglar.

### `setMenuGroupStatusAction(groupId, status): ActionResult`
Grup durumunu değiştirir (`draft|published|passive|archived`).
- Yetki: `published` için `cms.publish`, diğerleri için `cms.update`.
- `published` → `isActive=true`, `publishedAt=now`.
- `revalidateSite()` ile frontend önbelleğini temizler.

`ActionResult = { ok: true } | { ok: false; error: string }` — hatalar Türkçe.

## Okuma / kaynaklar (server helpers)

`lib/site/menu-sources.ts`:
- `listPages()` — CMS/kurumsal sayfaları (referenceId=slug).
- `listBungalows()` — bungalov kayıtları (referenceId=id, status, meta).
- `SYSTEM_ROUTES` — sistem route kayıt defteri.
- `resolveDynamicBungalows(settings)` — dinamik liste sonucu.

`lib/site/menu-resolver.ts`:
- `resolveMenu(selector, opts)` — grubu çözümlenmiş öğe ağacına dönüştürür
  (frontend). `selector = { key | groupId | type }`, `opts = { audience, device }`.
- `auditMenuGroup(group)` — bozuk bağlantı raporu (panel uyarıları).
- `getRawMenuGroups()` — React `cache`'li ham okuma.

## Doğrulama & tutarlılık

- Toplu sıralama/hiyerarşi tek `saveMenuGroupsAction` çağrısında atomik yazılır
  (SQL transaction karşılığı: tek dosya yazımı).
- N+1 yok: resolver bungalovları tek seferde yükler, `cache` ile istek başına tekrar okumaz.
