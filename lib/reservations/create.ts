import { Prisma } from "@/lib/prisma-types"
import { calculateReservationPrice, round2, toUtcMidnight } from "./pricing"
import { generateReservationCode } from "./code"

export type CreateReservationInput = {
  bungalowId: string
  customerId?: string | null
  inquiryId?: string | null
  guestName: string
  guestPhone: string
  guestEmail?: string | null
  checkIn: Date
  checkOut: Date
  adults: number
  children?: number
  infants?: number
  channel?: "WEB" | "PHONE" | "WHATSAPP" | "WALK_IN" | "ADMIN"
  servicesTotal?: number
  discountTotal?: number
  couponCode?: string | null
  note?: string | null
  staffNote?: string | null
  idempotencyKey?: string | null
  createdByUserId?: string | null
}

export async function createReservation(input: CreateReservationInput) {
  const checkIn = toUtcMidnight(input.checkIn)
  const checkOut = toUtcMidnight(input.checkOut)
  if (checkOut.getTime() <= checkIn.getTime()) {
    throw new Error("Çıkış tarihi giriş tarihinden sonra olmalıdır.")
  }

  const code = generateReservationCode()
  return {
    id: "mock-res-" + Math.random().toString(36).slice(2, 8),
    code,
    bungalowId: input.bungalowId,
    guestName: input.guestName,
    guestPhone: input.guestPhone,
    checkIn,
    checkOut,
    status: "PRE_RESERVED",
  }
}
