"use client"

import { useState } from "react"
import { ArrowRight, CalendarCheck2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { todayIsoDate } from "@/lib/form-validation"
import { cn } from "@/lib/utils"

type ReservationSearchCardProps = {
  action?: string
  method?: "GET" | "POST"
  submitLabel?: string
  className?: string
  defaultValues?: {
    checkIn?: string
    checkOut?: string
    adults?: number
    children?: number
  }
  hiddenFields?: Record<string, string>
}

export function ReservationSearchCard({
  action = "/bungalovlarimiz",
  method = "GET",
  submitLabel = "Müsaitlik Kontrol Et",
  className,
  defaultValues,
  hiddenFields,
}: ReservationSearchCardProps) {
  const today = todayIsoDate()
  const [checkIn, setCheckIn] = useState(defaultValues?.checkIn || "")
  const [checkOut, setCheckOut] = useState(defaultValues?.checkOut || "")
  const minCheckOut = checkIn ? nextDay(checkIn) : today

  return (
    <div className={cn("rounded-2xl border border-[#e2dcd2] bg-white shadow-2xs overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#f0e8db] px-5 py-3.5">
        <CalendarCheck2 className="h-4 w-4 text-emerald-700" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#18261e]">Müsaitlik Kontrolü</span>
      </div>

      {/* Form Fields */}
      <form action={action} method={method} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_1fr_0.7fr_0.7fr_auto] md:items-end">
        {hiddenFields
          ? Object.entries(hiddenFields).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))
          : null}

        {/* Giriş Tarihi */}
        <div className="space-y-1.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#777780]">Giriş Tarihi</span>
          <input
            id="checkIn"
            name="checkIn"
            type="date"
            required
            min={today}
            value={checkIn}
            onChange={(event) => {
              const value = event.target.value
              setCheckIn(value)
              if (checkOut && value && checkOut <= value) setCheckOut("")
            }}
            className="h-10 w-full rounded-xl border border-[#dcd4c8] bg-[#fbf9f6] px-3 text-xs font-semibold text-[#18261e] focus:outline-none focus:border-[#18261e] transition cursor-pointer"
          />
        </div>

        {/* Çıkış Tarihi */}
        <div className="space-y-1.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#777780]">Çıkış Tarihi</span>
          <input
            id="checkOut"
            name="checkOut"
            type="date"
            required
            min={minCheckOut}
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            className="h-10 w-full rounded-xl border border-[#dcd4c8] bg-[#fbf9f6] px-3 text-xs font-semibold text-[#18261e] focus:outline-none focus:border-[#18261e] transition cursor-pointer"
          />
        </div>

        {/* Yetişkin */}
        <div className="space-y-1.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#777780]">Yetişkin</span>
          <input
            id="adults"
            name="adults"
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            step={1}
            defaultValue={defaultValues?.adults || 2}
            className="h-10 w-full rounded-xl border border-[#dcd4c8] bg-[#fbf9f6] px-3 text-xs font-semibold text-[#18261e] focus:outline-none focus:border-[#18261e] transition"
          />
        </div>

        {/* Çocuk */}
        <div className="space-y-1.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#777780]">Çocuk</span>
          <input
            id="children"
            name="children"
            type="number"
            inputMode="numeric"
            min={0}
            max={8}
            step={1}
            defaultValue={defaultValues?.children || 0}
            className="h-10 w-full rounded-xl border border-[#dcd4c8] bg-[#fbf9f6] px-3 text-xs font-semibold text-[#18261e] focus:outline-none focus:border-[#18261e] transition"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="h-10 w-full rounded-xl btn-dark text-white text-xs font-bold uppercase tracking-wide px-5 gap-1.5 shadow-sm cursor-pointer md:w-auto"
        >
          <CalendarCheck2 className="h-3.5 w-3.5 shrink-0" />
          <span>{submitLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </Button>
      </form>
    </div>
  )
}

/** YYYY-MM-DD biçimindeki tarihin bir gün sonrası. */
function nextDay(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`)
  date.setDate(date.getDate() + 1)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}
