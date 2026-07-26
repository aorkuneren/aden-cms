"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BungalowCard } from "@/components/site/bungalow-card"
import type { SiteBungalov } from "@/lib/site/b2c"

type LoadMode = "load-more" | "pagination" | "infinite"

type BungalovListingGridProps = {
  bungalovs: SiteBungalov[]
  availabilityByBungalov?: Record<string, boolean>
  checkIn?: string
  checkOut?: string
  whatsappHref?: string
  limit: number
  loadMode: LoadMode
  currentPage: number
}

export function BungalovListingGrid({
  bungalovs,
  availabilityByBungalov,
  checkIn,
  checkOut,
  whatsappHref,
  limit,
  loadMode,
  currentPage,
}: BungalovListingGridProps) {
  const searchParams = useSearchParams()
  const [visibleCount, setVisibleCount] = useState(limit)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const totalPages = Math.max(1, Math.ceil(bungalovs.length / limit))
  const page = Math.min(Math.max(currentPage, 1), totalPages)
  const start = (page - 1) * limit
  const visibleBungalovs =
    loadMode === "pagination" ? bungalovs.slice(start, start + limit) : bungalovs.slice(0, visibleCount)
  const hasMore = visibleCount < bungalovs.length
  const getPageHref = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextPage <= 1) {
      params.delete("page")
    } else {
      params.set("page", String(nextPage))
    }
    const query = params.toString()
    return query ? `/bungalovlarimiz?${query}` : "/bungalovlarimiz"
  }

  useEffect(() => {
    setVisibleCount(limit)
  }, [bungalovs, limit, loadMode])

  useEffect(() => {
    if (loadMode !== "infinite" || !hasMore || !loadMoreRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + limit, bungalovs.length))
        }
      },
      { rootMargin: "240px" }
    )
    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [bungalovs.length, hasMore, limit, loadMode])

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleBungalovs.map((bungalov) => (
          <BungalowCard
            key={bungalov.id}
            bungalow={bungalov}
            availability={availabilityByBungalov?.[bungalov.id]}
            checkIn={checkIn}
            checkOut={checkOut}
            whatsappHref={whatsappHref}
          />
        ))}
      </div>

      {loadMode === "load-more" && hasMore ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + limit, bungalovs.length))}
            className="rounded-xl bg-[#18261e] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2a3b30]"
          >
            Daha fazla yükle
          </button>
        </div>
      ) : null}

      {loadMode === "infinite" && hasMore ? (
        <div ref={loadMoreRef} className="mt-8 h-8" aria-label="Daha fazla bungalov yükleniyor" />
      ) : null}

      {loadMode === "pagination" && totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          {page > 1 ? <Link href={getPageHref(page - 1)}>Önceki</Link> : <span className="text-[#999]">Önceki</span>}
          <span className="text-sm text-[#5f5f66]">
            {page} / {totalPages}
          </span>
          {page < totalPages ? <Link href={getPageHref(page + 1)}>Sonraki</Link> : <span className="text-[#999]">Sonraki</span>}
        </div>
      ) : null}
    </>
  )
}
