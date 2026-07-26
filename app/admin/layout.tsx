import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Yönetim Paneli | Aden Bungalov",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Panel tarafında (login dahil) tüm metinler Inter kullanır; globals.css'teki
  // global "h1-h6 → Playfair Display" kuralı yönetim paneline sızmaz.
  return <div className="admin-font-inter min-h-screen bg-muted/30 text-foreground">{children}</div>
}
