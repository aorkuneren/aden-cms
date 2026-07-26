"use client"

import { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight, Grid3X3, Image as ImageIcon, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type BungalowDetailGalleryProps = {
  images: string[]
  bungalowName: string
}

function normalizeImages(images: string[]) {
  return Array.from(
    new Set(
      (images || [])
        .map((image) => String(image || "").trim())
        .filter((image) => image.length > 0)
    )
  )
}

function buildVisibleTileIndices(length: number) {
  const maxIndex = Math.max(0, length - 1)
  return [0, 1, 2, 3, 4].map((index) => Math.min(index, maxIndex))
}

export function BungalowDetailGallery({ images, bungalowName }: BungalowDetailGalleryProps) {
  const normalizedImages = normalizeImages(images)
  const tileIndices = buildVisibleTileIndices(normalizedImages.length)
  const featured = normalizedImages[0] || ""
  const totalImages = normalizedImages.length
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [previewStartIndex, setPreviewStartIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: normalizedImages.length > 1,
    duration: 25,
  })

  const openPreview = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, totalImages - 1))
    setPreviewStartIndex(safeIndex)
    setActiveIndex(safeIndex)
    setIsPreviewOpen(true)
  }

  const goPrev = () => {
    emblaApi?.scrollPrev()
  }

  const goNext = () => {
    emblaApi?.scrollNext()
  }

  useEffect(() => {
    if (!emblaApi) return
    const syncActiveIndex = () => setActiveIndex(emblaApi.selectedScrollSnap())
    syncActiveIndex()
    emblaApi.on("select", syncActiveIndex)
    emblaApi.on("reInit", syncActiveIndex)
    return () => {
      emblaApi.off("select", syncActiveIndex)
      emblaApi.off("reInit", syncActiveIndex)
    }
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit({ loop: totalImages > 1 })
  }, [emblaApi, totalImages])

  useEffect(() => {
    if (!emblaApi || !isPreviewOpen) return
    emblaApi.scrollTo(Math.max(0, Math.min(previewStartIndex, totalImages - 1)), true)
  }, [emblaApi, isPreviewOpen, previewStartIndex, totalImages])

  if (totalImages === 0) {
    return (
      <div className="rounded-3xl border border-[#e7dfd1] bg-white p-8 text-center text-sm text-[#5f5f66] shadow-sm">
        <span className="inline-flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Bu bungalov için galeri görseli bulunmuyor.
        </span>
      </div>
    )
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-[22px]">
        <div className="grid grid-cols-2 gap-1.5 bg-white sm:gap-2 md:grid-cols-4">
          {tileIndices.map((sourceIndex, slotIndex) => (
            <button
              key={`${sourceIndex}-${slotIndex}`}
              type="button"
              onClick={() => openPreview(sourceIndex)}
              className={`overflow-hidden ${slotIndex === 0 ? "col-span-2 md:col-span-2 md:row-span-2" : "col-span-1"}`}
              aria-label={`${sourceIndex + 1}. görseli aç`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={normalizedImages[sourceIndex] || featured}
                alt={`${bungalowName} galeri ${sourceIndex + 1}`}
                className={`${
                  slotIndex === 0
                    ? "aspect-[4/3] h-auto w-full object-cover md:aspect-auto md:h-[min(544px,50vw)]"
                    : "aspect-[4/3] h-auto w-full object-cover md:aspect-auto md:h-[min(268px,25vw)]"
                } transition duration-500 hover:scale-[1.02]`}
                fetchPriority={slotIndex === 0 ? "high" : undefined}
                loading={slotIndex === 0 ? undefined : "lazy"}
                decoding="async"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => openPreview(0)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-xl border border-[#d4d4d8] bg-white/95 px-3 py-2 text-sm font-medium text-[#171717] shadow-sm backdrop-blur transition hover:bg-white"
        >
          <Grid3X3 className="h-4 w-4" />
          Tüm fotoğrafları göster
        </button>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          className="!inset-0 !left-0 !top-0 !h-screen !w-screen !max-w-[100vw] !translate-x-0 !translate-y-0 border-0 bg-transparent p-0 shadow-none sm:!max-w-[100vw]"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{bungalowName} galeri önizleme</DialogTitle>
          <div className="relative h-full w-full overflow-hidden bg-black/96 p-2 sm:p-3">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
              aria-label="Galeriyi kapat"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-full flex-col gap-3 pt-11 sm:pt-12">
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-[14px] bg-black">
                {totalImages > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
                      aria-label="Önceki görsel"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
                      aria-label="Sonraki görsel"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                ) : null}

                <div ref={emblaRef} className="h-full overflow-hidden">
                  <div className="flex h-full">
                    {normalizedImages.map((image, index) => (
                      <div key={`${image}-${index}`} className="min-w-0 shrink-0 grow-0 basis-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={`${bungalowName} büyük görsel ${index + 1}`}
                          className="h-full w-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {totalImages > 1 ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center">
                    <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {activeIndex + 1} / {totalImages}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {normalizedImages.map((image, index) => (
                    <button
                      key={`${image}-thumb-${index}`}
                      type="button"
                      onClick={() => emblaApi?.scrollTo(index)}
                      className={`overflow-hidden rounded-lg border transition ${
                        activeIndex === index
                          ? "border-white ring-1 ring-white/60"
                          : "border-white/25 hover:border-white/50"
                      }`}
                      aria-label={`${index + 1}. görsele git`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={`${bungalowName} küçük görsel ${index + 1}`}
                        className="h-16 w-24 object-cover sm:h-20 sm:w-32"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
