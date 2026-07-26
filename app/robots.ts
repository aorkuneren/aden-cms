import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const noindex =
    process.env.SEO_NOINDEX === "true" || process.env.VERCEL_ENV === "preview"

  if (noindex) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/hesabim", "/api/"],
    },
    sitemap: "https://www.adenbungalov.com/sitemap.xml",
    host: "https://www.adenbungalov.com",
  }
}
