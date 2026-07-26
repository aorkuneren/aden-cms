import {
  Ban,
  CalendarClock,
  Clock,
  CreditCard,
  Dog,
  ShieldCheck,
  Sparkles,
  Users,
  VolumeX,
  type LucideIcon,
} from "lucide-react"
import { normalizeContentKeyword, type BungalovContentItem } from "@/lib/bungalov-content"

type QuickRulesProps = {
  items: BungalovContentItem[]
}

const RULE_ICON_RULES: Array<{ pattern: RegExp; icon: LucideIcon }> = [
  { pattern: /minimum|gece|sure/, icon: CalendarClock },
  { pattern: /giris|cikis|saat/, icon: Clock },
  { pattern: /evcil|hayvan|pet/, icon: Dog },
  { pattern: /sessiz|gurultu|muzik/, icon: VolumeX },
  { pattern: /sigara|duman/, icon: Ban },
  { pattern: /odeme|kapora|depozito|fatura/, icon: CreditCard },
  { pattern: /misafir|kapasite|kisi/, icon: Users },
  { pattern: /temizlik|bakim/, icon: Sparkles },
]

function resolveRuleIcon(title: string): LucideIcon {
  const normalized = normalizeContentKeyword(title)
  const matched = RULE_ICON_RULES.find((rule) => rule.pattern.test(normalized))
  return matched?.icon ?? ShieldCheck
}

export function BungalowQuickRulesCard({ items }: QuickRulesProps) {
  const visibleItems = items.filter((item) => item.visible && item.title.trim().length > 0)
  if (visibleItems.length === 0) return null

  return (
    <section className="space-y-6 rounded-2xl border border-[#e2dcd2] bg-white p-6 shadow-xs sm:p-8">
      <div className="space-y-1 border-b border-[#f0e8db] pb-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-[#18261e] sm:text-2xl">
          <ShieldCheck className="h-6 w-6 text-[#18261e]" />
          <span>Konaklama Koşulları &amp; Tesis Kuralları</span>
        </h2>
        <p className="text-xs text-[#66666e]">
          Konforlu ve huzurlu bir tatil için bilmeniz gereken temel konaklama detayları.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item) => {
          const Icon = resolveRuleIcon(item.title)
          return (
            <div
              key={item.id}
              className="space-y-1.5 rounded-xl border border-[#e8e2d8] bg-[#fdfbf7] p-4"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#18261e]">
                <Icon className="h-4 w-4 text-emerald-700" />
                <span>{item.title}</span>
              </div>
              {item.description ? (
                <p className="text-xs leading-relaxed text-[#55555e]">{item.description}</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
