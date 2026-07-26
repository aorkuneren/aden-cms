"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Clock, Info, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

export type BookedRange = {
  start: string // YYYY-MM-DD (Check-in at 14:00)
  end: string // YYYY-MM-DD (Check-out at 11:00)
  label: string
}

export const SAMPLE_BOOKED_RANGES: BookedRange[] = [
  { start: "2026-08-03", end: "2026-08-09", label: "03 - 09 Ağustos 2026" },
  { start: "2026-08-12", end: "2026-08-15", label: "12 - 15 Ağustos 2026" },
  { start: "2026-08-22", end: "2026-08-23", label: "22 - 23 Ağustos 2026" },
]

type CustomDateRangePickerProps = {
  checkIn: string
  checkOut: string
  onSelectRange: (checkIn: string, checkOut: string) => void
  bookedRanges?: BookedRange[]
}

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
]

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

function formatISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Gece konaklaması dolu mu? (Giriş 14:00, Çıkış 11:00 kuralına göre) */
function isNightBooked(dateStr: string, ranges: BookedRange[]): boolean {
  return ranges.some((range) => dateStr >= range.start && dateStr < range.end)
}

/** İki aralık çakışıyor mu? (Devir günleri saat 11:00/14:00 farkından dolayı çakışmaz) */
function rangeOverlapsBooked(startStr: string, endStr: string, ranges: BookedRange[]): boolean {
  return ranges.some((range) => startStr < range.end && endStr > range.start)
}

/** Gün bir önceki rezervasyonun çıkış günü mü? (Saat 14:00 sonrası yeni giriş yapılabilir) */
function isCheckoutTurnoverDay(dateStr: string, ranges: BookedRange[]): boolean {
  return ranges.some((range) => range.end === dateStr && !isNightBooked(dateStr, ranges))
}

/** Gün bir sonraki rezervasyonun giriş günü mü? (Saat 11:00'e kadar çıkış günü yapılabilir) */
function isCheckinTurnoverDay(dateStr: string, ranges: BookedRange[]): boolean {
  return ranges.some((range) => range.start === dateStr)
}

export function CustomDateRangePicker({
  checkIn,
  checkOut,
  onSelectRange,
  bookedRanges = SAMPLE_BOOKED_RANGES,
}: CustomDateRangePickerProps) {
  const initialDate = checkIn ? new Date(`${checkIn}T00:00:00`) : new Date(2026, 7, 1)
  const [viewDate, setViewDate] = useState<Date>(
    Number.isNaN(initialDate.getTime()) ? new Date(2026, 7, 1) : initialDate
  )

  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  let startOffset = firstDayOfMonth.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const todayStr = formatISO(new Date())

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleDayClick = (dateStr: string) => {
    setWarning(null)

    if (dateStr < todayStr) {
      setWarning("Geçmiş bir tarih seçemezsiniz.")
      return
    }

    const isSelectingCheckIn = !checkIn || (checkIn && checkOut) || (checkIn && dateStr <= checkIn)

    if (isSelectingCheckIn) {
      // Giriş tarihi seçilirken o günün gecesinin boş olması gerekir.
      if (isNightBooked(dateStr, bookedRanges)) {
        setWarning("Bu gece doludur. Lütfen yeşil ile gösterilen müsait bir giriş günü seçiniz.")
        return
      }
      onSelectRange(dateStr, "")
    } else {
      // Çıkış tarihi seçilirken (dateStr > checkIn)
      // dateStr gününün saat 11:00'e kadar olan süresi çıkış için kullanılabilir (Örn: 3 Ağustos Çıkış 11:00).
      // Bu yüzden sadece [checkIn, dateStr] aralığında çakışan dolu geceler olup olmadığı kontrol edilir:
      if (rangeOverlapsBooked(checkIn, dateStr, bookedRanges)) {
        setWarning("Seçtiğiniz tarih aralığında dolu geceler var. Lütfen çakışmayan bir aralık seçiniz.")
        return
      }
      onSelectRange(checkIn, dateStr)
    }
  }

  return (
    <div className="w-full rounded-2xl border border-[#e2dcd2] bg-white p-4 shadow-lg space-y-3.5">
      {/* Legend & Policy Header - Single Clean Row */}
      <div className="border-b border-[#f0e8db] pb-3 text-[11px]">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-[#18261e] font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" />
              Müsait
            </span>
            <span className="flex items-center gap-1 text-red-700 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
              Dolu
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[#18261e] px-1.5 py-0.5 font-bold text-emerald-300 text-[10px]">
              Giriş 14:00
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[#18261e] px-1.5 py-0.5 font-bold text-amber-300 text-[10px]">
              Çıkış 11:00
            </span>
          </div>

          <span className="text-[10px] text-[#66666e] font-medium flex items-center gap-1">
            <Clock className="h-3 w-3 text-emerald-700 shrink-0" />
            Devir saatleri geçerlidir
          </span>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="touch-target p-1.5 rounded-lg border border-[#dcd4c8] hover:bg-[#f6f1e8] text-[#18261e] transition cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-sm font-bold text-[#18261e]">
          {MONTH_NAMES[month]} {year}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="touch-target p-1.5 rounded-lg border border-[#dcd4c8] hover:bg-[#f6f1e8] text-[#18261e] transition cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Warning Box */}
      {warning && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-800 flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {DAY_NAMES.map((d) => (
          <span key={d} className="py-1 text-[11px] font-bold uppercase text-[#777780]">
            {d}
          </span>
        ))}

        {Array.from({ length: startOffset }).map((_, i) => (
          <span key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1
          const dateObj = new Date(year, month, dayNum)
          const dateStr = formatISO(dateObj)

          const isPast = dateStr < todayStr
          const isBooked = isNightBooked(dateStr, bookedRanges)
          const isCheckoutTurnover = isCheckoutTurnoverDay(dateStr, bookedRanges)
          const isCheckinTurnover = isCheckinTurnoverDay(dateStr, bookedRanges)
          const isCheckIn = dateStr === checkIn
          const isCheckOut = dateStr === checkOut
          const isInSelectedRange = Boolean(
            checkIn && checkOut && dateStr >= checkIn && dateStr <= checkOut
          )
          const isInHoverRange = Boolean(
            checkIn && !checkOut && hoverDate && dateStr >= checkIn && dateStr <= hoverDate
          )

          // Is this day clickable as Check-Out when checkIn is currently active?
          const isClickableAsCheckOut = Boolean(
            checkIn &&
              !checkOut &&
              dateStr > checkIn &&
              !rangeOverlapsBooked(checkIn, dateStr, bookedRanges)
          )

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast}
              onClick={() => handleDayClick(dateStr)}
              onMouseEnter={() => setHoverDate(dateStr)}
              onMouseLeave={() => setHoverDate(null)}
              className={cn(
                "h-10 w-full rounded-lg text-xs font-semibold transition relative flex flex-col items-center justify-center cursor-pointer select-none py-0.5",
                // Past dates
                isPast && "text-slate-300 cursor-not-allowed opacity-50",

                // Booked Nights (Red & Line through) - Unless clicking as a valid Check-Out date
                isBooked &&
                  !isPast &&
                  !isClickableAsCheckOut &&
                  "bg-red-100 text-red-800 font-bold border border-red-300 line-through cursor-not-allowed hover:bg-red-200",

                // Booked night start day, but currently valid as Check-Out (e.g. 3 Ağustos Çıkış 11:00)
                isBooked &&
                  isClickableAsCheckOut &&
                  !isInSelectedRange &&
                  !isCheckIn &&
                  !isCheckOut &&
                  "bg-[#edf4ed] text-emerald-900 border border-emerald-400 font-bold hover:bg-emerald-200",

                // Turnover Checkout Day (Open for Check-In at 14:00!)
                isCheckoutTurnover &&
                  !isBooked &&
                  !isPast &&
                  !isInSelectedRange &&
                  !isCheckIn &&
                  !isCheckOut &&
                  "bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold hover:bg-emerald-100",

                // Regular available dates
                !isPast &&
                  !isBooked &&
                  !isCheckoutTurnover &&
                  !isInSelectedRange &&
                  !isCheckIn &&
                  !isCheckOut &&
                  "bg-emerald-50/50 text-[#18261e] border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-300",

                // Selected range
                isInSelectedRange &&
                  !isCheckIn &&
                  !isCheckOut &&
                  "bg-[#edf4ed] text-[#18261e] border-y border-[#c3d9c3]",

                // Hover preview
                isInHoverRange &&
                  !isCheckIn &&
                  "bg-emerald-100/70 text-[#18261e]",

                // Check-in or Check-out date (PROMINENT EMPHASIS)
                (isCheckIn || isCheckOut) &&
                  "bg-[#18261e] text-white font-extrabold shadow-sm ring-2 ring-[#18261e] z-10 hover:bg-[#111c16]"
              )}
            >
              <span className="text-xs font-extrabold">{dayNum}</span>

              {/* GİRİŞ VURGUSU */}
              {isCheckIn && (
                <span className="text-[8px] leading-none uppercase font-extrabold tracking-tight text-emerald-300 -mt-0.5">
                  GİRİŞ
                </span>
              )}

              {/* ÇIKIŞ VURGUSU */}
              {isCheckOut && (
                <span className="text-[8px] leading-none uppercase font-extrabold tracking-tight text-amber-300 -mt-0.5">
                  ÇIKIŞ
                </span>
              )}

              {/* Booked night lock icon (if not selected as Check-Out) */}
              {isBooked && !isPast && !isCheckOut && !isClickableAsCheckOut && (
                <Lock className="h-2.5 w-2.5 absolute top-0.5 right-0.5 text-red-600" />
              )}

              {/* Devir Günü İndikatörleri */}
              {isCheckoutTurnover && !isBooked && !isPast && !isCheckIn && !isCheckOut && (
                <span className="text-[8px] leading-none text-emerald-700 font-extrabold -mt-0.5">
                  14:00+
                </span>
              )}

              {isCheckinTurnover && isClickableAsCheckOut && !isCheckOut && (
                <span className="text-[8px] leading-none text-amber-700 font-extrabold -mt-0.5">
                  -11:00
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
