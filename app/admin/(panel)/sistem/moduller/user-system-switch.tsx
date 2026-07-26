"use client"

import { useState, useTransition } from "react"
import { Switch } from "@/components/ui/switch"
import { setUserSystemEnabledAction } from "./actions"

export function UserSystemSwitch({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleCheckedChange(nextEnabled: boolean) {
    setError("")
    startTransition(async () => {
      const result = await setUserSystemEnabledAction(nextEnabled)
      if (result.ok) {
        setEnabled(nextEnabled)
        return
      }
      setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">{enabled ? "Aktif" : "Pasif"}</span>
        <Switch
          id="user-system-enabled"
          checked={enabled}
          disabled={isPending}
          onCheckedChange={handleCheckedChange}
        />
      </div>
      {error ? <p className="max-w-xs text-right text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
