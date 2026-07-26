import { ArrowRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type SectionEyebrowProps = {
  label: string
  icon?: LucideIcon
  className?: string
}

export function SectionEyebrow({
  label,
  icon: Icon = ArrowRight,
  className,
}: SectionEyebrowProps) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4f6751]",
        className
      )}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#edf4ed] text-[#355733]">
        <Icon className="h-3 w-3" />
      </span>
      {label}
    </p>
  )
}
