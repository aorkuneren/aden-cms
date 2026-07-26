import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { logAuditEvent } from "@/lib/audit"
import { createInquiry } from "@/lib/site/inquiries"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const contactSchema = z.object({
  type: z.enum(["CONTACT", "COMPLAINT", "REQUEST", "SUGGESTION"]).optional(),
  name: z.string().min(2, "Lütfen adınızı girin.").max(100),
  phone: z.string().max(30).optional(),
  email: z
    .string()
    .email("Geçerli bir e-posta adresi girin.")
    .max(191)
    .optional()
    .or(z.literal("")),
  subject: z.string().max(200).optional(),
  message: z.string().min(5, "Lütfen mesajınızı yazın.").max(2000),
  honeypot: z.string().optional(),
})

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || null
  return request.headers.get("x-real-ip")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)

    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(" ")
      return NextResponse.json({ error: errorMsg }, { status: 422 })
    }

    // Bot tuzağı: gizli alan doluysa başarı taklit et, ama kaydetme.
    if (parsed.data.honeypot && parsed.data.honeypot.trim().length > 0) {
      return NextResponse.json({
        success: true,
        message: "İletişim talebiniz başarıyla alındı.",
      })
    }

    const inquiry = await createInquiry({
      type: parsed.data.type,
      name: parsed.data.name,
      email: parsed.data.email ?? "",
      phone: parsed.data.phone ?? "",
      subject: parsed.data.subject ?? "",
      message: parsed.data.message,
      ip: clientIp(request),
    })

    await logAuditEvent({
      action: "Yeni iletişim mesajı alındı",
      entityType: "inquiry",
      entityId: inquiry.id,
      details: { type: inquiry.type, name: inquiry.name },
      ip: inquiry.ip,
    })

    return NextResponse.json({
      success: true,
      inquiryId: inquiry.id,
      message: "İletişim talebiniz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.",
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
