"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, ArrowRight, GripVertical, Star, X } from "lucide-react"

import { cn } from "@/lib/utils"

type SortableImageGridProps = {
  images: string[]
  coverImage?: string
  onChange: (images: string[]) => void
  onSetCover?: (url: string) => void
}

function moveItem(images: string[], from: number, to: number) {
  if (from === to || to < 0 || to >= images.length) return images
  const next = [...images]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function SortableImageGrid({ images, coverImage = "", onChange, onSetCover }: SortableImageGridProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-xs text-slate-400">
        Galeriye henüz görsel eklenmedi.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500">
        Görselleri sürükleyerek sıralayın. Kapak olarak işaretlenen görsel kartlarda ve detay sayfasında öne çıkar.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((imageUrl, index) => {
          const isCover = coverImage === imageUrl
          return (
            <div
              key={imageUrl}
              draggable
              onDragStart={(event) => {
                setDragIndex(index)
                event.dataTransfer.effectAllowed = "move"
                event.dataTransfer.setData("text/plain", String(index))
              }}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = "move"
                if (dragIndex === null || dragIndex === index) return
                onChange(moveItem(images, dragIndex, index))
                setDragIndex(index)
              }}
              onDragEnd={() => setDragIndex(null)}
              className={cn(
                "group relative aspect-video overflow-hidden rounded-xl border bg-slate-100 transition",
                dragIndex === index
                  ? "border-emerald-500 opacity-60 ring-2 ring-emerald-400"
                  : isCover
                    ? "border-emerald-500 ring-1 ring-emerald-400"
                    : "border-slate-200 dark:border-neutral-800"
              )}
            >
              <Image
                src={imageUrl}
                alt={`Galeri görseli ${index + 1}`}
                fill
                sizes="240px"
                className="object-cover"
                unoptimized
              />

              <div className="absolute left-2 top-2 flex items-center gap-1">
                <span className="flex items-center gap-1 rounded-md bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <GripVertical className="size-3" />
                  {index + 1}
                </span>
                {isCover ? (
                  <span className="flex items-center gap-1 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    <Star className="size-3 fill-current" /> Kapak
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = images.filter((_, i) => i !== index)
                  onChange(next)
                }}
                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-destructive text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                title="Görseli sil"
              >
                <X className="size-4" />
              </button>

              <div className="absolute inset-x-2 bottom-2 flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!isCover && onSetCover ? (
                  <button
                    type="button"
                    onClick={() => onSetCover(imageUrl)}
                    className="inline-flex h-7 items-center gap-1 rounded-full bg-white/95 px-2.5 text-[10px] font-bold text-emerald-700 shadow"
                    title="Kapak yap"
                  >
                    <Star className="size-3" /> Kapak Yap
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onChange(moveItem(images, index, index - 1))}
                  className="flex size-7 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow disabled:opacity-40"
                  title="Öne al"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1}
                  onClick={() => onChange(moveItem(images, index, index + 1))}
                  className="flex size-7 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow disabled:opacity-40"
                  title="Geriye al"
                >
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
