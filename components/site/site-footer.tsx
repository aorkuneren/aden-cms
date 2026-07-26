"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Facebook,
  Globe2,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  PhoneCall,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react"
import { FacebookIcon, InstagramIcon, WhatsappIcon } from "@/components/site/brand-icons"
import { useCookieConsent } from "@/components/site/cookie-consent-context"
import type {
  CmsFooterColumn,
  CmsFooterManagement,
  CmsMenuGroup,
  CmsMenuGroupItem,
} from "@/lib/site/website-cms-types"

export type SiteFooterMenuItem = {
  id: string
  label: string
  href: string
  target?: "SELF" | "BLANK"
}

export type SiteFooterSocialProfile = {
  id: string
  platform: string
  icon?: string
  url: string
}

type SiteFooterProps = {
  companyName: string
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  companyLogo?: string | null
  menuItems?: SiteFooterMenuItem[]
  menuGroups?: CmsMenuGroup[]
  socialProfiles?: SiteFooterSocialProfile[]
  footerManagement?: CmsFooterManagement | null
  bungalowItems: Array<{ id: string; name: string }>
  cookiePreferencesLabel?: string
}

type FooterLinkItem = {
  id: string
  label: string
  href: string
  target: "SELF" | "BLANK"
}

const FALLBACK_SOCIAL_LINKS = [
  { href: "https://www.instagram.com/", label: "Instagram", icon: Instagram },
  { href: "https://www.facebook.com/", label: "Facebook", icon: Facebook },
  { href: "https://www.youtube.com/", label: "YouTube", icon: Youtube },
] as const

const FALLBACK_COLUMNS: CmsFooterColumn[] = [
  {
    id: "footer-col-logo",
    enabled: true,
    title: "Logo",
    type: "LOGO",
    menuType: "ANA_MENU",
    menuGroupId: "",
    bungalowLimit: 7,
  },
  {
    id: "footer-col-menu",
    enabled: true,
    title: "Ana Menü",
    type: "MENU_GROUP",
    menuType: "ANA_MENU",
    menuGroupId: "",
    bungalowLimit: 7,
  },
  {
    id: "footer-col-quick",
    enabled: true,
    title: "Hızlı Erişim",
    type: "MENU_GROUP",
    menuType: "HIZLI_ERISIM",
    menuGroupId: "",
    bungalowLimit: 7,
  },
  {
    id: "footer-col-bungalows",
    enabled: true,
    title: "Bungalov Listesi",
    type: "BUNGALOV_LIST",
    menuType: "BUNGALOVLAR",
    menuGroupId: "",
    bungalowLimit: 7,
  },
  {
    id: "footer-col-contact",
    enabled: true,
    title: "İletişim",
    type: "CONTACT",
    menuType: "OZEL_MENU",
    menuGroupId: "",
    bungalowLimit: 7,
  },
]

function normalizeWebsiteUrl(value?: string | null) {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  return `https://${trimmed}`
}

function normalizeHref(value?: string | null) {
  const trimmed = String(value || "").trim()
  if (!trimmed) return ""
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed
  }
  if (trimmed.startsWith("/")) return trimmed
  if (trimmed.startsWith("#")) return `/${trimmed}`
  return `/${trimmed.replace(/^\/+/, "")}`
}

function normalizeAssetUrl(value?: string | null) {
  const trimmed = String(value || "").trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  if (trimmed.startsWith("/")) return trimmed
  return `https://${trimmed}`
}

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//")
}

function resolveSocialIcon(platform: string, explicitIcon?: string) {
  const normalizedIcon = String(explicitIcon || "").trim().toLocaleLowerCase("tr-TR")
  if (normalizedIcon.includes("whatsapp") || normalizedIcon.includes("message")) return WhatsappIcon as unknown as LucideIcon
  if (normalizedIcon.includes("instagram")) return InstagramIcon as unknown as LucideIcon
  if (normalizedIcon.includes("facebook")) return FacebookIcon as unknown as LucideIcon
  if (normalizedIcon.includes("youtube")) return Youtube
  if (normalizedIcon.includes("linkedin")) return Linkedin
  if (normalizedIcon.includes("twitter") || normalizedIcon === "x") return Twitter
  if (normalizedIcon.includes("mail")) return Mail
  if (normalizedIcon.includes("phone")) return PhoneCall
  if (normalizedIcon.includes("map")) return MapPin
  if (normalizedIcon.includes("globe")) return Globe2

  const normalized = platform.trim().toLocaleLowerCase("tr-TR")
  if (normalized.includes("whatsapp")) return WhatsappIcon as unknown as LucideIcon
  if (normalized.includes("instagram")) return InstagramIcon as unknown as LucideIcon
  if (normalized.includes("facebook")) return FacebookIcon as unknown as LucideIcon
  if (normalized.includes("youtube")) return Youtube
  if (normalized.includes("linkedin")) return Linkedin
  if (normalized.includes("x") || normalized.includes("twitter")) return Twitter
  return Globe2
}

function resolveContactIcon(iconName?: string): LucideIcon {
  const normalizedIcon = String(iconName || "").trim().toLocaleLowerCase("tr-TR")
  if (normalizedIcon.includes("whatsapp") || normalizedIcon.includes("message")) return WhatsappIcon as unknown as LucideIcon
  if (normalizedIcon.includes("phone")) return PhoneCall
  if (normalizedIcon.includes("mail")) return Mail
  if (normalizedIcon.includes("globe")) return Globe2
  return MapPin
}

function resolveMenuGroupLinks(group: CmsMenuGroup | undefined): FooterLinkItem[] {
  return (group?.items || [])
    .filter((item) => item.isActive !== false)
    .map((item: CmsMenuGroupItem, index) => ({
      id: item.id || `${group?.id || "group"}-${index}`,
      label: String(item.text || "").trim(),
      href: normalizeHref(item.href),
      target: (item.target === "BLANK" ? "BLANK" : "SELF") as "SELF" | "BLANK",
    }))
    .filter((item) => item.label.length > 0 && item.href.length > 0)
}

export function SiteFooter({
  companyName,
  address,
  phone,
  email,
  website,
  companyLogo,
  menuItems = [],
  menuGroups = [],
  socialProfiles = [],
  footerManagement,
  bungalowItems,
  cookiePreferencesLabel = "Çerez Tercihleri",
}: SiteFooterProps) {
  const { openPreferences } = useCookieConsent()
  const phoneDigits = (phone || "").replace(/\D/g, "")
  const phoneHref = phoneDigits ? `tel:+${phoneDigits}` : ""
  const websiteHref = normalizeWebsiteUrl(website)
  const managedLogo = normalizeAssetUrl(footerManagement?.logoUrl)
  const logoSrc = managedLogo || (companyLogo || "").trim()
  const fallbackLogoSrc = "/icons/icon-192x192.png"
  const [logoError, setLogoError] = useState(false)
  const displayLogoSrc = logoSrc && !logoError ? logoSrc : fallbackLogoSrc

  const fallbackMainMenuGroup: CmsMenuGroup = {
    id: "fallback-main-group",
    title: "Ana Menü",
    type: "ANA_MENU",
    isActive: true,
    items: menuItems.map((item, index) => ({
      id: item.id || `fallback-menu-${index}`,
      text: item.label,
      href: item.href,
      target: item.target || "SELF",
      isActive: true,
    })),
  }

  const resolvedMenuGroups = menuGroups.length > 0 ? menuGroups : [fallbackMainMenuGroup]
  const fallbackMainMenuItems = resolveMenuGroupLinks(fallbackMainMenuGroup)
  const fallbackColumns = footerManagement?.columns?.length ? footerManagement.columns : FALLBACK_COLUMNS
  const columns = fallbackColumns.filter((column) => column.enabled !== false).slice(0, 5)

  const contactLinks = (footerManagement?.contactItems || [])
    .filter((item) => item.enabled !== false)
    .map((item, index) => ({
      id: item.id || `contact-${index}`,
      icon: resolveContactIcon(item.icon),
      text: String(item.text || "").trim(),
      href: normalizeHref(item.link),
    }))
    .filter((item) => item.text.length > 0 || item.href.length > 0)

  const fallbackContactLinks = [
    address ? { id: "fallback-address", icon: MapPin, text: address, href: "" } : null,
    phoneHref ? { id: "fallback-phone", icon: PhoneCall, text: phone || "", href: phoneHref } : null,
    email ? { id: "fallback-email", icon: Mail, text: email, href: `mailto:${email}` } : null,
    websiteHref ? { id: "fallback-website", icon: Globe2, text: website || "", href: websiteHref } : null,
  ].filter((item): item is { id: string; icon: LucideIcon; text: string; href: string } => Boolean(item))

  // CMS contactItems varsa kullan ama eksik olanları (telefon/e-posta) prop'lardan tamamla
  const cmsHasPhone = contactLinks.some((l) => l.href.startsWith("tel:") || resolveContactIcon("phone") === l.icon)
  const cmsHasEmail = contactLinks.some((l) => l.href.startsWith("mailto:"))
  const supplementLinks = [
    (!cmsHasPhone && phoneHref) ? { id: "fallback-phone", icon: PhoneCall, text: phone || "", href: phoneHref } : null,
    (!cmsHasEmail && email) ? { id: "fallback-email", icon: Mail, text: email, href: `mailto:${email}` } : null,
  ].filter((item): item is { id: string; icon: LucideIcon; text: string; href: string } => Boolean(item))

  const resolvedContactLinks = contactLinks.length > 0
    ? [...contactLinks, ...supplementLinks]
    : fallbackContactLinks

  const managedSocialLinks = (footerManagement?.socialItems || [])
    .filter((item) => item.enabled !== false)
    .map((item, index) => ({
      id: item.id || `social-${index}`,
      label: String(item.text || "").trim() || "Sosyal Ağ",
      href: normalizeWebsiteUrl(item.link),
      icon: resolveSocialIcon(item.text || "", item.icon),
    }))
    .filter((item) => item.href.length > 0)

  const cmsSocialLinks = socialProfiles
    .map((item) => ({
      id: item.id,
      label: item.platform.trim() || "Sosyal Ağ",
      href: normalizeWebsiteUrl(item.url),
      icon: resolveSocialIcon(item.platform, item.icon),
    }))
    .filter((item) => item.href.length > 0)

  const socialLinks =
    managedSocialLinks.length > 0
      ? managedSocialLinks
      : cmsSocialLinks.length > 0
      ? cmsSocialLinks
      : FALLBACK_SOCIAL_LINKS.map((item, index) => ({
          id: `fallback-social-${index}`,
          label: item.label,
          href: item.href,
          icon: item.icon,
        }))

  const resolveColumnGroup = (column: CmsFooterColumn) => {
    if (column.type !== "MENU_GROUP") return undefined
    return (
      resolvedMenuGroups.find((group) => group.id === column.menuGroupId && group.isActive !== false) ||
      resolvedMenuGroups.find((group) => group.type === column.menuType && group.isActive !== false)
    )
  }

  const renderFooterLink = (item: FooterLinkItem) => {
    const internal = isInternalHref(item.href)
    const openInBlank = item.target === "BLANK" || !internal

    if (internal) {
      return (
        <Link href={item.href} className="transition hover:text-[#1f3120]">
          {item.label}
        </Link>
      )
    }

    return (
      <a href={item.href} target={openInBlank ? "_blank" : undefined} rel={openInBlank ? "noreferrer" : undefined} className="transition hover:text-[#1f3120]">
        {item.label}
      </a>
    )
  }

  return (
    <footer className="mt-16 border-t border-[#e3dccf] bg-[#eeebe4]">
      <div className="mx-auto w-full max-w-7xl px-[var(--site-gutter-x)] py-10 pb-[calc(2.5rem+var(--site-bottom-chrome))] md:pb-10 lg:py-12 lg:pb-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {columns.map((column) => {
            if (column.type === "LOGO") {
              return (
                <div key={column.id}>
                  <Link href="/" aria-label={`${companyName} anasayfa`} className="inline-flex w-[80%]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayLogoSrc}
                      alt={companyName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={() => setLogoError(true)}
                    />
                  </Link>
                </div>
              )
            }

            if (column.type === "MENU_GROUP") {
              const group = resolveColumnGroup(column)
              const links = resolveMenuGroupLinks(group)
              const items = links.length > 0 ? links : fallbackMainMenuItems

              return (
                <div key={column.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b756d]">
                    {column.title || group?.title || "Menü"}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#5f5f66]">
                    {items.map((item) => (
                      <li key={item.id}>{renderFooterLink(item)}</li>
                    ))}
                  </ul>
                </div>
              )
            }

            if (column.type === "BUNGALOV_LIST") {
              const limit = Number.isFinite(column.bungalowLimit) ? Math.max(1, Math.min(24, column.bungalowLimit)) : 7
              const items = bungalowItems.slice(0, limit)
              return (
                <div key={column.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b756d]">
                    {column.title || "Bungalov Listesi"}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#5f5f66]">
                    {items.length > 0 ? (
                      items.map((item) => (
                        <li key={item.id}>
                          <Link href={`/bungalovlarimiz/${item.id}`} className="transition hover:text-[#1f3120]">
                            {item.name}
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li>
                        <Link href="/bungalovlarimiz" className="transition hover:text-[#1f3120]">
                          Bungalovlarımız
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              )
            }

            if (column.type === "SOCIAL") {
              return (
                <div key={column.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b756d]">
                    {column.title || "Sosyal Medya"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    {socialLinks.map((item) => (
                      <a
                        key={item.id}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={item.label}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d7cdbd] bg-white text-[#2b2b2f] transition hover:border-[#1f3a2e] hover:text-[#1f3a2e]"
                      >
                        <item.icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              )
            }

            return (
              <div key={column.id} className="space-y-4">
                {/* Başlık */}
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b756d]">
                  {column.title || "İletişim"}
                </p>

                {/* İletişim bilgileri — sade satır metin */}
                <div className="space-y-2">
                  {resolvedContactLinks.map((item) => {
                    const textClass = "flex items-start gap-2 text-sm text-[#5f5f66] transition-colors hover:text-[#18261e]"
                    const inner = (
                      <>
                        <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#9b9690]" />
                        <span>{item.text || item.href}</span>
                      </>
                    )
                    if (!item.href) return <p key={item.id} className={textClass}>{inner}</p>
                    if (item.href.startsWith("/")) return <Link key={item.id} href={item.href} className={textClass}>{inner}</Link>
                    const isExternal = !item.href.startsWith("tel:") && !item.href.startsWith("mailto:")
                    return (
                      <a key={item.id} href={item.href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} className={textClass}>
                        {inner}
                      </a>
                    )
                  })}
                </div>

                {/* Sosyal Medya — sadece ikonlar, çerçevesiz */}
                {socialLinks.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#aaa59e]">Sosyal Medya</p>
                    <div className="flex items-center gap-4">
                      {socialLinks.slice(0, 6).map((item) => (
                        <a
                          key={`${column.id}-${item.id}`}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={item.label}
                          title={item.label}
                          className="text-[#8c8880] transition-colors duration-200 hover:text-[#18261e]"
                        >
                          <item.icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[#e3dccf] pt-4 text-xs text-[#7b7b82] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p>{(footerManagement?.copyrightText || "").trim() || "Copyright © 2023 Tüm Hakları Saklıdır."}</p>
            <button
              type="button"
              onClick={openPreferences}
              className="font-semibold text-[#5f5f66] underline decoration-[#aaa399] underline-offset-4 transition hover:text-[#18261e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f3a2e]"
            >
              {cookiePreferencesLabel}
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.adenbungalov.com/theme/style/odeme.png"
            alt="Ödeme yöntemleri"
            className="h-7 w-auto object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </footer>
  )
}
