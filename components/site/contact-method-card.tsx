import type { LucideIcon } from "lucide-react"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

type ContactMethodCardProps = {
  icon: LucideIcon
  title: string
  description: string
  href?: string
  external?: boolean
  isHighlight?: boolean
}

export function ContactMethodCard({
  icon: Icon,
  title,
  description,
  href,
  external = false,
  isHighlight = false,
}: ContactMethodCardProps) {
  const content = (
    <div
      className={cn(
        "group flex items-center justify-between rounded-xl border p-3.5 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs",
        isHighlight
          ? "border-emerald-300 bg-emerald-50/80 hover:border-emerald-700"
          : "border-[#e2dcd2] bg-white hover:border-[#18261e] hover:bg-[#fdfbf7]"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition duration-200",
            isHighlight
              ? "bg-[#18261e] text-emerald-300"
              : "bg-[#edf4ed] text-[#18261e] group-hover:bg-[#18261e] group-hover:text-white"
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 space-y-0.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#777780]">
            {title}
          </span>
          <span className="block text-xs font-extrabold text-[#18261e] truncate">
            {description}
          </span>
        </div>
      </div>

      {href && (
        <ArrowUpRight className="h-4 w-4 shrink-0 text-[#777780] transition group-hover:text-[#18261e] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
    </div>
  )

  if (!href) return content

  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="block">
      {content}
    </a>
  )
}
