"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Bell, ExternalLink, LogOut, Search } from "lucide-react"

import { logoutAction } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminSidebar } from "./admin-sidebar"
import { ADMIN_NAV, type AdminNavItem } from "./admin-nav"

function currentLabel(pathname: string): string {
  let best = "Panel"
  let bestLen = -1
  const visit = (item: AdminNavItem) => {
    if (item.href) {
      const match = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
      if (match && item.href.length > bestLen) {
        best = item.label
        bestLen = item.href.length
      }
    }
    item.children?.forEach(visit)
  }

  for (const group of ADMIN_NAV) {
    group.items.forEach(visit)
  }
  return best
}

export function AdminTopbar({
  adminName,
  roleLabel,
  version,
}: {
  adminName: string
  roleLabel: string
  version: string
}) {
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const pathname = usePathname()
  const label = currentLabel(pathname)
  const initial = adminName.trim().charAt(0).toLocaleUpperCase("tr-TR") || "A"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
      {/* Mobil menü */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden" aria-label="Menü">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menü</SheetTitle>
          </SheetHeader>
          <AdminSidebar roleLabel={roleLabel} version={version} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <nav className="hidden items-center gap-2 text-sm sm:flex">
        <span className="text-slate-400">Panel</span>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="font-medium text-slate-900 dark:text-white">{label}</span>
      </nav>

      {/* Ortada arama */}
      <div className="mx-auto hidden w-full max-w-sm md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Hızlı Arama…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-800 dark:focus:bg-neutral-900"
          />
        </div>
      </div>

      <div className="flex-1 md:hidden" />

      {/* Sağ aksiyonlar */}
      <div className="flex items-center gap-1">
        <ThemeToggleSlot />

        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Bildirimler">
          <Bell />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Hesap menüsü"
            >
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>{adminName}</span>
              <span className="text-xs font-normal text-muted-foreground">{roleLabel}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink /> Siteyi görüntüle
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault()
                startTransition(() => {
                  void logoutAction()
                })
              }}
            >
              <LogOut /> Çıkış yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// Tema toggle'ı ayrı dosyada; burada dinamik import gerekmiyor, doğrudan kullan.
import { AdminThemeToggle } from "./admin-theme-toggle"
function ThemeToggleSlot() {
  return <AdminThemeToggle />
}
