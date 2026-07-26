"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCheck,
  Clock,
  Inbox,
  Mail,
  MailOpen,
  MessageSquare,
  Phone,
  Search,
  Trash2,
} from "lucide-react"

import {
  deleteInquiryAction,
  setInquiryReadAction,
  setInquiryStatusAction,
} from "@/app/admin/(panel)/iletisim/mesajlar/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Inquiry, InquiryStatus, InquiryType } from "@/lib/site/inquiries"
import { cn } from "@/lib/utils"

const TYPE_LABELS: Record<InquiryType, string> = {
  CONTACT: "İletişim",
  COMPLAINT: "Şikayet",
  REQUEST: "Talep",
  SUGGESTION: "Öneri / İstek",
}

const TYPE_ACCENT: Record<InquiryType, string> = {
  CONTACT: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  COMPLAINT: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  REQUEST: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  SUGGESTION: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
}

const STATUS_LABELS: Record<InquiryStatus, string> = {
  NEW: "Yeni",
  IN_PROGRESS: "İşlemde",
  RESOLVED: "Çözüldü",
}

const STATUS_STYLES: Record<InquiryStatus, string> = {
  NEW: "border-emerald-300 text-emerald-700 dark:text-emerald-300",
  IN_PROGRESS: "border-blue-300 text-blue-700 dark:text-blue-300",
  RESOLVED: "border-slate-300 text-slate-500 dark:text-slate-400",
}

const STATUS_ORDER: InquiryStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED"]

type FilterKey = "all" | "unread" | InquiryStatus

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function formatRelative(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diffMs = Date.now() - date.getTime()
  const min = Math.round(diffMs / 60000)
  if (min < 1) return "az önce"
  if (min < 60) return `${min} dk önce`
  const hours = Math.round(min / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} gün önce`
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(date)
}

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "")
}

export function InquiryInbox({
  initialItems,
  canManage,
  canDelete,
}: {
  initialItems: Inquiry[]
  canManage: boolean
  canDelete: boolean
}) {
  const router = useRouter()
  const [items, setItems] = useState<Inquiry[]>(initialItems)
  const [filter, setFilter] = useState<FilterKey>("all")
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Inquiry | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const counts = useMemo(() => {
    const base = { all: items.length, unread: 0, NEW: 0, IN_PROGRESS: 0, RESOLVED: 0 }
    for (const item of items) {
      if (!item.isRead) base.unread += 1
      base[item.status] += 1
    }
    return base
  }, [items])

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR")
    return items.filter((item) => {
      if (filter === "unread" && item.isRead) return false
      if (filter !== "all" && filter !== "unread" && item.status !== filter) return false
      if (!q) return true
      return [item.name, item.email, item.phone, item.subject, item.message]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(q)
    })
  }, [items, filter, query])

  const openItem = items.find((item) => item.id === openId) ?? null

  const patchLocal = (id: string, patch: Partial<Inquiry>) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  const openDetail = (item: Inquiry) => {
    setOpenId(item.id)
    if (!item.isRead && canManage) {
      patchLocal(item.id, { isRead: true })
      startTransition(async () => {
        await setInquiryReadAction(item.id, true)
        router.refresh()
      })
    }
  }

  const toggleRead = (item: Inquiry) => {
    const next = !item.isRead
    patchLocal(item.id, { isRead: next })
    startTransition(async () => {
      const res = await setInquiryReadAction(item.id, next)
      if (!res.ok) setStatus(res.error)
      router.refresh()
    })
  }

  const changeStatus = (item: Inquiry, next: InquiryStatus) => {
    patchLocal(item.id, { status: next, isRead: true })
    startTransition(async () => {
      const res = await setInquiryStatusAction(item.id, next)
      if (!res.ok) setStatus(res.error)
      router.refresh()
    })
  }

  const confirmDelete = () => {
    if (!deleteCandidate) return
    const target = deleteCandidate
    startTransition(async () => {
      const res = await deleteInquiryAction(target.id)
      if (!res.ok) {
        setStatus(res.error)
        return
      }
      setItems((current) => current.filter((item) => item.id !== target.id))
      setStatus(`“${target.name}” mesajı silindi.`)
      setDeleteCandidate(null)
      if (openId === target.id) setOpenId(null)
      router.refresh()
    })
  }

  const filterChips: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "Tümü", count: counts.all },
    { key: "unread", label: "Okunmamış", count: counts.unread },
    { key: "NEW", label: "Yeni", count: counts.NEW },
    { key: "IN_PROGRESS", label: "İşlemde", count: counts.IN_PROGRESS },
    { key: "RESOLVED", label: "Çözüldü", count: counts.RESOLVED },
  ]

  return (
    <div className="space-y-4">
      {status ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300">
          {status}
        </p>
      ) : null}

      {/* Filtre + arama çubuğu */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filterChips.map((chip) => {
            const active = filter === chip.key
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilter(chip.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-emerald-500 bg-emerald-600 text-white shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300"
                )}
              >
                {chip.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                    active ? "bg-white/20" : "bg-slate-100 dark:bg-neutral-800"
                  )}
                >
                  {chip.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ad, e-posta, konu ara..."
            className="h-9 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Liste */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-neutral-700">
          <Inbox className="mx-auto mb-3 size-8 text-slate-400" />
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {items.length === 0 ? "Henüz mesaj yok" : "Bu filtrede mesaj yok"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {items.length === 0
              ? "İletişim formundan gelen mesajlar burada listelenecek."
              : "Farklı bir filtre veya arama deneyin."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-neutral-800">
          <div className="divide-y divide-slate-100 dark:divide-neutral-800">
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openDetail(item)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-neutral-900/60",
                  !item.isRead && "bg-emerald-50/40 dark:bg-emerald-950/10"
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    item.isRead ? "bg-transparent" : "bg-emerald-500"
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-sm text-slate-900 dark:text-white",
                        item.isRead ? "font-medium" : "font-bold"
                      )}
                    >
                      {item.name || "İsimsiz"}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        TYPE_ACCENT[item.type]
                      )}
                    >
                      {TYPE_LABELS[item.type]}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("h-5 px-1.5 text-[10px]", STATUS_STYLES[item.status])}
                    >
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                    {item.subject || "(konu yok)"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{item.message}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap pt-0.5 text-[11px] text-slate-400">
                  {formatRelative(item.createdAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detay */}
      <Dialog open={Boolean(openItem)} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-w-lg">
          {openItem ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-base">{openItem.name || "İsimsiz"}</DialogTitle>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      TYPE_ACCENT[openItem.type]
                    )}
                  >
                    {TYPE_LABELS[openItem.type]}
                  </span>
                </div>
                <DialogDescription className="flex items-center gap-1.5 text-xs">
                  <Clock className="size-3" /> {formatDateTime(openItem.createdAt)}
                  {openItem.ip ? <span className="text-slate-400">· {openItem.ip}</span> : null}
                </DialogDescription>
              </DialogHeader>

              {/* İletişim kanalları */}
              <div className="grid gap-2 sm:grid-cols-2">
                {openItem.email ? (
                  <a
                    href={`mailto:${openItem.email}`}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 transition-colors hover:border-emerald-400 hover:text-emerald-700 dark:border-neutral-800 dark:text-slate-300"
                  >
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{openItem.email}</span>
                  </a>
                ) : null}
                {openItem.phone ? (
                  <a
                    href={`tel:${digitsOnly(openItem.phone)}`}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 transition-colors hover:border-emerald-400 hover:text-emerald-700 dark:border-neutral-800 dark:text-slate-300"
                  >
                    <Phone className="size-3.5 shrink-0" />
                    <span className="truncate">{openItem.phone}</span>
                  </a>
                ) : null}
              </div>

              {openItem.subject ? (
                <div className="flex items-start gap-2 text-sm">
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {openItem.subject}
                  </span>
                </div>
              ) : null}

              <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 dark:bg-neutral-900 dark:text-slate-200">
                {openItem.message || "(mesaj boş)"}
              </div>

              {/* Durum + hızlı yanıt */}
              {canManage ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Durum
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_ORDER.map((value) => {
                      const active = openItem.status === value
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={pending}
                          onClick={() => changeStatus(openItem, value)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                            active
                              ? "border-emerald-500 bg-emerald-600 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300"
                          )}
                        >
                          {STATUS_LABELS[value]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex gap-2">
                  {openItem.phone ? (
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                      <a
                        href={`https://wa.me/${digitsOnly(openItem.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={pending}
                      onClick={() => toggleRead(openItem)}
                    >
                      {openItem.isRead ? (
                        <>
                          <Mail className="size-3.5" /> Okunmadı yap
                        </>
                      ) : (
                        <>
                          <MailOpen className="size-3.5" /> Okundu yap
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
                {canDelete ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={pending}
                    onClick={() => setDeleteCandidate(openItem)}
                  >
                    <Trash2 className="size-3.5" /> Sil
                  </Button>
                ) : null}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Silme onayı */}
      <Dialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mesajı sil?</DialogTitle>
            <DialogDescription>
              “{deleteCandidate?.name}” adlı kişinin mesajı geri dönüşüme taşınacak. Geri
              Dönüşüm&apos;den geri yükleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setDeleteCandidate(null)}>
              Vazgeç
            </Button>
            <Button variant="destructive" disabled={pending} onClick={confirmDelete}>
              <CheckCheck className="size-4" /> Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
