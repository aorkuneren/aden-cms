"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  Plus, Trash2, ArrowUp, ArrowDown, ChevronRight, ChevronDown, Save, Rocket,
  Copy, Pencil, Eye, Layers, AlertTriangle, Search, FileText, Home, Link2,
  Type as TypeIcon, ListTree, IndentIncrease, IndentDecrease, Menu as MenuIcon,
  Monitor, Smartphone, PanelBottom, Check,
} from "lucide-react"

import { saveMenuGroupsAction, setMenuGroupStatusAction } from "@/app/admin/(panel)/website/actions"
import {
  MENU_ITEM_TYPE_LABELS, MENU_DISPLAY_STYLE_LABELS, MENU_GROUP_STATUS_LABELS,
  type MenuItemType, type MenuGroupStatus,
} from "@/lib/site/menu-model"
import {
  appendRoot, duplicateNode, indent, moveSibling, outdent, patchNode, removeNode,
  countNodes, type TreeItem,
} from "@/lib/site/menu-tree"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

/* ----------------------------------- tipler ----------------------------------- */

export type PickerSources = {
  pages: { referenceId: string; title: string; href: string; status: string }[]
  bungalows: { referenceId: string; title: string; href: string; status: string; image?: string }[]
  systemRoutes: { key: string; label: string; href: string }[]
}

export type BuilderGroup = {
  id: string
  key?: string
  title: string
  location?: string
  description?: string
  status?: MenuGroupStatus
  isActive: boolean
  items: TreeItem[]
  publishedAt?: string | null
}

const LOCATIONS = [
  { value: "HEADER", label: "Header (üst menü)" },
  { value: "MOBILE", label: "Mobil menü" },
  { value: "FOOTER", label: "Footer" },
  { value: "TOP", label: "Üst çubuk" },
  { value: "OTHER", label: "Diğer" },
]

const rid = (p = "mi") => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const label = (it: TreeItem) => (it.title ?? it.text ?? "").trim()

/* ------------------------------ ana bileşen ------------------------------ */

export function MenuBuilder({
  initialGroups,
  sources,
  canPublish,
}: {
  initialGroups: BuilderGroup[]
  sources: PickerSources
  canPublish: boolean
}) {
  const [groups, setGroups] = useState<BuilderGroup[]>(initialGroups)
  const [activeId, setActiveId] = useState<string>(initialGroups[0]?.id ?? "")
  const [dirty, setDirty] = useState(false)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const active = groups.find((g) => g.id === activeId) ?? groups[0]

  // Kaydedilmemiş değişiklik uyarısı
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  const mutateActive = (fn: (items: TreeItem[]) => TreeItem[]) => {
    setGroups((prev) => prev.map((g) => (g.id === activeId ? { ...g, items: fn(g.items) } : g)))
    setDirty(true)
    setStatus(null)
  }
  const patchGroup = (p: Partial<BuilderGroup>) => {
    setGroups((prev) => prev.map((g) => (g.id === activeId ? { ...g, ...p } : g)))
    setDirty(true)
    setStatus(null)
  }

  /* --- öğe ekleme --- */
  const addItem = (item: TreeItem) => {
    mutateActive((items) => appendRoot(items, item))
  }
  const addPage = (p: PickerSources["pages"][number]) =>
    addItem({ id: rid("page"), itemType: "page", referenceId: p.referenceId, title: p.title, isActive: true, showOnDesktop: true, showOnMobile: true })
  const addBungalow = (b: PickerSources["bungalows"][number]) =>
    addItem({ id: rid("bng"), itemType: "bungalow", referenceId: b.referenceId, title: b.title, isActive: true, showOnDesktop: true, showOnMobile: true })
  const addSystem = (r: PickerSources["systemRoutes"][number]) =>
    addItem({ id: rid("sys"), itemType: "system_route", routeName: r.key, title: r.label, isActive: true, showOnDesktop: true, showOnMobile: true })
  const addCustom = () =>
    addItem({ id: rid("custom"), itemType: "custom_link", title: "Yeni Bağlantı", url: "https://", target: "BLANK", isActive: true, showOnDesktop: true, showOnMobile: true })
  const addHeading = () =>
    addItem({ id: rid("head"), itemType: "heading", title: "Başlık", isActive: true, showOnDesktop: true, showOnMobile: true })
  const addDynamic = () =>
    addItem({ id: rid("dyn"), itemType: "dynamic_bungalow_list", title: "Bungalovlar", isActive: true, showOnDesktop: true, showOnMobile: true, dynamicSettings: { source: "all_active", limit: 6, sort: "manual" } })

  /* --- kaydet / yayınla --- */
  const persist = (onOk?: () => void) =>
    startTransition(async () => {
      const res = await saveMenuGroupsAction(groups)
      if (res.ok) {
        setDirty(false)
        setStatus({ type: "ok", msg: "Taslak kaydedildi." })
        onOk?.()
      } else setStatus({ type: "err", msg: res.error })
    })

  const publish = () =>
    startTransition(async () => {
      const save = await saveMenuGroupsAction(groups)
      if (!save.ok) return setStatus({ type: "err", msg: save.error })
      const res = await setMenuGroupStatusAction(active.id, "published")
      if (res.ok) {
        setDirty(false)
        setGroups((prev) => prev.map((g) => (g.id === active.id ? { ...g, status: "published", isActive: true } : g)))
        setStatus({ type: "ok", msg: "Menü yayınlandı ve siteye yansıtıldı." })
      } else setStatus({ type: "err", msg: res.error })
    })

  const setStatusValue = (s: MenuGroupStatus) =>
    startTransition(async () => {
      const res = await setMenuGroupStatusAction(active.id, s)
      if (res.ok) {
        setGroups((prev) => prev.map((g) => (g.id === active.id ? { ...g, status: s, isActive: s === "published" } : g)))
        setStatus({ type: "ok", msg: `Durum güncellendi: ${MENU_GROUP_STATUS_LABELS[s]}` })
      } else setStatus({ type: "err", msg: res.error })
    })

  const addGroup = () => {
    const g: BuilderGroup = { id: rid("group"), key: "", title: "Yeni Menü", location: "OTHER", status: "draft", isActive: false, items: [] }
    setGroups((prev) => [...prev, g])
    setActiveId(g.id)
    setDirty(true)
  }
  const deleteGroup = () => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== active.id)
      setActiveId(next[0]?.id ?? "")
      return next
    })
    setDirty(true)
  }

  if (!active) {
    return (
      <div className="space-y-4">
        <Card><CardContent className="py-10 text-center text-sm text-slate-500">Menü grubu yok.</CardContent></Card>
        <Button onClick={addGroup} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="mr-1 size-4" /> İlk grubu oluştur</Button>
      </div>
    )
  }

  const editing = editingItem ? findInTree(active.items, editingItem) : null

  return (
    <div className="space-y-3">
      {/* Üst bar */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-2xs backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={activeId} onValueChange={(v) => setActiveId(v)}>
            <SelectTrigger className="h-8 w-52 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.title}{g.key ? ` (${g.key})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <StatusBadge status={active.status ?? "draft"} />
          <span className="text-xs text-slate-400">{countNodes(active.items)} öğe</span>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addGroup}><Plus className="mr-1 size-3.5" /> Grup</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPreviewOpen(true)}><Eye className="mr-1 size-3.5" /> Önizleme</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => persist()} disabled={pending}><Save className="mr-1 size-3.5" /> Taslak Kaydet</Button>
          <Button size="sm" className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700" onClick={publish} disabled={pending || !canPublish} title={!canPublish ? "Yayınlama yetkiniz yok" : ""}>
            <Rocket className="mr-1 size-3.5" /> Yayınla
          </Button>
        </div>
      </div>

      <SaveStatusBanner status={status} />

      {/* Grup meta */}
      <Card>
        <CardContent className="grid gap-3 py-3 sm:grid-cols-4">
          <div className="space-y-1"><Label className="text-[11px]">Menü adı</Label><Input value={active.title} onChange={(e) => patchGroup({ title: e.target.value })} className="h-8 text-sm" /></div>
          <div className="space-y-1">
            <Label className="text-[11px]">Sistem anahtarı</Label>
            <Input value={active.key ?? ""} onChange={(e) => patchGroup({ key: e.target.value.trim() })} placeholder="main-menu" className="h-8 font-mono text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Konum</Label>
            <Select value={active.location ?? "OTHER"} onValueChange={(v) => patchGroup({ location: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{LOCATIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-[11px]">Açıklama</Label><Input value={active.description ?? ""} onChange={(e) => patchGroup({ description: e.target.value })} className="h-8 text-sm" /></div>
        </CardContent>
      </Card>

      {/* 2 panel: sol seçici + orta ağaç */}
      <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
        <ContentPicker sources={sources} onAddPage={addPage} onAddBungalow={addBungalow} onAddSystem={addSystem} onAddCustom={addCustom} onAddHeading={addHeading} onAddDynamic={addDynamic} />

        <Card>
          <CardContent className="py-3">
            {active.items.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                <ListTree className="mx-auto mb-2 size-6 text-slate-300" />
                Menü boş. Soldaki panelden içerik ekleyin.
              </div>
            ) : (
              <MenuTree
                items={active.items}
                depth={1}
                sources={sources}
                collapsed={collapsed}
                onToggleCollapse={(id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))}
                onMove={(id, dir) => mutateActive((items) => moveSibling(items, id, dir))}
                onIndent={(id) => mutateActive((items) => indent(items, id))}
                onOutdent={(id) => mutateActive((items) => outdent(items, id))}
                onDuplicate={(id) => mutateActive((items) => duplicateNode(items, id, () => rid("copy")))}
                onDelete={(id) => mutateActive((items) => removeNode(items, id))}
                onToggleActive={(id, v) => mutateActive((items) => patchNode(items, id, { isActive: v }))}
                onEdit={(id) => setEditingItem(id)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grup silme */}
      <div className="flex justify-end">
        <DeleteGroupButton itemCount={countNodes(active.items)} onDelete={deleteGroup} />
      </div>

      {/* Öğe ayarları */}
      {editing ? (
        <ItemSettingsDialog
          item={editing}
          sources={sources}
          onClose={() => setEditingItem(null)}
          onChange={(patch) => mutateActive((items) => patchNode(items, editing.id, patch))}
        />
      ) : null}

      {/* Önizleme */}
      {previewOpen ? <PreviewDialog group={active} sources={sources} onClose={() => setPreviewOpen(false)} /> : null}
    </div>
  )
}

/* --------------------------- yardımcı: ağaçta bul --------------------------- */
function findInTree(items: TreeItem[], id: string): TreeItem | null {
  for (const it of items) {
    if (it.id === id) return it
    if (it.children) {
      const f = findInTree(it.children, id)
      if (f) return f
    }
  }
  return null
}

function StatusBadge({ status }: { status: MenuGroupStatus }) {
  const map: Record<MenuGroupStatus, string> = {
    published: "bg-emerald-600 text-white",
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    passive: "bg-slate-200 text-slate-600 dark:bg-neutral-800 dark:text-slate-300",
    archived: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  }
  return <Badge className={`text-[10px] ${map[status]}`}>{MENU_GROUP_STATUS_LABELS[status]}</Badge>
}

/* ------------------------- SOL PANEL: içerik seçici ------------------------- */

const PICKER_TABS = [
  { key: "pages", label: "Sayfalar", icon: FileText },
  { key: "bungalows", label: "Bungalovlar", icon: Home },
  { key: "system", label: "Sistem", icon: Layers },
  { key: "custom", label: "Özel", icon: Link2 },
  { key: "heading", label: "Başlık", icon: TypeIcon },
  { key: "dynamic", label: "Dinamik", icon: ListTree },
] as const

function ContentPicker({
  sources, onAddPage, onAddBungalow, onAddSystem, onAddCustom, onAddHeading, onAddDynamic,
}: {
  sources: PickerSources
  onAddPage: (p: PickerSources["pages"][number]) => void
  onAddBungalow: (b: PickerSources["bungalows"][number]) => void
  onAddSystem: (r: PickerSources["systemRoutes"][number]) => void
  onAddCustom: () => void
  onAddHeading: () => void
  onAddDynamic: () => void
}) {
  const [tab, setTab] = useState<(typeof PICKER_TABS)[number]["key"]>("pages")
  const [q, setQ] = useState("")

  const pages = sources.pages.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
  const bungalows = sources.bungalows.filter((b) => b.title.toLowerCase().includes(q.toLowerCase()))
  const routes = sources.systemRoutes.filter((r) => r.label.toLowerCase().includes(q.toLowerCase()))

  return (
    <Card className="lg:sticky lg:top-32 lg:self-start">
      <CardContent className="space-y-3 py-3">
        <div className="flex flex-wrap gap-1">
          {PICKER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${tab === t.key ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800"}`}
            >
              <t.icon className="size-3" /> {t.label}
            </button>
          ))}
        </div>

        {(tab === "pages" || tab === "bungalows" || tab === "system") && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-3.5 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara…" className="h-8 pl-8 text-xs" />
          </div>
        )}

        <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
          {tab === "pages" && pages.map((p) => (
            <PickRow key={p.referenceId} title={p.title} sub={p.href} onAdd={() => onAddPage(p)} />
          ))}
          {tab === "pages" && pages.length === 0 && <Empty />}

          {tab === "bungalows" && bungalows.map((b) => (
            <PickRow key={b.referenceId} title={b.title} sub={b.status === "PASIF" ? "Pasif" : b.href} badge={b.status === "PASIF" ? "pasif" : undefined} onAdd={() => onAddBungalow(b)} />
          ))}
          {tab === "bungalows" && bungalows.length === 0 && <Empty />}

          {tab === "system" && routes.map((r) => (
            <PickRow key={r.key} title={r.label} sub={r.href} onAdd={() => onAddSystem(r)} />
          ))}

          {tab === "custom" && (
            <PickerAction icon={Link2} title="Özel bağlantı ekle" desc="WhatsApp, harici URL, kampanya…" onAdd={onAddCustom} />
          )}
          {tab === "heading" && (
            <PickerAction icon={TypeIcon} title="Bağlantısız başlık ekle" desc="Alt menüleri gruplamak için (örn. Kurumsal)" onAdd={onAddHeading} />
          )}
          {tab === "dynamic" && (
            <PickerAction icon={ListTree} title="Dinamik bungalov listesi" desc="Öne çıkanlar / en yeni / tümü — otomatik" onAdd={onAddDynamic} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PickRow({ title, sub, badge, onAdd }: { title: string; sub?: string; badge?: string; onAdd: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-100 px-2 py-1.5 hover:border-emerald-300 dark:border-neutral-800">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{title}</p>
        {sub ? <p className="truncate text-[10px] text-slate-400">{sub}</p> : null}
      </div>
      {badge ? <Badge variant="secondary" className="text-[9px]">{badge}</Badge> : null}
      <Button size="icon-sm" variant="ghost" className="text-emerald-600" onClick={onAdd} aria-label="Menüye ekle"><Plus className="size-4" /></Button>
    </div>
  )
}
function PickerAction({ icon: Icon, title, desc, onAdd }: { icon: any; title: string; desc: string; onAdd: () => void }) {
  return (
    <button onClick={onAdd} className="flex w-full items-start gap-2 rounded-md border border-dashed border-slate-300 px-3 py-3 text-left hover:border-emerald-400 dark:border-neutral-700">
      <Icon className="mt-0.5 size-4 text-emerald-600" />
      <div><p className="text-xs font-medium">{title}</p><p className="text-[10px] text-slate-400">{desc}</p></div>
    </button>
  )
}
const Empty = () => <p className="py-6 text-center text-[11px] text-slate-400">Sonuç bulunamadı.</p>

/* -------------------------- ORTA PANEL: menü ağacı -------------------------- */

const TYPE_ICON: Record<MenuItemType, any> = {
  page: FileText, bungalow: Home, bungalow_category: ListTree, system_route: Layers,
  custom_link: Link2, heading: TypeIcon, dynamic_bungalow_list: ListTree,
}

function itemBroken(it: TreeItem, sources: PickerSources): string | null {
  const type = (it.itemType ?? "custom_link") as MenuItemType
  if (type === "page" && !sources.pages.some((p) => p.referenceId === it.referenceId)) return "Sayfa bulunamadı"
  if (type === "bungalow") {
    const b = sources.bungalows.find((x) => x.referenceId === it.referenceId)
    if (!b) return "Bungalov silinmiş"
    if (b.status === "PASIF") return "Bungalov pasif"
  }
  if (type === "system_route" && !sources.systemRoutes.some((r) => r.key === it.routeName)) return "Route yok"
  return null
}

function MenuTree(props: {
  items: TreeItem[]; depth: number; sources: PickerSources
  collapsed: Record<string, boolean>
  onToggleCollapse: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onIndent: (id: string) => void
  onOutdent: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, v: boolean) => void
  onEdit: (id: string) => void
}) {
  const { items, depth, sources, collapsed } = props
  return (
    <div className="space-y-1">
      {items.map((it, index) => {
        const type = (it.itemType ?? "custom_link") as MenuItemType
        const Icon = TYPE_ICON[type] ?? Link2
        const broken = itemBroken(it, sources)
        const hasKids = (it.children?.length ?? 0) > 0
        const isCollapsed = collapsed[it.id]
        return (
          <div key={it.id}>
            <div className={`group flex items-center gap-2 rounded-md border px-2 py-1.5 ${it.isActive === false ? "opacity-55" : ""} ${broken ? "border-red-200 bg-red-50/40 dark:border-red-900/60" : "border-slate-200 dark:border-neutral-800"}`}>
              {hasKids ? (
                <button onClick={() => props.onToggleCollapse(it.id)} className="text-slate-400" aria-label="Aç/Kapat">
                  {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
              ) : <span className="w-4" />}
              <Icon className="size-3.5 shrink-0 text-slate-400" />
              <span className="truncate text-sm font-medium">{label(it) || <span className="text-slate-400">(başlıksız)</span>}</span>
              <Badge variant="secondary" className="hidden shrink-0 text-[9px] sm:inline-flex">{MENU_ITEM_TYPE_LABELS[type]}</Badge>
              {it.displayStyle && it.displayStyle !== "link" ? <Badge className="hidden bg-emerald-600 text-[9px] sm:inline-flex">buton</Badge> : null}
              {hasKids ? <span className="text-[10px] text-slate-400">{it.children!.length} alt</span> : null}
              {broken ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-red-600" title={broken}>
                  <AlertTriangle className="size-3" /> {broken}
                </span>
              ) : null}
              <div className="ml-auto flex items-center gap-0.5">
                <Switch checked={it.isActive !== false} onCheckedChange={(v) => props.onToggleActive(it.id, v)} className="scale-90" />
                <Button variant="ghost" size="icon-sm" onClick={() => props.onMove(it.id, -1)} disabled={index === 0} aria-label="Yukarı"><ArrowUp className="size-3.5" /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => props.onMove(it.id, 1)} disabled={index === items.length - 1} aria-label="Aşağı"><ArrowDown className="size-3.5" /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => props.onIndent(it.id)} disabled={index === 0} aria-label="Alt menü yap" title="Alt menü yap"><IndentIncrease className="size-3.5" /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => props.onOutdent(it.id)} disabled={depth === 1} aria-label="Üst seviyeye çıkar" title="Üst seviyeye çıkar"><IndentDecrease className="size-3.5" /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => props.onEdit(it.id)} aria-label="Düzenle"><Pencil className="size-3.5" /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => props.onDuplicate(it.id)} aria-label="Kopyala"><Copy className="size-3.5" /></Button>
                <Button variant="ghost" size="icon-sm" className="text-red-500" onClick={() => props.onDelete(it.id)} aria-label="Sil"><Trash2 className="size-3.5" /></Button>
              </div>
            </div>
            {hasKids && !isCollapsed ? (
              <div className="ml-5 mt-1 border-l border-slate-200 pl-2 dark:border-neutral-800">
                <MenuTree {...props} items={it.children!} depth={depth + 1} />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------- SAĞ: öğe ayarları (drawer) ------------------------- */

function ItemSettingsDialog({
  item, sources, onClose, onChange,
}: {
  item: TreeItem
  sources: PickerSources
  onClose: () => void
  onChange: (patch: Partial<TreeItem>) => void
}) {
  const type = (item.itemType ?? "custom_link") as MenuItemType
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="size-4" /> Menü Öğesi Ayarları
          </DialogTitle>
          <DialogDescription>{MENU_ITEM_TYPE_LABELS[type]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">Menüde görünen başlık</Label>
            <Input value={item.title ?? item.text ?? ""} onChange={(e) => onChange({ title: e.target.value })} className="h-8 text-sm" />
          </div>

          {type === "custom_link" ? (
            <div className="space-y-1"><Label className="text-xs">URL</Label>
              <Input value={item.url ?? item.href ?? ""} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://…" className="h-8 text-sm" />
              <p className="text-[10px] text-slate-400">javascript: gibi güvensiz protokoller sunucuda engellenir.</p>
            </div>
          ) : null}

          {type === "dynamic_bungalow_list" ? (
            <div className="grid gap-2 rounded-md border border-slate-200 p-2 dark:border-neutral-800 sm:grid-cols-3">
              <div className="space-y-1"><Label className="text-[10px]">Kaynak</Label>
                <Select value={item.dynamicSettings?.source ?? "all_active"} onValueChange={(v) => onChange({ dynamicSettings: { ...(item.dynamicSettings ?? { limit: 6, sort: "manual" }), source: v as any } })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_active">Tüm aktif</SelectItem>
                    <SelectItem value="all_published">Yayındakiler</SelectItem>
                    <SelectItem value="featured">Öne çıkanlar</SelectItem>
                    <SelectItem value="newest">En yeniler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-[10px]">Adet</Label>
                <Input type="number" min={1} max={50} value={item.dynamicSettings?.limit ?? 6} onChange={(e) => onChange({ dynamicSettings: { ...(item.dynamicSettings ?? { source: "all_active", sort: "manual" }), limit: Number(e.target.value) || 6 } })} className="h-8 text-xs" />
              </div>
              <div className="space-y-1"><Label className="text-[10px]">Sıralama</Label>
                <Select value={item.dynamicSettings?.sort ?? "manual"} onValueChange={(v) => onChange({ dynamicSettings: { ...(item.dynamicSettings ?? { source: "all_active", limit: 6 }), sort: v as any } })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuel</SelectItem>
                    <SelectItem value="name">İsim</SelectItem>
                    <SelectItem value="price">Fiyat</SelectItem>
                    <SelectItem value="created">Tarih</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1"><Label className="text-xs">İkon (lucide)</Label><Input value={item.icon ?? ""} onChange={(e) => onChange({ icon: e.target.value })} className="h-8 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">CSS sınıfı</Label><Input value={item.cssClass ?? ""} onChange={(e) => onChange({ cssClass: e.target.value })} className="h-8 text-sm" /></div>
          </div>

          <div className="space-y-1"><Label className="text-xs">Kısa açıklama</Label><Textarea rows={2} value={item.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} className="text-sm" /></div>

          {type !== "heading" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1"><Label className="text-xs">Görünüm (buton)</Label>
                <Select value={item.displayStyle ?? "link"} onValueChange={(v) => onChange({ displayStyle: v as any })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(MENU_DISPLAY_STYLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Bağlantı hedefi</Label>
                <Select value={item.target ?? "SELF"} onValueChange={(v) => onChange({ target: v as any })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="SELF">Aynı sekme</SelectItem><SelectItem value="BLANK">Yeni sekme</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 p-2 dark:border-neutral-800">
            <Toggle label="Aktif" checked={item.isActive !== false} onChange={(v) => onChange({ isActive: v })} />
            <Toggle label="nofollow" checked={Boolean(item.nofollow)} onChange={(v) => onChange({ nofollow: v })} />
            <Toggle label="Masaüstünde göster" checked={item.showOnDesktop !== false} onChange={(v) => onChange({ showOnDesktop: v })} />
            <Toggle label="Mobilde göster" checked={item.showOnMobile !== false} onChange={(v) => onChange({ showOnMobile: v })} />
            <Toggle label="Misafirlere göster" checked={item.showForGuests !== false} onChange={(v) => onChange({ showForGuests: v })} />
            <Toggle label="Üyelere göster" checked={item.showForAuthenticated !== false} onChange={(v) => onChange({ showForAuthenticated: v })} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700"><Check className="mr-1 size-4" /> Tamam</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-90" />
    </label>
  )
}

/* ------------------------------- ÖNİZLEME ------------------------------- */

function resolveHref(it: TreeItem, sources: PickerSources): string {
  const type = (it.itemType ?? "custom_link") as MenuItemType
  if (type === "page") return sources.pages.find((p) => p.referenceId === it.referenceId)?.href ?? "#"
  if (type === "bungalow") return sources.bungalows.find((b) => b.referenceId === it.referenceId)?.href ?? "#"
  if (type === "system_route") return sources.systemRoutes.find((r) => r.key === it.routeName)?.href ?? "#"
  if (type === "custom_link") return it.url ?? it.href ?? "#"
  return "#"
}

function DeleteGroupButton({ itemCount, onDelete }: { itemCount: number; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setOpen(true)}>
        <Trash2 className="mr-1 size-4" /> Menü grubunu sil
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Menü grubunu sil?</DialogTitle>
            <DialogDescription>Bu grup ve içindeki <strong>{itemCount} menü öğesi</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button variant="destructive" onClick={() => { onDelete(); setOpen(false) }}>Evet, sil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PreviewDialog({ group, sources, onClose }: { group: BuilderGroup; sources: PickerSources; onClose: () => void }) {
  const [mode, setMode] = useState<"header" | "mobile" | "footer">("header")
  const visible = group.items.filter((it) => it.isActive !== false && (it.title ?? it.text))
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Menü Önizleme</DialogTitle>
          <DialogDescription>Gerçek menü verisiyle yaklaşık görünüm.</DialogDescription>
        </DialogHeader>
        <div className="mb-2 flex gap-1">
          {[{ k: "header", i: Monitor, l: "Header" }, { k: "mobile", i: Smartphone, l: "Mobil" }, { k: "footer", i: PanelBottom, l: "Footer" }].map((m) => (
            <button key={m.k} onClick={() => setMode(m.k as any)} className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs ${mode === m.k ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800"}`}>
              <m.i className="size-3.5" /> {m.l}
            </button>
          ))}
        </div>

        {mode === "header" ? (
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-900 px-4 py-3">
            <span className="mr-3 text-sm font-semibold text-white">Aden</span>
            {visible.map((it) => <span key={it.id} className={`rounded-md px-3 py-1.5 text-xs ${it.displayStyle && it.displayStyle !== "link" ? "bg-emerald-600 font-semibold text-white" : "text-slate-200"}`}>{it.title ?? it.text}</span>)}
          </div>
        ) : mode === "mobile" ? (
          <div className="mx-auto w-64 rounded-xl border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            {visible.map((it) => (
              <div key={it.id}>
                <div className="border-b border-slate-100 py-2 text-sm dark:border-neutral-800">{it.title ?? it.text}</div>
                {it.children?.filter((c) => c.isActive !== false).map((c) => <div key={c.id} className="border-b border-slate-100 py-1.5 pl-4 text-xs text-slate-500 dark:border-neutral-800">{c.title ?? c.text}</div>)}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-slate-900 p-4 text-slate-300">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</p>
            <div className="space-y-1">{visible.map((it) => <div key={it.id} className="text-xs">{it.title ?? it.text}</div>)}</div>
          </div>
        )}
        <p className="mt-2 text-[10px] text-slate-400">Not: Bozuk/pasif öğeler sitede gösterilmez. Örnek URL: {visible[0] ? resolveHref(visible[0], sources) : "—"}</p>
      </DialogContent>
    </Dialog>
  )
}
