"use client"

import { useEffect, useState } from "react"
import { AppProgressBar as ProgressBar } from "next-nprogress-bar"

export function ProgressBarProvider() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <ProgressBar
      height="3px"
      color="#1f3a2e"
      options={{ showSpinner: false }}
      shallowRouting
    />
  )
}
