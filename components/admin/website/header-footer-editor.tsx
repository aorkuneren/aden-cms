"use client"

import { useState, useTransition } from "react"
import { Save, PanelsTopLeft, Phone, MessageCircle, CalendarCheck, MapPin, Copyright, Menu as MenuIcon, PanelBottom } from "lucide-react"

import { saveHeaderFooterAction } from "@/app/admin/(panel)/website/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

type Btn = { enabled: boolean; label: string; url: string }
export type MenuGroupType = "ANA_MENU" | "HIZLI_ERISIM" | "BUNGALOVLAR" | "SOZLESMELER" | "OZEL_MENU"
export type GroupRef = { id: string; title: string; type: MenuGroupType }
export type FooterColumn = { id: string; title: string; type: string; menuGroupId: string; enabled: boolean }

export type HeaderFooterData = {
  topHeaderEnabled: boolean
  topHeaderText: string
  topHeaderPhone: string
  buttons: { whatsapp: Btn; phone: Btn; reservation: Btn }
  headerMenuGroupId: string
  footerEnabled: boolean
  copyrightText: string
  footerColumns: FooterColumn[]
}

const NONE = "__none__"

function ButtonRow({ icon, title, value, onChange }: { icon: React.ReactNode; title: string; value: Btn; onChange: (v: Btn) => void }) {
  return (
    <div className={`rounded-lg border p-3 transition-colors ${value.enabled ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-slate-200 dark:border-neutral-800"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="flex size-7 items-center justify-center rounded-md bg-white text-slate-600 shadow-2xs dark:bg-neutral-800 dark:text-slate-300">{icon}</span>
          {title}
        </span>
        <Switch checked={value.enabled} onCheckedChange={(v) => onChange({ ...value, enabled: v })} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} placeholder="Etiket" className="h-8 text-sm" />
        <Input value={value.url} onChange={(e) => onChange({ ...value, url: e.target.value })} placeholder="URL" className="h-8 text-sm" />
      </div>
    </div>
  )
}

/** Menü grubu seçici (id → başlık). "__none__" = otomatik/atanmamış. */
function GroupSelect({ groups, value, onChange, placeholder }: { groups: GroupRef[]; value: string; onChange: (id: string) => void; placeholder: string }) {
  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>— Otomatik / Atanmamış —</SelectItem>
        {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function HeaderFooterEditor({ initial, groups }: { initial: HeaderFooterData; groups: GroupRef[] }) {
  const [data, setData] = useState<HeaderFooterData>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)

  const set = (p: Partial<HeaderFooterData>) => { setData((prev) => ({ ...prev, ...p })); setStatus(null) }
  const setBtn = (key: keyof HeaderFooterData["buttons"], v: Btn) => { setData((prev) => ({ ...prev, buttons: { ...prev.buttons, [key]: v } })); setStatus(null) }
  const setColumnGroup = (colId: string, groupId: string) => {
    setData((prev) => ({ ...prev, footerColumns: prev.footerColumns.map((c) => (c.id === colId ? { ...c, menuGroupId: groupId } : c)) }))
    setStatus(null)
  }

  const save = () =>
    startTransition(async () => {
      const headerType = groups.find((g) => g.id === data.headerMenuGroupId)?.type ?? "ANA_MENU"
      const footerColumnAssignments = data.footerColumns
        .filter((c) => c.type === "MENU_GROUP")
        .map((c) => ({ id: c.id, menuGroupId: c.menuGroupId, menuType: groups.find((g) => g.id === c.menuGroupId)?.type ?? "OZEL_MENU" }))
      const res = await saveHeaderFooterAction({
        topHeaderEnabled: data.topHeaderEnabled,
        topHeaderText: data.topHeaderText,
        topHeaderPhone: data.topHeaderPhone,
        buttons: data.buttons,
        headerMenuGroupId: data.headerMenuGroupId,
        headerMenuType: headerType,
        footerEnabled: data.footerEnabled,
        copyrightText: data.copyrightText,
        footerColumnAssignments,
      })
      setStatus(res.ok ? { type: "ok", msg: "Kaydedildi ve siteye yansıtıldı." } : { type: "err", msg: res.error })
    })

  const menuColumns = data.footerColumns.filter((c) => c.type === "MENU_GROUP")

  return (
    <div className="space-y-4">
      {/* Sticky bar */}
      <div className="sticky top-14 z-20 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-2xs backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <Badge variant="outline" className="h-6 border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <PanelsTopLeft className="mr-1 size-3" /> Header & Footer
        </Badge>
        <Button onClick={save} disabled={pending} size="sm" className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700">
          <Save className="mr-1 size-3.5" /> {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>

      <SaveStatusBanner status={status} />

      {/* Header menü ataması */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-sm"><MenuIcon className="size-4 text-emerald-600" /> Header Menü</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs">Header'da gösterilecek menü grubu</Label>
          <div className="max-w-sm">
            <GroupSelect groups={groups} value={data.headerMenuGroupId} onChange={(id) => set({ headerMenuGroupId: id })} placeholder="Menü grubu seçin" />
          </div>
          <p className="text-[11px] text-slate-400">
            Örn. “Ana Menü”. Seçili grubun aktif öğeleri sitenin üst navigasyonunda görünür. Grupları “Menüler” sayfasından düzenleyin.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Üst çubuk */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <CardTitle className="flex items-center gap-2 text-sm"><MapPin className="size-4 text-emerald-600" /> Üst Bilgi Çubuğu</CardTitle>
            <Switch checked={data.topHeaderEnabled} onCheckedChange={(v) => set({ topHeaderEnabled: v })} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Metin (adres vb.)</Label><Input value={data.topHeaderText} onChange={(e) => set({ topHeaderText: e.target.value })} className="h-8 text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Telefon</Label><Input value={data.topHeaderPhone} onChange={(e) => set({ topHeaderPhone: e.target.value })} className="h-8 text-sm" /></div>
          </CardContent>
        </Card>

        {/* Footer genel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <CardTitle className="flex items-center gap-2 text-sm"><Copyright className="size-4 text-emerald-600" /> Footer</CardTitle>
            <Switch checked={data.footerEnabled} onCheckedChange={(v) => set({ footerEnabled: v })} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Telif metni (copyright)</Label><Input value={data.copyrightText} onChange={(e) => set({ copyrightText: e.target.value })} className="h-8 text-sm" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Footer menü sütunları */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-sm"><PanelBottom className="size-4 text-emerald-600" /> Footer Menü Sütunları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {menuColumns.length === 0 ? (
            <p className="text-xs text-slate-500">Footer'da menü grubu tipinde sütun bulunmuyor.</p>
          ) : (
            menuColumns.map((col) => (
              <div key={col.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-neutral-800 sm:flex-nowrap">
                <span className="flex items-center gap-2 text-sm font-medium sm:w-44">
                  <Badge variant="secondary" className="text-[10px]">Sütun</Badge>
                  {col.title || "Menü"}
                </span>
                <div className="w-full flex-1"><GroupSelect groups={groups} value={col.menuGroupId} onChange={(id) => setColumnGroup(col.id, id)} placeholder="Grup seçin" /></div>
              </div>
            ))
          )}
          <p className="text-[11px] text-slate-400">Footer sütunlarına atanan menü grupları, site alt kısmında liste olarak görünür.</p>
        </CardContent>
      </Card>

      {/* Aksiyon butonları */}
      <Card>
        <CardHeader className="border-b"><CardTitle className="text-sm">Aksiyon Butonları (Header)</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <ButtonRow icon={<MessageCircle className="size-4" />} title="WhatsApp" value={data.buttons.whatsapp} onChange={(v) => setBtn("whatsapp", v)} />
          <ButtonRow icon={<Phone className="size-4" />} title="Telefon" value={data.buttons.phone} onChange={(v) => setBtn("phone", v)} />
          <ButtonRow icon={<CalendarCheck className="size-4" />} title="Rezervasyon" value={data.buttons.reservation} onChange={(v) => setBtn("reservation", v)} />
        </CardContent>
      </Card>
    </div>
  )
}
