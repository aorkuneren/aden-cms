import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const reservationRequestSchema = z.object({
  bungalovId: z.string().min(1, "Bungalov seçilmelidir."),
  checkIn: z.string().min(1, "Giriş tarihi gereklidir."),
  checkOut: z.string().min(1, "Çıkış tarihi gereklidir."),
  guestName: z.string().min(2, "Lütfen adınızı girin.").max(100),
  guestPhone: z.string().min(5, "Lütfen telefon numaranızı girin.").max(30),
  guestEmail: z.string().email().optional().or(z.literal("")),
  guestCount: z.coerce.number().int().positive().optional(),
  message: z.string().optional(),
  honeypot: z.string().optional(),
})

function generateReservationCode() {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ADN-${stamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    
    const parsed = reservationRequestSchema.safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(" ")
      return NextResponse.json({ error: errorMsg }, { status: 422 })
    }

    if (parsed.data.honeypot && parsed.data.honeypot.trim().length > 0) {
      return NextResponse.json({ error: "Spam enjeksiyonu tespit edildi." }, { status: 400 })
    }

    if (parsed.data.checkOut <= parsed.data.checkIn) {
      return NextResponse.json({ error: "Çıkış tarihi giriş tarihinden sonra olmalıdır." }, { status: 400 })
    }

    const reservationCode = generateReservationCode()

    return NextResponse.json(
      {
        success: true,
        message: "Rezervasyon talebiniz başarıyla alındı. Müşteri temsilcimiz kısa süre içinde sizi arayacaktır.",
        request: {
          id: "mock-res-" + Math.random().toString(36).slice(2, 8),
          reservationCode,
          shortId: reservationCode.slice(-4),
          status: "PENDING",
          source: "WEB_SITE",
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
