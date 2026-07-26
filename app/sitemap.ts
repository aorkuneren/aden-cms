import type { MetadataRoute } from "next"
import { bungalovQueries, settingsQueries } from "@/lib/data/queries"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await settingsQueries.findFirst().catch(() => null)
  const baseUrl = (settings?.website || "https://www.adenbungalov.com").replace(/\/+$/, "")

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/bungalovlarimiz`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/galeri`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kurumsal`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/iletisim`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/giris`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/kayit-ol`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sifremi-unuttum`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    // /hesabim kişiye özel içerik barındırdığı için sitemap dışında bırakıldı (noindex).
  ]

  // Dynamic bungalow detail routes
  try {
    const bungalows = await bungalovQueries.findMany({ status: "AKTIF" })
    const bungalowRoutes: MetadataRoute.Sitemap = bungalows.map((b) => ({
      url: `${baseUrl}/bungalovlarimiz/${b.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }))

    return [...staticRoutes, ...bungalowRoutes]
  } catch (error) {
    console.error("Failed to fetch bungalows for sitemap:", error)
    return staticRoutes
  }
}
