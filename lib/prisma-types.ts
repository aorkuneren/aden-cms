export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
export type PaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER" | "CASH"
export type PaymentType = "DEPOSIT" | "REMAINING" | "FULL"
export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP"
export type NotificationStatus = "PENDING" | "SENT" | "FAILED"

export namespace Prisma {
  export type TransactionClient = any
}
