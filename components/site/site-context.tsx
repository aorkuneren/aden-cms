"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useCookieConsent } from "@/components/site/cookie-consent-context"

interface SiteContextType {
  currency: string
  setCurrency: (c: string) => void
  language: string
  setLanguage: (l: string) => void
  activeCurrencies: { code: string; symbol: string }[]
  activeLanguages: { code: string; name: string }[]
  rates: Record<string, number>
  convertPrice: (priceInTry: number) => number
  formatConvertedPrice: (priceInTry: number) => string
}

const SiteContext = createContext<SiteContextType | undefined>(undefined)

export function SiteProvider({ 
  children,
  activeCurrencies = [{ code: "TRY", symbol: "₺" }],
  activeLanguages = [{ code: "TR", name: "Türkçe" }]
}: { 
  children: React.ReactNode
  activeCurrencies?: { code: string; symbol: string }[]
  activeLanguages?: { code: string; name: string }[]
}) {
  const { isReady: consentReady, isAllowed } = useCookieConsent()
  const preferencesAllowed = isAllowed("preferences")
  const [currency, setCurrencyState] = useState<string>(activeCurrencies[0]?.code || "TRY")
  const [language, setLanguageState] = useState<string>(activeLanguages[0]?.code || "TR")
  const [rates, setRates] = useState<Record<string, number>>({ TRY: 1, USD: 35, EUR: 38, GBP: 45 })

  useEffect(() => {
    // Kurları çek
    fetch("/api/currency")
      .then(res => res.json())
      .then(data => {
        if (data && data.TRY) {
          setRates(data)
        }
      })
      .catch(err => console.error("Currency fetch error:", err))
  }, [])

  useEffect(() => {
    if (!consentReady) return
    const timer = window.setTimeout(() => {
      if (!preferencesAllowed) {
        window.localStorage.removeItem("aden-currency")
        window.localStorage.removeItem("aden-language")
        return
      }

      const storedCur = window.localStorage.getItem("aden-currency")
      const storedLang = window.localStorage.getItem("aden-language")
      if (storedCur && activeCurrencies.some((item) => item.code === storedCur)) {
        setCurrencyState(storedCur)
      }
      if (storedLang && activeLanguages.some((item) => item.code === storedLang)) {
        setLanguageState(storedLang)
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [activeCurrencies, activeLanguages, consentReady, preferencesAllowed])

  const setCurrency = (c: string) => {
    setCurrencyState(c)
    if (preferencesAllowed) window.localStorage.setItem("aden-currency", c)
  }

  const setLanguage = (l: string) => {
    setLanguageState(l)
    if (preferencesAllowed) window.localStorage.setItem("aden-language", l)
  }

  const convertPrice = (priceInTry: number) => {
    if (currency === "TRY") return priceInTry
    const rate = rates[currency] || 1
    return priceInTry / rate
  }

  const formatConvertedPrice = (priceInTry: number) => {
    const converted = convertPrice(priceInTry)
    return new Intl.NumberFormat(language === "TR" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0
    }).format(converted)
  }

  return (
    <SiteContext.Provider value={{ 
      currency, setCurrency, 
      language, setLanguage, 
      activeCurrencies, activeLanguages,
      rates, convertPrice, formatConvertedPrice 
    }}>
      {children}
    </SiteContext.Provider>
  )
}

export const useSiteContext = () => {
  const context = useContext(SiteContext)
  if (!context) {
    throw new Error("useSiteContext must be used within a SiteProvider")
  }
  return context
}
