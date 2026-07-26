"use client"

import { SiteImageSlot } from "@/components/admin/website/site-image-slot"
import { cn } from "@/lib/utils"

export type CollageValues = [string, string, string, string]

/** Sitedeki masaüstü collage kartlarının birebir konum/ölçüleri. */
const DESKTOP_SLOTS = [
  "left-0 top-0 z-[2] h-[320px] w-[56%] rounded-[18px] shadow-[0_14px_28px_-20px_rgba(0,0,0,0.6)]",
  "right-[18%] top-[36px] z-[3] h-[128px] w-[33%] rounded-[16px] shadow-[0_10px_20px_-18px_rgba(0,0,0,0.7)]",
  "right-0 top-[160px] z-[1] h-[240px] w-[58%] rounded-[20px] shadow-[0_14px_30px_-22px_rgba(0,0,0,0.65)]",
  "bottom-[20px] left-[10%] z-[4] h-[128px] w-[33%] rounded-[16px] shadow-[0_10px_22px_-18px_rgba(0,0,0,0.7)]",
]

/**
 * Görselleri sitedeki collage yerleşiminin birebir aynısında düzenler:
 * masaüstünde üst üste binen dört kart, mobilde sitedeki 2'li ızgara.
 */
export function AboutCollageUploader({
  values,
  onChange,
}: {
  values: CollageValues
  onChange: (index: number, url: string) => void
}) {
  return (
    <div className="rounded-xl border border-[#e8dfcf] bg-[#f6f3ee] p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
      {/* Mobil: sitedeki 2'li ızgara */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {values.map((value, index) => (
          <SiteImageSlot
            key={`about-collage-mobile-${index}`}
            index={index}
            value={value}
            onChange={(url) => onChange(index, url)}
            target={{ scope: "hakkimizda" }}
            className="aspect-[4/3] rounded-[18px] shadow-sm"
            compact
          />
        ))}
      </div>

      {/* Masaüstü: sitedeki üst üste binen collage */}
      <div className="relative mx-auto hidden h-[470px] w-full max-w-[620px] md:block">
        {values.map((value, index) => (
          <SiteImageSlot
            key={`about-collage-desktop-${index}`}
            index={index}
            value={value}
            onChange={(url) => onChange(index, url)}
            target={{ scope: "hakkimizda" }}
            className={cn("absolute", DESKTOP_SLOTS[index])}
            compact={index === 1 || index === 3}
          />
        ))}
      </div>
    </div>
  )
}
