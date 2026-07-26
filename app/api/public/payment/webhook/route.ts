import { NextResponse } from "next/server"
import { handlePaymentWebhook } from "@/lib/payment/webhook"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reservationId, merchantOrderId, paymentId, amount, status } = body

    if (!reservationId || !amount || !status) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 })
    }

    const result = await handlePaymentWebhook({
      reservationId,
      merchantOrderId: merchantOrderId || reservationId,
      paymentId: paymentId || `PAY-${Date.now()}`,
      amount: parseFloat(amount),
      status: status === "SUCCESS" ? "SUCCESS" : "FAILED",
      signature: "mock_signature",
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Webhook işlenemedi" }, { status: 500 })
  }
}
