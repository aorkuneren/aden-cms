"use client"

const ORIGIN = "adenbungalov.com"

type Props = {
  title: string
  description: string
  imageUrl: string
  urlPath: string
}

function displayPath(urlPath: string): string {
  const path = urlPath.startsWith("/") ? urlPath : `/${urlPath}`
  return path === "/" ? ORIGIN : `${ORIGIN}${path}`
}

export function SocialPreview({ title, description, imageUrl, urlPath }: Props) {
  const displayTitle = title || "Sayfa başlığı"
  const displayDesc =
    description || "Meta açıklaması sosyal paylaşımlarda bu alanda görünür."
  const pathLabel = displayPath(urlPath || "/")

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500">Sosyal Medya Önizleme</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Facebook */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="aspect-[1.91/1] bg-slate-100 dark:bg-neutral-800">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-[10px] text-slate-400">
                Görsel yok
              </div>
            )}
          </div>
          <div className="space-y-0.5 bg-[#f2f3f5] p-2 dark:bg-neutral-900">
            <p className="text-[9px] uppercase tracking-wide text-slate-500">{ORIGIN}</p>
            <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {displayTitle}
            </p>
            <p className="line-clamp-2 text-[10px] leading-snug text-slate-600 dark:text-slate-400">
              {displayDesc}
            </p>
          </div>
          <p className="border-t border-slate-200 px-2 py-1 text-[9px] text-slate-400 dark:border-neutral-800">
            Facebook
          </p>
        </div>

        {/* X (Twitter) */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="aspect-[2/1] bg-slate-100 dark:bg-neutral-800">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-[10px] text-slate-400">
                Görsel yok
              </div>
            )}
          </div>
          <div className="space-y-0.5 p-2">
            <p className="line-clamp-2 text-[11px] font-medium leading-tight text-slate-900 dark:text-slate-100">
              {displayTitle}
            </p>
            <p className="line-clamp-2 text-[10px] leading-snug text-slate-600 dark:text-slate-400">
              {displayDesc}
            </p>
            <p className="truncate text-[9px] text-slate-400">{pathLabel}</p>
          </div>
          <p className="border-t border-slate-200 px-2 py-1 text-[9px] text-slate-400 dark:border-neutral-800">
            X
          </p>
        </div>

        {/* WhatsApp */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex gap-2 p-2">
            <div className="size-14 shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-neutral-800">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-[8px] text-slate-400">
                  —
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="line-clamp-1 text-[11px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                {displayTitle}
              </p>
              <p className="line-clamp-2 text-[10px] leading-snug text-slate-600 dark:text-slate-400">
                {displayDesc}
              </p>
              <p className="truncate text-[9px] text-slate-400">{pathLabel}</p>
            </div>
          </div>
          <p className="border-t border-slate-200 px-2 py-1 text-[9px] text-slate-400 dark:border-neutral-800">
            WhatsApp
          </p>
        </div>
      </div>
    </div>
  )
}
