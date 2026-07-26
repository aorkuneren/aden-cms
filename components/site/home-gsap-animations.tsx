"use client"

import { useLayoutEffect } from "react"
import { gsap } from "gsap"

export function HomeGsapAnimations() {
  useLayoutEffect(() => {
    if (typeof window === "undefined") return

    const root = document.querySelector<HTMLElement>(".home-motion-root")
    if (!root) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.setAttribute("data-hero-animated", "")
      return
    }

    const ctx = gsap.context(() => {
      const heroBlock = root.querySelector<HTMLElement>("[data-gsap-hero]")
      if (!heroBlock) return

      const heroImage = heroBlock.querySelector<HTMLElement>("[data-hero-image]")
      const heroTextTargets = heroBlock.querySelectorAll<HTMLElement>("[data-hero-copy]")
      const heroTagTargets = heroBlock.querySelectorAll<HTMLElement>("[data-hero-tag]")

      if (heroImage) {
        gsap.fromTo(
          heroImage,
          { scale: 1.08 },
          { scale: 1, duration: 1.6, ease: "power3.out", clearProps: "transform" }
        )
      }

      if (heroTextTargets.length > 0) {
        gsap.fromTo(
          heroTextTargets,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "opacity,visibility,transform",
          }
        )
      }

      if (heroTagTargets.length > 0) {
        gsap.fromTo(
          heroTagTargets,
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.04,
            ease: "power2.out",
            delay: 0.2,
            clearProps: "opacity,visibility,transform",
          }
        )
      }
    }, root)

    // CSS ön-gizlemeyi kaldır; bu noktada GSAP inline stilleri kontrol ediyor (paint öncesi).
    root.setAttribute("data-hero-animated", "")

    return () => {
      ctx.revert()
      root.removeAttribute("data-hero-animated")
    }
  }, [])

  return null
}
