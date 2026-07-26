import { NextResponse } from "next/server"
import { resolveRedirect } from "@/lib/seo/seo-redirect-service"
import { normalizePath } from "@/lib/seo/path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = normalizePath(searchParams.get("path") || "")
  const hit = await resolveRedirect(path)
  if (!hit) {
    return NextResponse.json({ redirect: null })
  }
  return NextResponse.json({
    redirect: { toPath: hit.toPath, statusCode: hit.statusCode },
  })
}
