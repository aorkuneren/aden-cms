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

const number = (name: string, label: string, defaultValue: string): FieldDef => ({
  name,
  label,
  type: "number",
  defaultValue,
})

export const BUNGALOVLARIMIZ_PAGE: PageDef = {
  slug: "bungalovlarimiz",
  title: "Bungalovlarımız",
  sections: [
    {
      key: "listing-hero",
      label: "Sayfa Başlığı",
      kind: "fields",
      fields: [
        shortText("title", "Başlık", "Bungalovlarımız"),
        longText(
          "description",
          "Açıklama",
          "Tüm suit seçeneklerimizi karşılaştırın, müsaitliği kontrol edin ve hızlıca talep oluşturun."
        ),
        longText(
          "emptyStateText",
          "Boş durum metni",
          "Şu anda listelenecek aktif bungalov bulunmuyor."
        ),
      ],
    },
    {
      key: "listing-behavior",
      label: "Liste Davranışı",
      kind: "fields",
      fields: [
        number("limit", "Sayfa başına bungalov sayısı", "9"),
        {
          name: "loadMode",
          label: "Yükleme modu",
          type: "select",
          defaultValue: "load-more",
          options: [
            { value: "load-more", label: "Daha fazla yükle" },
            { value: "pagination", label: "Sayfalama" },
            { value: "infinite", label: "Sonsuz kaydırma" },
          ],
        },
      ],
    },
  ],
}
