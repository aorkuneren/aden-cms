"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Loader2, Upload, X } from "lucide-react"

import { uploadFileAction } from "@/app/admin/(panel)/upload-actions"
import { Button } from "@/components/ui/button"
import type { UploadTarget } from "@/lib/media/upload"
import { cn } from "@/lib/utils"

/**
 * Sitedeki yerleşimin birebir aynısında çizilen görsel slotu.
 *
 * Kart ölçüsü ve konumu dışarıdan `className` ile verilir; böylece yükleme
 * alanı, sitedeki bölümün gerçek düzenini yansıtır.
 */
export function SiteImageSlot({
  index,
  value,
  onChange,
  target,
  className,
  compact,
  emptyHint = "Boşsa galeriden doldurulur",
}: {
  /** Kart üzerindeki sıra numarası (0 tabanlı). */
  index: number
  value: string
  onChange: (url: string) => void
  target: UploadTarget
  className?: string
  /** Küçük kartlarda etiketler gizlenir, butonlar ikona iner. */
  compact?: boolean
  emptyHint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("scope", target.scope)
      if (target.scope === "bungalov") formData.append("targetId", target.id)
      if (target.scope === "galeri") formData.append("category", target.category)

      const res = await uploadFileAction(formData)
      if (res.ok) onChange(res.url)
      else setError(res.error || "Yükleme başarısız oldu.")
    } catch {
      setError("Dosya yüklenirken hata oluştu.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        void upload(event.dataTransfer.files?.[0])
      }}
      className={cn(
        "group overflow-hidden border bg-white transition-colors",
        dragging ? "border-emerald-500 ring-2 ring-emerald-400/50" : "border-[#e8dfcf]",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void upload(event.target.files?.[0])
          event.target.value = ""
        }}
      />

      <div className="relative h-full w-full">
        {value ? (
          <Image
            src={value}
            alt={`Görsel ${index + 1}`}
            fill
            sizes="360px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-50 p-2 text-center transition-colors hover:bg-emerald-50 dark:bg-neutral-800 dark:hover:bg-emerald-950/30"
          >
            <ImagePlus className="size-5 text-slate-400" />
            {!compact ? (
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Sürükle bırak veya seç
              </span>
            ) : null}
            <span className="text-[10px] text-slate-400">{emptyHint}</span>
          </button>
        )}

        <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {index + 1}
        </span>

        {value ? (
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-slate-900/60 opacity-0 backdrop-blur-xs transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size={compact ? "icon-xs" : "sm"}
              onClick={() => inputRef.current?.click()}
              className="text-xs font-semibold"
              title="Değiştir"
            >
              <Upload className={compact ? "size-3" : "mr-1 size-3.5"} />
              {compact ? null : "Değiştir"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size={compact ? "icon-xs" : "sm"}
              onClick={() => onChange("")}
              className="text-xs font-semibold"
              title="Kaldır"
            >
              <X className={compact ? "size-3" : "mr-1 size-3.5"} />
              {compact ? null : "Kaldır"}
            </Button>
          </div>
        ) : null}

        {uploading ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-white/85 dark:bg-neutral-900/85">
            <Loader2 className="size-5 animate-spin text-emerald-600" />
            <span className="text-[10px] font-medium text-slate-600">Yükleniyor…</span>
          </div>
        ) : null}

        {error ? (
          <p className="absolute inset-x-0 bottom-0 z-20 bg-destructive px-1.5 py-1 text-[10px] font-medium text-white">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
