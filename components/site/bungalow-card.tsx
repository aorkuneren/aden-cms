import Link from "next/link"
import { ArrowRight, Square, Users, Waves, Wifi } from "lucide-react"
import { WhatsappIcon } from "@/components/site/brand-icons"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PriceDisplay } from "@/components/site/price-display"
import { formatNightlyPrice, getAreaHintByCapacity, type SiteBungalov } from "@/lib/site/b2c"
import { WHATSAPP_CONFIG } from "@/lib/site/site-config"
import { buildWhatsappHref } from "@/lib/site/whatsapp"
import { cleanFeatureTitle } from "@/lib/sector-icons"

type BungalowCardProps = {
  bungalow: SiteBungalov
  availability?: boolean
  checkIn?: string
  checkOut?: string
  whatsappHref?: string
  variant?: "default" | "showcase"
  /** Next/Image `sizes` override — carousel slide genişliğine uyum için. */
  imageSizes?: string
}

function buildDetailHref(id: string, checkIn?: string, checkOut?: string) {
  const params = new URLSearchParams()
  if (checkIn) params.set("checkIn", checkIn)
  if (checkOut) params.set("checkOut", checkOut)
  const suffix = params.toString()
  return suffix.length > 0 ? `/bungalovlarimiz/${id}?${suffix}` : `/bungalovlarimiz/${id}`
}

export function BungalowCard({
  bungalow,
  availability,
  checkIn,
  checkOut,
  whatsappHref,
  variant = "default",
  imageSizes,
}: BungalowCardProps) {
  const detailHref = buildDetailHref(bungalow.id, checkIn, checkOut)
  const nightlyLabel = formatNightlyPrice(Number(bungalow.nightlyPrice || 0))
  const waHref = buildWhatsappHref(
    whatsappHref,
    WHATSAPP_CONFIG.bungalowMessage(bungalow.name)
  )
  const showcaseSizes = imageSizes ?? "(max-width: 768px) 100vw, 50vw"
  const defaultSizes = imageSizes ?? "(max-width: 768px) 100vw, 33vw"

  if (variant === "showcase") {
    return (
      <Card className="group relative gap-0 overflow-hidden rounded-[24px] border-[#ddd3c3] bg-[#d7cebc] py-0 shadow-sm">
        <div className="absolute inset-0">
          {bungalow.image ? (
            <Image
              src={bungalow.image}
              alt={bungalow.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
              sizes={showcaseSizes}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#f4eee4]">
              Görsel bulunmuyor
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101712]/85 via-[#101712]/48 to-[#101712]/12" />
        </div>

        <CardContent className="relative flex min-h-[340px] aspect-[4/5] sm:min-h-[360px] sm:aspect-auto sm:h-[360px] flex-col justify-between p-4">
          <div>
            {availability !== undefined ? (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  availability ? "bg-[#e9f5e4] text-[#2f5f25]" : "bg-[#f8ece2] text-[#8f5b23]"
                }`}
              >
                {availability ? "Müsait" : "Bu tarih dolu"}
              </span>
            ) : null}
          </div>

          <div>
            <h3 className="max-w-[17rem] text-2xl font-semibold leading-tight text-white">{bungalow.name}</h3>
            <p className="mt-2 line-clamp-2 max-w-[19rem] text-sm text-white/82">
              {bungalow.description || "Sapanca doğasında huzurlu ve modern bungalov deneyimi."}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {bungalow.capacity} Kişi
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Square className="h-3.5 w-3.5" />
                {getAreaHintByCapacity(bungalow.capacity)} m²
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Waves className="h-3.5 w-3.5" />
                Sapanca
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-2xl font-semibold text-[#d5e87a]">{nightlyLabel}</span>
              <Link
                href={detailHref}
                className="inline-flex min-h-11 items-center gap-1 py-1 text-sm font-medium text-white/92 transition hover:text-white"
              >
                Detayları İncele
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group gap-0 overflow-hidden rounded-2xl border-[#e6dece] bg-white py-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[16/10] h-auto min-h-56 bg-[#ddd6c7]">
        {bungalow.image ? (
          <Image
            src={bungalow.image}
            alt={bungalow.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes={defaultSizes}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#71685a]">
            Görsel bulunmuyor
          </div>
        )}
        {availability !== undefined ? (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${
              availability ? "bg-[#e9f5e4] text-[#2f5f25]" : "bg-[#f8ece2] text-[#8f5b23]"
            }`}
          >
            {availability ? "Müsait" : "Bu tarih dolu"}
          </span>
        ) : null}
      </div>

      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-[#181818]">{bungalow.name}</h3>
          <PriceDisplay value={Number(bungalow.nightlyPrice || 0)} className="shrink-0" />
        </div>

        <p className="line-clamp-2 text-xs text-[#66666e] w-full leading-relaxed">
          {bungalow.description || "Doğa manzaralı konforlu bungalov deneyimi."}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2dcd2] bg-[#fdfbf7] px-2.5 py-1 text-xs font-semibold text-[#18261e]">
            <Users className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
            {bungalow.capacity} kişi
          </span>

          {(() => {
            const yuvarlak = bungalow.features.some(f => /yuvarlak/i.test(f))
            const dikdortgen = bungalow.features.some(f => /dikdörtgen|dikdortgen/i.test(f))
            const label = yuvarlak ? "Yuvarlak Havuz" : dikdortgen ? "Dikdörtgen Havuz" : "Havuzlu"
            return (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2dcd2] bg-[#fdfbf7] px-2.5 py-1 text-xs font-semibold text-[#18261e]">
                <Waves className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                {label}
              </span>
            )
          })()}

          {(() => {
            const hasWifi = bungalow.features.some(f => /wi.?fi|wifi|internet/i.test(f))
            return (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2dcd2] bg-[#fdfbf7] px-2.5 py-1 text-xs font-semibold text-[#18261e]">
                <Wifi className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                {hasWifi ? "Wi-Fi Var" : "Wi-Fi Yok"}
              </span>
            )
          })()}

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2dcd2] bg-[#fdfbf7] px-2.5 py-1 text-xs font-semibold text-[#18261e]">
            <Square className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
            {getAreaHintByCapacity(bungalow.capacity)} m²
          </span>
        </div>

        {bungalow.features.length > 0 ? (
          <div className="card-features-viewport -mx-1 px-1">
            {/* Track: tüm öğeler 2x kopyalanarak sorunsuz döngü sağlanır */}
            <div className="card-features-track" aria-hidden="false">
              {[...bungalow.features, ...bungalow.features].map((feature, idx) => {
                const cleanedTitle = cleanFeatureTitle(feature)
                return (
                  <span
                    key={`${feature}-${idx}`}
                    className="shrink-0 rounded-lg border border-[#e2dcd2] bg-[#f7f5ef] px-2.5 py-1 text-xs font-medium text-[#55555e] whitespace-nowrap"
                  >
                    {cleanedTitle}
                  </span>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button asChild variant="outline" className="flex-1 rounded-xl border-[#e2dcd2] bg-white text-xs font-bold text-[#18261e] hover:bg-[#fdfbf7] hover:border-[#18261e]">
            <Link href={detailHref}>Detayları İncele</Link>
          </Button>
          {waHref ? (
            <Button asChild className="flex-1 rounded-xl btn-dark text-white text-xs font-bold gap-1.5">
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <WhatsappIcon className="h-3.5 w-3.5 text-white" />
                <span>{bungalow.status === "BAKIMDA" ? "WhatsApp İle Bilgi Al" : "Hızlı Rezervasyon"}</span>
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
