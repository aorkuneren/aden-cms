"use client"

import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { BungalowCard } from "@/components/site/bungalow-card"
import type { SiteBungalov } from "@/lib/site/b2c"
import { cn } from "@/lib/utils"

export type FeaturedCarouselSettings = {
  autoplayEnabled?: boolean
  autoplaySeconds?: number
  pauseOnHover?: boolean
  showDots?: boolean
  loop?: boolean
}

type FeaturedBungalowsCarouselProps = {
  items: SiteBungalov[]
  settings?: FeaturedCarouselSettings
}

export function FeaturedBungalowsCarousel({
  items,
  settings,
}: FeaturedBungalowsCarouselProps) {
  const autoplayEnabled = settings?.autoplayEnabled !== false
  const autoplaySeconds = Math.max(2, Math.min(30, settings?.autoplaySeconds ?? 5))
  const pauseOnHover = settings?.pauseOnHover !== false
  const showDots = settings?.showDots !== false
  const loop = settings?.loop !== false && items.length > 1

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop,
    dragFree: false,
    skipSnaps: false,
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const syncState = useCallback(() => {
    if (!emblaApi) return
    setActiveIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    emblaApi.on("select", syncState)
    emblaApi.on("reInit", syncState)

    return () => {
      emblaApi.off("select", syncState)
      emblaApi.off("reInit", syncState)
    }
  }, [emblaApi, syncState])

  useEffect(() => {
    if (!emblaApi) return
    if (!autoplayEnabled) return
    if (items.length < 2) return
    if (pauseOnHover && isPaused) return

    const timer = window.setInterval(() => {
      emblaApi.scrollNext()
    }, autoplaySeconds * 1000)

    return () => window.clearInterval(timer)
  }, [emblaApi, autoplayEnabled, autoplaySeconds, pauseOnHover, isPaused, items.length])

  return (
    <div
      className="mt-6 space-y-4"
      onMouseEnter={pauseOnHover ? () => setIsPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setIsPaused(false) : undefined}
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className="-ml-4 flex touch-pan-y">
          {items.map((bungalov, index) => (
            <div
              key={bungalov.id}
              className="min-w-0 flex-[0_0_100%] pl-4 sm:flex-[0_0_50%] md:flex-[0_0_33.3333%]"
            >
              <div
                className={cn(
                  "transition-all duration-300",
                  activeIndex === index ? "scale-100" : "scale-[0.94]"
                )}
              >
                <BungalowCard
                  bungalow={bungalov}
                  variant="showcase"
                  imageSizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDots && items.length > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                activeIndex === index ? "w-7 bg-[#1f3a2e]" : "w-2 bg-[#c9c0b3] hover:bg-[#b6ab9b]"
              )}
              aria-label={`Bungalov ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
