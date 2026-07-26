import type { MetadataRoute } from "next"
import { settingsQueries } from "@/lib/data/queries"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await settingsQueries.findFirst()

  const appName = settings?.companyName || "Aden Bungalov"
  const shortName = appName.length > 12 ? appName.slice(0, 12) : appName
  const logoIcon = settings?.companyLogo || settings?.themeLogoUrl || null

  const baseIcons = [
    {
      src: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "/icons/maskable-icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable" as const,
    },
  ] satisfies NonNullable<MetadataRoute.Manifest["icons"]>

  const icons: NonNullable<MetadataRoute.Manifest["icons"]> = logoIcon
    ? [
        {
          src: logoIcon,
          sizes: "512x512",
          type: "image/png",
          purpose: "any" as const,
        },
        ...baseIcons,
      ]
    : baseIcons

  return {
    id: "/",
    name: `${appName} | Sapanca Bungalov`,
    short_name: shortName,
    description:
      "Aden Bungalov B2C web uygulaması: müsaitlik kontrolü, rezervasyon talebi ve hızlı iletişim.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#f6f3ee",
    theme_color: "#1f3a2e",
    lang: "tr",
    orientation: "portrait",
    categories: ["travel", "lifestyle", "booking"],
    shortcuts: [
      {
        name: "Müsaitlik Kontrol Et",
        short_name: "Müsaitlik",
        url: "/bungalovlarimiz",
      },
      {
        name: "Rezervasyon Talebi",
        short_name: "Rezervasyon",
        url: "/bungalovlarimiz",
      },
      {
        name: "İletişim",
        short_name: "İletişim",
        url: "/iletisim",
      },
    ],
    icons,
  }
}
