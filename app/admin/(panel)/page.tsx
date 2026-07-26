import Link from "next/link"
import {
  GalleryHorizontal,
  Images,
  MessageCircleQuestion,
  Home,
  Inbox,
  Plus,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { getCurrentAdmin } from "@/lib/admin/auth"
import { getAuditLogs } from "@/lib/audit"
import { getInquiryStats } from "@/lib/site/inquiries"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

async function safeRead<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin()

  const [sliderCount, galleryCount, faqCount, bungalovList, auditLogs, inquiryStats] =
    await Promise.all([
      safeRead(async () => {
        const cfg = await readJson<any>("cms-config.json")
        return Array.isArray(cfg?.sliderManagement) ? filterActive(cfg.sliderManagement).length : 0
      }, 0),
      safeRead(async () => {
        const cfg = await readJson<any>("cms-config.json")
        return Array.isArray(cfg?.galleryManagement?.items)
          ? filterActive(cfg.galleryManagement.items).length
          : 0
      }, 0),
      safeRead(async () => {
        const cfg = await readJson<any>("cms-config.json")
        return Array.isArray(cfg?.faqManagement) ? filterActive(cfg.faqManagement).length : 0
      }, 0),
      safeRead(async () => {
        const list = await readJson<any[]>("bungalovs.json")
        return Array.isArray(list) ? list : []
      }, []),
      safeRead(async () => {
        return await getAuditLogs()
      }, []),
      safeRead(async () => await getInquiryStats(), {
        total: 0,
        unread: 0,
        byStatus: { NEW: 0, IN_PROGRESS: 0, RESOLVED: 0 },
      }),
    ])

  const activeBungalovs = filterActive(bungalovList).filter((b) => b?.status !== "PASIF").length
  const featuredBungalovs = filterActive(bungalovList).filter((b) => b?.isFeatured).length

  const stats = [
    {
      label: "Bungalov Kataloğu",
      value: filterActive(bungalovList).length,
      subtext: `${activeBungalovs} aktif, ${featuredBungalovs} öne çıkan`,
      icon: Home,
      href: "/admin/bungalovlar",
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    {
      label: "Slider Görselleri",
      value: sliderCount,
      subtext: "Anasayfa vitrin slaytları",
      icon: GalleryHorizontal,
      href: "/admin/website/slider",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    },
    {
      label: "Galeri İçerikleri",
      value: galleryCount,
      subtext: "Fotoğraf & kategori koleksiyonu",
      icon: Images,
      href: "/admin/website/galeri",
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
    },
    {
      label: "İletişim Mesajları",
      value: inquiryStats.total,
      subtext:
        inquiryStats.unread > 0
          ? `${inquiryStats.unread} okunmamış mesaj`
          : "Tüm mesajlar okundu",
      icon: Inbox,
      href: "/admin/iletisim/mesajlar",
      color: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    },
  ]

  const recentLogs = auditLogs.slice(0, 5)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Hoş geldiniz${admin?.name ? `, ${admin.name}` : ""}`}
        description="Aden Bungalov kurumsal içerik ve sistem yönetim paneline genel bakış."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> Siteyi İncele
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/admin/bungalovlar/yeni">
                <Plus className="size-4" /> Yeni Bungalov
              </Link>
            </Button>
          </div>
        }
      />

      {/* İstatistik Metrikleri */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="relative overflow-hidden transition-all duration-200 hover:border-emerald-500/50 hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {s.label}
                </CardTitle>
                <div className={`flex size-9 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
                    {s.value}
                  </span>
                  <ArrowUpRight className="size-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.subtext}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Hızlı Erişim ve Durum Alanı */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Hızlı İşlem Kartları */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-base">Hızlı Yönetim İşlemleri</CardTitle>
            </div>
            <CardDescription>Sık kullanılan modüllere doğrudan erişin.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/website/slider"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-neutral-800 dark:hover:bg-emerald-950/20"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <GalleryHorizontal className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Slider Görselleri</p>
                <p className="truncate text-xs text-slate-500">Vitrin slaytlarını yönet</p>
              </div>
            </Link>

            <Link
              href="/admin/website/galeri"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-neutral-800 dark:hover:bg-emerald-950/20"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <Images className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Galeri Yönetimi</p>
                <p className="truncate text-xs text-slate-500">Tesis fotoğraflarını yönet</p>
              </div>
            </Link>

            <Link
              href="/admin/website/sss"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-neutral-800 dark:hover:bg-emerald-950/20"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <MessageCircleQuestion className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Sıkça Sorulanlar</p>
                <p className="truncate text-xs text-slate-500">{faqCount} soru mevcut</p>
              </div>
            </Link>

            <Link
              href="/admin/ayarlar"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-neutral-800 dark:hover:bg-emerald-950/20"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300">
                <ShieldCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Sistem Ayarları</p>
                <p className="truncate text-xs text-slate-500">Firma & iletişim bilgileri</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Sistem Durumu Sağ Kolon */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-base">Sistem Sağlığı</CardTitle>
            </div>
            <CardDescription>Altyapı ve veritabanı durumu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
              <span className="text-slate-600 dark:text-slate-400">Veri Deposu (JSON)</span>
              <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 size-3" /> Atomik Aktif
              </Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
              <span className="text-slate-600 dark:text-slate-400">Oturum Güvenliği</span>
              <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400">
                HMAC-SHA256
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Site Önizleme Cache</span>
              <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
                Otomatik Revalidate
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Son Denetim Kayıtları (Audit Logs Feed) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Son İşlem ve Aktivite Kayıtları</CardTitle>
            <CardDescription>Sistemde gerçekleştirilen son 5 yönetici işlemi.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/aktivite">
              Tümünü Gör <ArrowUpRight className="ml-1 size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              <AlertCircle className="mx-auto size-6 text-slate-400" />
              <p className="mt-2">Henüz kaydedilmiş bir aktivite bulunmuyor.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-neutral-800 dark:text-slate-300">
                      {log.actorName ? log.actorName.charAt(0).toLocaleUpperCase("tr-TR") : "S"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {log.action}
                      </p>
                      <p className="text-xs text-slate-500">
                        {log.actorName} • <span className="uppercase">{log.entityType}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(log.createdAt).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
