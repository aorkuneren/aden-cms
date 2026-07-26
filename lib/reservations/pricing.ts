/**
 * Sunucu tarafı rezervasyon fiyat hesabı — SAF fonksiyon (yan etkisiz, testlenebilir).
 * İstemciden gelen tutara asla güvenilmez; tüm hesap burada yapılır.
 */

export type PricingPricePeriod = {
  startDate: Date
  endDate: Date
  nightlyPrice: number
  minStayDays: number
}

export type PricingInput = {
  checkIn: Date
  checkOut: Date
  baseNightlyPrice: number
  pricePeriods: PricingPricePeriod[]
  settingMinStayDays: number
  taxRatePercent: number
  depositAmount: number
  servicesTotal?: number
  discountTotal?: number
}

export type PricingNight = { date: Date; price: number; periodMatched: boolean }

export type PricingResult = {
  nights: number
  perNight: PricingNight[]
  nightlyTotal: number
  servicesTotal: number
  discountTotal: number
  taxTotal: number
  depositAmount: number
  grandTotal: number
  minStayRequired: number
}

export const DAY_MS = 24 * 60 * 60 * 1000

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function toUtcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/** checkIn (dahil) → checkOut (hariç) arasındaki her geceyi UTC gün başında döndürür. */
export function eachNight(checkIn: Date, checkOut: Date): Date[] {
  const start = toUtcMidnight(checkIn).getTime()
  const end = toUtcMidnight(checkOut).getTime()
  const nights: Date[] = []
  for (let t = start; t < end; t += DAY_MS) nights.push(new Date(t))
  return nights
}

function priceForNight(
  night: Date,
  periods: PricingPricePeriod[],
  base: number
): { price: number; minStay: number; matched: boolean } {
  const covering = periods.filter(
    (p) => night >= toUtcMidnight(p.startDate) && night < toUtcMidnight(p.endDate)
  )
  if (covering.length === 0) return { price: base, minStay: 0, matched: false }
  // En spesifik = en geç başlayan periyot
  covering.sort(
    (a, b) => toUtcMidnight(b.startDate).getTime() - toUtcMidnight(a.startDate).getTime()
  )
  return { price: covering[0].nightlyPrice, minStay: covering[0].minStayDays, matched: true }
}

export function calculateReservationPrice(input: PricingInput): PricingResult {
  const nights = eachNight(input.checkIn, input.checkOut)
  const perNight: PricingNight[] = []
  let nightlyTotal = 0
  let minStayRequired = input.settingMinStayDays

  for (const night of nights) {
    const { price, minStay, matched } = priceForNight(
      night,
      input.pricePeriods,
      input.baseNightlyPrice
    )
    nightlyTotal += price
    minStayRequired = Math.max(minStayRequired, minStay)
    perNight.push({ date: night, price: round2(price), periodMatched: matched })
  }

  nightlyTotal = round2(nightlyTotal)
  const servicesTotal = round2(input.servicesTotal ?? 0)
  const discountTotal = round2(input.discountTotal ?? 0)
  const taxable = Math.max(0, nightlyTotal + servicesTotal - discountTotal)
  const taxTotal = round2((taxable * input.taxRatePercent) / 100)
  const depositAmount = round2(input.depositAmount ?? 0)
  const grandTotal = round2(nightlyTotal + servicesTotal + taxTotal - discountTotal)

  return {
    nights: nights.length,
    perNight,
    nightlyTotal,
    servicesTotal,
    discountTotal,
    taxTotal,
    depositAmount,
    grandTotal,
    minStayRequired,
  }
}
