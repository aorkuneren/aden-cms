import {
  Building2,
  Bus,
  MapPin,
  Plane,
  ShoppingCart,
  Stethoscope,
  TrainFront,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react"
import { normalizeContentKeyword, type BungalovContentItem } from "@/lib/bungalov-content"

type BungalowNearbyPlacesProps = {
  items: BungalovContentItem[]
}

const PLACE_ICON_RULES: Array<{ pattern: RegExp; icon: LucideIcon }> = [
  { pattern: /havaliman|ucus|airport/, icon: Plane },
  { pattern: /sehir merkez|merkez|centrum/, icon: Building2 },
  { pattern: /plaj|deniz|gol|sahil/, icon: Waves },
  { pattern: /otogar|terminal/, icon: Bus },
  { pattern: /market|bakkal|alisveris/, icon: ShoppingCart },
  { pattern: /restaurant|restoran|lokanta|kahvalti|kafe|cafe/, icon: UtensilsCrossed },
  { pattern: /toplu ulasim|otobus|tren|metro|dolmus/, icon: TrainFront },
  { pattern: /hastane|saglik|eczane|klinik/, icon: Stethoscope },
]

function resolvePlaceIcon(title: string): LucideIcon {
  const normalized = normalizeContentKeyword(title)
  const matched = PLACE_ICON_RULES.find((rule) => rule.pattern.test(normalized))
  return matched?.icon ?? MapPin
}

export function BungalowNearbyPlaces({ items }: BungalowNearbyPlacesProps) {
  const visibleItems = items.filter((item) => item.visible && item.title.trim().length > 0)
  if (visibleItems.length === 0) return null

  return (
    <section className="space-y-6 rounded-2xl border border-[#e2dcd2] bg-white p-6 shadow-xs sm:p-8">
      <div className="space-y-1 border-b border-[#f0e8db] pb-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-[#18261e] sm:text-2xl">
          <MapPin className="h-6 w-6 text-[#18261e]" />
          <span>Çevredeki Yerler &amp; Mesafeler</span>
        </h2>
        <p className="text-xs text-[#66666e]">
          Bungalova en yakın ulaşım noktaları, hizmetler ve gezi alanları.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item) => {
          const Icon = resolvePlaceIcon(item.title)
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-[#e8e2d8] bg-[#fdfbf7] p-3.5 transition hover:border-[#18261e] hover:shadow-2xs"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ed] text-[#18261e]">
                <Icon className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <span className="block truncate text-xs font-bold text-[#18261e]">{item.title}</span>
                {item.description ? (
                  <span className="block truncate text-[11px] font-medium text-[#66666e]">{item.description}</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
