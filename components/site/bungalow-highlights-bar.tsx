import { Bed, Maximize2, Users, Waves, Wifi, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type HighlightsProps = {
  capacity?: number
  bedrooms?: number | null
  poolType?: string | null
  internet?: string | null
  areaSqm?: number | null
}

type HighlightItem = {
  key: string
  icon: LucideIcon
  label: string
  value: string
}

export function BungalowHighlightsBar({
  capacity = 2,
  bedrooms,
  poolType,
  internet,
  areaSqm,
}: HighlightsProps) {
  const items: HighlightItem[] = []

  if (capacity > 0) {
    items.push({ key: "capacity", icon: Users, label: "Kapasite", value: `${capacity} Misafir` })
  }
  if (bedrooms != null && bedrooms > 0) {
    items.push({ key: "bedrooms", icon: Bed, label: "Yatak Odası", value: `${bedrooms} Yatak Odası` })
  }
  if (poolType?.trim()) {
    items.push({ key: "pool", icon: Waves, label: "Havuz Tipi", value: poolType.trim() })
  }
  if (internet?.trim()) {
    items.push({ key: "internet", icon: Wifi, label: "İnternet", value: internet.trim() })
  }
  if (areaSqm != null && areaSqm > 0) {
    items.push({ key: "area", icon: Maximize2, label: "Metre Kare", value: `${areaSqm} m²` })
  }

  if (items.length === 0) return null

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3",
        items.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"
      )}
    >
      {items.map(({ key, icon: Icon, label, value }) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-xl border border-[#e2dcd2] bg-white p-3.5 shadow-2xs transition hover:border-[#18261e]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ed] text-[#18261e]">
            <Icon className="h-4.5 w-4.5 text-emerald-800" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold tracking-wider text-[#777780] uppercase">{label}</span>
            <span className="block truncate text-xs font-extrabold text-[#18261e]">{value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
