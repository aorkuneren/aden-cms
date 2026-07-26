import type { PaymentMethod, PaymentType } from "@/lib/prisma-types"

export async function addReservationPayment(params: {
  reservationId: string
  amount: number
  paymentType: PaymentType
  paymentMethod: PaymentMethod
  transactionId?: string
  note?: string
  recordedByUserId?: string
}) {
  void params
  return null
}
