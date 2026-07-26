"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Eye, X, LayoutGrid, List } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type GalleryCategory = {
  id: string
  label: string
  images: string[]
}

type GalleryItem = {
  imageUrl: string
  categoryId: string
  categoryLabel: string
}

type GalleryPageContentProps = {
  categories: GalleryCategory[]
  filterAllLabel?: string
  zoomLabel?: string
  emptyLabel?: string
  viewGridLabel?: string
  viewListLabel?: string
}

const MOSAIC_LAYOUT = [
  "col-span-2 row-span-2 md:col-span-3 md:row-span-2 lg:col-span-4 lg:row-span-2",
  "col-span-1 row-span-1 md:col-span-3 md:row-span-1 lg:col-span-2 lg:row-span-1",
  "col-span-1 row-span-1 md:col-span-2 md:row-span-1 lg:col-span-2 lg:row-span-1",
  "col-span-2 row-span-1 md:col-span-4 md:row-span-1 lg:col-span-4 lg:row-span-1",
  "col-span-1 row-span-1 md:col-span-2 md:row-span-1 lg:col-span-2 lg:row-span-1",
  "col-span-1 row-span-1 md:col-span-2 md:row-span-1 lg:col-span-2 lg:row-span-1",
] as const

function normalizeCategories(categories: GalleryCategory[]) {
  const seen = new Set<string>()

  return categories
    .map((category) => ({
      id: String(category.id || "").trim(),
      label: String(category.label || "").trim(),
      images: (category.images || [])
        .map((item) => String(item || "").trim())
        .filter((item) => item.length > 0),
    }))
    .filter((category) => {
      if (!category.id || !category.label) return false
      if (seen.has(category.id)) return false
      seen.add(category.id)
      return category.images.length > 0
    })
}

function buildAllItems(categories: GalleryCategory[]) {
  const seen = new Set<string>()
  const items: GalleryItem[] = []

  for (const category of categories) {
    for (const imageUrl of category.images) {
      if (seen.has(imageUrl)) continue
      seen.add(imageUrl)
      items.push({
        imageUrl,
        categoryId: category.id,
        categoryLabel: category.label,
      })
    }
  }

  return items
}

export function GalleryPageContent({
  categories,
  filterAllLabel = "Tümü",
  zoomLabel = "Büyüt",
  emptyLabel = "Bu kategori için henüz herhangi bir galeri görseli eklenmemiş.",
  viewGridLabel = "Izgara Görünümü",
  viewListLabel = "Liste Görünümü",
}: GalleryPageContentProps) {
  const normalizedCategories = useMemo(() => normalizeCategories(categories || []), [categories])
  const allItems = useMemo(() => buildAllItems(normalizedCategories), [normalizedCategories])
  const [activeFilter, setActiveFilter] = useState<"all" | string>("all")
  
  // New view mode state: 'grid' (3 columns) or 'list' (1 column list) or 'mosaic'
  const [viewMode, setViewMode] = useState<"grid" | "list" | "mosaic">("grid")
  
  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return allItems
    return allItems.filter((item) => item.categoryId === activeFilter)
  }, [activeFilter, allItems])

  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const previewItem = previewIndex !== null ? filteredItems[previewIndex] || null : null

  const hasItems = filteredItems.length > 0

  const touchStartX = useRef<number | null>(null)

  const prevPreview = useCallback(() => {
    if (filteredItems.length < 2) return
    setPreviewIndex((prev) => {
      if (prev === null) return 0
      return (prev - 1 + filteredItems.length) % filteredItems.length
    })
  }, [filteredItems.length])

  const nextPreview = useCallback(() => {
    if (filteredItems.length < 2) return
    setPreviewIndex((prev) => {
      if (prev === null) return 0
      return (prev + 1) % filteredItems.length
    })
  }, [filteredItems.length])

  useEffect(() => {
    if (!previewItem) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        prevPreview()
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        nextPreview()
      }
    }

    document.documentElement.classList.add("lightbox-scroll-lock")
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.documentElement.classList.remove("lightbox-scroll-lock")
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [nextPreview, previewItem, prevPreview])

  const handleTouchEnd = (event: React.TouchEvent) => {
    const startX = touchStartX.current
    touchStartX.current = null
    if (startX === null || filteredItems.length < 2) return

    const distance = event.changedTouches[0]?.clientX - startX
    if (Math.abs(distance) < 48) return
    if (distance > 0) prevPreview()
    else nextPreview()
  }

  return (
    <>
      <div className="mt-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8e4dc] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all")
                setPreviewIndex(null)
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                activeFilter === "all"
                  ? "bg-[#1f3a2e] text-white shadow-md shadow-[#1f3a2e]/20"
                  : "bg-white text-[#4f4f57] border border-[#d8cbb8] hover:bg-[#f8f5ef] hover:text-[#202025]"
              )}
            >
              {filterAllLabel} ({allItems.length})
            </button>
            {normalizedCategories.map((category) => {
              const categoryCount = allItems.filter((item) => item.categoryId === category.id).length
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveFilter(category.id)
                    setPreviewIndex(null)
                  }}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                    activeFilter === category.id
                      ? "bg-[#1f3a2e] text-white shadow-md shadow-[#1f3a2e]/20"
                      : "bg-white text-[#4f4f57] border border-[#d8cbb8] hover:bg-[#f8f5ef] hover:text-[#202025]"
                  )}
                >
                  {category.label} <span className="ml-1 text-[11px] opacity-70">({categoryCount})</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#d8cbb8] rounded-full p-1 shadow-sm">
             <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-full transition-colors flex items-center justify-center",
                  viewMode === "grid" ? "bg-[#1f3a2e] text-white" : "text-[#4f4f57] hover:bg-[#f8f5ef]"
                )}
                aria-label={viewGridLabel}
                title={viewGridLabel}
             >
                <LayoutGrid className="size-4" />
             </button>
             <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-full transition-colors flex items-center justify-center",
                  viewMode === "list" ? "bg-[#1f3a2e] text-white" : "text-[#4f4f57] hover:bg-[#f8f5ef]"
                )}
                aria-label={viewListLabel}
                title={viewListLabel}
             >
                <List className="size-4" />
             </button>
          </div>
        </div>

        {hasItems ? (
          <div className={cn(
            "transition-all duration-500 ease-in-out",
            viewMode === "grid" && "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6",
            viewMode === "list" && "flex flex-col gap-6 max-w-4xl mx-auto",
            viewMode === "mosaic" && "grid auto-rows-[130px] grid-cols-2 gap-3 md:auto-rows-[160px] md:grid-cols-6 lg:auto-rows-[180px] lg:grid-cols-8" // Kept for future reference or if user wants to switch back
          )}>
            {filteredItems.map((item, index) => (
              <button
                key={`${item.imageUrl}-${index}`}
                type="button"
                onClick={() => setPreviewIndex(index)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl bg-white text-left outline-none focus-visible:ring-2 focus-visible:ring-[#1f3a2e] transition-all duration-300",
                  viewMode === "grid" && "aspect-[4/3] w-full shadow-sm border border-[#e8e4dc] hover:shadow-lg hover:shadow-[#1f3a2e]/5 hover:-translate-y-1",
                  viewMode === "list" && "flex flex-row aspect-auto w-full min-h-[140px] md:min-h-[220px] shadow-sm border border-[#e8e4dc] hover:shadow-lg hover:shadow-[#1f3a2e]/5 hover:-translate-x-1",
                  viewMode === "mosaic" && cn("border border-[#ddd4c5] bg-[#ddd4c5] shadow-[0_12px_24px_-20px_rgba(20,20,20,0.7)]", MOSAIC_LAYOUT[index % MOSAIC_LAYOUT.length])
                )}
              >
                {viewMode === "list" ? (
                   // List View Layout
                   <>
                     <div className="relative w-[40%] md:w-[45%] h-full shrink-0 overflow-hidden">
                       <Image
                        src={item.imageUrl}
                        alt={`${item.categoryLabel} galeri görseli ${index + 1}`}
                        fill
                        sizes="(max-width: 767px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                       />
                     </div>
                     <div className="flex flex-col justify-center p-5 md:p-8 w-full bg-white relative">
                        <span className="inline-flex w-fit items-center rounded-full border border-[#d8cbb8] bg-[#f8f5ef] px-3 py-1 text-xs font-semibold text-[#6f725f] mb-3">
                          {item.categoryLabel}
                        </span>
                        <h3 className="text-xl md:text-2xl font-medium text-[#171717] transition-colors group-hover:text-[#1f3a2e]">
                          {item.categoryLabel} Görseli #{index + 1}
                        </h3>
                        <div className="mt-auto pt-4 flex items-center text-[#1f3a2e] font-medium text-sm gap-2 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                          {zoomLabel} <ChevronRight className="size-4" />
                        </div>
                     </div>
                   </>
                ) : (
                   // Grid & Mosaic View Layout
                   <>
                     <Image
                        src={item.imageUrl}
                        alt={`${item.categoryLabel} galeri görseli ${index + 1}`}
                        fill
                        sizes={viewMode === "grid" ? "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" : "(max-width: 767px) 50vw, (max-width: 1023px) 34vw, 25vw"}
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1f3a2e]/60 via-[#1f3a2e]/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      
                      <span className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md shadow-sm">
                          {item.categoryLabel}
                        </span>
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1f3a2e] shadow-lg transform transition-transform group-hover:scale-110">
                          <Eye className="h-5 w-5" />
                        </span>
                      </span>
                   </>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-[#d8cbb8] rounded-2xl bg-[#f8f5ef]/50">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <Eye className="size-6 text-[#d8cbb8]" />
            </div>
            <h3 className="text-lg font-medium text-[#171717]">Görsel Bulunamadı</h3>
            <p className="mt-1 text-sm text-[#5f5f66] max-w-sm">
              {emptyLabel}
            </p>
          </div>
        )}
      </div>
      
      {/* LIGHTBOX DIALOG */}
      <Dialog
        open={Boolean(previewItem)}
        onOpenChange={(open) => {
          if (!open) setPreviewIndex(null)
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="fixed inset-0 top-0 left-0 z-50 flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 overflow-visible border-0 bg-black p-0 shadow-none outline-none sm:max-w-none"
        >
          <DialogTitle className="sr-only">Galeri Görsel Önizleme</DialogTitle>
          {previewItem ? (
            <div
              className="relative flex h-full w-full touch-pan-y items-center justify-center px-3 py-6 sm:px-10 sm:py-8"
              onClick={(event) => {
                if (event.target === event.currentTarget) setPreviewIndex(null)
              }}
              onTouchStart={(event) => {
                touchStartX.current = event.touches[0]?.clientX ?? null
              }}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative flex w-[min(96vw,80rem)] flex-col items-stretch">
                <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(null)}
                    className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="Görseli kapat"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {filteredItems.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={prevPreview}
                        className="absolute left-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-3 sm:h-12 sm:w-12"
                        aria-label="Önceki görsel"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        type="button"
                        onClick={nextPreview}
                        className="absolute right-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-3 sm:h-12 sm:w-12"
                        aria-label="Sonraki görsel"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  ) : null}

                  <Image
                    src={previewItem.imageUrl}
                    alt={`${previewItem.categoryLabel} büyük görsel`}
                    width={1600}
                    height={1200}
                    sizes="100vw"
                    className="h-auto max-h-[min(78dvh,860px)] w-full object-contain"
                    priority
                    unoptimized
                  />
                </div>

                <div className="mt-3 flex flex-col items-center gap-1 text-center">
                  <span className="rounded-full border border-white/20 bg-black/45 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur-md">
                    {previewItem.categoryLabel}
                  </span>
                  <p className="text-sm font-medium text-white/70">
                    {(previewIndex ?? 0) + 1} / {filteredItems.length}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}