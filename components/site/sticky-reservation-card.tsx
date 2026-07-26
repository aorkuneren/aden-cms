"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import { WhatsappIcon } from "@/components/site/brand-icons"
import {
  CustomDateRangePicker,
  SAMPLE_BOOKED_RANGES,
  type BookedRange,
} from "@/components/site/custom-date-range-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency } from "@/lib/site/b2c"
import { buildWhatsappHref } from "@/lib/site/whatsapp"
import { cn } from "@/lib/utils"

type ExtraPackage = {
  id: string
  name: string
  price: number
}

type StickyReservationCardProps = {
  bungalowId: string
  bungalowName: string
  nightlyPrice: number
  capacity: number
  minNights?: number
  checkInTime?: string
  checkOutTime?: string
  serviceFeeRatePercent?: number
  extraPackages?: ExtraPackage[]
  whatsappHref?: string
  isReservationsEnabled?: boolean
  isReservationClosed?: boolean
  defaultValues?: {
    checkIn?: string
    checkOut?: string
    adults?: number
    children?: number
  }
}

type AvailabilityState = {
  available: boolean
  message: string
} | null

function formatTurkishDate(dateStr: string): string {
  if (!dateStr) return ""
  const [y, m, d] = dateStr.split("-")
  if (!y || !m || !d) return dateStr
  return `${d}.${m}.${y}`
}

function getNightCount(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0
  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const diff = end.getTime() - start.getTime()
  const nights = Math.floor(diff / (1000 * 60 * 60 * 24))
  return nights > 0 ? nights : 0
}

export function StickyReservationCard({
  bungalowId,
  bungalowName,
  nightlyPrice,
  capacity,
  minNights = 2,
  checkInTime = "14:00",
  checkOutTime = "11:00",
  serviceFeeRatePercent = 0,
  extraPackages = [],
  whatsappHref,
  isReservationsEnabled = true,
  isReservationClosed = false,
  defaultValues,
}: StickyReservationCardProps) {
  const capacityLimit = Math.max(1, Number(capacity || 0))
  const normalizedServiceFeeRate = Math.max(0, Number(serviceFeeRatePercent || 0))
  const availableExtras = extraPackages.filter(
    (item) => item.id && item.name.trim() && Number.isFinite(item.price) && item.price > 0
  )

  // Alttan Açılan Tam Boy Panel State (Açılış/Kapanış Animasyonu Destekli)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Form State
  const [checkIn, setCheckIn] = useState(defaultValues?.checkIn || "2026-08-15")
  const [checkOut, setCheckOut] = useState(defaultValues?.checkOut || "2026-08-18")
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])

  const [guests, setGuests] = useState(() => {
    const adultsValue = Number(defaultValues?.adults || 2)
    const childrenValue = Number(defaultValues?.children || 0)
    const guestTotal = adultsValue + childrenValue
    if (!Number.isFinite(guestTotal)) {
      return Math.min(2, capacityLimit)
    }
    return Math.min(capacityLimit, Math.max(1, Math.floor(guestTotal)))
  })

  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityState>(null)
  const [bookedRangesList, setBookedRangesList] = useState<BookedRange[]>(SAMPLE_BOOKED_RANGES)

  const handleSelectRange = (newCheckIn: string, newCheckOut: string) => {
    setCheckIn(newCheckIn)
    setCheckOut(newCheckOut)
  }

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const closeDrawer = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsDrawerOpen(false)
      setIsClosing(false)
    }, 280)
  }

  const nights = getNightCount(checkIn, checkOut)
  const isMinNightsSatisfied = nights >= minNights

  const estimatedTotal = nights > 0 && nightlyPrice > 0 ? nights * nightlyPrice : 0
  const selectedExtrasFee = selectedExtras.reduce((acc, extraId) => {
    const found = availableExtras.find((item) => item.id === extraId)
    return acc + (found ? found.price : 0)
  }, 0)

  const serviceFee =
    normalizedServiceFeeRate > 0 && estimatedTotal > 0
      ? Math.round((estimatedTotal + selectedExtrasFee) * (normalizedServiceFeeRate / 100))
      : 0
  const grandTotal = estimatedTotal + selectedExtrasFee + serviceFee

  const selectedExtrasNames = selectedExtras
    .map((id) => availableExtras.find((item) => item.id === id)?.name)
    .filter(Boolean)

  const isFormValid = Boolean(checkIn && checkOut && nights > 0 && isMinNightsSatisfied)
  const isAvailable = Boolean(isFormValid && (availability === null || availability.available))

  const reservationMessage = [
    `Merhaba, ${bungalowName} için rezervasyon talebinde bulunmak istiyorum.`,
    checkIn && checkOut ? `Tarih: ${formatTurkishDate(checkIn)} - ${formatTurkishDate(checkOut)} (${nights} Gece)` : null,
    `Misafir: ${guests} kişi`,
    selectedExtrasNames.length > 0 ? `Ekstra Paketler: ${selectedExtrasNames.join(", ")}` : null,
    grandTotal > 0 ? `Tahmini Toplam: ${formatCurrency(grandTotal)}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const reservationHref = buildWhatsappHref(whatsappHref, reservationMessage)
  const infoHref = buildWhatsappHref(
    whatsappHref,
    `Merhaba, ${bungalowName} hakkında bilgi almak istiyorum.`
  )

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) {
      setAvailability(null)
      return
    }

    setChecking(true)
    try {
      const response = await fetch(
        `/api/public/bungalovlar/${encodeURIComponent(
          bungalowId
        )}/availability?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(
          checkOut
        )}`
      )
      const data = await response.json()
      if (Array.isArray(data.bookedRanges)) {
        setBookedRangesList(data.bookedRanges)
      }

      if (!response.ok || !data.available) {
        setAvailability({
          available: false,
          message: data.message || data.error || "Seçilen tarihlerde dolu/müsait olmayan günler bulunmaktadır.",
        })
        return
      }

      setAvailability({
        available: true,
        message: "Seçilen tarih aralığı müsait görünüyor.",
      })
    } catch {
      setAvailability({
        available: false,
        message: "Müsaitlik sorgusu sırasında bir hata oluştu.",
      })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (!isReservationsEnabled || !checkIn || !checkOut || !isDrawerOpen) {
      return
    }

    const timer = setTimeout(() => {
      void checkAvailability()
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, bungalowId, isReservationsEnabled, isDrawerOpen])

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isDrawerOpen])

  return (
    <>
      {/* SAĞ BLOK: MASAÜSTÜ & MOBİL SABİT KART */}
      <Card className="rounded-2xl border-[#e2dcd2] bg-white shadow-md lg:sticky lg:top-24 overflow-hidden">
        <CardContent className="space-y-5 p-6">
          {/* Fiyat Başlığı */}
          <div className="border-b border-[#f0e8db] pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777780] block">
              Gecelik Başlangıç Fiyatı
            </span>
            <div className="flex items-end gap-1.5 mt-0.5">
              <span className="text-3xl font-extrabold text-[#18261e]">
                {nightlyPrice > 0 ? formatCurrency(nightlyPrice) : "Fiyat Sorunuz"}
              </span>
              {nightlyPrice > 0 ? <span className="pb-0.5 text-sm text-[#66666e]">/ gece</span> : null}
            </div>
          </div>

          {/* Öne Çıkan Özellik Rozetleri */}
          <div className="space-y-2 text-xs text-[#44444c]">
            <div className="flex items-center gap-2 rounded-xl bg-[#edf4ed] p-2.5 text-emerald-900 border border-[#c3d9c3] font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Güncel Müsaitlik Takvimi</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-[#fdfbf7] p-2.5 border border-[#e8e2d8]">
              <Clock className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Giriş: <strong>{checkInTime}</strong> • Çıkış: <strong>{checkOutTime}</strong></span>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-[#fdfbf7] p-2.5 border border-[#e8e2d8]">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>%100 Müstakil & Korunaklı Bahçe</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-[#fdfbf7] p-2.5 border border-[#e8e2d8]">
              <Lock className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Minimum {minNights} Gece Konaklama</span>
            </div>
          </div>

          {/* REZERVASİYONA KAPALI VEYA AÇIK BUTONLARI */}
          {isReservationClosed ? (
            infoHref ? (
              <Button
                asChild
                className="h-12 w-full rounded-xl btn-dark text-white font-bold text-xs sm:text-sm uppercase tracking-wide shadow-md transition-all gap-2 cursor-pointer"
              >
                <a href={infoHref} target="_blank" rel="noopener noreferrer">
                  <WhatsappIcon className="h-4.5 w-4.5 text-white" />
                  <span>WhatsApp ile Bilgi Al</span>
                </a>
              </Button>
            ) : null
          ) : (
            <>
              {/* ALTTAN AÇILAN PANELİ TETİKLEYEN ANA BUTON */}
              <Button
                onClick={() => setIsDrawerOpen(true)}
                className="h-12 w-full rounded-xl btn-dark text-white font-bold text-xs sm:text-sm uppercase tracking-wide shadow-md transition-all gap-2 cursor-pointer"
              >
                <CalendarIcon className="h-4.5 w-4.5 text-emerald-300" />
                <span>MÜSAİTLİK DURUMU</span>
              </Button>

              {/* SECONDARY ACTION: WHATSAPP İLE BİLGİ AL */}
              {infoHref ? (
                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full rounded-xl border-[#dcd4c8] bg-white text-[#18261e] hover:bg-[#f6f1e8] font-semibold text-xs sm:text-sm transition-all gap-2 cursor-pointer"
                >
                  <a href={infoHref} target="_blank" rel="noopener noreferrer">
                    <WhatsappIcon className="h-4.5 w-4.5 text-[#18261e]" />
                    <span>WhatsApp ile Bilgi Al</span>
                  </a>
                </Button>
              ) : null}
            </>
          )}

          <p className="text-center text-[11px] text-[#777780]">
            {isReservationClosed ? "WhatsApp üzerinden sorularınıza anında yanıt verilir." : "Rezervasyon onayınız ortalama 2 dakika içinde iletilir."}
          </p>
        </CardContent>
      </Card>

      {/* HEADER ALTINA KADAR UZANAN, DÜZ KÖŞELİ (ROUNDED-NONE), AÇILIŞ/KAPANIŞ ANİMASYONLU PANEL */}
      {(isDrawerOpen || isClosing) && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop Overlay (Fade In & Fade Out) */}
          <div
            onClick={closeDrawer}
            className={cn(
              "fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-300",
              isClosing ? "animate-out fade-out-0 duration-300" : "animate-in fade-in-0 duration-300"
            )}
          />

          {/* Header Altına Kadar Uzanan, Köşesiz (rounded-none), Slide Up & Slide Down Animasyonlu Panel */}
          <div
            className={cn(
              "fixed top-16 sm:top-20 bottom-0 inset-x-0 z-50 w-full rounded-none bg-white shadow-2xl flex flex-col border-t border-[#e2dcd2] overflow-hidden",
              isClosing
                ? "animate-out slide-out-to-bottom duration-300 ease-in"
                : "animate-in slide-in-from-bottom duration-300 ease-out"
            )}
          >
            {/* Header Bar */}
            <div className="bg-[#fdfbf7] border-b border-[#f0e8db] px-6 py-4 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-[#18261e] text-base sm:text-lg">
                <CalendarIcon className="h-5 w-5 text-emerald-700" />
                <span>Müsaitlik Durumu — {bungalowName}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-semibold text-[#66666e]">
                  {formatCurrency(nightlyPrice)} / gece
                </span>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-[#18261e] flex items-center justify-center transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 2 SÜTUNLU ÇALIŞMA ALANI (GRID) */}
            <div className="p-6 sm:p-8 overflow-y-auto min-h-0 flex-1">
              <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* SOL SÜTUN: TAKVİM & TARİH SEÇİMİ (lg:col-span-7) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#f0e8db] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#18261e] flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4 text-emerald-700" />
                      1. Tarih Seçimi (Giriş / Çıkış)
                    </span>
                    <span className="text-[11px] text-[#55555e]">
                      Giriş: <strong>{checkInTime}</strong> • Çıkış: <strong>{checkOutTime}</strong>
                    </span>
                  </div>

                  <CustomDateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onSelectRange={handleSelectRange}
                    bookedRanges={bookedRangesList}
                  />
                </div>

                {/* SAĞ SÜTUN: MİSAFİR, EKSTRALAR, HESAPLAMA & WHATSAPP AKSİYONU (lg:col-span-5) */}
                <div className="lg:col-span-5 space-y-5">
                  {/* 2. Misafir Sayısı Seçimi (- Rakam +) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#18261e] block">
                        2. Misafir Sayısı
                      </span>
                      <span className="text-[10px] text-[#66666e] font-medium">
                        (Maks. {capacityLimit} misafir)
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-[#dcd4c8] bg-[#fbf9f6] p-2">
                      <button
                        type="button"
                        disabled={guests <= 1}
                        onClick={() => setGuests((prev) => Math.max(1, prev - 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dcd4c8] bg-white text-[#18261e] font-bold shadow-2xs hover:bg-[#f6f1e8] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        aria-label="Misafir sayısını azalt"
                      >
                        <Minus className="h-4 w-4 text-[#18261e]" />
                      </button>

                      <div className="text-center space-y-0.5 select-none">
                        <span className="text-sm font-extrabold text-[#18261e] block">
                          {guests} Misafir
                        </span>
                        <span className="text-[10px] text-[#777780] block font-medium">
                          Yetişkin & Çocuk
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={guests >= capacityLimit}
                        onClick={() => setGuests((prev) => Math.min(capacityLimit, prev + 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dcd4c8] bg-white text-[#18261e] font-bold shadow-2xs hover:bg-[#f6f1e8] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        aria-label="Misafir sayısını artır"
                      >
                        <Plus className="h-4 w-4 text-[#18261e]" />
                      </button>
                    </div>
                  </div>

                  {/* 3. Ekstra Paket Seçenekleri (yalnız yapılandırılmışsa) */}
                  {availableExtras.length > 0 ? (
                    <div className="rounded-xl border border-[#e8e2d8] bg-[#fdfbf7] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#18261e] flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-amber-600" />
                          3. Ekstra Paket Seçenekleri
                        </span>
                        <span className="text-[10px] text-[#777780]">Opsiyonel</span>
                      </div>

                      <div className="space-y-2">
                        {availableExtras.map((extra) => {
                          const isChecked = selectedExtras.includes(extra.id)
                          return (
                            <div
                              key={extra.id}
                              onClick={() => toggleExtra(extra.id)}
                              className={cn(
                                "flex items-center justify-between rounded-xl border p-2.5 text-xs transition cursor-pointer select-none",
                                isChecked
                                  ? "border-[#18261e] bg-emerald-50/80 font-bold text-[#18261e]"
                                  : "border-[#e2dcd2] bg-white text-[#55555e] hover:border-[#b8af9f]"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <Checkbox
                                  id={`drawer-extra-fullwidth-${extra.id}`}
                                  checked={isChecked}
                                  onCheckedChange={() => toggleExtra(extra.id)}
                                  className="h-4 w-4 rounded border-[#b8af9f] data-[state=checked]:bg-[#18261e]"
                                />
                                <span>{extra.name}</span>
                              </div>
                              <span className="font-bold text-[#18261e]">{formatCurrency(extra.price)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Müsaitlik Kontrol Durumu */}
                  {checking && (
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#66666e]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#18261e]" />
                      <span>Müsaitlik kontrol ediliyor...</span>
                    </p>
                  )}

                  {/* Minimum Gece Uyarısı */}
                  {nights > 0 && !isMinNightsSatisfied && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <span>Bu bungalov için minimum {minNights} gece konaklama kuralı mevcuttur. Lütfen en az {minNights} gece seçiniz.</span>
                    </div>
                  )}

                  {/* Müsaitlik Uyarı Durumu (Sadece Çakışma Halinde Gösterilir) */}
                  {availability && !availability.available && isMinNightsSatisfied ? (
                    <div className="flex items-start gap-2.5 rounded-xl p-3 text-xs font-bold border leading-relaxed border-red-200 bg-red-50 text-red-900">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-600 mt-0.5" />
                      <span>{availability.message}</span>
                    </div>
                  ) : null}

                  {/* Fiyat Özeti Kartı */}
                  {nights > 0 && (
                    <div className="rounded-xl border border-[#e2dcd2] bg-[#fbf9f6] p-4 space-y-2 text-xs text-[#55555e]">
                      <div className="flex items-center justify-between">
                        <span>{formatCurrency(nightlyPrice)} × {nights} gece</span>
                        <span className="font-semibold text-[#18261e]">{formatCurrency(estimatedTotal)}</span>
                      </div>

                      {selectedExtrasFee > 0 && (
                        <div className="flex items-center justify-between text-emerald-900 font-medium">
                          <span>Ekstra paketler ({selectedExtras.length})</span>
                          <span className="font-bold">{formatCurrency(selectedExtrasFee)}</span>
                        </div>
                      )}

                      {serviceFee > 0 && (
                        <div className="flex items-center justify-between border-b border-[#eee8df] pb-2">
                          <span>Hizmet bedeli (%{normalizedServiceFeeRate})</span>
                          <span className="font-semibold text-[#18261e]">{formatCurrency(serviceFee)}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm font-extrabold text-[#18261e] pt-1">
                        <span>Toplam Tutar</span>
                        <span className="text-xl font-extrabold">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                  )}

                  {/* Sağ Sütun Butonu */}
                  {isAvailable && reservationHref ? (
                    <Button
                      asChild
                      className="h-12 w-full rounded-xl btn-dark text-white font-bold text-xs sm:text-sm uppercase tracking-wide shadow-md transition-all gap-2 cursor-pointer"
                    >
                      <a href={reservationHref} target="_blank" rel="noopener noreferrer">
                        <WhatsappIcon className="h-4.5 w-4.5 text-white" />
                        <span>WHATSAPP İLE REZERVASYON TALEP ET</span>
                      </a>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="h-12 w-full rounded-xl bg-slate-200 text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wide cursor-not-allowed shadow-none gap-2"
                    >
                      <Lock className="h-4 w-4 text-[#777780]" />
                      <span>
                        {nights > 0 && !isMinNightsSatisfied
                          ? `MİNİMUM ${minNights} GECE KONAKLAMA`
                          : availability?.available === false
                          ? "SEÇİLEN TARİHTE DOLU"
                          : "MÜSAİT TARİH SEÇİNİZ"}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
