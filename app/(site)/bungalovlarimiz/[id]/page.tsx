import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { BungalowAmenitiesTabs } from "@/components/site/bungalow-amenities-tabs"
import { BungalowDetailGallery } from "@/components/site/bungalow-detail-gallery"
import { BungalowHighlightsBar } from "@/components/site/bungalow-highlights-bar"
import { BungalowNearbyPlaces } from "@/components/site/bungalow-nearby-places"
import { BungalowQuickRulesCard } from "@/components/site/bungalow-quick-rules-card"
import { BreadcrumbJsonLd, BungalowJsonLd } from "@/components/site/json-ld"
import { StickyReservationCard } from "@/components/site/sticky-reservation-card"
import { splitBungalowFeaturesByCategory } from "@/lib/bungalov-feature-categories"
import { readFeatureCatalog } from "@/lib/bungalov-feature-catalog"
import { bungalovQueries, settingsQueries } from "@/lib/data/queries"
import { isReservationsModuleEnabled } from "@/lib/module-check"
import { toSiteBungalov } from "@/lib/site/b2c"
import { getSiteContactConfig } from "@/lib/site/contact-config"
import { SITE_ORIGIN } from "@/lib/site/site-config"
import { buildWhatsappHref } from "@/lib/site/whatsapp"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type DetailPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    checkIn?: string
    checkOut?: string
    adults?: string
    children?: string
  }>
}

function normalizeImages(values: string[]) {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => String(value || "").trim())
        .filter((value) => value.length > 0)
    )
  )
}

function buildDetailGalleryImages(mainImage: string, galleryImages: string[]) {
  const normalizedMainImage = String(mainImage || "").trim()
  return normalizeImages([
    normalizedMainImage,
    ...galleryImages,
  ])
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const row = await bungalovQueries.findUnique(id)
  if (!row || row.status === "PASIF") {
    return {
      title: "Bungalov Bulunamadı",
    }
  }

  // H4 — panelden yönetilen SEO alanları (yoksa isim/açıklamaya düşer)
  const title = row.seoTitle?.trim() || `${row.name} | Aden Bungalov Sapanca`
  const description = (
    row.seoDescription?.trim() ||
    row.description ||
    `${row.name} Sapanca konaklama detayları, özellikleri, gecelik fiyatı ve online rezervasyon talebi.`
  ).slice(0, 158)

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/bungalovlarimiz/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.adenbungalov.com/bungalovlarimiz/${id}`,
      images: row.image ? [{ url: row.image }] : undefined,
    },
  }
}

export default async function BungalovDetayPage({ params, searchParams }: DetailPageProps) {
  const { id } = await params
  const query = await searchParams

  const [isReservationsEnabled, row, contact, settings, featureCatalog] = await Promise.all([
    isReservationsModuleEnabled(),
    bungalovQueries.findUnique(id),
    getSiteContactConfig(),
    settingsQueries.findFirst(),
    readFeatureCatalog(),
  ])
  if (!row || row.status === "PASIF") {
    notFound()
  }

  const bungalov = toSiteBungalov(row as unknown as Record<string, unknown>)
  const detailGalleryImages = buildDetailGalleryImages(
    String(row.image || ""),
    Array.isArray(row.galleryImages) ? row.galleryImages.map(String) : []
  )
  const schemaImages = normalizeImages([
    String(row.image || ""),
    ...(Array.isArray(row.galleryImages) ? row.galleryImages.map(String) : []),
  ])
  const canonicalUrl = `${SITE_ORIGIN}/bungalovlarimiz/${bungalov.id}`
  const capacityLimit = Math.max(1, Number(bungalov.capacity || 0))
  const adultsFromQuery = Number(query.adults || "2")
  const childrenFromQuery = Number(query.children || "0")
  const defaultAdults =
    Number.isFinite(adultsFromQuery) && adultsFromQuery >= 1
      ? Math.min(Math.floor(adultsFromQuery), capacityLimit)
      : Math.min(2, capacityLimit)
  const defaultChildren =
    Number.isFinite(childrenFromQuery) && childrenFromQuery >= 0
      ? Math.floor(childrenFromQuery)
      : 0
  const detailDescription =
    String(bungalov.description || "").trim() ||
    "Sapanca'nın büyüleyici doğasıyla çevrili bu lüks bungalov; özel ısıtmalı yüzme havuzu, jakuzi, şömine ve %100 müstakil korunaklı bahçesiyle eşsiz bir konaklama deneyimi sunar."
  const featureGroups = splitBungalowFeaturesByCategory(
    Array.isArray(bungalov.features) ? bungalov.features : [],
    featureCatalog
  )
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 pb-[calc(var(--site-bottom-chrome)+1rem)] sm:px-6 md:py-10 md:pb-16 space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "https://www.adenbungalov.com" },
          { name: "Bungalovlarımız", url: "https://www.adenbungalov.com/bungalovlarimiz" },
          { name: bungalov.name, url: `https://www.adenbungalov.com/bungalovlarimiz/${bungalov.id}` },
        ]}
      />
      <BungalowJsonLd
        id={bungalov.id}
        name={bungalov.name}
        canonicalUrl={canonicalUrl}
        description={bungalov.description}
        images={schemaImages}
        capacity={capacityLimit}
        nightlyPrice={bungalov.nightlyPrice}
        features={bungalov.features}
        address={row.address}
        latitude={row.latitude ? Number(row.latitude) : null}
        longitude={row.longitude ? Number(row.longitude) : null}
        bedrooms={row.bedrooms}
        bathrooms={row.bathrooms}
        areaSqm={row.areaSqm}
        provider={{
          name: contact.companyName,
          url: contact.website || SITE_ORIGIN,
          telephone: contact.phone,
        }}
      />

      {/* Header & Breadcrumb */}
      <section className="space-y-4">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[#66666d] font-medium">
            <li>
              <Link href="/" className="transition hover:text-[#18261e]">
                Ana Sayfa
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5 text-[#b0b0b8]" />
            </li>
            <li>
              <Link href="/bungalovlarimiz" className="transition hover:text-[#18261e]">
                Bungalovlarımız
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5 text-[#b0b0b8]" />
            </li>
            <li className="font-bold text-[#18261e]">{bungalov.name}</li>
          </ol>
        </nav>

        {/* Title Header */}
        <div className="border-b border-[#e2dcd2] pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-[#18261e] sm:text-3xl lg:text-4xl">
            {bungalov.name}
          </h1>
        </div>

        {/* Gallery Slider & Modal */}
        <BungalowDetailGallery images={detailGalleryImages} bungalowName={bungalov.name} />
      </section>

      {/* Highlights Bar */}
      <BungalowHighlightsBar
        capacity={capacityLimit}
        bedrooms={row.bedrooms}
        poolType={row.poolType}
        internet={row.internet}
        areaSqm={row.areaSqm}
      />

      {/* Main Grid: Content Article + Sticky Reservation Sidebar */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-12 items-start">
        {/* Left Article Content */}
        <article className="space-y-8 min-w-0">
          {/* Description Section */}
          <div className="rounded-2xl border border-[#e2dcd2] bg-white p-6 shadow-xs sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-[#18261e] sm:text-xl border-b border-[#f0e8db] pb-3">
              Bungalov Hakkında
            </h2>
            <p className="text-sm leading-relaxed text-[#44444c] sm:text-base">
              {detailDescription}
            </p>
          </div>

          {/* Amenities & Features Tabs */}
          <BungalowAmenitiesTabs groupedFeatures={featureGroups} />

          {/* Stay Policies & Quick Rules */}
          <BungalowQuickRulesCard items={bungalov.rules} />

          {/* Nearby Places & Distances */}
          <BungalowNearbyPlaces items={bungalov.nearbyPlaces} />
        </article>

        {/* Right Sidebar: Sticky Reservation Card */}
        <aside className="min-w-0 lg:sticky lg:top-24">
          <StickyReservationCard
            bungalowId={bungalov.id}
            bungalowName={bungalov.name}
            nightlyPrice={Number(bungalov.nightlyPrice || 0)}
            capacity={capacityLimit}
            minNights={2}
            checkInTime={settings?.checkInTime || "14:00"}
            checkOutTime={settings?.checkOutTime || "11:00"}
            serviceFeeRatePercent={settings?.serviceFeeRatePercent}
            whatsappHref={buildWhatsappHref(contact.whatsappPhone)}
            isReservationsEnabled={isReservationsEnabled}
            isReservationClosed={row.status === "BAKIMDA"}
            defaultValues={{
              checkIn: query.checkIn || "",
              checkOut: query.checkOut || "",
              adults: defaultAdults,
              children: defaultChildren,
            }}
          />
        </aside>
      </section>

    </div>
  )
}
