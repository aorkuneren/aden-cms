import { cache } from "react"
import { websiteCmsQueries } from "@/lib/data/queries"
import {
  buildDefaultSectionContentMap,
  type CmsManagedPageSlug,
} from "@/lib/site/cms-page-content"

export const getCmsPageContent = cache(async (slug: CmsManagedPageSlug) => {
  try {
    return await websiteCmsQueries.getPageContent(slug)
  } catch {
    return buildDefaultSectionContentMap(slug)
  }
})

export function getCmsField(
  content: Record<string, Record<string, string>>,
  sectionKey: string,
  fieldKey: string,
  fallback = ""
) {
  const value = content[sectionKey]?.[fieldKey]
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}
