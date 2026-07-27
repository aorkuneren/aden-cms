# MySQL CMS Migration Design

**Goal:** Panelden girilen tüm veriler MySQL’de kalsın; dosya tabanlı `data/*.json` yazımı kalksın; geçişte veri kaybı olmasın.

**Approach:** Strangler B + normalize tablolar.

## Constraints

- Hostinger MySQL: `srv1816.hstgr.io` / DB `u878592693_adencms`
- Secret’lar yalnızca `.env` (git’e girmez)
- Medya dosyaları `public/uploads/` diskte kalır; yalnızca metadata DB’de
- Mevcut `readJson` / `writeJson` / `mutateJson` API yüzeyi korunur (44+ çağrı yeri kırılmaz)
- Cutover öncesi `data/` → `data/backup-pre-mysql/` kopyası zorunlu

## Architecture

```
Admin / Site / SEO
        ↓
lib/cms/store.ts  (aynı API)
        ↓
lib/cms/db-repos/*  (dosya adına göre repo)
        ↓
Prisma Client → MySQL 8
```

1. Seed: mevcut JSON → MySQL (tek yön)
2. Runtime: tüm okuma/yazma MySQL
3. JSON dosyaları: salt yedek / bootstrap; runtime yazmaz
4. Geri dönüş: `scripts/export-cms-to-json.ts` ile DB → JSON dump

## Domains → Tables

| Domain | Tables |
|--------|--------|
| Auth | `AdminUser` |
| System | `AuditLog`, `Inquiry` |
| Settings | `AppSetting` (key/value), `Language`, `Currency`, `UiString`, `LegalTerm` |
| Bungalov | `Bungalov`, `BungalovImage`, `BungalovFeature`, `BungalovRule`, `BungalovNearby`, `FeatureCatalogItem`, `ContentCatalog` |
| Website CMS | `MenuGroup`, `MenuItem`, `SliderSlide`, `SliderSettings`, `GalleryCategory`, `GalleryItem`, `FaqItem`, `WhyAdenItem`, `HeaderConfig`, `SiteManagement`, `SocialProfile`, `FooterConfig` |
| Pages | `PageSection` |
| SEO | `SeoMeta`, `UrlHistory`, `SeoLegacyLog` |
| Safety net | `CmsDocument` (bilinmeyen/geçiş anahtarları + cms-config artık parçaları) |

Nested menü: `MenuItem.parentId` self-relation. Bungalov `features` string listesi → `BungalovFeature` satırları.

## Store routing

`writeJson("bungalovs.json", data)` → bungalov repo replace-all (transaction).  
`mutateJson` → transaction + satır kilidi / version check.  
Bilinmeyen dosya adı → `CmsDocument` (kaynak kaybı yok).

## Data loss prevention

1. Cutover öncesi full JSON backup klasörü
2. Seed idempotent değil; boş DB’de bir kez; dolu DB’de `--force` ile bilinçli overwrite
3. Seed sonrası satır sayıları JSON uzunluklarıyla karşılaştırılır
4. `DATABASE_URL` yoksa store fail-fast (sessizce dosyaya düşmez)
5. Export script ile istediğin an JSON dump

## Out of scope

- Müşteri rezervasyon/ödeme canlı akışı (mock Prisma auth iskeleti ayrı)
- Medya binary’lerini DB’ye taşımak
- Hostinger panel UI değişiklikleri
