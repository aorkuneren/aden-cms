import type { ReservationStatus } from "@/lib/prisma-types"

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  OFFER: ["PRE_RESERVED", "CANCELLED"],
  PRE_RESERVED: ["PAYMENT_PENDING", "CONFIRMED", "CANCELLED"],
  PAYMENT_PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKIN_PENDING", "CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKIN_PENDING: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["CHECKED_OUT", "COMPLETED"],
  CHECKED_OUT: ["COMPLETED", "REFUND_PENDING"],
  COMPLETED: [],
  CANCELLED: ["REFUND_PENDING", "REFUNDED"],
  NO_SHOW: ["REFUND_PENDING", "REFUNDED"],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
}

export function isValidStatusTransition(
  fromStatus: ReservationStatus,
  toStatus: ReservationStatus
): boolean {
  if (fromStatus === toStatus) return true
  const allowed = ALLOWED_STATUS_TRANSITIONS[fromStatus] || []
  return allowed.includes(toStatus)
}

export async function transitionReservationStatus(
  reservationId: string,
  toStatus: ReservationStatus,
  byUserId?: string,
  note?: string
) {
  void reservationId
  void toStatus
  void byUserId
  void note
  return null
}

export async function syncReservationCalendarSlots(
  reservationId: string,
  status: "RESERVED" | "BLOCKED" = "RESERVED",
  note?: string
) {
  void reservationId
  void status
  void note
}

export async function clearReservationCalendarSlots(reservationId: string) {
  void reservationId
}
