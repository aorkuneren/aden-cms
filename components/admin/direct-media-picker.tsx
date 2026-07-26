"use client"

import { useState, useRef, useTransition } from "react"
import Image from "next/image"
import { Upload, FolderOpen, Loader2, ImageOff, X, Check, Link as LinkIcon } from "lucide-react"

import { uploadFileAction } from "@/app/admin/(panel)/upload-actions"
import { type UploadTarget } from "@/lib/media/upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DirectMediaPickerProps {
  value: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
  accept?: string
  compact?: boolean
  /** Dosyanın hangi klasör altına kaydedileceğini belirler. */
  target?: UploadTarget
}

export function DirectMediaPicker({
  value,
  onChange,
  label = "Görsel Seç / Yükle",
  placeholder = "https://... veya dosya yükleyin",
  accept = "image/*,video/*",
  compact = false,
  target = { scope: "system" },
}: DirectMediaPickerProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
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
      if (res.ok) {
        onChange(res.url)
      } else {
        setError(res.error || "Yükleme başarısız oldu.")
      }
    } catch (err: any) {
      setError(err?.message || "Dosya yüklenirken hata oluştu.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      {label ? <Label className="text-xs font-medium">{label}</Label> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {compact ? (
        <div className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="text-xs flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerUpload}
            disabled={uploading}
            className="whitespace-nowrap text-xs"
          >
            {uploading ? (
              <Loader2 className="mr-1 size-3.5 animate-spin text-emerald-600" />
            ) : (
              <Upload className="mr-1 size-3.5 text-emerald-600" />
            )}
            {uploading ? "Yükleniyor..." : "Dosya Yükle"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Görsel Önizleme ve Yükleme Kartı */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 group">
            {value ? (
              <>
                <Image
                  src={value}
                  alt="Önizleme"
                  fill
                  sizes="400px"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={triggerUpload}
                    disabled={uploading}
                    className="text-xs font-semibold"
                  >
                    {uploading ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <Upload className="mr-1 size-3.5" />}
                    Değiştir
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onChange("")}
                    className="text-xs font-semibold"
                  >
                    <X className="mr-1 size-3.5" /> Kaldır
                  </Button>
                </div>
              </>
            ) : (
              <div
                onClick={triggerUpload}
                className="flex h-full flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="size-8 animate-spin text-emerald-600 mb-2" />
                ) : (
                  <Upload className="size-8 text-slate-400 group-hover:text-emerald-600 transition-colors mb-2" />
                )}
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {uploading ? "Dosya Sunucuya Yükleniyor..." : "Dosya Seçmek İçin Tıklayın"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PNG, JPG, WEBP, AVIF veya MP4 (Max 100MB)
                </p>
              </div>
            )}
          </div>

          {/* URL Girişi veya Manuel Yükleme Butonları */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerUpload}
                disabled={uploading}
                className="text-xs"
              >
                {uploading ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin text-emerald-600" />
                ) : (
                  <Upload className="mr-1 size-3.5 text-emerald-600" />
                )}
                Bilgisayardan Yükle
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs text-slate-500"
              >
                <LinkIcon className="mr-1 size-3.5" /> {showUrlInput ? "URL Girişini Gizle" : "URL Adresi Gir"}
              </Button>
            </div>
          </div>

          {showUrlInput ? (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://... görsel adresi"
              className="text-xs"
            />
          ) : null}

          {error ? <p className="text-xs text-destructive font-medium">{error}</p> : null}
        </div>
      )}
    </div>
  )
}
