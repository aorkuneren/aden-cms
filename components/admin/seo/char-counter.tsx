"use client"

import { unicodeLength } from "@/lib/seo/path"

type Props = {
  value: string
  softMax: number
  ideal: [number, number]
}

export function CharCounter({ value, softMax, ideal }: Props) {
  const len = unicodeLength(value)
  const [idealMin, idealMax] = ideal

  let colorClass = "text-emerald-600 dark:text-emerald-400"
  if (len > softMax) {
    colorClass = "text-red-500 dark:text-red-400"
  } else if (len < idealMin) {
    colorClass = "text-amber-500 dark:text-amber-400"
  } else if (len <= idealMax) {
    colorClass = "text-emerald-600 dark:text-emerald-400"
  } else {
    colorClass = "text-amber-500 dark:text-amber-400"
  }

  return (
    <span className={`text-[10px] tabular-nums ${colorClass}`}>
      {len} / {softMax}
    </span>
  )
}
