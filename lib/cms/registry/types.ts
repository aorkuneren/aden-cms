export type FieldType =
  | "shortText"
  | "longText"
  | "richText"
  | "image"
  | "link"
  | "number"
  | "boolean"
  | "select"

export type FieldDef = {
  name: string
  type: FieldType
  label: string
  help?: string
  required?: boolean
  defaultValue: string | number | boolean
  options?: { label: string; value: string }[]
}

export type SectionDef = {
  key: string
  label: string
  kind: "fields" | "collection-link"
  fields?: FieldDef[]
  collectionHref?: string
}

export type PageDef = {
  slug: string
  title: string
  sections: SectionDef[]
}
