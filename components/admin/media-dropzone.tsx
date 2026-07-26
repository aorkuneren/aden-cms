"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Link as LinkIcon, Loader2, Upload, X } from "lucide-react"

import { uploadFileAction } from "@/app/admin/(panel)/upload-actions"
import { type UploadTarget } from "@/lib/media/upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type MediaDropzoneProps = {
  label?: string
  hint?: string
  accept?: string
  /** Çoklu modda önizleme yapılmaz; yüklenen adresler onUploaded ile dışarıya verilir. */
  multiple?: boolean
  /** Tek dosya modunda kompakt yatay dropzone / küçük önizleme. */
  compact?: boolean
  value?: string
  /** Dosyanın hangi klasör altına kaydedileceğini belirler. */
  target?: UploadTarget
  onUploaded: (urls: string[]) => void
  onClear?: () => void
  onValueChange?: (url: string) => void
}

function appendTargetToFormData(formData: FormData, target: UploadTarget) {
  formData.append("scope", target.scope)
  if (target.scope === "bungalov") formData.append("targetId", target.id)
  if (target.scope === "galeri") formData.append("category", target.category)
}

export function MediaDropzone({
  label,
  hint = "PNG, JPG, WEBP, AVIF (Maks. 100MB)",
  accept = "image/*,video/*",
  multiple = false,
  compact = false,
  value = "",
  target = { scope: "system" },
  onUploaded,
  onClear,
  onValueChange,
}: MediaDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepthRef = useRef(0)

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const selected = multiple ? files : files.slice(0, 1)
      if (selected.length === 0) return

      setError(null)
      setProgress({ done: 0, total: selected.length })

      const uploadedUrls: string[] = []
      const failedNames: string[] = []

      for (const [index, file] of selected.entries()) {
        try {
          const formData = new FormData()
          formData.append("file", file)
          appendTargetToFormData(formData, target)

          const res = await uploadFileAction(formData)
          if (res.ok && res.url) {
            uploadedUrls.push(res.url)
          } else {
            failedNames.push(file.name)
          }
        } catch {
          failedNames.push(file.name)
        }
        setProgress({ done: index + 1, total: selected.length })
      }

      setProgress(null)
      if (uploadedUrls.length > 0) {
        onUploaded(uploadedUrls)
      }
      if (failedNames.length > 0) {
        setError(`Yüklenemedi: ${failedNames.join(", ")}`)
      }
    },
    [multiple, onUploaded, target]
  )

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    await uploadFiles(files)
  }

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault()
    dragDepthRef.current += 1
    setIsDragActive(true)
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) {
      setIsDragActive(false)
    }
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    dragDepthRef.current = 0
    setIsDragActive(false)
    await uploadFiles(Array.from(event.dataTransfer.files || []))
  }

  const triggerFileDialog = () => fileInputRef.current?.click()

  const isUploading = progress !== null
  const uploadingText = progress
    ? progress.total > 1
      ? `Yükleniyor... (${progress.done}/${progress.total})`
      : "Dosya sunucuya yükleniyor..."
    : ""

  const dropzoneClasses = cn(
    "relative flex items-center justify-center rounded-lg border border-dashed text-center transition-colors",
    multiple
      ? "min-h-24 flex-col gap-1 p-4"
      : compact
        ? "h-20 w-full max-w-md flex-row gap-3 px-4"
        : "aspect-video w-full max-w-md flex-col p-4",
    isDragActive
      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
      : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-slate-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800",
    isUploading ? "pointer-events-none opacity-80" : "cursor-pointer"
  )

  const showSinglePreview = !multiple && Boolean(value) && !isUploading
  const iconSize = compact || multiple ? "size-5" : "size-6"

  return (
    <div className="space-y-2">
      {label ? <Label className="text-xs font-medium">{label}</Label> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      {showSinglePreview ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "group relative overflow-hidden rounded-lg border bg-slate-100 dark:border-neutral-800",
            compact ? "h-20 w-36" : "aspect-video w-full max-w-md",
            isDragActive && "border-emerald-500 ring-2 ring-emerald-400"
          )}
        >
          <Image
            src={value}
            alt="Kapak görseli önizleme"
            fill
            sizes={compact ? "144px" : "448px"}
            className="object-cover"
            unoptimized
          />
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center gap-1.5 bg-slate-900/60 backdrop-blur-xs transition-opacity",
              isDragActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            {isDragActive ? (
              <p className="px-2 text-[10px] font-semibold text-white">Bırakın</p>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  onClick={triggerFileDialog}
                  title="Değiştir"
                >
                  <Upload className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => (onClear ? onClear() : onValueChange?.(""))}
                  title="Kaldır"
                >
                  <X className="size-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={triggerFileDialog}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              triggerFileDialog()
            }
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={dropzoneClasses}
        >
          {isUploading ? (
            <>
              <Loader2 className={cn(iconSize, "animate-spin text-emerald-600")} />
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{uploadingText}</p>
            </>
          ) : compact && !multiple ? (
            <>
              <Upload className={cn(iconSize, "shrink-0", isDragActive ? "text-emerald-600" : "text-slate-400")} />
              <div className="min-w-0 text-left">
                <p className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  {isDragActive ? "Dosyayı bırakın" : "Sürükle bırak veya seç"}
                </p>
                <p className="truncate text-[10px] text-slate-400">{hint}</p>
              </div>
            </>
          ) : (
            <>
              {multiple ? (
                <ImagePlus className={cn(iconSize, isDragActive ? "text-emerald-600" : "text-slate-400")} />
              ) : (
                <Upload className={cn(iconSize, isDragActive ? "text-emerald-600" : "text-slate-400")} />
              )}
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                {isDragActive
                  ? "Dosyaları bırakın"
                  : multiple
                    ? "Görselleri sürükleyip bırakın veya seçin"
                    : "Kapak görselini sürükleyip bırakın veya seçin"}
              </p>
              <p className="text-[10px] text-slate-400">{hint}</p>
            </>
          )}
        </div>
      )}

      {onValueChange ? (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setShowUrlInput((current) => !current)}
            className="inline-flex items-center text-[11px] text-slate-500 hover:text-slate-700"
          >
            <LinkIcon className="mr-1 size-3" />
            {showUrlInput ? "URL girişini gizle" : "URL ile ekle"}
          </button>

          {showUrlInput ? (
            <Input
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              placeholder="https://... görsel adresi"
              className="h-8 text-xs"
            />
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-[11px] font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
