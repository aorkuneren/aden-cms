"use client"

import Link from "next/link"
import { startTransition, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { SectionEyebrow } from "@/components/site/section-eyebrow"
import { SiteSection } from "@/components/site/site-section"
import { cn } from "@/lib/utils"

type GalleryCategory = {
  id: string
  label: string
  images: string[]
}

type GallerySectionProps = {
  eyebrow?: string
  title?: string
  description?: string
  categories: GalleryCategory[]
  maxImagesPerCategory?: number | null
  showViewAllButton?: boolean
  viewAllHref?: string
  viewAllLabel?: string
}

// Mozaik düzeni: 6 sütunluk masaüstü ızgarada tekrar eden desen.
// Sol küçük → orta büyük (2 satır) → sağ küçük; ikinci satır sol/sağ küçük.
// Beş görselde vitrin kahraman görünümünü üretir, fazlası düzgün sarar.
const MOSAIC_SPANS = [
  "col-span-1 md:col-span-2 md:row-span-1",
  "col-span-2 md:col-span-2 md:row-span-2",
  "col-span-1 md:col-span-2 md:row-span-1",
  "col-span-1 md:col-span-2 md:row-span-1",
  "col-span-1 md:col-span-2 md:row-span-1",
] as const

function normalizeGalleryCategories(categories: GalleryCategory[], maxImagesPerCategory: number | null) {
  const seen = new Set<string>()
  const normalizedLimit =
    typeof maxImagesPerCategory === "number" && Number.isFinite(maxImagesPerCategory)
      ? Math.max(1, Math.trunc(maxImagesPerCategory))
      : null

  return categories
    .map((category) => {
      const images = (category.images || [])
        .map((image) => String(image || "").trim())
        .filter((image) => image.length > 0)
      return {
        id: String(category.id || "").trim(),
        label: String(category.label || "").trim(),
        images: normalizedLimit ? images.slice(0, normalizedLimit) : images,
      }
    })
    .filter((category) => {
      if (!category.id || !category.label) return false
      if (seen.has(category.id)) return false
      seen.add(category.id)
      return category.images.length > 0
    })
}

export function GallerySection({
  eyebrow = "Galeri",
  title = "Foto Galeri",
  description = "Sapanca atmosferini yansıtan bungalov iç ve dış mekan kareleri.",
  categories,
  maxImagesPerCategory = 5,
  showViewAllButton = true,
  viewAllHref = "/galeri",
  viewAllLabel = "Tümünü Görüntüle",
}: GallerySectionProps) {
  const normalizedCategories = useMemo(
    () => normalizeGalleryCategories(categories || [], maxImagesPerCategory),
    [categories, maxImagesPerCategory]
  )
  const [activeTab, setActiveTab] = useState("")
  const activeCategoryId = normalizedCategories.some((category) => category.id === activeTab)
    ? activeTab
    : (normalizedCategories[0]?.id || "")

  const activeCategory =
    normalizedCategories.find((category) => category.id === activeCategoryId) ||
    normalizedCategories[0] ||
    null
  const visibleImages = activeCategory?.images || []

  return (
    <SiteSection id="galeri" className="py-12 sm:py-16">
      <div className="relative overflow-hidden py-7 sm:py-8 lg:py-10">
        <div className="relative grid gap-7 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <SectionEyebrow label={eyebrow} />
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#171717] md:text-4xl lg:text-5xl">
              {title}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="max-w-xl text-sm leading-7 text-[#616168] md:text-base lg:ml-auto">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 border-b border-[#e8e4dc] pb-6">
          {normalizedCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                startTransition(() => {
                  setActiveTab(category.id)
                })
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                activeCategoryId === category.id
                  ? "bg-[#1f3a2e] text-white shadow-md shadow-[#1f3a2e]/20"
                  : "bg-white text-[#4f4f57] border border-[#d8cbb8] hover:bg-[#f8f5ef] hover:text-[#202025]"
              )}
              aria-pressed={activeCategoryId === category.id}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="mt-7 grid auto-rows-[150px] grid-cols-2 gap-3 [grid-auto-flow:dense] sm:auto-rows-[170px] sm:gap-4 md:auto-rows-[190px] md:grid-cols-6 lg:auto-rows-[210px]">
          {visibleImages.map((image, index) => (
            <figure
              key={`${image}-${index}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-[#1f3a2e]/10",
                MOSAIC_SPANS[index % MOSAIC_SPANS.length]
              )}
            >
              <Image
                src={image}
                alt={`${activeCategory?.label} galeri görseli ${index + 1}`}
                fill
                sizes="(max-width: 767px) 50vw, (max-width: 1023px) 34vw, 25vw"
                className="max-w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1f3a2e]/60 via-[#1f3a2e]/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <figcaption className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-md">
                  {activeCategory?.label}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {showViewAllButton ? (
          <div className="mt-10 flex justify-center">
            <Button asChild className="rounded-full bg-[#1f3a2e] px-6 py-5 text-[15px] text-white shadow-lg shadow-[#1f3a2e]/20 transition-all hover:-translate-y-0.5 hover:bg-[#1a3127]">
              <Link href={viewAllHref}>{viewAllLabel}</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </SiteSection>
  )
}
