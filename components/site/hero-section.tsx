"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type HeroSlide = {
  imageUrl: string
  videoUrl?: string
  mediaType?: "IMAGE" | "VIDEO"
  title?: string
  description?: string
  tags?: string[]
  overlayOpacity?: number
  badgeText?: string
  buttonText?: string
  buttonUrl?: string
  secondaryButtonText?: string
  secondaryButtonUrl?: string
}

type HeroSectionProps = {
  companyName: string
  slides: HeroSlide[]
  autoplayEnabled?: boolean
  autoplaySeconds?: number
  pauseOnHover?: boolean
}

function mediaKey(slide: HeroSlide): string {
  return slide.mediaType === "VIDEO" ? slide.videoUrl || "" : slide.imageUrl
}

export function HeroSection({
  companyName,
  slides: inputSlides,
  autoplayEnabled = true,
  autoplaySeconds = 5,
  pauseOnHover = true,
}: HeroSectionProps) {
  const [isPaused, setIsPaused] = useState(false)
  const normalizedSlides = useMemo(() => {
    const seen = new Set<string>()
    return (inputSlides || [])
      .map((slide) => {
        const videoUrl = slide.videoUrl?.trim() || ""
        const isVideo = slide.mediaType === "VIDEO" && videoUrl.length > 0
        return {
          imageUrl: slide.imageUrl?.trim() || "",
          videoUrl: videoUrl || undefined,
          mediaType: (isVideo ? "VIDEO" : "IMAGE") as "IMAGE" | "VIDEO",
          title: slide.title?.trim() || "",
          description: slide.description?.trim() || "",
          tags: Array.isArray(slide.tags)
            ? slide.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0).slice(0, 6)
            : [],
          overlayOpacity: typeof slide.overlayOpacity === "number" ? slide.overlayOpacity : undefined,
          badgeText: slide.badgeText?.trim() || "",
          buttonText: slide.buttonText?.trim() || "",
          buttonUrl: slide.buttonUrl?.trim() || "",
          secondaryButtonText: slide.secondaryButtonText?.trim() || "",
          secondaryButtonUrl: slide.secondaryButtonUrl?.trim() || "",
        }
      })
      .filter((slide) => {
        const key = mediaKey(slide)
        if (!key) return false // görsel/video yoksa atla
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }, [inputSlides])

  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return
    if (!autoplayEnabled) return
    if (normalizedSlides.length < 2) return
    if (pauseOnHover && isPaused) return
    const intervalMs = Math.max(2, autoplaySeconds) * 1000
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % normalizedSlides.length)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [normalizedSlides.length, autoplayEnabled, autoplaySeconds, pauseOnHover, isPaused])

  const activeSlideIndex = normalizedSlides.length > 0 ? activeSlide % normalizedSlides.length : 0
  const activeSlideItem = normalizedSlides[activeSlideIndex] || normalizedSlides[0] || null
  const heroTitle = activeSlideItem?.title?.trim() || ""
  const heroDescription = activeSlideItem?.description?.trim() || ""
  const heroTags = activeSlideItem?.tags?.slice(0, 3) || []
  const heroBadge = activeSlideItem?.badgeText || ""
  const primaryCta =
    activeSlideItem?.buttonText && activeSlideItem?.buttonUrl
      ? { text: activeSlideItem.buttonText, url: activeSlideItem.buttonUrl }
      : null
  const secondaryCta =
    activeSlideItem?.secondaryButtonText && activeSlideItem?.secondaryButtonUrl
      ? { text: activeSlideItem.secondaryButtonText, url: activeSlideItem.secondaryButtonUrl }
      : null
  const hasHeroCopy =
    heroTitle.length > 0 || heroDescription.length > 0 || heroTags.length > 0 || Boolean(heroBadge) || Boolean(primaryCta)

  // Panelden ayarlanan karartma; tanımsızsa mevcut görünümü koru (ekstra overlay yok).
  const extraOverlay = typeof activeSlideItem?.overlayOpacity === "number" ? activeSlideItem.overlayOpacity / 100 : 0

  if (normalizedSlides.length === 0) {
    return null
  }

  const isExternal = (url: string) => /^https?:\/\//i.test(url) && !url.includes("adenbungalov.com")

  return (
    <section
      className="relative isolate w-full overflow-hidden aspect-[9/16] max-h-[100svh] sm:aspect-[16/9] sm:max-h-none lg:aspect-auto lg:h-[min(100svh,56.25vw)]"
      onMouseEnter={pauseOnHover ? () => setIsPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setIsPaused(false) : undefined}
    >
      <div className="absolute inset-0" data-hero-image>
        {normalizedSlides.map((slide, index) =>
          slide.mediaType === "VIDEO" ? (
            <video
              key={`${slide.videoUrl}-${index}`}
              src={slide.videoUrl}
              poster={slide.imageUrl || undefined}
              autoPlay
              loop
              muted
              playsInline
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity duration-700",
                index === activeSlideIndex ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            <Image
              key={`${slide.imageUrl}-${index}`}
              src={slide.imageUrl}
              alt={`${companyName} ${slide.title?.trim() || `hero ${index + 1}`}`}
              fill
              className={cn(
                "object-cover transition-opacity duration-700",
                index === activeSlideIndex ? "opacity-100" : "opacity-0"
              )}
              priority={index === 0}
              sizes="100vw"
            />
          )
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#040a12]/88 via-[#040a12]/45 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,255,255,0.16),transparent_54%)]" />
        {extraOverlay > 0 ? (
          <div className="absolute inset-0 bg-black transition-opacity duration-700" style={{ opacity: extraOverlay }} />
        ) : null}
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col justify-end pl-[max(var(--site-gutter-x),env(safe-area-inset-left,0px))] pr-[max(var(--site-gutter-x),env(safe-area-inset-right,0px))] pb-[calc(var(--site-bottom-chrome)+1.5rem)] pt-32 sm:pt-36 md:pb-32">
        {hasHeroCopy ? (
          <div className="max-w-2xl">
            {heroBadge ? (
              <span
                data-hero-copy
                className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm"
              >
                {heroBadge}
              </span>
            ) : null}
            {heroTitle ? (
              <h1
                data-hero-copy
                className="text-[clamp(1.75rem,4vw+1rem,3.7rem)] font-semibold leading-[1.03] tracking-[-0.025em] text-white"
              >
                {heroTitle}
              </h1>
            ) : null}
            {heroDescription ? (
              <p data-hero-copy className="mt-4 max-w-xl text-base leading-7 text-white/84 md:text-lg md:leading-8">
                {heroDescription}
              </p>
            ) : null}
            {heroTags.length > 0 ? (
              <div className="mt-7 flex flex-wrap gap-2 text-xs font-medium text-white/92">
                {heroTags.map((tag) => (
                  <span
                    key={tag}
                    data-hero-tag
                    className="rounded-full border border-white/35 bg-white/12 px-3 py-1.5 backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {primaryCta || secondaryCta ? (
              <div data-hero-copy className="mt-8 flex flex-wrap items-center gap-3">
                {primaryCta ? (
                  <a
                    href={primaryCta.url}
                    target={isExternal(primaryCta.url) ? "_blank" : undefined}
                    rel={isExternal(primaryCta.url) ? "noopener noreferrer" : undefined}
                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0b1a12] shadow-lg transition-colors hover:bg-white/90"
                  >
                    {primaryCta.text}
                  </a>
                ) : null}
                {secondaryCta ? (
                  <a
                    href={secondaryCta.url}
                    target={isExternal(secondaryCta.url) ? "_blank" : undefined}
                    rel={isExternal(secondaryCta.url) ? "noopener noreferrer" : undefined}
                    className="rounded-full border border-white/45 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    {secondaryCta.text}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={cn("relative z-10 flex items-center gap-1.5", hasHeroCopy ? "mt-10" : "")}>
          {normalizedSlides.slice(0, 6).map((_, index) => (
            <button
              type="button"
              key={index}
              onClick={() => setActiveSlide(index)}
              className="touch-target p-1"
              aria-label={`Görsel ${index + 1}`}
            >
              <span
                className={cn(
                  "block h-2.5 rounded-full transition-all",
                  activeSlideIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
