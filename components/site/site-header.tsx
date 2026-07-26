"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Banknote,
  CalendarCheck2,
  CircleHelp,
  Clock3,
  ChevronDown,
  Globe2,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Phone,
  PhoneCall,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from "lucide-react"
import { WhatsappIcon } from "@/components/site/brand-icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useSiteContext } from "@/components/site/site-context"

export type SiteHeaderMenuItem = {
  id: string
  label: string
  href: string
  target?: "SELF" | "BLANK"
}

export type SiteHeaderActionButton = {
  id: string
  label: string
  href: string
  icon?: string
  external?: boolean
}

type SiteHeaderTopItem = {
  id: string
  icon?: string
  text: string
  href?: string
}

type SiteHeaderTopRightConfig = {
  showLanguage: boolean
  showCurrency: boolean
  currencyLabel: string
}

type SiteHeaderProps = {
  companyName: string
  companyAddress: string
  companyPhone: string
  topHeaderEnabled?: boolean
  topHeaderText?: string
  topHeaderPhone?: string
  topHeaderPhoneHref?: string
  topHeaderItems?: SiteHeaderTopItem[]
  topHeaderRight?: Partial<SiteHeaderTopRightConfig>
  menuItems: SiteHeaderMenuItem[]
  actionButtons?: SiteHeaderActionButton[]
  whatsappButton?: SiteHeaderActionButton | null
  phoneButton?: SiteHeaderActionButton | null
  reservationButton?: SiteHeaderActionButton | null
  homeLogoUrl?: string | null
  innerLogoUrl?: string | null
  languageCode?: string | null
  isCustomerEnabled?: boolean
  loginLabel?: string
  registerLabel?: string
}

function isNavItemActive(pathname: string, href: string) {
  const normalizedHref = href.trim()
  if (!normalizedHref) return false
  if (normalizedHref.startsWith("http://") || normalizedHref.startsWith("https://")) {
    return false
  }
  if (normalizedHref === "/") {
    return pathname === "/"
  }
  if (normalizedHref.startsWith("/#")) {
    return pathname === "/"
  }
  return pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`)
}

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//")
}

function resolveTopHeaderIcon(name?: string): LucideIcon {
  const normalized = String(name || "").trim().toLocaleLowerCase("tr-TR")
  if (normalized.includes("whatsapp") || normalized.includes("message")) return WhatsappIcon as unknown as LucideIcon
  if (normalized.includes("map")) return MapPin
  if (normalized.includes("phone")) return Phone
  if (normalized.includes("mail")) return Mail
  if (normalized.includes("clock")) return Clock3
  return MapPin
}

function resolveHeaderButtonIcon(name?: string): LucideIcon {
  const normalized = String(name || "").trim().toLocaleLowerCase("tr-TR")
  if (normalized.includes("whatsapp") || normalized.includes("message")) return WhatsappIcon as unknown as LucideIcon
  if (normalized.includes("phone")) return PhoneCall
  if (normalized.includes("calendar")) return CalendarCheck2
  if (normalized.includes("globe")) return Globe2
  if (normalized.includes("sparkle")) return Sparkles
  return CircleHelp
}

export function SiteHeader({
  companyName,
  companyAddress,
  companyPhone,
  topHeaderEnabled = true,
  topHeaderText,
  topHeaderPhone,
  topHeaderPhoneHref,
  topHeaderItems,
  topHeaderRight,
  menuItems,
  actionButtons,
  whatsappButton,
  phoneButton,
  reservationButton,
  homeLogoUrl,
  innerLogoUrl,
  isCustomerEnabled = true,
  loginLabel = "Giriş Yap",
  registerLabel = "Hesap Oluştur",
}: SiteHeaderProps) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const { currency, setCurrency, language, setLanguage, activeCurrencies, activeLanguages } = useSiteContext()
  const languageLabel = activeLanguages.find(l => l.code === language)?.name || "Türkçe"
  const [isTopHeaderHidden, setIsTopHeaderHidden] = useState(false)
  const resolvedTopHeaderText = topHeaderText?.trim() || companyAddress || "Sapanca / Sakarya"
  const resolvedTopHeaderPhone = topHeaderPhone?.trim() || companyPhone
  const resolvedTopHeaderPhoneHref =
    topHeaderPhoneHref?.trim() ||
    (phoneButton?.href.startsWith("tel:") ? phoneButton.href : "")
  const homeLogo = homeLogoUrl?.trim() || ""
  const innerLogo = innerLogoUrl?.trim() || ""
  const companyLogo = isHome ? homeLogo || innerLogo : innerLogo || homeLogo
  const fallbackTopHeaderItems: SiteHeaderTopItem[] = [
    {
      id: "top-location-fallback",
      icon: "map-pin",
      text: resolvedTopHeaderText,
      href: "",
    },
    {
      id: "top-phone-fallback",
      icon: "phone",
      text: resolvedTopHeaderPhone,
      href: resolvedTopHeaderPhoneHref,
    },
  ].filter((item) => String(item.text || "").trim().length > 0)
  const dynamicTopItems = (topHeaderItems || [])
    .map((item) => ({
      id: item.id,
      icon: item.icon,
      text: String(item.text || "").trim(),
      href: String(item.href || "").trim(),
    }))
    .filter((item) => item.text.length > 0)
    .slice(0, 3)
  const resolvedTopHeaderItems = dynamicTopItems.length > 0 ? dynamicTopItems : fallbackTopHeaderItems
  const resolvedTopHeaderRight: SiteHeaderTopRightConfig = {
    showLanguage: topHeaderRight?.showLanguage !== false,
    showCurrency: topHeaderRight?.showCurrency === true,
    currencyLabel: String(topHeaderRight?.currencyLabel || "TRY").trim() || "TRY",
  }
  const fallbackActionButtons = [
    whatsappButton ? { ...whatsappButton, id: "legacy-whatsapp", icon: whatsappButton.icon || "message-circle" } : null,
    phoneButton ? { ...phoneButton, id: "legacy-phone", icon: phoneButton.icon || "phone-call" } : null,
    reservationButton ? { ...reservationButton, id: "legacy-reservation", icon: reservationButton.icon || "calendar-check-2" } : null,
  ].filter(Boolean) as SiteHeaderActionButton[]
  const dynamicActionButtons = (actionButtons || [])
    .filter((item) => item.label.trim().length > 0 && item.href.trim().length > 0)
    .slice(0, 3)
  const resolvedActionButtons =
    dynamicActionButtons.length > 0 ? dynamicActionButtons : fallbackActionButtons

  useEffect(() => {
    if (!topHeaderEnabled) {
      return
    }

    const onScroll = () => {
      setIsTopHeaderHidden(window.scrollY > 18)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  }, [topHeaderEnabled])

  return (
    <header className={cn("z-50 w-full", isHome ? "fixed inset-x-0 top-0" : "sticky top-0")}>
      {topHeaderEnabled ? (
        <div
          className={cn(
            "overflow-hidden border-b backdrop-blur transition-all duration-300",
            isHome ? "bg-[#0b1523]/45 text-white" : "bg-white text-[#32323a]",
            isTopHeaderHidden
              ? "max-h-0 border-transparent opacity-0"
              : isHome
              ? "max-h-20 border-white/15 opacity-100"
              : "max-h-20 border-[#ece4d7] opacity-100"
          )}
        >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 flex-wrap items-center gap-3 text-xs sm:text-sm">
              {resolvedTopHeaderItems.map((item) => {
                const Icon = resolveTopHeaderIcon(item.icon)
                const href = String(item.href || "")
                const isExternalItem = href.startsWith("http://") || href.startsWith("https://")
                const itemContent = (
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    <span className="truncate">{item.text}</span>
                  </span>
                )
                if (!href) {
                  return (
                    <span
                      key={item.id}
                      className={cn(isHome ? "text-white/90" : "text-[#4d4d55]")}
                    >
                      {itemContent}
                    </span>
                  )
                }

                return (
                  <a
                    key={item.id}
                    href={href}
                    target={isExternalItem ? "_blank" : undefined}
                    rel={isExternalItem ? "noreferrer" : undefined}
                    className={cn(
                      "inline-flex",
                      isHome ? "text-white/90 hover:text-white" : "text-[#4d4d55] hover:text-[#171717]"
                    )}
                  >
                    {itemContent}
                  </a>
                )
              })}
            </div>

            <div className="hidden items-center gap-4 text-xs sm:text-sm md:flex">
              {isCustomerEnabled ? (
                <>
                  <Link
                    href="/giris"
                    className={cn(
                      "inline-flex items-center gap-1.5 font-medium transition",
                      isHome ? "text-white/90 hover:text-white" : "text-[#4d4d55] hover:text-[#171717]"
                    )}
                  >
                    <LogIn className="h-4 w-4 shrink-0" />
                    <span>{loginLabel}</span>
                  </Link>
                  <Link
                    href="/kayit-ol"
                    className={cn(
                      "inline-flex items-center gap-1.5 font-medium transition",
                      isHome ? "text-white/90 hover:text-white" : "text-[#4d4d55] hover:text-[#171717]"
                    )}
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    <span>{registerLabel}</span>
                  </Link>
                </>
              ) : null}

              {resolvedTopHeaderRight.showCurrency ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      suppressHydrationWarning
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition cursor-pointer",
                        isHome
                          ? "border-white/30 bg-white/10 text-white hover:bg-white/15"
                          : "border-[#ded5c7] bg-white text-[#36363e] hover:bg-[#f7f2e8]"
                      )}
                    >
                      <Banknote className="h-3.5 w-3.5" />
                      {currency}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    {activeCurrencies.map(c => (
                      <DropdownMenuItem key={c.code} onClick={() => setCurrency(c.code)}>
                        {c.code} ({c.symbol})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              {resolvedTopHeaderRight.showLanguage ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      suppressHydrationWarning
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition cursor-pointer",
                        isHome
                          ? "border-white/30 bg-white/10 text-white hover:bg-white/15"
                          : "border-[#ded5c7] bg-white text-[#36363e] hover:bg-[#f7f2e8]"
                      )}
                    >
                      <Globe2 className="h-3.5 w-3.5" />
                      {languageLabel}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {activeLanguages.map(l => (
                      <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code)}>
                        {l.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {resolvedTopHeaderRight.showCurrency ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      suppressHydrationWarning
                      className={cn(
                        "inline-flex h-8 items-center gap-1 rounded-full border px-2 text-xs transition cursor-pointer",
                        isHome
                          ? "border-white/35 bg-white/10 text-white hover:bg-white/15"
                          : "border-[#ded5c7] bg-white text-[#2f2f37] hover:bg-[#f7f2e8]"
                      )}
                    >
                      <Banknote className="h-3.5 w-3.5" />
                      {currency}
                      <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-24">
                    {activeCurrencies.map(c => (
                      <DropdownMenuItem key={c.code} onClick={() => setCurrency(c.code)}>
                        {c.code}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              {resolvedTopHeaderRight.showLanguage ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      suppressHydrationWarning
                      className={cn(
                        "inline-flex h-8 items-center gap-1 rounded-full border px-2 transition cursor-pointer",
                        isHome
                          ? "border-white/35 bg-white/10 text-white hover:bg-white/15"
                          : "border-[#ded5c7] bg-white text-[#2f2f37] hover:bg-[#f7f2e8]"
                      )}
                    >
                      <Globe2 className="h-3.5 w-3.5" />
                      <span className="text-xs">{languageLabel}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {activeLanguages.map(l => (
                      <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code)}>
                        {l.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "border-b backdrop-blur-md",
          isHome ? "border-white/15 bg-[#0a1320]/40 text-white" : "border-[#ece4d7] bg-[#fffdfa]/95 text-[#151515]"
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center">
            {companyLogo ? (
              <span className="inline-flex h-12 items-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="h-full w-auto max-w-[220px] object-contain"
                  loading="eager"
                  decoding="async"
                />
              </span>
            ) : (
              <span
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold",
                  isHome ? "bg-white/90 text-[#142233]" : "bg-[#1f3a2e] text-white"
                )}
              >
                AB
              </span>
            )}
            <span className="sr-only">{companyName}</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {menuItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href)
              const isInternal = isInternalHref(item.href)
              const openInNewTab = item.target === "BLANK" || !isInternal
              const className = cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                isHome
                  ? "text-white/90 hover:bg-white/15 hover:text-white"
                  : "text-[#4e4e56] hover:bg-[#f3eee4] hover:text-[#1c1c1c]",
                isActive
                  ? isHome
                    ? "bg-white/20 text-white"
                    : "bg-[#efe7d8] text-[#1c1c1c]"
                  : ""
              )

              if (isInternal) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={className}
                  >
                    {item.label}
                  </Link>
                )
              }

              return (
                <a
                  key={item.id}
                  href={item.href}
                  target={openInNewTab ? "_blank" : undefined}
                  rel={openInNewTab ? "noreferrer" : undefined}
                  className={className}
                >
                  {item.label}
                </a>
              )
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {resolvedActionButtons.map((button, index) => {
              const isPrimary = index === resolvedActionButtons.length - 1
              const Icon = resolveHeaderButtonIcon(button.icon)
              const internal = isInternalHref(button.href)
              const shouldOpenBlank = button.external === true || !internal

              return (
                <Button
                  key={button.id}
                  asChild
                  size="sm"
                  variant={isPrimary ? "default" : "outline"}
                  className={cn(
                    "rounded-full",
                    isPrimary
                      ? "bg-[#111111] text-white hover:bg-black"
                      : isHome
                      ? "border-white/35 bg-white/10 text-white hover:bg-white/15"
                      : "border-[#d8cfbf] bg-white text-[#1d1d1d] hover:bg-[#f5f0e7]"
                  )}
                >
                  {internal ? (
                    <Link href={button.href}>
                      <Icon className="h-4 w-4" />
                      {button.label}
                    </Link>
                  ) : (
                    <a
                      href={button.href}
                      target={shouldOpenBlank ? "_blank" : undefined}
                      rel={shouldOpenBlank ? "noreferrer" : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      {button.label}
                    </a>
                  )}
                </Button>
              )
            })}
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-controls="site-mobile-menu-sheet"
                  className={cn(
                    "touch-target h-11 w-11 rounded-full",
                    isHome
                      ? "border-white/35 bg-white/10 text-white hover:bg-white/15"
                      : "border-[#d8cfbf] bg-white text-[#1f1f1f] hover:bg-[#f5f0e7]"
                  )}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menüyü aç</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                id="site-mobile-menu-sheet"
                side="right"
                className="w-[88vw] border-l-[#ebe4d7] bg-[#fffdfa] sm:max-w-sm"
              >
                <SheetHeader>
                  <SheetTitle className="text-[#161616]">{companyName}</SheetTitle>
                  <SheetDescription>
                    Aden Bungalov müşteri menüsü ve hızlı rezervasyon aksiyonları.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 rounded-xl border border-[#ece2d4] bg-[#f8f4ec] p-3">
                  <div className="space-y-1.5">
                    {resolvedTopHeaderItems.slice(0, 3).map((item) => {
                      const Icon = resolveTopHeaderIcon(item.icon)
                      const isExternalItem =
                        item.href?.startsWith("http://") || item.href?.startsWith("https://")
                      if (item.href) {
                        return (
                          <a
                            key={item.id}
                            href={item.href}
                            target={isExternalItem ? "_blank" : undefined}
                            rel={isExternalItem ? "noreferrer" : undefined}
                            className="inline-flex items-center gap-2 text-xs font-medium text-[#32323a]"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {item.text}
                          </a>
                        )
                      }
                      return (
                        <p key={item.id} className="flex items-start gap-2 text-xs text-[#52525a]">
                          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {item.text}
                        </p>
                      )
                    })}
                  </div>
                  {isCustomerEnabled ? (
                    <div className="mt-3 flex items-center justify-around border-t border-[#e5dcce] pt-2.5 text-xs font-semibold text-[#2b5a44]">
                      <Link href="/giris" className="inline-flex items-center gap-1.5 hover:text-[#162b21]">
                        <LogIn className="h-4 w-4" />
                        <span>{loginLabel}</span>
                      </Link>
                      <span className="h-3.5 w-px bg-[#d8cfbf]" />
                      <Link href="/kayit-ol" className="inline-flex items-center gap-1.5 hover:text-[#162b21]">
                        <UserPlus className="h-4 w-4" />
                        <span>{registerLabel}</span>
                      </Link>
                    </div>
                  ) : null}
                </div>
                <div className="mt-7 space-y-2">
                  {menuItems.map((item) => {
                    const isActive = isNavItemActive(pathname, item.href)
                    const isInternal = isInternalHref(item.href)
                    const openInNewTab = item.target === "BLANK" || !isInternal
                    const className = cn(
                      "block rounded-xl px-3 py-2 text-sm font-medium text-[#43434a]",
                      isActive ? "bg-[#efe8dc] text-[#1a1a1a]" : "hover:bg-[#f4eee4]"
                    )

                    if (isInternal) {
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={className}
                        >
                          {item.label}
                        </Link>
                      )
                    }

                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        target={openInNewTab ? "_blank" : undefined}
                        rel={openInNewTab ? "noreferrer" : undefined}
                        className={className}
                      >
                        {item.label}
                      </a>
                    )
                  })}
                </div>

                <div className="mt-6 grid gap-2">
                  {resolvedActionButtons.map((button, index) => {
                    const isPrimary = index === resolvedActionButtons.length - 1
                    const Icon = resolveHeaderButtonIcon(button.icon)
                    const internal = isInternalHref(button.href)
                    const shouldOpenBlank = button.external === true || !internal

                    return (
                      <Button
                        key={button.id}
                        asChild
                        variant={isPrimary ? "default" : "outline"}
                        className={isPrimary ? "btn-dark" : "border-[#d8cfbf] bg-white hover:bg-[#f5f0e7]"}
                      >
                        {internal ? (
                          <Link href={button.href}>
                            <Icon className="h-4 w-4" />
                            {button.label}
                          </Link>
                        ) : (
                          <a
                            href={button.href}
                            target={shouldOpenBlank ? "_blank" : undefined}
                            rel={shouldOpenBlank ? "noreferrer" : undefined}
                          >
                            <Icon className="h-4 w-4" />
                            {button.label}
                          </a>
                        )}
                      </Button>
                    )
                  })}
                  {/* Hesap alanı bu tanıtım sitesinde yok. */}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
