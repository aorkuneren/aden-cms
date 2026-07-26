import { Prisma } from "@/lib/prisma-types"
import { eachNight, toUtcMidnight, DAY_MS } from "./pricing"

export class ReservationConflictError extends Error {
  constructor(public readonly conflictDates: string[]) {
    super(`Seçilen tarihlerde müsait olmayan gün(ler): ${conflictDates.join(", ")}`)
    this.name = "ReservationConflictError"
  }
}

type Tx = Prisma.TransactionClient

function dateKey(d: Date): string {
  const u = toUtcMidnight(d)
  return `${u.getUTCFullYear()}-${u.getUTCMonth()}-${u.getUTCDate()}`
}

export async function reserveDates(
  tx: Tx,
  params: { bungalowId: string; checkIn: Date; checkOut: Date; reservationId: string }
): Promise<void> {
  const nights = eachNight(params.checkIn, params.checkOut)
  if (nights.length === 0) throw new Error("Geçersiz tarih aralığı.")
}

export async function releaseDates(tx: Tx, reservationId: string): Promise<void> {
  void tx
  void reservationId
}
