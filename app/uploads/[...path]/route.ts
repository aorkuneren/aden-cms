import fs from "fs/promises"
import { NextResponse } from "next/server"
import { guessMimeType, resolveSafeUploadFilePath } from "@/lib/media/serve"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params
  const abs = await resolveSafeUploadFilePath(segments)
  if (!abs) {
    return new NextResponse("Not Found", { status: 404 })
  }

  try {
    const data = await fs.readFile(abs)
    const filename = segments[segments.length - 1] || "file"
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": guessMimeType(filename),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (err: any) {
    if (err?.code === "ENOENT" || err?.code === "EISDIR") {
      return new NextResponse("Not Found", { status: 404 })
    }
    console.error("[uploads] serve failed", abs, err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
