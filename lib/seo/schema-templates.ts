import type { SeoSchemaType } from "@/lib/seo/types"

export type SchemaTemplateContext = {
  name: string
  description: string
  url: string
  imageUrl?: string | null
  siteName?: string
  breadcrumb?: { name: string; url: string }[]
}

export function buildSchemaJson(
  schemaType: SeoSchemaType,
  ctx: SchemaTemplateContext
): Record<string, unknown> | null {
  if (!schemaType) return null

  const base = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: ctx.name,
    description: ctx.description,
    url: ctx.url,
  }

  if (schemaType === "LodgingBusiness") {
    return {
      ...base,
      image: ctx.imageUrl || undefined,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sapanca",
        addressCountry: "TR",
      },
    }
  }

  if (schemaType === "FAQPage") {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [],
    }
  }

  if (schemaType === "Organization") {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: ctx.siteName || ctx.name,
      url: ctx.url,
      logo: ctx.imageUrl || undefined,
    }
  }

  return base
}
