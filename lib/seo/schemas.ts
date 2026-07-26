import { z } from "zod"

const schemaTypeSchema = z.enum([
  "WebPage",
  "AboutPage",
  "ContactPage",
  "CollectionPage",
  "LodgingBusiness",
  "FAQPage",
  "Organization",
])

const changeFreqSchema = z.enum([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
])

function emptyToNull(value: unknown): unknown {
  if (typeof value === "string" && value.trim() === "") return null
  return value
}

export const seoMetaRecordSchema = z.object({
  id: z.string().min(1),
  entityType: z.enum(["page", "bungalow"]),
  entityId: z.string().min(1),
  locale: z.literal("tr"),
  path: z.preprocess(emptyToNull, z.string().nullable()),
  slug: z.preprocess(emptyToNull, z.string().nullable()),
  metaTitle: z.string(),
  metaDescription: z.string(),
  focusKeyword: z.preprocess(emptyToNull, z.string().nullable()),
  canonicalUrl: z.preprocess(emptyToNull, z.string().nullable()),
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  ogTitle: z.preprocess(emptyToNull, z.string().nullable()),
  ogDescription: z.preprocess(emptyToNull, z.string().nullable()),
  ogImageUrl: z.preprocess(emptyToNull, z.string().nullable()),
  schemaType: schemaTypeSchema.nullable(),
  schemaJson: z.record(z.string(), z.unknown()).nullable(),
  priority: z.number().min(0).max(1),
  changeFreq: changeFreqSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  updatedBy: z.string().nullable(),
  revision: z.number().int().nonnegative(),
})

export const seoMetaListSchema = z.array(seoMetaRecordSchema)

export const urlHistoryRecordSchema = z.object({
  id: z.string().min(1),
  fromPath: z.string().min(1),
  toPath: z.string().min(1),
  statusCode: z.union([z.literal(301), z.literal(302)]),
  entityType: z.enum(["page", "bungalow"]).nullable(),
  entityId: z.string().nullable(),
  reason: z.enum(["slug-change", "page-move", "manual"]),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  createdBy: z.string().nullable(),
})

export const urlHistoryListSchema = z.array(urlHistoryRecordSchema)

export type SeoMetaRecordInput = z.infer<typeof seoMetaRecordSchema>
export type UrlHistoryRecordInput = z.infer<typeof urlHistoryRecordSchema>
