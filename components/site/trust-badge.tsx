import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type TrustBadgeProps = {
  icon?: LucideIcon
  label: string
  className?: string
}

export function TrustBadge({ icon: Icon, label, className }: TrustBadgeProps) {
  return (
    <Badge
      className={cn(
        "gap-1.5 rounded-full border border-white/35 bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/25",
        className
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {label}
    </Badge>
  )
}

