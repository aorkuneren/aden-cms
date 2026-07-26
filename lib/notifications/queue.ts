import type { NotificationChannel, NotificationStatus } from "@/lib/prisma-types"

export type QueueNotificationInput = {
  channel: NotificationChannel
  recipient: string
  subject?: string
  body: string
  templateKey?: string
  payload?: Record<string, unknown>
  reservationId?: string
  inquiryId?: string
}

export async function queueNotification(input: QueueNotificationInput) {
  void input
  return null
}
