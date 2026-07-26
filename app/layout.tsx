import type { CSSProperties } from "react";
import { cache } from "react";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ProgressBarProvider } from "@/components/providers/progress-bar-provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { settingsQueries } from "@/lib/data/queries";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const DEFAULT_THEME_PRIMARY_COLOR = "#0f172a";
const DEFAULT_THEME_SECONDARY_COLOR = "#6B7280";
const DEFAULT_THEME_FONT_FAMILY = "Inter";
const FALLBACK_FAVICON_URL = "/favicon.ico";

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

function sanitizeFontFamily(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 100) return null;
  if (!/^[a-zA-Z0-9,\-_\s"']+$/.test(trimmed)) return null;
  return trimmed;
}

function normalizeFaviconUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

const getThemeSettings = cache(async () => {
  const settings = await settingsQueries.findFirst();

  const primaryColor = isHexColor(settings?.themePrimaryColor)
    ? settings.themePrimaryColor.trim()
    : DEFAULT_THEME_PRIMARY_COLOR;
  const secondaryColor = isHexColor(settings?.themeSecondaryColor)
    ? settings.themeSecondaryColor.trim()
    : DEFAULT_THEME_SECONDARY_COLOR;
  const fontFamily = sanitizeFontFamily(settings?.themeFontFamily) || DEFAULT_THEME_FONT_FAMILY;
  const faviconUrl = normalizeFaviconUrl(settings?.themeFaviconUrl) || FALLBACK_FAVICON_URL;
  const companyName = settings?.companyName || "Aden Bungalov";

  return { primaryColor, secondaryColor, fontFamily, faviconUrl, companyName };
});

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getThemeSettings();

  return {
    metadataBase: new URL("https://www.adenbungalov.com"),
    title: {
      default: "Aden Bungalov | Sapanca Bungalov Rezervasyon & Tatil",
      template: "%s | Aden Bungalov",
    },
    description: "Sapanca'da doğa içinde özel havuzlu, jakuzili lüks bungalov konaklama. Online rezervasyon talebi oluşturun ve yerinizi hemen ayırtın.",
    applicationName: theme.companyName,
    manifest: "/manifest.webmanifest",
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    formatDetection: {
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: theme.companyName,
    },
    icons: {
      icon: [
        {
          url: theme.faviconUrl,
        },
        {
          url: "/icons/icon-192x192.png",
          type: "image/png",
          sizes: "192x192",
        },
        {
          url: "/icons/icon-512x512.png",
          type: "image/png",
          sizes: "512x512",
        },
      ],
      apple: [
        {
          url: theme.faviconUrl,
        },
        {
          url: "/icons/apple-touch-icon.png",
          type: "image/png",
          sizes: "180x180",
        },
      ],
      shortcut: [theme.faviconUrl],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1f3a2e",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemeSettings();
  const bodyStyle: CSSProperties & Record<string, string> = {
    "--theme-primary": theme.primaryColor,
    "--theme-secondary": theme.secondaryColor,
    "--theme-font-family": theme.fontFamily,
  };

  return (
    <html lang="tr">
      <body
        className={`${inter.variable} ${playfairDisplay.variable} ${geistMono.variable} antialiased`}
        style={bodyStyle}
      >
        <ProgressBarProvider />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
