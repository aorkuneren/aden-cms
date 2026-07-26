"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarCheck2, Filter, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageIntro } from "@/components/site/page-intro"
import { ReservationSearchCard } from "@/components/site/reservation-search-card"
import { cn } from "@/lib/utils"

type BungalovListingControlsProps = {
  title: string
  description: string
  features: string[]
  initialValues: {
    checkIn?: string
    checkOut?: string
    adults?: string
    children?: string
    capacity?: string
    feature?: string
    priceMode?: string
  }
}

function hasFilterValue(values: BungalovListingControlsProps["initialValues"]) {
  return Boolean(values.capacity || values.feature || values.priceMode)
}

function hasAvailabilityValue(values: BungalovListingControlsProps["initialValues"]) {
  return Boolean(values.checkIn || values.checkOut || values.adults || values.children)
}

export function BungalovListingControls({
  title,
  description,
  features,
  initialValues,
}: BungalovListingControlsProps) {
  const [showFilters, setShowFilters] = useState(hasFilterValue(initialValues))
  const [showAvailability, setShowAvailability] = useState(hasAvailabilityValue(initialValues))

  return (
    <div className="space-y-4">
      <PageIntro
        title={title}
        description={description}
        actions={(
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-all cursor-pointer",
                showFilters
                  ? "border-[#18261e] bg-[#18261e] text-white shadow-sm"
                  : "border-[#e2dcd2] bg-white text-[#18261e] hover:border-[#18261e] hover:bg-[#fdfbf7]"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtrele</span>
              {showFilters && <X className="h-3.5 w-3.5 ml-0.5 opacity-70" />}
            </button>

            <button
              type="button"
              onClick={() => setShowAvailability((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-all cursor-pointer",
                showAvailability
                  ? "border-[#18261e] bg-[#18261e] text-white shadow-sm"
                  : "border-[#e2dcd2] bg-white text-[#18261e] hover:border-[#18261e] hover:bg-[#fdfbf7]"
              )}
            >
              <CalendarCheck2 className="h-3.5 w-3.5" />
              <span>Müsaitlik Kontrol</span>
              {showAvailability && <X className="h-3.5 w-3.5 ml-0.5 opacity-70" />}
            </button>
          </div>
        )}
      />

      {showAvailability ? (
        <ReservationSearchCard
          action="/bungalovlarimiz"
          submitLabel="Müsaitlik Kontrol Et"
          defaultValues={{
            checkIn: initialValues.checkIn || "",
            checkOut: initialValues.checkOut || "",
            adults: Number(initialValues.adults || "2"),
            children: Number(initialValues.children || "0"),
          }}
          hiddenFields={{
            capacity: initialValues.capacity || "",
            feature: initialValues.feature || "",
            priceMode: initialValues.priceMode || "",
          }}
        />
      ) : null}

      {showFilters ? (
        <form
          action="/bungalovlarimiz"
          method="GET"
          className="rounded-2xl border border-[#e2dcd2] bg-white shadow-2xs overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-[#f0e8db] px-5 py-3.5">
            <Filter className="h-4 w-4 text-emerald-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#18261e]">Filtreleme Seçenekleri</span>
          </div>

          {/* Filter Fields */}
          <div className="grid gap-4 px-5 py-4 md:grid-cols-3">
            {/* Kapasite */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#777780]">Kapasite</span>
              <div className="relative">
                <select
                  name="capacity"
                  defaultValue={initialValues.capacity || ""}
                  className="h-10 w-full appearance-none rounded-xl border border-[#dcd4c8] bg-[#fbf9f6] pl-3 pr-8 text-xs font-semibold text-[#18261e] focus:outline-none focus:border-[#18261e] cursor-pointer transition"
                >
                  <option value="">Tümü</option>
                  <option value="2">2+ kişi</option>
                  <option value="3">3+ kişi</option>
                  <option value="4">4+ kişi</option>
                  <option value="5">5+ kişi</option>
                  <option value="6">6+ kişi</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#777780]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </span>
              </div>
            </div>

            {/* Özellik */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#777780]">Özellik</span>
              <div className="relative">
                <select
                  name="feature"
                  defaultValue={initialValues.feature || ""}
                  className="h-10 w-full appearance-none rounded-xl border border-[#dcd4c8] bg-[#fbf9f6] pl-3 pr-8 text-xs font-semibold text-[#18261e] focus:outline-none focus:border-[#18261e] cursor-pointer transition"
                >
                  <option value="">Tümü</option>
                  {features.map((feature) => (
                    <option key={feature} value={feature}>
                      {feature}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#777780]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </span>
              </div>
            </div>

            {/* Fiyat Durumu */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#777780]">Fiyat Durumu</span>
              <div className="relative">
                <select
                  name="priceMode"
                  defaultValue={initialValues.priceMode || ""}
                  className="h-10 w-full appearance-none rounded-xl border border-[#dcd4c8] bg-[#fbf9f6] pl-3 pr-8 text-xs font-semibold text-[#18261e] focus:outline-none focus:border-[#18261e] cursor-pointer transition"
                >
                  <option value="">Tümü</option>
                  <option value="priced">Fiyatı belli olanlar</option>
                  <option value="inquire">Fiyat sorunuz olanlar</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#777780]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </span>
              </div>
            </div>
          </div>

          <input type="hidden" name="checkIn" value={initialValues.checkIn || ""} />
          <input type="hidden" name="checkOut" value={initialValues.checkOut || ""} />
          <input type="hidden" name="adults" value={initialValues.adults || ""} />
          <input type="hidden" name="children" value={initialValues.children || ""} />

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-[#f0e8db] px-5 py-3.5">
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-xl border-[#e2dcd2] bg-white text-xs font-bold text-[#55555e] hover:bg-[#fdfbf7] hover:border-[#18261e] cursor-pointer"
            >
              <Link href="/bungalovlarimiz">Sıfırla</Link>
            </Button>
            <Button
              type="submit"
              className="h-9 rounded-xl btn-dark text-white text-xs font-bold uppercase tracking-wide px-5 shadow-sm cursor-pointer"
            >
              Filtre Uygula
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
