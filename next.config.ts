import type { NextConfig } from "next"

// Content-Security-Policy — Faz 1'de REPORT-ONLY olarak devreye alınır.
// Report-only asla engellemez; yalnız ihlalleri tarayıcı konsoluna bildirir.
// Google Maps iframe, Unsplash görselleri ve inline JSON-LD script'leri kapsar.
// İleride (test sonrası) enforce moduna alınacaktır.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "frame-src https://www.google.com https://maps.google.com https://*.google.com",
  "connect-src 'self' https:",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ")

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
]

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
      { protocol: "https", hostname: "www.adenbungalov.com", pathname: "/**" },
      { protocol: "https", hostname: "adenbungalov.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Yönetim paneli arama motorlarından gizlenir (robots.txt + header).
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ]
  },
  turbopack: {},
}

export default nextConfig
