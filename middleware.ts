import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads")
  ) {
    return NextResponse.next()
  }

  try {
    const lookupUrl = new URL("/api/seo/redirect-lookup", request.nextUrl.origin)
    lookupUrl.searchParams.set("path", pathname)
    const res = await fetch(lookupUrl, { next: { revalidate: 30 } })
    if (!res.ok) return NextResponse.next()
    const data = (await res.json()) as {
      redirect: { toPath: string; statusCode: 301 | 302 } | null
    }
    if (!data.redirect) return NextResponse.next()
    const target = new URL(data.redirect.toPath, request.nextUrl.origin)
    return NextResponse.redirect(target, data.redirect.statusCode)
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
