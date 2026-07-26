# İletişim Yönetimi — Sayfa Haritası Editörü

**Tarih:** 2026-07-26  
**Durum:** Onay bekliyor  
**Kapsam:** Yalnızca `/admin/sayfalar/iletisim`

## Problem

İletişim yönetim ekranı jenerik `PageEditor` kart ızgarası kullanıyor. Sitedeki `/iletisim` yerleşimiyle görsel bağ yok; hangi alanın sayfada nereye düştüğü paneldan anlaşılmıyor. Kullanıcı 2026 UI dilinde, sitedeki düzeni yansıtan bir yönetim yüzeyi istiyor.

## Çözüm

İletişim sayfasına özel bir **sayfa haritası editörü**: panel, canlı sayfanın iskeletini (hero → 4 kart → form | harita) düzenlenebilir yüzey olarak çizer. Tek sticky Kaydet barı ve mevcut `savePageSectionsAction` korunur.

## Yerleşim

```
┌─ Sticky bar: rozet | N alan değişti | Siteyi Aç | Kaydet ─┐
├─ Hero şeridi: eyebrow | title | description ───────────────┤
├─ 4 kart: WhatsApp | Telefon | E-posta | Konum ────────────┤
├─ Sol (≈7) Form kabuğu          │ Sağ (≈5) Harita kartı ──┤
│  formTitle + tür açıklaması    │  title                   │
│  tür etiket/açıklama (4)       │  harita placeholder      │
│  alan etiket + placeholder     │  description             │
│  submit / success / error      │  adres (salt okunur)     │
└────────────────────────────────┴──────────────────────────┘
```

## Veri modeli

- Kaynak: mevcut registry bölümleri (`contact-hero`, `contact-cards`, `contact-info`, `form-fields`, `form-settings`, `contact-region`) ve `page-content.json`.
- Yeni alan / yeni dosya yok.
- Telefon, e-posta, açık adres: `getSiteContactConfig()` ile salt okunur gösterilir; CMS yazılmaz. Kart başlıkları CMS’ten gelir.

## Bileşenler

| Parça | Rol |
|---|---|
| `ContactPageEditor` | Client editör; state, dirty count, kaydet |
| Inline alanlar | Kart/form iskeleti içinde `Input`/`Textarea`; etiket sitedeki karşılığına yakın |
| Sticky bar | Mevcut PageEditor bar dili (emerald, blur, dirty indicator) |
| Rota | `sayfalar/[sayfa]/page.tsx` içinde `sayfa === "iletisim"` → özel editör; diğer sayfalar `PageEditor` |

## Görsel dil (2026)

- Soft surface: `#fbf9f6` / white, ince `#e2dcd2` border, soft shadow
- Sticky bar: `backdrop-blur`, glass
- Emerald aksan (panel ile uyumlu); mor/glow yok
- Micro-motion: focus ring, dirty nokta, kaydet başarı durumu
- Kartlar sitedeki `ContactMethodCard` oranına yakın; düzenleme için inline input

## Davranış

- Tek Kaydet → `savePageSectionsAction("iletisim", values)`
- Dirty = 0 iken Kaydet pasif
- Başarı/hata: mevcut `SaveStatusBanner`
- Siteyi Aç → `/iletisim` yeni sekme

## Kapsam dışı

- Canlı iframe önizleme
- Diğer sayfa editörlerinin aynı kalıba çekilmesi
- Telefon / e-posta / adres yazımı (SoT: Site Ayarları)
- View Transitions API zorunluluğu

## Başarı ölçütü

1. Panel açıldığında sitedeki blok sırası birebir okunur.
2. Bir kart başlığını değiştirip kaydetmek `/iletisim` kartına yansır.
3. Tip kontrolü + mevcut vitest geçmeye devam eder.
