"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BadgeCheck, ChevronDown, ShieldAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { LucideIcon } from "@/components/admin/lucide-icon"
import { ADMIN_NAV } from "./admin-nav"

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof ADMIN_NAV)[number]["items"][number]
  pathname: string
  onNavigate?: () => void
}) {
  const hasChildren = Boolean(item.children?.length)
  const childActive = item.children?.some((child) => child.href && isActive(pathname, child.href)) ?? false
  const [expanded, setExpanded] = useState(childActive)
  const isExpanded = expanded || childActive

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={isExpanded}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
            childActive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-neutral-800"
          )}
        >
          <LucideIcon name={item.icon} className={cn("size-4", childActive ? "text-emerald-600" : "text-slate-400 dark:text-slate-500")} />
          <span className="flex-1">{item.label}</span>
          <ChevronDown className={cn("size-4 transition-transform", isExpanded && "rotate-180")} />
        </button>
        {isExpanded ? (
          <div className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-2 dark:border-neutral-800">
            {item.children?.map((child) => {
              if (!child.href) return null
              const active = isActive(pathname, child.href)
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-emerald-600 font-medium text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-neutral-800"
                  )}
                >
                  <LucideIcon name={child.icon} className={cn("size-3.5", active ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                  <span>{child.label}</span>
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>
    )
  }

  if (!item.href) return null
  const active = isActive(pathname, item.href)
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-emerald-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-neutral-800"
      )}
    >
      <LucideIcon name={item.icon} className={cn("size-4", active ? "text-white" : "text-slate-400 dark:text-slate-500")} />
      <span>{item.label}</span>
    </Link>
  )
}

export function AdminSidebar({
  roleLabel,
  version = "v1.0",
  onNavigate,
}: {
  roleLabel: string
  version?: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-900">
      {/* Marka */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 dark:border-neutral-800">
        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          <LucideIcon name="House" className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="truncate font-semibold text-slate-900 dark:text-white">Aden Bungalov</p>
            <BadgeCheck className="size-4 shrink-0 text-emerald-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Yönetim Paneli</p>
        </div>
      </div>

      {/* Menü */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.title}
            </p>
            {group.items.map((item) => (
              <NavItem key={item.href ?? item.label} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      {/* Alt statü */}
      <div className="space-y-2 border-t border-slate-200 p-3 dark:border-neutral-800">
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/40">
          <span className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-500" />
            Sistem Aktif
          </span>
          <span className="text-xs font-medium text-emerald-600/70 dark:text-emerald-500/70">{version}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-500">
          <ShieldAlert className="size-4" />
          {roleLabel}
        </div>
      </div>
    </div>
  )
}
