import { NextRequest, NextResponse } from "next/server"

/**
 * MOCK — kupon doğrulama.
 * Demo amaçlı iki sabit kod tanınır; diğer her kod geçersiz döner.
 */
export const dynamic = "force-dynamic"

const DEMO_COUPONS: Record<string, { discountAmount: number; discountType: "PERCENT" | "FIXED" }> = {
  ADEN10: { discountAmount: 10, discountType: "PERCENT" },
  HOSGELDIN500: { discountAmount: 500, discountType: "FIXED" },
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const code = String((body as { code?: string } | null)?.code || "").trim().toUpperCase()

  if (!code) {
    return NextResponse.json({ valid: false, error: "Kupon kodu giriniz." }, { status: 400 })
  }

  const coupon = DEMO_COUPONS[code]
  if (!coupon) {
    return NextResponse.json({ valid: false, error: "Kupon kodu geçersiz." })
  }

  return NextResponse.json({ valid: true, ...coupon })
}
