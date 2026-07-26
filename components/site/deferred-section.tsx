"use client"

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"

type DeferredSectionProps = {
  children: ReactNode
  className?: string
  placeholderClassName?: string
  rootMargin?: string
}

const DEFAULT_ROOT_MARGIN = "280px 0px"

export function DeferredSection({
  children,
  className,
  placeholderClassName,
  rootMargin = DEFAULT_ROOT_MARGIN,
}: DeferredSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isVisible) return

    const node = containerRef.current
    if (!node) return

    if (typeof IntersectionObserver === "undefined") {
      const rafId = window.requestAnimationFrame(() => setIsVisible(true))
      return () => window.cancelAnimationFrame(rafId)
    }

    let isMounted = true
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting || !isMounted) return

        setIsVisible(true)
        observer.disconnect()
      },
      {
        root: null,
        rootMargin,
        threshold: 0.01,
      }
    )

    observer.observe(node)

    return () => {
      isMounted = false
      observer.disconnect()
    }
  }, [isVisible, rootMargin])

  // Paint öncesi çalışır; içerik önce görünüp sonra yeniden animasyonlanmaz.
  useLayoutEffect(() => {
    if (!isVisible) return
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const node = containerRef.current
    if (!node) return

    const animation = gsap.fromTo(
      node,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.72, ease: "power2.out", clearProps: "opacity,visibility,transform" }
    )

    return () => {
      animation.kill()
    }
  }, [isVisible])

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? (
        children
      ) : (
        <div
          className={cn(
            "min-h-[320px] w-full rounded-[28px] border border-[#e8dfcf] bg-[#f8f4ec] animate-pulse",
            placeholderClassName
          )}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
