import type { Metadata } from "next"
import { cache } from "react"
import type { ReactNode } from "react"
import { MobileBottomNav } from "@/components/site/mobile-bottom-nav"
import { CookieConsentProvider } from "@/components/site/cookie-consent-context"
import { CookieConsentManager } from "@/components/site/cookie-consent-manager"
import {
  SiteFooter,
  type SiteFooterMenuItem,
  type SiteFooterSocialProfile,
} from "@/components/site/site-footer"
import {
  SiteHeader,
  type SiteHeaderActionButton,
  type SiteHeaderMenuItem,
} from "@/components/site/site-header"
import { bungalovQueries, websiteCmsQueries, settingsQueries } from "@/lib/data/queries"
import { SITE_NAV_ITEMS, normalizePhoneHref } from "@/lib/site/b2c"
import { getSitePublicContent } from "@/lib/site/public-content"
import { resolveMenu } from "@/lib/site/menu-resolver"
import type { WebsiteCmsConfig } from "@/lib/site/website-cms-types"
import { SiteProvider } from "@/components/site/site-context"
import { localizationQueries } from "@/lib/data/queries"
import { OrganizationJsonLd } from "@/components/site/json-ld"
import { getSiteContactConfig } from "@/lib/site/contact-config"
import { isUserSystemEnabled } from "@/lib/site/modules"
import { buildWhatsappHref } from "@/lib/site/whatsapp"
import { getUiStrings, t } from "@/lib/cms/ui-strings"

type SiteLayoutContent = {
  settings: Awaited<ReturnType<typeof getSitePublicContent>>["settings"]
  footerBungalowRows: Awaited<ReturnType<typeof bungalovQueries.findMany>>
  cmsConfig: WebsiteCmsConfig | null
  contact: Awaited<ReturnType<typeof getSiteContactConfig>>
}

function normalizeCmsHref(value: string | null | undefined) {
  const trimmed = String(value || "").trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  if (trimmed.startsWith("tel:") || trimmed.startsWith("mailto:")) return trimmed
  if (trimmed.startsWith("/")) return trimmed
  if (trimmed.startsWith("#")) return `/${trimmed}`
  return `/${trimmed.replace(/^\/+/, "")}`
}

function normalizeExternalUrl(value: string | null | undefined) {
  const trimmed = String(value || "").trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  return `https://${trimmed}`
}

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//")
}

function resolveMenuItems(cmsConfig: WebsiteCmsConfig | null): SiteHeaderMenuItem[] {
  const menuGroups = (cmsConfig?.siteManagement.menuGroups || []).filter((group) => group.isActive !== false)
  const selectedMenuType = cmsConfig?.headerManagement.menuType || "ANA_MENU"
  const selectedMenuGroupId = String(cmsConfig?.headerManagement.menuGroupId || "").trim()
  const selectedGroup =
    menuGroups.find((group) => group.id === selectedMenuGroupId) ||
    menuGroups.find((group) => group.type === selectedMenuType) ||
    menuGroups[0]

  const groupItems: SiteHeaderMenuItem[] = (selectedGroup?.items || [])
    .filter((item) => item.isActive !== false)
    .map((item, index) => ({
      id: item.id || `cms-menu-group-item-${index}`,
      label: String(item.text || "").trim(),
      href: normalizeCmsHref(item.href),
      target: (item.target === "BLANK" ? "BLANK" : "SELF") as "SELF" | "BLANK",
    }))
    .filter((item) => item.label.length > 0 && item.href.length > 0)

  if (groupItems.length > 0) {
    return groupItems
  }

  const cmsMenuItems = (cmsConfig?.headerManagement.menuItems || [])
    .filter((item) => item.isActive)
    .map((item, index) => ({
      id: item.id || `cms-menu-${index}`,
      label: item.label.trim(),
      href: normalizeCmsHref(item.href),
      target: "SELF" as const,
    }))
    .filter((item) => item.label.length > 0 && item.href.length > 0)

  if (cmsMenuItems.length > 0) {
    return cmsMenuItems
  }

  return SITE_NAV_ITEMS.map((item, index) => ({
    id: `default-menu-${index}`,
    label: item.label,
    href: item.href,
    target: "SELF",
  }))
}

function resolveHeaderButton(
  id: string,
  icon: string,
  config: WebsiteCmsConfig["headerManagement"]["buttons"]["whatsapp"] | undefined,
  fallbackLabel: string,
  fallbackHref: string
): SiteHeaderActionButton | null {
  if (config?.enabled === false) return null
  const href = normalizeCmsHref(config?.url) || fallbackHref
  if (!href) return null
  return {
    id,
    icon,
    label: config?.label?.trim() || fallbackLabel,
    href,
    external: !isInternalHref(href),
  }
}

function resolveFooterSocialProfiles(cmsConfig: WebsiteCmsConfig | null): SiteFooterSocialProfile[] {
  return (cmsConfig?.siteManagement.socialProfiles || [])
    .map((item, index) => ({
      id: item.id || `cms-social-${index}`,
      platform: item.platform.trim(),
      icon: item.icon,
      url: normalizeExternalUrl(item.url),
    }))
    .filter((item) => item.url.length > 0)
}

const getSiteLayoutContent = cache(async (): Promise<SiteLayoutContent> => {
  const [{ settings }, footerBungalowRows, cmsConfig, contact] = await Promise.all([
    getSitePublicContent(),
    bungalovQueries.findMany({ status: "AKTIF" }, { orderBy: { name: "asc" } }),
    websiteCmsQueries.getConfig().catch((err) => {
      console.error("[getSiteLayoutContent] cms-config okunamadı:", err)
      return null
    }),
    getSiteContactConfig().catch((err) => {
      console.error("[getSiteLayoutContent] contact okunamadı:", err)
      return {
        companyName: "Aden Bungalov",
        phone: "",
        whatsappPhone: "",
        defaultWhatsappMessage: "",
        email: "",
        address: "",
        website: "",
      }
    }),
  ])

  return { settings, footerBungalowRows, cmsConfig, contact }
})

export async function generateMetadata(): Promise<Metadata> {
  const { settings, cmsConfig } = await getSiteLayoutContent()

  const companyName = settings?.companyName || "Aden Bungalov"
  const seoTitle = cmsConfig?.siteManagement.seoTitle?.trim() || "Aden Bungalov | Sapanca Bungalov Rezervasyon"
  const seoDescription =
    cmsConfig?.siteManagement.seoDescription?.trim() ||
    "Sapanca doğasında premium bungalov konaklama. Müsaitlik kontrolü yapın, online rezervasyon talebi oluşturun ve WhatsApp üzerinden hızlı bilgi alın."
  const seoKeywords = cmsConfig?.siteManagement.seoKeywords?.trim() || ""

  return {
    title: {
      default: seoTitle,
      template: `%s | ${companyName}`,
    },
    description: seoDescription,
    keywords: seoKeywords
      ? seoKeywords
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : undefined,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: "website",
      locale: "tr_TR",
    },
  }
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settingsDb = await settingsQueries.findFirst()
  const uiStrings = await getUiStrings()
  if (settingsDb?.maintenanceModeEnabled) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{t(uiStrings, "maintenance.title", "Sistem Güncelleniyor")}</h1>
          <p className="text-slate-600">{t(uiStrings, "maintenance.description", "Şu an sistemlerimizi sizin için güncelliyoruz, lütfen kısa bir süre sonra tekrar deneyin.")}</p>
        </div>
      </div>
    )
  }

  const { settings, footerBungalowRows, cmsConfig, contact } = await getSiteLayoutContent()
  const activeLanguages = await localizationQueries.getActiveLanguages()
  const activeCurrencies = await localizationQueries.getActiveCurrencies()

  const companyName = settings?.companyName || "Aden Bungalov"
  const companyAddress = contact.address
  const companyPhone = contact.phone
  const companyEmail = contact.email
  const companyWebsite = contact.website || settings?.website || ""
  const topHeaderEnabled = cmsConfig?.headerManagement.topHeaderEnabled ?? true
  const topHeaderText = cmsConfig?.headerManagement.topHeaderText?.trim() || companyAddress
  const topHeaderPhone = companyPhone
  const topHeaderPhoneHref = normalizePhoneHref(topHeaderPhone)
  // Koyu zemin için açık renkli logo (logoLightUrl - logo-w), açık zemin için koyu renkli logo (logoDarkUrl - logo-b) kullanılır.
  const logoForDarkBackground =
    cmsConfig?.siteManagement.logoLightUrl?.trim() ||
    settings?.themeLogoUrl ||
    settings?.companyLogo ||
    null
  const logoForLightBackground =
    cmsConfig?.siteManagement.logoDarkUrl?.trim() ||
    settings?.companyLogo ||
    settings?.themeLogoUrl ||
    logoForDarkBackground
  // Menü resolver (ID/route tabanlı, bozuk bağlantı filtreli). Boşsa eski
  // (legacy) çözüm devreye girer — geriye tam uyumluluk.
  const resolvedHeaderMenu = await resolveMenu(
    {
      groupId: cmsConfig?.headerManagement?.menuGroupId,
      type: cmsConfig?.headerManagement?.menuType,
      key: "main-menu",
    },
    { device: "desktop", audience: "guest" }
  )
  const headerMenuItems: SiteHeaderMenuItem[] =
    resolvedHeaderMenu.length > 0
      ? resolvedHeaderMenu.map((it) => ({ id: it.id, label: it.label, href: it.href, target: it.target }))
      : resolveMenuItems(cmsConfig)
  const footerMenuItems: SiteFooterMenuItem[] = headerMenuItems.map((item) => ({ ...item }))
  const footerSocialProfiles = resolveFooterSocialProfiles(cmsConfig)
  const footerManagement = cmsConfig?.siteManagement.footerManagement || null
  const footerMenuGroups = cmsConfig?.siteManagement.menuGroups || []

  const defaultWhatsappPhone = contact.whatsappPhone
  const defaultWhatsappHref = defaultWhatsappPhone ? `https://wa.me/${defaultWhatsappPhone}` : ""
  const defaultPhoneHref = normalizePhoneHref(companyPhone)

  const legacyActionButtons = [
    resolveHeaderButton(
      "legacy-whatsapp",
      "message-circle",
      cmsConfig?.headerManagement.buttons?.whatsapp,
      "WhatsApp",
      defaultWhatsappHref
    ),
    resolveHeaderButton(
      "legacy-phone",
      "phone-call",
      cmsConfig?.headerManagement.buttons?.phone,
      "Hemen Ara",
      defaultPhoneHref
    ),
    resolveHeaderButton(
      "legacy-reservation",
      "calendar-check-2",
      cmsConfig?.headerManagement.buttons?.reservation,
      "Hızlı Rezervasyon",
      "/bungalovlarimiz"
    ),
  ].filter((item): item is SiteHeaderActionButton => Boolean(item))

  const dynamicActionButtons = (cmsConfig?.headerManagement.actionButtons || [])
    .filter((btn) => btn.enabled !== false)
    .map((btn, index) => {
      const identity = `${btn.icon} ${btn.label}`.toLocaleLowerCase("tr-TR")
      const isWhatsapp = identity.includes("whatsapp") || identity.includes("message")
      const href = isWhatsapp ? buildWhatsappHref(btn.url) || btn.url : btn.url
      return {
        // Math.random() her render'da farklı key üretip listeyi kararsız yapıyordu
        id: btn.id || `action-btn-${index}`,
        label: btn.label,
        href,
        icon: btn.icon,
        external: btn.target === "BLANK" || !isInternalHref(href),
      }
    })

  const headerActionButtons =
    dynamicActionButtons.length > 0 ? dynamicActionButtons : legacyActionButtons
  const topHeaderItems = (cmsConfig?.headerManagement.topHeaderItems || [])
    .filter((item) => item.enabled)
    .map((item, index) => ({
      id: item.id || `top-item-${index}`,
      icon: item.icon,
      text:
        item.text.trim() ||
        (item.icon.toLocaleLowerCase("tr-TR").includes("phone") ? companyPhone : companyAddress),
      href: normalizeCmsHref(item.url),
    }))
    .filter((item) => item.text.length > 0)
    .slice(0, 3)
  const topHeaderRight = cmsConfig?.headerManagement.topHeaderRight || {
    showLanguage: true,
    showCurrency: false,
    currencyLabel: "TRY",
  }

  const footerBungalows = footerBungalowRows
    .map((item) => item as Record<string, unknown>)
    .map((item) => ({
      id: String(item.id || ""),
      name: String(item.name || ""),
      slug: String(item.slug || item.id || ""),
    }))
    .filter((item) => item.id.length > 0 && item.name.trim().length > 0)
    .slice(0, 7)
  const mobileWhatsappHref = buildWhatsappHref(contact.whatsappPhone, contact.defaultWhatsappMessage)
  const mobilePhoneHref = defaultPhoneHref

  const userSystemEnabled = await isUserSystemEnabled()

  return (
    <CookieConsentProvider>
      <SiteProvider activeLanguages={activeLanguages} activeCurrencies={activeCurrencies}>
        <OrganizationJsonLd
        name={companyName}
        url={companyWebsite || "https://www.adenbungalov.com"}
        logo={logoForLightBackground || logoForDarkBackground || undefined}
        telephone={companyPhone}
        email={companyEmail}
        address={companyAddress}
        />
      {/* Klavye kullanıcıları için içeriğe atlama bağlantısı (WCAG 2.4.1) */}
        <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#1f3a2e] focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        İçeriğe geç
        </a>
        <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[#f6f3ee] text-[#111111]">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#d5dfd1]/35 blur-3xl" />
          <div className="absolute right-[-120px] top-[28%] h-80 w-80 rounded-full bg-[#e7d9c4]/40 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[22%] h-80 w-80 rounded-full bg-[#d6e1db]/25 blur-3xl" />
        </div>
        <SiteHeader
          companyName={companyName}
          companyAddress={companyAddress}
          companyPhone={companyPhone}
          topHeaderEnabled={topHeaderEnabled}
          topHeaderText={topHeaderText}
          topHeaderPhone={topHeaderPhone}
          topHeaderPhoneHref={topHeaderPhoneHref}
          topHeaderItems={topHeaderItems}
          topHeaderRight={topHeaderRight}
          menuItems={headerMenuItems}
          actionButtons={headerActionButtons}
          homeLogoUrl={logoForDarkBackground}
          innerLogoUrl={logoForLightBackground}
          languageCode={settings?.language || "tr"}
          isCustomerEnabled={userSystemEnabled}
          loginLabel={t(uiStrings, "header.login", "Giriş Yap")}
          registerLabel={t(uiStrings, "header.register", "Hesap Oluştur")}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 focus-visible:outline-none">
          {children}
        </main>
        <SiteFooter
          companyName={companyName}
          address={companyAddress}
          phone={companyPhone}
          email={companyEmail}
          website={companyWebsite}
          companyLogo={logoForLightBackground || logoForDarkBackground}
          menuItems={footerMenuItems}
          menuGroups={footerMenuGroups}
          socialProfiles={footerSocialProfiles}
          footerManagement={footerManagement}
          bungalowItems={footerBungalows}
          cookiePreferencesLabel={t(uiStrings, "footer.cookiePreferences", "Çerez Tercihleri")}
        />
        <MobileBottomNav
          whatsappHref={mobileWhatsappHref}
          phoneHref={mobilePhoneHref}
          userSystemEnabled={userSystemEnabled}
        />
        <CookieConsentManager />
        </div>
      </SiteProvider>
    </CookieConsentProvider>
  )
}
