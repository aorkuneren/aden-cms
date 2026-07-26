import { NextRequest, NextResponse } from "next/server"
import { checkBungalowAvailability } from "@/lib/data/availability"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bungalowId } = await params
    const { searchParams } = new URL(request.url)
    const checkInStr = searchParams.get("checkIn")
    const checkOutStr = searchParams.get("checkOut")

    if (!checkInStr || !checkOutStr) {
      return NextResponse.json({ error: "Giriş ve çıkış tarihleri gereklidir." }, { status: 400 })
    }

    if (checkOutStr <= checkInStr) {
      return NextResponse.json(
        { available: false, error: "Çıkış tarihi giriş tarihinden sonra olmalıdır." },
        { status: 400 }
      )
    }

    const checkIn = new Date(checkInStr)
    const checkOut = new Date(checkOutStr)

    const result = await checkBungalowAvailability(bungalowId, checkIn, checkOut)

    if (!result.meetsMinStay) {
      return NextResponse.json({
        available: false,
        message: `Bu tarihler için minimum konaklama süresi ${result.minStayDays} gecedir.`,
        result,
      })
    }

    if (!result.isAvailable) {
      return NextResponse.json({
        available: false,
        message: `Seçilen tarihlerde dolu/bloke gün bulunmaktadır (${result.blockedDates.join(", ")}).`,
        result,
      })
    }

    return NextResponse.json({
      available: true,
      message: "Seçilen tarih aralığı müsait.",
      result,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Müsaitlik kontrol hatası"
    return NextResponse.json({ available: false, error: msg }, { status: 500 })
  }
}
