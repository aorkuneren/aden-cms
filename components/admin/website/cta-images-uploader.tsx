"use client"

import { SiteImageSlot } from "@/components/admin/website/site-image-slot"

/**
 * CTA görsellerini sitedeki yerleşimin aynısında düzenler: solda uzun kart,
 * sağ üstte küçük kart, altında dönüş kartının gerçek karşılığı.
 */
export function CtaImagesUploader({
  imageUrl1,
  imageUrl2,
  responseTitle,
  responseDescription,
  onChange,
}: {
  imageUrl1: string
  imageUrl2: string
  /** Sağ alttaki dönüş kartı yalnızca bağlam için çizilir, düzenlenmez. */
  responseTitle: string
  responseDescription: string
  onChange: (field: "imageUrl1" | "imageUrl2", url: string) => void
}) {
  return (
    <div className="rounded-xl border border-[#ddd3c3] bg-[#f6f3ee] p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
      <div className="mx-auto grid max-w-[560px] grid-cols-2 gap-3 sm:gap-4">
        <SiteImageSlot
          index={0}
          value={imageUrl1}
          onChange={(url) => onChange("imageUrl1", url)}
          target={{ scope: "cta" }}
          className="h-[290px] rounded-[20px] shadow-sm sm:h-[340px] lg:h-[380px]"
          emptyHint="Boşsa Hakkımızda görseli"
        />

        <div className="flex flex-col gap-3 sm:gap-4">
          <SiteImageSlot
            index={1}
            value={imageUrl2}
            onChange={(url) => onChange("imageUrl2", url)}
            target={{ scope: "cta" }}
            className="h-[150px] rounded-[20px] shadow-sm sm:h-[170px] lg:h-[184px]"
            compact
            emptyHint="Boşsa galeriden"
          />

          <div className="rounded-[20px] border border-[#ddd3c3] bg-white/70 px-4 py-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f725f]">
              {responseTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#49494f] dark:text-slate-300">
              {responseDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
