import { NextResponse } from "next/server"

/**
 * MOCK — döviz kurları.
 * Gerçek uçta canlı kur servisi çağrılıyordu. Burada sabit, makul kurlar
 * döndürülür. Değerler TRY bazlıdır (1 TRY karşılığı).
 */
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    TRY: 1,
    USD: 0.029,
    EUR: 0.027,
    GBP: 0.023,
  })
}
