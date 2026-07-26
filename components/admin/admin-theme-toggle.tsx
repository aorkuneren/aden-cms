"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

const STORAGE_KEY = "aden-admin-theme"

export function AdminThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light")
    } catch {
      /* yok say */
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Tema değiştir" className="rounded-full">
      {mounted && dark ? <Sun /> : <Moon />}
    </Button>
  )
}
