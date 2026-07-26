"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Plus, Save, Sparkles } from "lucide-react"

import { saveBungalovAction, addFeatureCatalogItemAction, addContentCatalogItemAction } from "@/app/admin/(panel)/bungalovlar/actions"
import { MediaDropzone } from "@/components/admin/media-dropzone"
import { ContentItemEditor } from "@/components/admin/bungalov/content-item-editor"
import { SortableImageGrid } from "@/components/admin/bungalov/sortable-image-grid"
import {
  mergeContentCatalogWithDefaults,
  type BungalovContentCatalog,
  type BungalovContentItem,
  type BungalovContentPreset,
} from "@/lib/bungalov-content"
import {
  SEO_DESCRIPTION_LIMIT,
  SEO_TITLE_LIMIT,
  buildBungalovSeo,
  fillEmptyBungalovSeo,
} from "@/lib/bungalov-seo"
import {
  mergeFeatureCategoriesWithCatalog,
  splitBungalowFeaturesByCategory,
  mergeBungalowFeaturesFromCategoryMap,
  type BungalowFeatureCatalog,
  type BungalowFeatureCategoryKey,
} from "@/lib/bungalov-feature-categories"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"
import { cn } from "@/lib/utils"

export type BungalovFormData = {
  id: string
  name: string
  slug: string
  image: string
  galleryImages: string[]
  capacity: number
  description: string
  nightlyPrice: number
  status: string
  features: string[]
  rules: BungalovContentItem[]
  nearbyPlaces: BungalovContentItem[]
  bedrooms: number | null
  areaSqm: number | null
  poolType: string
  internet: string
  address: string
  seoTitle: string
  seoDescription: string
  isFeatured: boolean
  sortOrder: number
}

function slugify(text: string): string {
  return text
    .toString()
    .toLocaleLowerCase("tr-TR")
    .trim()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
}

/** Kapak ayrı upload olmadığı için, tanımlı kapak galeride yoksa başa eklenir. */
function withCoverInGallery(form: BungalovFormData): BungalovFormData {
  const cover = form.image.trim()
  const gallery = form.galleryImages.filter((url) => url.trim().length > 0)
  if (cover && !gallery.includes(cover)) {
    return { ...form, galleryImages: [cover, ...gallery] }
  }
  if (!cover && gallery.length > 0) {
    return { ...form, image: gallery[0] }
  }
  return { ...form, galleryImages: gallery }
}

function syncCoverWithGallery(galleryImages: string[], currentCover: string) {
  if (galleryImages.length === 0) return { galleryImages, image: "" }
  if (currentCover && galleryImages.includes(currentCover)) {
    return { galleryImages, image: currentCover }
  }
  return { galleryImages, image: galleryImages[0] }
}

const FORM_TABS = ["genel", "gorseller", "detaylar", "kurallar", "seo"] as const
type FormTab = (typeof FORM_TABS)[number]
type RulesPanel = "rules" | "nearby"

function isFormTab(value: string | null | undefined): value is FormTab {
  return FORM_TABS.includes(value as FormTab)
}

function isRulesPanel(value: string | null | undefined): value is RulesPanel {
  return value === "rules" || value === "nearby"
}

function readTabStateFromUrl(): { tab: FormTab; panel: RulesPanel } {
  if (typeof window === "undefined") {
    return { tab: "genel", panel: "rules" }
  }
  const params = new URLSearchParams(window.location.search)
  const tab = params.get("tab")
  const panel = params.get("panel")
  return {
    tab: isFormTab(tab) ? tab : "genel",
    panel: isRulesPanel(panel) ? panel : "rules",
  }
}

function writeTabStateToUrl(tab: FormTab, panel: RulesPanel) {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (tab === "genel") {
    url.searchParams.delete("tab")
  } else {
    url.searchParams.set("tab", tab)
  }
  if (tab === "kurallar" && panel !== "rules") {
    url.searchParams.set("panel", panel)
  } else {
    url.searchParams.delete("panel")
  }
  const next = `${url.pathname}${url.search}${url.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) {
    window.history.replaceState(window.history.state, "", next)
  }
}

export function BungalovForm({
  initial,
  isNew,
  initialTab = "genel",
  initialPanel = "rules",
  featureCatalog: initialFeatureCatalog,
  contentCatalog: initialContentCatalog,
}: {
  initial: BungalovFormData
  isNew: boolean
  initialTab?: FormTab
  initialPanel?: RulesPanel
  featureCatalog?: BungalowFeatureCatalog
  contentCatalog?: BungalovContentCatalog
}) {
  const router = useRouter()
  const [data, setData] = useState<BungalovFormData>(() => withCoverInGallery(initial))
  const [created, setCreated] = useState(!isNew)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const [activeTab, setActiveTab] = useState<FormTab>(isFormTab(initialTab) ? initialTab : "genel")
  const [rulesPanel, setRulesPanel] = useState<RulesPanel>(isRulesPanel(initialPanel) ? initialPanel : "rules")
  const [isDirty, setIsDirty] = useState(false)
  const [featureCatalog, setFeatureCatalog] = useState<BungalowFeatureCatalog | undefined>(initialFeatureCatalog)
  const [contentCatalog, setContentCatalog] = useState<BungalovContentCatalog | undefined>(initialContentCatalog)

  useEffect(() => {
    const { tab, panel } = readTabStateFromUrl()
    setActiveTab(tab)
    setRulesPanel(panel)
  }, [])

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = isFormTab(value) ? value : "genel"
      setActiveTab(tab)
      writeTabStateToUrl(tab, rulesPanel)
    },
    [rulesPanel]
  )

  const handleRulesPanelChange = useCallback(
    (panel: RulesPanel) => {
      setRulesPanel(panel)
      writeTabStateToUrl(activeTab, panel)
    },
    [activeTab]
  )

  const [galleryUrlInput, setGalleryUrlInput] = useState("")

  const [groupedFeatures, setGroupedFeatures] = useState<Record<BungalowFeatureCategoryKey, string[]>>(() =>
    splitBungalowFeaturesByCategory(initial.features || [], initialFeatureCatalog)
  )

  const featureCategories = mergeFeatureCategoriesWithCatalog(featureCatalog)
  const defaultFeatureTokens = new Set(
    mergeFeatureCategoriesWithCatalog(undefined).flatMap((category) =>
      category.suggestions.map((suggestion) => suggestion.toLocaleLowerCase("tr-TR"))
    )
  )
  const mergedContentPresets = mergeContentCatalogWithDefaults(contentCatalog)

  const rememberContentPreset = (kind: "rules" | "nearbyPlaces", preset: BungalovContentPreset) => {
    startTransition(async () => {
      const res = await addContentCatalogItemAction(kind, preset)
      if (res.ok && res.catalog) {
        setContentCatalog(res.catalog)
      }
    })
  }

  const [featureCustomInput, setFeatureCustomInput] = useState<Record<BungalowFeatureCategoryKey, string>>({
    genel: "",
    mutfak: "",
    mobilya: "",
    banyo: "",
    bahce: "",
  })

  const set = (patch: Partial<BungalovFormData>) => {
    setData((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setStatus(null)
  }

  const handleAutoSlug = () => {
    if (data.name) {
      set({ slug: slugify(data.name) })
    }
  }

  const handleToggleFeature = (catKey: BungalowFeatureCategoryKey, featureText: string) => {
    setGroupedFeatures((prev) => {
      const currentList = prev[catKey] || []
      const exists = currentList.some((f) => f.toLowerCase() === featureText.toLowerCase())
      const updatedList = exists
        ? currentList.filter((f) => f.toLowerCase() !== featureText.toLowerCase())
        : [...currentList, featureText]

      const nextMap = { ...prev, [catKey]: updatedList }
      const merged = mergeBungalowFeaturesFromCategoryMap(nextMap)
      set({ features: merged })
      return nextMap
    })
  }

  const handleAddCustomFeature = (catKey: BungalowFeatureCategoryKey) => {
    const val = (featureCustomInput[catKey] || "").trim()
    if (!val) return

    handleToggleFeature(catKey, val)
    setFeatureCustomInput((prev) => ({ ...prev, [catKey]: "" }))

    // Özel öneriyi hemen kalıcı kataloğa yaz — yeni bungalovlarda da çıksın.
    startTransition(async () => {
      const res = await addFeatureCatalogItemAction(catKey, val)
      if (res.ok && res.catalog) {
        setFeatureCatalog(res.catalog)
      }
    })
  }

  const appendGalleryImages = (urls: string[]) => {
    const merged = [...data.galleryImages]
    for (const url of urls) {
      const normalized = url.trim()
      if (normalized && !merged.includes(normalized)) {
        merged.push(normalized)
      }
    }
    set(syncCoverWithGallery(merged, data.image))
  }

  const handleGalleryChange = (images: string[]) => {
    set(syncCoverWithGallery(images, data.image))
  }

  const handleSetCover = (url: string) => {
    if (!data.galleryImages.includes(url)) return
    set({ image: url })
  }

  const handleAddGalleryUrl = () => {
    if (!galleryUrlInput.trim()) return
    appendGalleryImages([galleryUrlInput])
    setGalleryUrlInput("")
  }

  const seoSource = {
    name: data.name,
    description: data.description,
    capacity: data.capacity,
    bedrooms: data.bedrooms,
    poolType: data.poolType,
    internet: data.internet,
    areaSqm: data.areaSqm,
    features: data.features,
    address: data.address,
  }

  const handleGenerateSeo = () => {
    const generated = buildBungalovSeo(seoSource)
    set({
      seoTitle: generated.seoTitle,
      seoDescription: generated.seoDescription,
    })
  }

  const save = () => {
    const withSeo = fillEmptyBungalovSeo(seoSource, {
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
    })
    const synced = withCoverInGallery({
      ...data,
      slug: data.slug.trim() || slugify(data.name),
      seoTitle: withSeo.seoTitle,
      seoDescription: withSeo.seoDescription,
    })
    setData(synced)

    startTransition(async () => {
      const res = await saveBungalovAction({
        ...synced,
        featureGroups: groupedFeatures,
      })
      if (res.ok) {
        setStatus({
          type: "ok",
          msg: created
            ? "Değişiklikler kaydedildi ve siteye yansıtıldı."
            : "Bungalov oluşturuldu. Düzenlemeye devam edebilirsiniz.",
        })
        setIsDirty(false)
        setCreated(true)
        if (!created && res.id) {
          const qs = typeof window !== "undefined" ? window.location.search : ""
          router.replace(`/admin/bungalovlar/${res.id}${qs}`)
        }
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  const isActive = data.status !== "PASIF"

  return (
    <div className="space-y-6">
      {/* Üst Sabit Aksiyon Barı */}
      <div className="sticky top-16 z-20 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/bungalovlar")}>
            <ArrowLeft className="mr-1 size-4" /> Listeye Dön
          </Button>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-emerald-600" : ""}>
              {isActive ? "Aktif" : "Pasif"}
            </Badge>
            {isDirty ? <span className="text-xs font-medium text-amber-600">● Değişiklikler var</span> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {created && data.slug ? (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href={`/bungalovlarimiz/${data.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 size-4" /> Önizle
              </Link>
            </Button>
          ) : null}
          <Button onClick={save} disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="mr-1 size-4" />{" "}
            {pending ? "Kaydediliyor..." : created ? "Değişiklikleri Kaydet" : "Oluştur & Kaydet"}
          </Button>
        </div>
      </div>

      <SaveStatusBanner status={status} />

      {/* Sekmeli İlerleme Yapısı */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 sm:grid-cols-5 dark:bg-neutral-900">
          <TabsTrigger value="genel" className="text-xs">
            1. Genel & Fiyat
          </TabsTrigger>
          <TabsTrigger value="gorseller" className="text-xs">
            2. Görseller & Galeri
          </TabsTrigger>
          <TabsTrigger value="detaylar" className="text-xs">
            3. Detay & Özellikler
          </TabsTrigger>
          <TabsTrigger value="kurallar" className="text-xs">
            4. Kurallar & Çevre
          </TabsTrigger>
          <TabsTrigger value="seo" className="text-xs">
            5. SEO & Konum
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GENEL & FİYATLANDIRMA */}
        <TabsContent value="genel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Temel Bungalov Tanımı</CardTitle>
              <CardDescription>
                Bungalov adı, adresi, fiyatı ve detay sayfasının üst bilgi şeridinde görünen künye bilgileri.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Bungalov Adı *</Label>
                  <Input
                    value={data.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="Örn: Sapanca Orman Jakuzili Delüks Bungalov"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>URL Slug Adresi</Label>
                    <button
                      type="button"
                      onClick={handleAutoSlug}
                      className="flex items-center text-xs text-emerald-600 hover:underline"
                    >
                      <Sparkles className="mr-1 size-3" /> Otomatik Üret
                    </button>
                  </div>
                  <Input
                    value={data.slug}
                    onChange={(e) => set({ slug: e.target.value })}
                    placeholder="sapanca-orman-jakuzili-deluks"
                  />
                  <p className="text-[11px] text-slate-500">
                    Boş bırakılırsa bungalov adına göre otomatik oluşturulur.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Gecelik Fiyat (₺) *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={data.nightlyPrice}
                    onChange={(e) => set({ nightlyPrice: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-neutral-800">
                <div>
                  <Label className="text-sm font-semibold">Künye Bilgileri</Label>
                  <p className="text-[11px] text-slate-500">
                    Detay sayfasının üst bilgi şeridinde gösterilir. Boş bırakılan alanlar sitede gizlenir.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Kapasite (Kişi) *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={data.capacity}
                      onChange={(e) => set({ capacity: Number(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Yatak Odası</Label>
                    <Input
                      type="number"
                      min={0}
                      value={data.bedrooms ?? ""}
                      onChange={(e) => set({ bedrooms: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Örn: 1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Havuz Tipi</Label>
                    <Input
                      value={data.poolType}
                      onChange={(e) => set({ poolType: e.target.value })}
                      placeholder="Örn: Özel Isıtmalı Havuz"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>İnternet</Label>
                    <Input
                      value={data.internet}
                      onChange={(e) => set({ internet: e.target.value })}
                      placeholder="Örn: Fiber Wi-Fi"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Metre Kare (m²)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={data.areaSqm ?? ""}
                      onChange={(e) => set({ areaSqm: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Örn: 55"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200 pt-5 dark:border-neutral-800">
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => set({ status: checked ? "AKTIF" : "PASIF" })}
                />
                <div>
                  <Label className="cursor-pointer">Yayın Durumu — {isActive ? "Aktif" : "Pasif"}</Label>
                  <p className="text-xs text-slate-500">
                    {isActive
                      ? "Bungalov sitede yayında ve rezervasyona açık."
                      : "Bungalov sitede gizli, detay sayfası açılmaz."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bungalov Hakkında</CardTitle>
              <CardDescription>Detay sayfasındaki tanıtım metni.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={5}
                value={data.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Bungalov atmosferi, manzarası ve konfor detayları..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vitrin & Sıralama</CardTitle>
              <CardDescription>Bungalovun anasayfa ve liste sayfasındaki konumu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={data.isFeatured} onCheckedChange={(v) => set({ isFeatured: v })} />
                <div>
                  <Label className="cursor-pointer">Anasayfada Öne Çıkar</Label>
                  <p className="text-xs text-slate-500">Bu bungalov anasayfa vitrin alanında gösterilir.</p>
                </div>
              </div>

              <div className="max-w-xs space-y-1.5">
                <Label>Sıralama Numarası</Label>
                <Input
                  type="number"
                  value={data.sortOrder}
                  onChange={(e) => set({ sortOrder: Number(e.target.value) || 0 })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: GÖRSELLER & GALERİ */}
        <TabsContent value="gorseller" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Görseller & Galeri</CardTitle>
              <CardDescription>
                Görselleri yükleyin, sıralayın ve kapak olarak kullanmak istediğinize &quot;Kapak Yap&quot; deyin.
                Kapak seçilmezse ilk görsel otomatik kapak olur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MediaDropzone
                multiple
                accept="image/*"
                target={{ scope: "bungalov", id: data.id }}
                onUploaded={appendGalleryImages}
              />

              <div className="flex gap-2">
                <Input
                  value={galleryUrlInput}
                  onChange={(e) => setGalleryUrlInput(e.target.value)}
                  placeholder="https://... adresiyle galeriye ekle"
                  className="h-8 text-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddGalleryUrl} className="h-8 text-xs">
                  <Plus className="mr-1 size-3.5" /> Ekle
                </Button>
              </div>

              {data.image ? (
                <p className="text-[11px] text-emerald-700">
                  Seçili kapak: galeri içinde yeşil çerçeve / &quot;Kapak&quot; etiketi ile işaretlidir.
                </p>
              ) : null}

              <SortableImageGrid
                images={data.galleryImages}
                coverImage={data.image}
                onChange={handleGalleryChange}
                onSetCover={handleSetCover}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: DETAYLAR & ÖZELLİKLER */}
        <TabsContent value="detaylar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bungalov Donanım & Özellikleri</CardTitle>
              <CardDescription>
                Önerilen özelliklere tıklayın. Yeni eklediğiniz özel özellikler kaydedilir ve sonraki bungalovlarda da
                önerilir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {featureCategories.map((cat) => {
                const currentCatList = groupedFeatures[cat.key] || []
                return (
                  <div key={cat.key} className="space-y-2 border-b pb-4 last:border-b-0 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-emerald-700 dark:text-emerald-400">{cat.label} Özellikleri</Label>
                      <span className="text-xs text-slate-400">Seçili: {currentCatList.length}</span>
                    </div>

                    {/* Öneri Çipleri */}
                    <div className="flex flex-wrap gap-1.5">
                      {cat.suggestions.map((sug) => {
                        const isSelected = currentCatList.some((f) => f.toLowerCase() === sug.toLowerCase())
                        const isCustom = !defaultFeatureTokens.has(sug.toLocaleLowerCase("tr-TR"))
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleToggleFeature(cat.key, sug)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-sm"
                                : isCustom
                                  ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300"
                            }`}
                            title={isCustom ? "Kayıtlı özel özellik" : undefined}
                          >
                            {isSelected ? "✓ " : "+ "}
                            {sug}
                          </button>
                        )
                      })}
                    </div>

                    {/* Özel etiket ekle */}
                    <div className="mt-2 flex max-w-sm gap-2">
                      <Input
                        value={featureCustomInput[cat.key] || ""}
                        onChange={(e) => setFeatureCustomInput((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                        placeholder={cat.placeholder}
                        className="h-8 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddCustomFeature(cat.key)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleAddCustomFeature(cat.key)}
                      >
                        Ekle
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: KURALLAR & ÇEVRE */}
        <TabsContent value="kurallar" className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-emerald-50/40 shadow-2xs dark:border-neutral-800 dark:from-neutral-950 dark:via-neutral-950 dark:to-emerald-950/20">
            <div className="flex flex-col gap-3 border-b border-slate-200/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Kurallar & Çevre
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Detay sayfasında kart olarak gösterilir. Öğeye tıklayarak düzenleyin, sürükleyerek sıralayın.
                </p>
              </div>
              <div className="inline-flex rounded-xl border border-slate-200/80 bg-white/80 p-1 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/80">
                <button
                  type="button"
                  onClick={() => handleRulesPanelChange("rules")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    rulesPanel === "rules"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  Konaklama Kuralları
                  <span
                    className={cn(
                      "ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                      rulesPanel === "rules" ? "bg-white/20" : "bg-slate-100 text-slate-600 dark:bg-neutral-800"
                    )}
                  >
                    {data.rules.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRulesPanelChange("nearby")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    rulesPanel === "nearby"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  Çevre & Mesafe
                  <span
                    className={cn(
                      "ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                      rulesPanel === "nearby" ? "bg-white/20" : "bg-slate-100 text-slate-600 dark:bg-neutral-800"
                    )}
                  >
                    {data.nearbyPlaces.length}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {rulesPanel === "rules" ? (
                <ContentItemEditor
                  variant="rules"
                  items={data.rules}
                  onChange={(rules) => set({ rules })}
                  presets={mergedContentPresets.rules}
                  onRememberPreset={(preset) => rememberContentPreset("rules", preset)}
                  titlePlaceholder="Örn: Evcil Hayvan Politikası"
                  descriptionPlaceholder="Örn: Tesisimiz evcil hayvan dostudur."
                  addLabel="Yeni kural ekle"
                  emptyTitle="Henüz kural yok"
                  emptyHint="Hazır başlıklardan seçin veya özel bir kural ekleyin. Yeni başlıklar kaydedilir ve sonraki bungalovlarda da önerilir."
                />
              ) : (
                <ContentItemEditor
                  variant="nearby"
                  items={data.nearbyPlaces}
                  onChange={(nearbyPlaces) => set({ nearbyPlaces })}
                  presets={mergedContentPresets.nearbyPlaces}
                  onRememberPreset={(preset) => rememberContentPreset("nearbyPlaces", preset)}
                  titlePlaceholder="Örn: Plaj"
                  descriptionPlaceholder="Örn: 500 m"
                  addLabel="Yeni yer ekle"
                  emptyTitle="Henüz çevre noktası yok"
                  emptyHint="Yakın noktaları ekleyin. Yeni başlıklar kaydedilir ve sonraki bungalovlarda da önerilir."
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: SEO & GOOGLE CANLI ÖNİZLEME */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-base">Arama Motoru (SEO) Yapılandırması</CardTitle>
                <CardDescription>
                  Boş bırakırsanız kaydetme sırasında otomatik doldurulur. Dolu alanlar korunur.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSeo}
                disabled={!data.name.trim()}
                className="shrink-0 text-xs"
              >
                <Sparkles className="mr-1 size-3.5 text-emerald-600" /> SEO Oluştur
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label>SEO Başlığı (Title Tag)</Label>
                  <span
                    className={`text-[11px] ${
                      data.seoTitle.length > SEO_TITLE_LIMIT ? "font-semibold text-amber-600" : "text-slate-400"
                    }`}
                  >
                    {data.seoTitle.length}/{SEO_TITLE_LIMIT}
                  </span>
                </div>
                <Input
                  value={data.seoTitle}
                  onChange={(e) => set({ seoTitle: e.target.value })}
                  placeholder={data.name ? `${data.name} | Aden Bungalov Sapanca` : "Bungalov Başlığı"}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label>Meta Açıklaması (Description Tag)</Label>
                  <span
                    className={`text-[11px] ${
                      data.seoDescription.length > SEO_DESCRIPTION_LIMIT
                        ? "font-semibold text-amber-600"
                        : "text-slate-400"
                    }`}
                  >
                    {data.seoDescription.length}/{SEO_DESCRIPTION_LIMIT}
                  </span>
                </div>
                <Textarea
                  rows={3}
                  value={data.seoDescription}
                  onChange={(e) => set({ seoDescription: e.target.value })}
                  placeholder="Bungalov rezervasyon ve konaklama fırsatları..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Fiziksel Adres / Konum Tarifi</Label>
                <Input
                  value={data.address}
                  onChange={(e) => set({ address: e.target.value })}
                  placeholder="Sapanca / Sakarya"
                />
              </div>
            </CardContent>
          </Card>

          {/* Google Canlı Arama Sonucu Simülasyonu */}
          <Card className="bg-slate-50 dark:bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Google Arama Canlı Önizlemesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-xl rounded-lg border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>https://adenbungalov.com</span>
                  <span>›</span>
                  <span>bungalovlarimiz</span>
                  <span>›</span>
                  <span>{data.slug || slugify(data.name) || "bungalov-url"}</span>
                </div>
                <h4 className="mt-1 text-lg font-medium text-blue-800 hover:underline dark:text-blue-400">
                  {data.seoTitle || data.name || "Bungalov Adı — Aden Bungalov"}
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {data.seoDescription ||
                    data.description.slice(0, SEO_DESCRIPTION_LIMIT) ||
                    "Sapanca doğasında premium konaklama tecrübesi..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
