"use client"

import { useEffect, useState } from "react"
import { Download, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const STORAGE_KEY = "aden_pwa_prompt_dismissed"

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY) === "1"
    if (dismissed) return

    const handler = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === "accepted") {
      setVisible(false)
      setDeferredPrompt(null)
      return
    }
    localStorage.setItem(STORAGE_KEY, "1")
    setVisible(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1")
    setVisible(false)
  }

  if (!visible || !deferredPrompt) return null

  return (
    <div className="fixed bottom-20 right-3 z-50 w-[min(340px,calc(100%-1.5rem))] md:bottom-6">
      <Card className="rounded-2xl border-[#d9d0be] bg-white shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#edf4ed] text-[#2f5530]">
              <Smartphone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1a1a1a]">Uygulama Olarak Kurun</p>
              <p className="mt-1 text-xs leading-5 text-[#5f5f66]">
                Aden Bungalov&apos;u ana ekranınıza ekleyip daha hızlı erişim sağlayabilirsiniz.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="rounded-full btn-dark" onClick={() => void handleInstall()}>
                  <Download className="h-4 w-4" />
                  Kur
                </Button>
                <Button size="sm" variant="outline" className="rounded-full border-[#d8cfbf]" onClick={handleDismiss}>
                  Kapat
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

