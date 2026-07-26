type JsonLdValue = Record<string, unknown> | Array<unknown>

/** Prevents a data value from terminating the JSON-LD script element. */
export function safeJsonLdStringify(value: JsonLdValue) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    const replacements: Record<string, string> = {
      "<": "\\u003c",
      ">": "\\u003e",
      "&": "\\u0026",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029",
    }
    return replacements[character]
  })
}

function JsonLdScript({ schema }: { schema: JsonLdValue }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(schema) }}
    />
  )
}

export interface JsonLdOrganizationProps {
  name: string
  url: string
  logo?: string
  telephone?: string
  email?: string
  address?: string
  description?: string
}

export function OrganizationJsonLd({
  name,
  url,
  logo,
  telephone,
  email,
  address,
  description,
}: JsonLdOrganizationProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LodgingBusiness"],
    "@id": `${url}#organization`,
    name,
    url,
    logo: logo || undefined,
    image: logo || undefined,
    telephone: telephone || undefined,
    email: email || undefined,
    description: description || undefined,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: address,
          addressCountry: "TR",
        }
      : undefined,
  }

  return <JsonLdScript schema={schema} />
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLdScript schema={schema} />
}

export interface FaqItem {
  question: string
  answer: string
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return <JsonLdScript schema={schema} />
}

export type BungalowJsonLdProps = {
  id: string
  name: string
  canonicalUrl: string
  description?: string | null
  images: string[]
  capacity: number
  nightlyPrice?: number | null
  features: string[]
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  areaSqm?: number | null
  provider: {
    name: string
    url: string
    telephone?: string
  }
}

export function BungalowJsonLd({
  id,
  name,
  canonicalUrl,
  description,
  images,
  capacity,
  nightlyPrice,
  features,
  address,
  latitude,
  longitude,
  bedrooms,
  bathrooms,
  areaSqm,
  provider,
}: BungalowJsonLdProps) {
  const normalizedImages = Array.from(
    new Set(images.map((image) => image.trim()).filter(Boolean))
  )
  const normalizedFeatures = Array.from(
    new Set(features.map((feature) => feature.trim()).filter(Boolean))
  )
  const hasPrice = Number.isFinite(nightlyPrice) && Number(nightlyPrice) > 0

  const schema = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    "@id": `${canonicalUrl}#vacation-rental`,
    identifier: id,
    additionalType: "Bungalow",
    name,
    url: canonicalUrl,
    description: description?.trim() || undefined,
    image: normalizedImages,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: address,
          addressCountry: "TR",
        }
      : undefined,
    geo:
      latitude != null && longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: Number(latitude),
            longitude: Number(longitude),
          }
        : undefined,
    numberOfRooms: bedrooms != null && bedrooms > 0 ? Number(bedrooms) : undefined,
    numberOfBathroomsTotal: bathrooms != null && bathrooms > 0 ? Number(bathrooms) : undefined,
    floorSize:
      areaSqm != null && areaSqm > 0
        ? {
            "@type": "QuantitativeValue",
            value: Number(areaSqm),
            unitCode: "MTK",
          }
        : undefined,
    containsPlace: {
      "@type": "Accommodation",
      additionalType: "EntirePlace",
      occupancy:
        capacity > 0
          ? {
              "@type": "QuantitativeValue",
              value: capacity,
              unitText: "kişi",
            }
          : undefined,
      amenityFeature: normalizedFeatures.map((feature) => ({
        "@type": "LocationFeatureSpecification",
        name: feature,
        value: true,
      })),
    },
    provider: {
      "@type": "Organization",
      "@id": `${provider.url}#organization`,
      name: provider.name,
      url: provider.url,
      telephone: provider.telephone || undefined,
    },
    makesOffer: hasPrice
      ? {
          "@type": "Offer",
          url: canonicalUrl,
          price: Number(nightlyPrice),
          priceCurrency: "TRY",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: Number(nightlyPrice),
            priceCurrency: "TRY",
            unitText: "gece",
          },
          itemOffered: { "@id": `${canonicalUrl}#vacation-rental` },
        }
      : undefined,
  }

  return <JsonLdScript schema={schema} />
}
