"use client"

import { cn } from "@/lib/utils"
import { useSiteContext } from "@/components/site/site-context"

type PriceDisplayProps = {
  value: number
  className?: string
}

export function PriceDisplay({ value, className }: PriceDisplayProps) {
  const { formatConvertedPrice } = useSiteContext()
  const isFallback = value <= 0
  const label = isFallback ? "Fiyat sorunuz" : formatConvertedPrice(value) + " / Gece"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold",
        isFallback
          ? "border-[#e5d7bf] bg-[#f7f0e2] text-[#7a5b34]"
          : "border-[#cfdbcf] bg-[#edf4ed] text-[#2f5530]",
        className
      )}
    >
      {label}
    </span>
  )
}
