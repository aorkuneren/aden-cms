import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Kişiye özel / indekslenmemesi gereken alanlar.
      // /giris ve /kayit-ol herkese açık dönüşüm sayfaları olduğu için taranabilir.
      disallow: ["/admin/", "/hesabim", "/api/"],
    },
    sitemap: "https://www.adenbungalov.com/sitemap.xml",
    host: "https://www.adenbungalov.com",
  }
}
