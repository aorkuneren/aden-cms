"use client"

import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

type ScoreItem = {
  id: string
  label: string
  passed: boolean
  weight: number
}

type Props = {
  score: number
  items: ScoreItem[]
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 50) return "text-amber-500 dark:text-amber-400"
  return "text-red-500 dark:text-red-400"
}

function scoreRingColor(score: number): string {
  if (score >= 80) return "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
  if (score >= 50) return "border-amber-500 bg-amber-50 dark:bg-amber-950/40"
  return "border-red-500 bg-red-50 dark:bg-red-950/40"
}

function scoreLabel(score: number): string {
  if (score >= 80) return "İyi"
  if (score >= 50) return "Orta"
  return "Zayıf"
}

export function SeoScorePanel({ score, items }: Props) {
  const passedCount = items.filter((i) => i.passed).length

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-16 shrink-0 flex-col items-center justify-center rounded-full border-2",
            scoreRingColor(score)
          )}
        >
          <span className={cn("text-xl font-bold tabular-nums", scoreColor(score))}>{score}</span>
          <span className={cn("text-[9px] font-medium", scoreColor(score))}>{scoreLabel(score)}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">SEO Skoru</p>
          <p className="text-xs text-slate-500">
            {passedCount} / {items.length} kriter karşılandı
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-xs">
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                item.passed
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-400"
              )}
            >
              {item.passed ? <Check className="size-2.5" /> : <X className="size-2.5" />}
            </span>
            <span className={item.passed ? "text-slate-700 dark:text-slate-300" : "text-slate-500"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
