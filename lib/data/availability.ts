import { bungalovQueries } from "@/lib/data/queries"

export interface NightPriceInfo {
  date: string // YYYY-MM-DD
  price: number
  isCustomPeriod: boolean
}

export interface BungalowAvailabilityResult {
  bungalowId: string
  checkIn: string
  checkOut: string
  totalNights: number
  isAvailable: boolean
  blockedDates: string[]
  baseNightlyPrice: number
  totalPrice: number
  averageNightlyPrice: number
  nightlyBreakdown: NightPriceInfo[]
  minStayDays: number
  meetsMinStay: boolean
}

interface AvailabilityRecord {
  id?: string
  date?: string | Date
  status?: string
}

/**
 * Belirli bir bungalov ve tarih aralığı için mock fiyat ve müsaitlik hesaplar.
 */
export async function checkBungalowAvailability(
  bungalowId: string,
  checkInDate: Date,
  checkOutDate: Date
): Promise<BungalowAvailabilityResult> {
  const bungalow = await bungalovQueries.findUnique(bungalowId)

  if (!bungalow) {
    return {
      bungalowId,
      checkIn: checkInDate.toISOString().split("T")[0],
      checkOut: checkOutDate.toISOString().split("T")[0],
      totalNights: 0,
      isAvailable: false,
      blockedDates: [],
      baseNightlyPrice: 0,
      totalPrice: 0,
      averageNightlyPrice: 0,
      nightlyBreakdown: [],
      minStayDays: 1,
      meetsMinStay: false,
    }
  }

  const basePrice = Number(bungalow.nightlyPrice || 4500)

  // Gece listesi üret
  const dates: Date[] = []
  const current = new Date(checkInDate)
  while (current < checkOutDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const totalNights = dates.length
  const dateStrings = dates.map((d) => d.toISOString().split("T")[0])

  const availabilityRecords: AvailabilityRecord[] = []
  const blockedDates = availabilityRecords
    .filter((r: AvailabilityRecord) => r.status === "BLOCKED" || r.status === "RESERVED")
    .map((r: AvailabilityRecord) => String(r.date).split("T")[0])

  const isAvailable = true
  const maxMinStay = 1
  let totalPrice = 0
  const nightlyBreakdown: NightPriceInfo[] = []

  for (const dateObj of dates) {
    const dateStr = dateObj.toISOString().split("T")[0]
    totalPrice += basePrice
    nightlyBreakdown.push({
      date: dateStr,
      price: basePrice,
      isCustomPeriod: false,
    })
  }

  const averageNightlyPrice = totalNights > 0 ? totalPrice / totalNights : basePrice
  const meetsMinStay = totalNights >= maxMinStay

  return {
    bungalowId,
    checkIn: checkInDate.toISOString().split("T")[0],
    checkOut: checkOutDate.toISOString().split("T")[0],
    totalNights,
    isAvailable,
    blockedDates,
    baseNightlyPrice: basePrice,
    totalPrice,
    averageNightlyPrice,
    nightlyBreakdown,
    minStayDays: maxMinStay,
    meetsMinStay,
  }
}
