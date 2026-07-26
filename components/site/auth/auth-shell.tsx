import type { ReactNode } from "react"
import Link from "next/link"
import { BreadcrumbJsonLd } from "@/components/site/json-ld"
import { cn } from "@/lib/utils"

export type AuthShellProps = {
  /** Sol sütundaki tek h1 başlığı */
  title: string
  description: string
  /** Breadcrumb JSON-LD için sayfa adı ve mutlak URL */
  breadcrumbName: string
  breadcrumbUrl: string
  /** Kart üstündeki küçük etiket ve serif kart başlığı */
  cardEyebrow?: string
  cardTitle: string
  cardDescription?: string
  /** Giriş/Kayıt/Şifremi Unuttum geçişi hangi sekmede aktif görünsün */
  activeTab?: "login" | "register" | "forgot-password" | null
  children: ReactNode
}

/** Giriş / kayıt / şifre sıfırlama sayfalarının ortak iskeleti. */
export function AuthShell({
  title,
  description,
  breadcrumbName,
  breadcrumbUrl,
  cardEyebrow = "Hesap İşlemleri",
  cardTitle,
  cardDescription,
  activeTab = null,
  children,
}: AuthShellProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 pb-[calc(var(--site-bottom-chrome)+1rem)] sm:px-6 md:py-16 md:pb-16">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "https://www.adenbungalov.com" },
          { name: breadcrumbName, url: breadcrumbUrl },
        ]}
      />

      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Sol sütun: marka rozeti ve sayfa başlığı */}
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8a857a]">
            Müşteri Paneli
          </p>

          <h1 className="mt-3 text-[clamp(2rem,4.6vw,3.25rem)] font-semibold leading-[1.12] tracking-tight text-[#1a1a1a]">
            {title}
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-7 text-[#616168] md:text-base">
            {description}
          </p>
        </div>

        {/* Sağ sütun: form kartı */}
        <div className="rounded-2xl border border-[#e7dfd1] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8a857a]">
            {cardEyebrow}
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#1a1a1a] sm:text-2xl">
            {cardTitle}
          </h2>

          {cardDescription ? (
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#75756f]">{cardDescription}</p>
          ) : null}

          {activeTab ? <AuthTabs active={activeTab} /> : null}

          <div className={activeTab ? "mt-5" : "mt-6"}>{children}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Giriş ve kayıt arasındaki geçiş. Görsel olarak segment kontrolü gibi görünür
 * ancak gerçek bağlantılardır; her ekranın kendi URL'i korunur.
 */
function AuthTabs({ active }: { active: "login" | "register" | "forgot-password" }) {
  const items = [
    { key: "login" as const, label: "Giriş Yap", href: "/giris" },
    { key: "register" as const, label: "Kayıt Ol", href: "/kayit-ol" },
  ]

  return (
    <nav aria-label="Hesap işlemleri" className="mt-5">
      <ul className="grid grid-cols-2 gap-1 rounded-lg bg-[#f5f1e8] p-1">
        {items.map((item) => {
          const isActive = item.key === active
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-9 w-full items-center justify-center rounded-md px-3 text-[13px] transition",
                  isActive
                    ? "bg-[#1f3a2e] font-medium text-white shadow-sm"
                    : "text-[#4f4f57] hover:text-[#1a1a1a]"
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
