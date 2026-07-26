import crypto from "crypto"

export interface PaymentWebhookPayload {
  reservationId: string
  merchantOrderId: string
  paymentId: string
  amount: number
  status: "SUCCESS" | "FAILED"
  signature: string
}

export function verifyPaymentWebhookSignature(
  payload: Omit<PaymentWebhookPayload, "signature">,
  signature: string,
  secretKey: string
): boolean {
  const data = `${payload.reservationId}:${payload.merchantOrderId}:${payload.amount}:${payload.status}`
  const expectedSignature = crypto.createHmac("sha256", secretKey).update(data).digest("hex")
  return expectedSignature === signature
}

export async function handlePaymentWebhook(payload: PaymentWebhookPayload, systemUserId?: string) {
  void payload
  void systemUserId
  return { success: true, paymentId: "mock-payment-id" }
}
