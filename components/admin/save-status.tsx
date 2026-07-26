"use client"

import { CheckCircle2, AlertCircle } from "lucide-react"

export type SaveStatus = { type: "ok" | "err"; msg: string } | null

export function SaveStatusBanner({ status }: { status: SaveStatus }) {
  if (!status) return null
  return (
    <div
      role="status"
      className={
        status.type === "ok"
          ? "flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
          : "flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      }
    >
      {status.type === "ok" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
      {status.msg}
    </div>
  )
}
