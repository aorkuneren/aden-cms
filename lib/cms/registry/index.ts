import { ANA_SAYFA_PAGE } from "./pages/ana-sayfa"
import { BUNGALOVLARIMIZ_PAGE } from "./pages/bungalovlarimiz"
import { GALERI_PAGE } from "./pages/galeri"
import { ILETISIM_PAGE } from "./pages/iletisim"
import { KURUMSAL_PAGE } from "./pages/kurumsal"
import type { PageDef, SectionDef } from "./types"

export { buildSectionZod, sectionDefaults } from "./field-zod"
export type { FieldDef, FieldType, PageDef, SectionDef } from "./types"

const pages: PageDef[] = [
  ANA_SAYFA_PAGE,
  BUNGALOVLARIMIZ_PAGE,
  GALERI_PAGE,
  ILETISIM_PAGE,
  KURUMSAL_PAGE,
]

export function getPage(slug: string): PageDef | undefined {
  return pages.find((page) => page.slug === slug)
}

export function getSection(slug: string, sectionKey: string): SectionDef | undefined {
  return getPage(slug)?.sections.find((section) => section.key === sectionKey)
}
