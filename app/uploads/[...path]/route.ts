import { createReadStream } from "node:fs"
import fs from "node:fs/promises"
import { Readable } from "node:stream"
import { NextResponse } from "next/server"
import {
  guessMimeType,
  parseByteRange,
  resolveSafeUploadFilePath,
  shouldForceDownload,
  type ByteRange,
} from "@/lib/media/serve"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NOT_FOUND_CODES = new Set(["ENOENT", "EISDIR", "ENOTDIR", "ELOOP", "EACCES", "EPERM", "ENAMETOOLONG"])

function streamFile(abs: string, range?: ByteRange): ReadableStream {
  const nodeStream = createReadStream(abs, range ? { start: range.start, end: range.end } : undefined)
  return Readable.toWeb(nodeStream) as ReadableStream
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  let abs: string | null = null
  let filename = "file"

  try {
    const { path: segments } = await context.params
    filename = segments[segments.length - 1] || "file"
    abs = await resolveSafeUploadFilePath(segments)
  } catch (err) {
    console.error("[uploads] path resolve failed", err)
    return new NextResponse("Not Found", { status: 404 })
  }

  if (!abs) return new NextResponse("Not Found", { status: 404 })

  try {
    const stat = await fs.stat(abs)
    if (!stat.isFile()) return new NextResponse("Not Found", { status: 404 })

    const headers: Record<string, string> = {
      "Content-Type": guessMimeType(filename),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
    }
    if (shouldForceDownload(filename)) {
      headers["Content-Disposition"] = "attachment"
    }

    const range = parseByteRange(request.headers.get("range"), stat.size)

    if (range === "unsatisfiable") {
      return new NextResponse("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${stat.size}`, "Accept-Ranges": "bytes" },
      })
    }

    if (range) {
      return new NextResponse(streamFile(abs, range), {
        status: 206,
        headers: {
          ...headers,
          "Content-Range": `bytes ${range.start}-${range.end}/${stat.size}`,
          "Content-Length": String(range.end - range.start + 1),
        },
      })
    }

    return new NextResponse(streamFile(abs), {
      status: 200,
      headers: { ...headers, "Content-Length": String(stat.size) },
    })
  } catch (err: any) {
    if (NOT_FOUND_CODES.has(err?.code)) {
      return new NextResponse("Not Found", { status: 404 })
    }
    console.error("[uploads] serve failed", abs, err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
