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

export const GALERI_PAGE: PageDef = {
  slug: "galeri",
  title: "Galeri",
  sections: [
    {
      key: "page-hero",
      label: "Sayfa Başlığı",
      kind: "fields",
      fields: [
        shortText("title", "Başlık", "Foto Galeri"),
        longText(
          "description",
          "Açıklama",
          "Aden Bungalov galerisi: tüm kategorilerdeki görselleri keşfedin."
        ),
      ],
    },
  ],
}
