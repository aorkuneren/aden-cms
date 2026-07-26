import Link from "next/link"
import type { ComponentType } from "react"
import { PhoneCall, Search, UserRound } from "lucide-react"
import { WhatsappIcon } from "@/components/site/brand-icons"
import { cn } from "@/lib/utils"

type MobileBottomNavProps = {
  whatsappHref: string
  phoneHref: string
  userSystemEnabled: boolean
}

type MobileAction = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  external?: boolean
  highlighted?: boolean
}

export function MobileBottomNav({ whatsappHref, phoneHref, userSystemEnabled }: MobileBottomNavProps) {
  const actions: MobileAction[] = [
    { href: phoneHref, label: "Ara", icon: PhoneCall, external: true },
    { href: whatsappHref, label: "WhatsApp", icon: WhatsappIcon, external: true },
    { href: "/bungalovlarimiz", label: "Bungalovlar", icon: Search },
    ...(userSystemEnabled ? [{ href: "/hesabim", label: "Hesabım", icon: UserRound, highlighted: true }] : []),
  ]

  return (
    <nav
      aria-label="Mobil Alt Gezinme"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#ded5c6] bg-[#fffaf2]/95 px-2 px-safe py-1.5 pb-safe backdrop-blur md:hidden"
    >
      <div className={cn("mx-auto grid max-w-xl gap-1", userSystemEnabled ? "grid-cols-4" : "grid-cols-3")}>
        {actions.map((action) =>
          action.external ? (
            <a
              key={action.label}
              href={action.href}
              target={action.href.startsWith("http") ? "_blank" : undefined}
              rel={action.href.startsWith("http") ? "noreferrer" : undefined}
              aria-label={action.label}
              className={cn(
                "touch-target flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-semibold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1f3a2e]",
                action.highlighted ? "bg-[#1f3a2e] text-white shadow-sm" : "text-[#3e3e45] hover:bg-[#efe7d8]"
              )}
            >
              <action.icon className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">{action.label}</span>
            </a>
          ) : (
            <Link
              key={action.label}
              href={action.href}
              aria-label={action.label}
              className={cn(
                "touch-target flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-semibold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1f3a2e]",
                action.highlighted ? "bg-[#1f3a2e] text-white shadow-sm" : "text-[#3e3e45] hover:bg-[#efe7d8]"
              )}
            >
              <action.icon className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">{action.label}</span>
            </Link>
          )
        )}
      </div>
    </nav>
  )
}
