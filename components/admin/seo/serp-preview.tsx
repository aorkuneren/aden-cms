"use client"

import { Globe, Monitor, Smartphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ORIGIN = "www.adenbungalov.com"

type Props = {
  title: string
  description: string
  urlPath: string
  mode: "desktop" | "mobile"
  onModeChange: (mode: "desktop" | "mobile") => void
}

function displayUrl(urlPath: string): string {
  const path = urlPath.startsWith("/") ? urlPath : `/${urlPath}`
  return `${ORIGIN}${path === "/" ? "" : path}`
}

export function SerpPreview({ title, description, urlPath, mode, onModeChange }: Props) {
  const url = displayUrl(urlPath || "/")
  const isMobile = mode === "mobile"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">Google Önizleme</p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === "desktop" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() => onModeChange("desktop")}
          >
            <Monitor className="mr-1 size-3" />
            Masaüstü
          </Button>
          <Button
            type="button"
            variant={mode === "mobile" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() => onModeChange("mobile")}
          >
            <Smartphone className="mr-1 size-3" />
            Mobil
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "rounded-lg border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950",
          isMobile && "max-w-[360px]"
        )}
      >
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800">
            <Globe className="size-2.5" />
          </span>
          <span className="truncate">{url}</span>
        </div>
        <p
          className={cn(
            "mt-1 truncate leading-tight text-[#1a0dab] dark:text-blue-400",
            isMobile ? "text-[18px]" : "text-[19px]"
          )}
        >
          {title || "Sayfa başlığı"}
        </p>
        <p
          className={cn(
            "mt-0.5 line-clamp-2 leading-snug text-[#4d5156] dark:text-slate-400",
            isMobile ? "text-[12px]" : "text-[13px]"
          )}
        >
          {description ||
            "Meta açıklaması burada görünecek. Arama sonuçlarında bu metin gösterilir."}
        </p>
      </div>
    </div>
  )
}
