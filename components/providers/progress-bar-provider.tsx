"use client"

import { AppProgressBar as ProgressBar } from "next-nprogress-bar"

export function ProgressBarProvider() {
  return (
    <ProgressBar
      height="3px"
      color="#1f3a2e"
      options={{ showSpinner: false }}
      shallowRouting
    />
  )
}
