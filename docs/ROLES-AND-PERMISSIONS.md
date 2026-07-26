# Roller ve Yetkiler — Menü Sistemi

Yetki kontrolü **hem UI hem backend** tarafında uygulanır. Backend gate:
`lib/admin/permissions.ts` → `requireCms(action)`.

## CMS eylemleri

`view | create | update | delete | publish | approve` (bkz. `lib/auth/rbac.ts`
`PERMISSION_CATALOG.cms`).

## Rol → yetki eşlemesi

| Rol | CMS yetkileri |
|-----|---------------|
| `SUPERADMIN` | tümü (`*`) |
| `ADMIN` | tümü (`*`) |
| `CONTENT_EDITOR` | `view`, `create`, `update` (yayınlayamaz/silemez) |
| `STAFF` | `view`, `create`, `update` |

## Menü işlemleri ve gerekli yetki

| İşlem | Yetki |
|-------|-------|
| Menü/öğe görüntüleme | `cms.view` (panel erişimi) |
| Menü grubu/öğe oluşturma-düzenleme, sıralama, taslak kaydetme | `cms.update` |
| **Menü yayınlama** | `cms.publish` |
| Menü pasife alma / arşivleme | `cms.update` |

Örnek: **İçerik Editörü** menüyü düzenleyip taslak kaydedebilir ancak **Yayınla**
butonu devre dışıdır ve `setMenuGroupStatusAction(..., "published")` çağrısı
backend'de reddedilir.

## Uygulama noktaları

- UI: `MenuBuilder` `canPublish` prop'u ile Yayınla butonunu kontrol eder
  (`adminCan(admin, "publish")`).
- Backend: her mutation başında `requireCms(...)` — UI atlansa bile korunur.
- Tüm mutasyonlar `logAuditEvent` ile denetim loglarına yazılır (`/admin/aktivite`).
