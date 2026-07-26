import type { FieldDef, PageDef } from "../types"

const shortText = (name: string, label: string, defaultValue: string): FieldDef => ({
  name,
  label,
  type: "shortText",
  defaultValue,
})

const longText = (name: string, label: string, defaultValue: string): FieldDef => ({
  name,
  label,
  type: "longText",
  defaultValue,
})

export const KURUMSAL_PAGE: PageDef = {
  slug: "kurumsal",
  title: "Kurumsal",
  sections: [
    {
      key: "corporate-hero",
      label: "Sayfa Başlığı",
      kind: "fields",
      fields: [
        shortText("eyebrow", "Üst başlık", "Kurumsal"),
        shortText("title", "Başlık", "Kurumsal ve Yasal Bilgiler"),
        longText(
          "description",
          "Açıklama",
          "Rezervasyon öncesi ihtiyaç duyulan resmi metinler ve işletme bilgilerine buradan ulaşabilirsiniz."
        ),
        longText(
          "intro",
          "Giriş metni",
          "Bu alan; Hakkımızda, banka hesap bilgileri, kiralama şartları, KVKK, iptal politikası ve gizlilik metinlerini tek noktada erişilebilir kılar."
        ),
        shortText("introVisible", "Giriş metni görünsün", "true"),
      ],
    },
  ],
}
