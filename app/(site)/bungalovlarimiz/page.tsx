import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { BungalovListingControls } from "@/components/site/bungalov-listing-controls"
import { BungalovListingGrid } from "@/components/site/bungalov-listing-grid"
import { bungalovQueries, reservationQueries } from "@/lib/data/queries"
import { parseLocalDateKey, toLocalDateKey } from "@/lib/date-only"
import { toSiteBungalov } from "@/lib/site/b2c"
import { getCmsField, getCmsPageContent } from "@/lib/site/page-content"
import { getSiteContactConfig } from "@/lib/site/contact-config"
import { BreadcrumbJsonLd } from "@/components/site/json-ld"
import { resolvePageSeo } from "@/lib/site/page-seo"
import { getUiStrings, t } from "@/lib/cms/ui-strings"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolvePageSeo("/bungalovlarimiz", {
    title: "Bungalovlarımız | Sapanca Havuzlu & Jakuzili Tatil",
    description:
      "Aden Bungalov Sapanca özel havuzlu ve jakuzili lüks bungalov seçeneklerini görüntüleyin, filtreleyin ve müsaitlik kontrolü yapın.",
  })

  return {
    title: { absolute: seo.title },
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: "/bungalovlarimiz" },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: "https://www.adenbungalov.com/bungalovlarimiz",
    },
  }
}

const BLOCKING_STATUSES = ["PENDING", "CONFIRMED", "ACTIVE"] as const

export default async function BungalovlarimizPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkIn?: string
    checkOut?: string
    adults?: string
    children?: string
    capacity?: string
    feature?: string
    priceMode?: string
    page?: string
  }>
}) {
  const params = await searchParams

  const checkInDate = params.checkIn ? parseLocalDateKey(params.checkIn) : null
  const checkOutDate = params.checkOut ? parseLocalDateKey(params.checkOut) : null
  const adults = Number(params.adults || "0")
  const capacityFilter = Number(params.capacity || "0")
  const featureFilter = (params.feature || "").trim()
  const priceMode = (params.priceMode || "").trim()

  const [rawBungalovs, cmsPageContent, contact, uiStrings] = await Promise.all([
    bungalovQueries.findMany(
      { status: { in: ["AKTIF", "BAKIMDA"] } },
      { orderBy: { name: "asc" } }
    ),
    getCmsPageContent("bungalovlarimiz"),
    getSiteContactConfig(),
    getUiStrings(),
  ])
  const bungalovs = rawBungalovs.map((item) =>
    toSiteBungalov(item as unknown as Record<string, unknown>)
  )
  const listingTitle = getCmsField(
    cmsPageContent,
    "listing-hero",
    "title",
    "Size Uygun Konaklamayı Seçin"
  )
  const listingDescription = getCmsField(
    cmsPageContent,
    "listing-hero",
    "description",
    "Kapasite, özellik ve fiyat durumuna göre filtreleyin. Tarih seçtiğinizde sadece müsait seçenekler görüntülenir."
  )
  const listingEmptyStateText = getCmsField(
    cmsPageContent,
    "listing-hero",
    "emptyStateText",
    getCmsField(
      cmsPageContent,
      "listing-grid",
      "emptyStateText",
      t(uiStrings, "listing.emptyFallback", "Filtre kriterlerine uygun bungalow bulunamadı.")
    )
  )
  const configuredLimit = Number.parseInt(
    getCmsField(cmsPageContent, "listing-behavior", "limit", "9"),
    10
  )
  const listingLimit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 9
  const requestedLoadMode = getCmsField(
    cmsPageContent,
    "listing-behavior",
    "loadMode",
    "load-more"
  )
  const listingLoadMode =
    requestedLoadMode === "pagination" || requestedLoadMode === "infinite"
      ? requestedLoadMode
      : "load-more"
  const requestedPage = Number.parseInt(params.page || "1", 10)
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const featurePool = Array.from(
    new Set(
      bungalovs.flatMap((bungalov) =>
        bungalov.features.map((feature) => feature.trim()).filter((feature) => feature.length > 0)
      )
    )
  ).sort((a, b) => a.localeCompare(b, "tr"))

  let availabilityMap = new Map<string, boolean>()
  if (checkInDate && checkOutDate && checkOutDate > checkInDate) {
    const reservations = await reservationQueries.findMany({
      status: { in: [...BLOCKING_STATUSES] },
      checkIn: { lte: checkOutDate },
      checkOut: { gte: checkInDate },
    })

    const periodsByBungalov = new Map<string, Array<{ checkIn: Date; checkOut: Date }>>()
    for (const reservation of reservations) {
      const bungalovId = String((reservation as { bungalovId?: string }).bungalovId || "")
      if (!bungalovId) continue
      const periods = periodsByBungalov.get(bungalovId) || []
      periods.push({
        checkIn: new Date(String((reservation as { checkIn?: string }).checkIn || "")),
        checkOut: new Date(String((reservation as { checkOut?: string }).checkOut || "")),
      })
      periodsByBungalov.set(bungalovId, periods)
    }

    availabilityMap = new Map(
      bungalovs.map((bungalov) => {
        const periods = periodsByBungalov.get(bungalov.id) || []
        const hasConflict = periods.some(
          (period) => checkInDate < period.checkOut && checkOutDate > period.checkIn
        )
        return [bungalov.id, !hasConflict]
      })
    )
  }

  const filteredBungalovs = bungalovs.filter((bungalov) => {
    if (adults > 0 && bungalov.capacity < adults) return false
    if (capacityFilter > 0 && bungalov.capacity < capacityFilter) return false
    if (featureFilter.length > 0) {
      const hasFeature = bungalov.features.some(
        (feature) => feature.toLocaleLowerCase("tr-TR") === featureFilter.toLocaleLowerCase("tr-TR")
      )
      if (!hasFeature) return false
    }
    if (priceMode === "priced" && Number(bungalov.nightlyPrice || 0) <= 0) return false
    if (priceMode === "inquire" && Number(bungalov.nightlyPrice || 0) > 0) return false
    if (availabilityMap.size > 0 && availabilityMap.get(bungalov.id) === false) return false
    return true
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 pb-24 sm:px-6 md:pb-12">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "https://www.adenbungalov.com" },
          { name: "Bungalovlarımız", url: "https://www.adenbungalov.com/bungalovlarimiz" },
        ]}
      />
      <BungalovListingControls
        title={listingTitle}
        description={listingDescription}
        features={featurePool}
        initialValues={{
          checkIn: params.checkIn || "",
          checkOut: params.checkOut || "",
          adults: params.adults || "",
          children: params.children || "",
          capacity: params.capacity || "",
          feature: params.feature || "",
          priceMode: params.priceMode || "",
        }}
      />

      {checkInDate && checkOutDate && checkOutDate > checkInDate ? (
        <p className="mt-4 text-sm text-[#5f5f66]">
          Müsaitlik aralığı: {toLocalDateKey(checkInDate)} - {toLocalDateKey(checkOutDate)}
        </p>
      ) : null}

      <div className="mt-6">
        {filteredBungalovs.length === 0 ? (
          <Card className="rounded-2xl border-[#e7dfd1] bg-white">
            <CardContent className="p-6 text-sm text-[#5f5f66]">
              {listingEmptyStateText}
            </CardContent>
          </Card>
        ) : (
          <BungalovListingGrid
            bungalovs={filteredBungalovs}
            availabilityByBungalov={
              availabilityMap.size > 0 ? Object.fromEntries(availabilityMap) : undefined
            }
            checkIn={params.checkIn}
            checkOut={params.checkOut}
            whatsappHref={contact.whatsappPhone}
            limit={listingLimit}
            loadMode={listingLoadMode}
            currentPage={currentPage}
          />
        )}
      </div>
    </div>
  )
}
