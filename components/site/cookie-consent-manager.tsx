"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Cookie, Settings2, ShieldCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  useCookieConsent,
  type CookieConsentPreferences,
} from "@/components/site/cookie-consent-context"

const CATEGORIES: Array<{
  key: keyof CookieConsentPreferences
  title: string
  description: string
}> = [
  {
    key: "essential",
    title: "Zorunlu çerezler",
    description: "Güvenlik, tercih kaydı ve sitenin temel işlevleri için gereklidir; kapatılamaz.",
  },
  {
    key: "analytics",
    title: "Analitik çerezler",
    description: "Ziyaretlerin anonim ölçümü ve site performansının iyileştirilmesi için kullanılabilir.",
  },
  {
    key: "marketing",
    title: "Pazarlama çerezleri",
    description: "Reklam kampanyalarının ölçümü ve kişiselleştirilmesi için kullanılabilir.",
  },
  {
    key: "preferences",
    title: "Tercih çerezleri",
    description: "Dil ve para birimi gibi site tercihlerinizi hatırlamamızı sağlar.",
  },
]

export function CookieConsentManager() {
  const {
    preferences,
    hasDecision,
    isReady,
    preferencesOpen,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    openPreferences,
    closePreferences,
  } = useCookieConsent()
  const [draft, setDraft] = useState(preferences)

  useEffect(() => {
    if (!preferencesOpen) return
    const timer = window.setTimeout(() => setDraft(preferences), 0)
    return () => window.clearTimeout(timer)
  }, [preferences, preferencesOpen])

  const saveDraft = () => {
    savePreferences({
      analytics: draft.analytics,
      marketing: draft.marketing,
      preferences: draft.preferences,
    })
  }

  return (
    <>
      {isReady && !hasDecision ? (
        <section
          role="region"
          aria-label="Çerez tercihleri"
          className="fixed inset-x-0 bottom-[5.45rem] z-[70] w-full border-y border-[#d9d0c2] bg-[#fffdf8]/98 px-3 py-2.5 shadow-[0_-10px_35px_-24px_rgba(17,24,19,0.5)] backdrop-blur md:bottom-0 md:border-b-0 sm:px-4"
        >
          <div className="flex w-full flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <span className="mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e9efe8] text-[#1f3a2e] sm:inline-flex">
                <Cookie className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="shrink-0 text-xs font-bold text-[#18261e] sm:text-sm">Çerez tercihlerinizi yönetin</h2>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#5f5f66] sm:text-xs">
                  Zorunlu çerezler sitenin çalışması için kullanılır. Analitik, pazarlama ve tercih
                  çerezleri yalnızca onayınızla etkinleşir. Ayrıntılar için{" "}
                  <Link className="font-semibold underline underline-offset-2" href="/kurumsal/kvkk-aydinlatma-metni">
                    KVKK Aydınlatma Metni
                  </Link>{" "}
                  ve{" "}
                  <Link className="font-semibold underline underline-offset-2" href="/kurumsal/cerez-politikasi">
                    Çerez Politikası
                  </Link>
                  ’nı inceleyebilirsiniz.
                </p>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                className="h-11 rounded-lg px-2 text-[11px] sm:px-3 sm:text-xs"
                onClick={rejectNonEssential}
                aria-label="Zorunlu olmayan çerezleri reddet"
              >
                <span className="sm:hidden">Reddet</span>
                <span className="hidden sm:inline">Zorunlu olmayanları reddet</span>
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-lg px-2 text-[11px] sm:px-3 sm:text-xs"
                onClick={openPreferences}
                aria-label="Çerez tercihlerini yönet"
              >
                <Settings2 className="hidden h-3.5 w-3.5 sm:block" />
                <span className="sm:hidden">Ayarlar</span>
                <span className="hidden sm:inline">Tercihleri yönet</span>
              </Button>
              <Button
                className="h-11 rounded-lg px-2 text-[11px] sm:px-3 sm:text-xs btn-dark"
                onClick={acceptAll}
                aria-label="Tüm çerezleri kabul et"
              >
                <span className="sm:hidden">Kabul et</span>
                <span className="hidden sm:inline">Tümünü kabul et</span>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <Dialog open={preferencesOpen} onOpenChange={(open) => (open ? openPreferences() : closePreferences())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[#d9d0c2] bg-[#fffdf8] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#18261e]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Çerez tercihleri
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              İstediğiniz kategorileri etkinleştirin. Seçimlerinizi daha sonra alt bilgideki
              “Çerez Tercihleri” bağlantısından değiştirebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {CATEGORIES.map((category) => {
              const required = category.key === "essential"
              const checked = required || draft[category.key]
              return (
                <div key={category.key} className="flex items-start gap-3 rounded-xl border border-[#e2dcd2] bg-white p-4">
                  <Checkbox
                    id={`cookie-${category.key}`}
                    checked={checked}
                    disabled={required}
                    onCheckedChange={(value) => {
                      if (required) return
                      setDraft((current) => ({ ...current, [category.key]: value === true }))
                    }}
                    aria-describedby={`cookie-${category.key}-description`}
                  />
                  <div className="min-w-0">
                    <Label htmlFor={`cookie-${category.key}`} className="text-sm font-bold text-[#18261e]">
                      {category.title}
                      {required ? <span className="ml-2 text-xs font-medium text-[#777780]">Her zaman etkin</span> : null}
                    </Label>
                    <p id={`cookie-${category.key}-description`} className="mt-1 text-xs leading-relaxed text-[#66666e]">
                      {category.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" className="rounded-xl" onClick={rejectNonEssential}>
              Zorunlu olmayanları reddet
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" className="rounded-xl" onClick={acceptAll}>
                Tümünü kabul et
              </Button>
              <Button className="rounded-xl btn-dark" onClick={saveDraft}>
                Seçimleri kaydet
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
