"use client"

import { useMemo, useState } from "react"
import {
  Armchair,
  Baby,
  Bath,
  BedDouble,
  CalendarCheck2,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coffee,
  CookingPot,
  Droplets,
  Flame,
  KeyRound,
  MapPin,
  Mountain,
  ShieldCheck,
  ShowerHead,
  Snowflake,
  Sparkles,
  Sun,
  TreePine,
  Tv,
  UtensilsCrossed,
  Waves,
  Wifi,
  type LucideIcon,
} from "lucide-react"
import {
  BUNGALOW_FEATURE_CATEGORIES,
  type BungalowFeatureCategoryKey,
  mergeBungalowFeaturesFromCategoryMap,
} from "@/lib/bungalov-feature-categories"
import { cn } from "@/lib/utils"

type FeatureGroups = Record<BungalowFeatureCategoryKey, string[]>

type BungalowAmenitiesTabsProps = {
  groupedFeatures: FeatureGroups
}

type TabItem = {
  key: "tumu" | BungalowFeatureCategoryKey
  label: string
  amenities: string[]
}

const INITIAL_VISIBLE_COUNT = 9

function normalizeFeatureKeyword(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const TAB_ICONS: Record<"tumu" | BungalowFeatureCategoryKey, LucideIcon> = {
  tumu: Sparkles,
  genel: ShieldCheck,
  mutfak: CookingPot,
  mobilya: Armchair,
  banyo: Bath,
  bahce: TreePine,
}

const CATEGORY_ICON_SET: Record<BungalowFeatureCategoryKey, LucideIcon[]> = {
  genel: [ShieldCheck, Sparkles, Mountain, MapPin, Waves, Wifi],
  mutfak: [CookingPot, Coffee, UtensilsCrossed],
  mobilya: [Armchair, BedDouble, Tv, KeyRound],
  banyo: [Bath, ShowerHead, Droplets],
  bahce: [TreePine, Sun, Flame, Waves],
}

const AMENITY_ICON_BY_TITLE: Record<string, LucideIcon> = {
  havuz: Waves,
  "isitmali havuz": Waves,
  "ozel havuz": Waves,
  "ozel isitmali havuz": Waves,
  "cift kisilik oda kahvalti": Coffee,
  kahvalti: Coffee,
  klima: Snowflake,
  "amerikan mutfak": CookingPot,
  bahce: TreePine,
  "ozel bahce": TreePine,
  "barbeku evet": Flame,
  barbeku: Flame,
  buzdolabi: CookingPot,
  "deniz manzarali": Mountain,
  dusakabin: Bath,
  "elbise dolabi": KeyRound,
  "guneslenme alani": Sun,
  "havlular carsaf": BedDouble,
  "carsaf takimi": BedDouble,
  komidin: KeyRound,
  mobilya: Armchair,
  "mutfak gerecleri": UtensilsCrossed,
  ocak: CookingPot,
  otopark: Car,
  "oturma alani": Armchair,
  salincak: TreePine,
  somine: Flame,
  "su isiticisi": Coffee,
  televizyon: Tv,
  "uydu tv lcd": Tv,
  "veranda teras": Sun,
  "yemek masasi": UtensilsCrossed,
  "cift kisilik oda": BedDouble,
  wifi: Wifi,
  "wi fi": Wifi,
  jakuzi: Waves,
  "mini buzdolabi": CookingPot,
  "elektrikli cayci": Coffee,
  "kahve makinesi": Coffee,
  "elektrikli ocak": CookingPot,
  "catal kasik bicak seti": UtensilsCrossed,
  "tencere tava seti": CookingPot,
  "kesme tahtasi": UtensilsCrossed,
  "bardak seti": Coffee,
  "cop kovasi": CookingPot,
  "l koltuk": Armchair,
  "cift kisilik yatak": BedDouble,
  "tek kisilik yatak": BedDouble,
  "sallanan sandalye": Armchair,
  "boy aynasi": Sparkles,
  "sampuan ve sabun": ShowerHead,
  "havlu seti": Bath,
  "fon makinesi": Sparkles,
  "sicak su": Droplets,
  "bahce oturma grubu": TreePine,
  sezlong: Sun,
}

const AMENITY_ICON_RULES: Array<{
  pattern: RegExp
  icon: LucideIcon
}> = [
  { pattern: /wifi|wi-fi|internet/, icon: Wifi },
  { pattern: /otopark|park/, icon: Car },
  { pattern: /bebek|cocuk|çocuk|aile/, icon: Baby },
  { pattern: /manzara|view/, icon: Mountain },
  { pattern: /konum|lokasyon|merkez|havaliman|ulas|ulaş/, icon: MapPin },
  { pattern: /havuz|jakuzi|spa|deniz/, icon: Waves },
  { pattern: /somine|şomine|barbeku|barbekü|ates|ateş/, icon: Flame },
  { pattern: /klima|isitma|ısıtma|sogutma|soğutma/, icon: Snowflake },
  { pattern: /kahvalti|kahvaltı|kahve|mutfak|yemek/, icon: Coffee },
  { pattern: /tv|televizyon|netflix/, icon: Tv },
  { pattern: /guvenlik|güvenlik|alarm|kasa/, icon: ShieldCheck },
  { pattern: /yatak|oda/, icon: BedDouble },
]

import { SECTOR_ICON_MAP_BY_KEY, cleanFeatureTitle } from "@/lib/sector-icons"

const AMENITY_FALLBACK_ICONS: LucideIcon[] = [Sparkles, CalendarCheck2, KeyRound]

const ICON_MAP_BY_NAME: Record<string, LucideIcon> = {
  ...SECTOR_ICON_MAP_BY_KEY,
  waves: Waves,
  sparkles: Sparkles,
  flame: Flame,
  tree: TreePine,
  treepine: TreePine,
  wifi: Wifi,
  tv: Tv,
  snowflake: Snowflake,
  coffee: Coffee,
  cookingpot: CookingPot,
  car: Car,
  shieldcheck: ShieldCheck,
  mountain: Mountain,
  beddouble: BedDouble,
  bath: Bath,
  baby: Baby,
  utensilscrossed: UtensilsCrossed,
  keyround: KeyRound,
  sun: Sun,
  showerhead: ShowerHead,
  droplets: Droplets,
  armchair: Armchair,
}
function resolveAmenityIcon(
  feature: string,
  index: number,
  categoryHint: BungalowFeatureCategoryKey | undefined
) {
  const match = feature.match(/^\[icon:([a-zA-Z0-9]+)\]/i)
  if (match) {
    const iconKey = match[1].toLowerCase()
    if (ICON_MAP_BY_NAME[iconKey]) {
      return ICON_MAP_BY_NAME[iconKey]
    }
  }

  const cleaned = cleanFeatureTitle(feature)
  const normalized = normalizeFeatureKeyword(cleaned)

  const directIcon = AMENITY_ICON_BY_TITLE[normalized]
  if (directIcon) return directIcon

  if (categoryHint) {
    const categorySet = CATEGORY_ICON_SET[categoryHint]
    if (categorySet && categorySet.length > 0) {
      return categorySet[index % categorySet.length]
    }
  }

  const matched = AMENITY_ICON_RULES.find((rule) => rule.pattern.test(normalized))
  if (matched) return matched.icon
  return AMENITY_FALLBACK_ICONS[index % AMENITY_FALLBACK_ICONS.length]
}

export function BungalowAmenitiesTabs({ groupedFeatures }: BungalowAmenitiesTabsProps) {
  const amenityCategoryLookup = useMemo(() => {
    const lookup = new Map<string, BungalowFeatureCategoryKey>()
    for (const category of BUNGALOW_FEATURE_CATEGORIES) {
      const amenities = groupedFeatures[category.key] || []
      for (const amenity of amenities) {
        const key = normalizeFeatureKeyword(String(amenity || ""))
        if (!key) continue
        if (!lookup.has(key)) {
          lookup.set(key, category.key)
        }
      }
    }
    return lookup
  }, [groupedFeatures])

  const tabs = useMemo<TabItem[]>(() => {
    const allAmenities = mergeBungalowFeaturesFromCategoryMap(groupedFeatures)
    const categorizedTabs = BUNGALOW_FEATURE_CATEGORIES.filter(
      (category) => (groupedFeatures[category.key] || []).length > 0
    ).map((category) => ({
      key: category.key,
      label: category.label,
      amenities: groupedFeatures[category.key] || [],
    }))

    return [
      {
        key: "tumu",
        label: "Tüm Özellikler",
        amenities: allAmenities,
      },
      ...categorizedTabs,
    ]
  }, [groupedFeatures])

  const [activeTab, setActiveTab] = useState<"tumu" | BungalowFeatureCategoryKey>("tumu")
  const [showAllAmenities, setShowAllAmenities] = useState(false)

  const effectiveActiveTab = tabs.some((tab) => tab.key === activeTab) ? activeTab : "tumu"

  const activeAmenities = useMemo(() => {
    const tab = tabs.find((item) => item.key === effectiveActiveTab)
    return tab?.amenities || []
  }, [effectiveActiveTab, tabs])

  const visibleAmenities =
    effectiveActiveTab === "tumu" && !showAllAmenities
      ? activeAmenities.slice(0, INITIAL_VISIBLE_COUNT)
      : activeAmenities

  const canToggleAll = effectiveActiveTab === "tumu" && activeAmenities.length > INITIAL_VISIBLE_COUNT

  return (
    <section className="rounded-2xl border border-[#e2dcd2] bg-white p-6 shadow-xs sm:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#f0e8db] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#18261e] sm:text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#18261e]" />
            <span>Özellikler & Tesis İmkanları</span>
          </h2>
          <p className="text-xs text-[#66666e]">
            Konaklamanız boyunca yararlanabileceğiniz tüm donanım ve hizmetler.
          </p>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#18261e] bg-[#edf4ed] border border-[#c3d9c3] px-3 py-1 rounded-full w-fit">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
          <span>{activeAmenities.length} Tesis İmkanı</span>
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const TabIcon = TAB_ICONS[tab.key]
          const isActive = effectiveActiveTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key)
                setShowAllAmenities(false)
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer select-none border",
                isActive
                  ? "bg-[#18261e] border-[#18261e] text-white shadow-xs"
                  : "bg-[#fbf9f6] border-[#e8e2d8] text-[#55555e] hover:border-[#b8af9f] hover:bg-white"
              )}
            >
              <TabIcon className={cn("h-4 w-4", isActive ? "text-emerald-300" : "text-emerald-700")} />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.2 text-[10px] font-extrabold",
                  isActive ? "bg-white/20 text-white" : "bg-[#eee8df] text-[#18261e]"
                )}
              >
                {tab.amenities.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Amenities Grid Cards */}
      {activeAmenities.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleAmenities.map((amenity, index) => {
              const normalizedAmenity = normalizeFeatureKeyword(amenity)
              const categoryHint =
                effectiveActiveTab === "tumu" ? amenityCategoryLookup.get(normalizedAmenity) : effectiveActiveTab
              const Icon = resolveAmenityIcon(amenity, index, categoryHint)
              return (
                <div
                  key={`${amenity}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-[#e8e2d8] bg-[#fdfbf7] p-3 transition hover:border-[#18261e] hover:shadow-2xs"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf4ed] text-[#18261e]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-[#18261e]">{cleanFeatureTitle(amenity)}</span>
                </div>
              )
            })}
          </div>

          {canToggleAll ? (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowAllAmenities((current) => !current)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#18261e] bg-white px-6 text-xs font-bold text-[#18261e] transition hover:bg-[#18261e] hover:text-white cursor-pointer shadow-2xs"
              >
                <span>
                  {showAllAmenities
                    ? "Özellikleri Gizle"
                    : `Tüm ${activeAmenities.length} Özelliği Göster`}
                </span>
                {showAllAmenities ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-[#6a6a73] text-center py-4">Bu kategori için tanımlanmış özellik bulunmuyor.</p>
      )}
    </section>
  )
}
