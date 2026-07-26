"use client"

import { useState, useTransition } from "react"
import { Save } from "lucide-react"

import { saveSettingsAction } from "@/app/admin/(panel)/ayarlar/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

export type SettingsData = {
  companyName: string
  phone: string
  email: string
  address: string
  website: string
  taxNumber: string
  taxOffice: string
  bankName: string
  iban: string
  googleBusinessProfileUrl: string
  checkInTime: string
  checkOutTime: string
  minStayDays: number
  requiredDepositAmount: number
  cancellationDaysBefore: number
  themePrimaryColor: string
  themeSecondaryColor: string
  themeFontFamily: string
  maintenanceModeEnabled: boolean
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function SettingsEditor({ initial }: { initial: SettingsData }) {
  const [data, setData] = useState<SettingsData>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)

  const set = (p: Partial<SettingsData>) => {
    setData((prev) => ({ ...prev, ...p }))
    setStatus(null)
  }
  const save = () =>
    startTransition(async () => {
      const res = await saveSettingsAction(data)
      setStatus(res.ok ? { type: "ok", msg: "Ayarlar kaydedildi." } : { type: "err", msg: res.error })
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={save} disabled={pending}>
          <Save /> {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>

      <SaveStatusBanner status={status} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Firma bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Firma adı">
            <Input value={data.companyName} onChange={(e) => set({ companyName: e.target.value })} />
          </Field>
          <Field label="Telefon">
            <Input value={data.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="E-posta">
            <Input value={data.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Web sitesi">
            <Input value={data.website} onChange={(e) => set({ website: e.target.value })} />
          </Field>
          <Field label="Adres">
            <Input value={data.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <Field label="Google İşletme URL">
            <Input value={data.googleBusinessProfileUrl} onChange={(e) => set({ googleBusinessProfileUrl: e.target.value })} />
          </Field>
          <Field label="Vergi no">
            <Input value={data.taxNumber} onChange={(e) => set({ taxNumber: e.target.value })} />
          </Field>
          <Field label="Vergi dairesi">
            <Input value={data.taxOffice} onChange={(e) => set({ taxOffice: e.target.value })} />
          </Field>
          <Field label="Banka">
            <Input value={data.bankName} onChange={(e) => set({ bankName: e.target.value })} />
          </Field>
          <Field label="IBAN">
            <Input value={data.iban} onChange={(e) => set({ iban: e.target.value })} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rezervasyon kuralları</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Giriş saati">
            <Input value={data.checkInTime} onChange={(e) => set({ checkInTime: e.target.value })} placeholder="14:00" />
          </Field>
          <Field label="Çıkış saati">
            <Input value={data.checkOutTime} onChange={(e) => set({ checkOutTime: e.target.value })} placeholder="11:00" />
          </Field>
          <Field label="Min. konaklama (gece)">
            <Input
              type="number"
              min={1}
              value={data.minStayDays}
              onChange={(e) => set({ minStayDays: Number(e.target.value) || 1 })}
            />
          </Field>
          <Field label="Kapora tutarı (₺)">
            <Input
              type="number"
              min={0}
              value={data.requiredDepositAmount}
              onChange={(e) => set({ requiredDepositAmount: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="İptal süresi (gün önce)">
            <Input
              type="number"
              min={0}
              value={data.cancellationDaysBefore}
              onChange={(e) => set({ cancellationDaysBefore: Number(e.target.value) || 0 })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tema & durum</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Ana renk">
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-9 w-12 cursor-pointer rounded border"
                value={/^#[0-9A-Fa-f]{6}$/.test(data.themePrimaryColor) ? data.themePrimaryColor : "#000000"}
                onChange={(e) => set({ themePrimaryColor: e.target.value })}
              />
              <Input value={data.themePrimaryColor} onChange={(e) => set({ themePrimaryColor: e.target.value })} />
            </div>
          </Field>
          <Field label="İkincil renk">
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-9 w-12 cursor-pointer rounded border"
                value={/^#[0-9A-Fa-f]{6}$/.test(data.themeSecondaryColor) ? data.themeSecondaryColor : "#6B7280"}
                onChange={(e) => set({ themeSecondaryColor: e.target.value })}
              />
              <Input value={data.themeSecondaryColor} onChange={(e) => set({ themeSecondaryColor: e.target.value })} />
            </div>
          </Field>
          <Field label="Yazı tipi">
            <Input value={data.themeFontFamily} onChange={(e) => set({ themeFontFamily: e.target.value })} placeholder="Inter" />
          </Field>
          <div className="flex items-center gap-3 sm:col-span-3">
            <Switch checked={data.maintenanceModeEnabled} onCheckedChange={(v) => set({ maintenanceModeEnabled: v })} />
            <div>
              <Label>Bakım modu</Label>
              <p className="text-xs text-muted-foreground">Açıkken ziyaretçilere bakım sayfası gösterilebilir.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
