"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { COOKIE_CONSENT_CONFIG } from "@/lib/site/site-config"

export type CookieConsentPreferences = {
  essential: true
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

type StoredCookieConsent = {
  version: number
  savedAt: string
  expiresAt: string
  preferences: CookieConsentPreferences
}

type CookieConsentContextValue = {
  preferences: CookieConsentPreferences
  hasDecision: boolean
  isReady: boolean
  preferencesOpen: boolean
  acceptAll: () => void
  rejectNonEssential: () => void
  savePreferences: (preferences: Omit<CookieConsentPreferences, "essential">) => void
  openPreferences: () => void
  closePreferences: () => void
  isAllowed: (category: keyof CookieConsentPreferences) => boolean
}

const DEFAULT_PREFERENCES: CookieConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  preferences: false,
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

function isStoredConsent(value: unknown): value is StoredCookieConsent {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<StoredCookieConsent>
  const preferences = record.preferences as Partial<CookieConsentPreferences> | undefined

  return Boolean(
    record.version === COOKIE_CONSENT_CONFIG.version &&
      typeof record.expiresAt === "string" &&
      preferences &&
      typeof preferences.analytics === "boolean" &&
      typeof preferences.marketing === "boolean" &&
      typeof preferences.preferences === "boolean"
  )
}

function readStoredConsent() {
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_CONFIG.storageKey)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isStoredConsent(parsed) || Date.parse(parsed.expiresAt) <= Date.now()) {
      window.localStorage.removeItem(COOKIE_CONSENT_CONFIG.storageKey)
      return null
    }
    return parsed
  } catch {
    window.localStorage.removeItem(COOKIE_CONSENT_CONFIG.storageKey)
    return null
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(DEFAULT_PREFERENCES)
  const [hasDecision, setHasDecision] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStoredConsent()
      if (stored) {
        setPreferences({ ...stored.preferences, essential: true })
        setHasDecision(true)
      }
      setIsReady(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const persist = useCallback((next: CookieConsentPreferences) => {
    const savedAt = new Date()
    const expiresAt = new Date(savedAt)
    expiresAt.setDate(expiresAt.getDate() + COOKIE_CONSENT_CONFIG.retentionDays)

    const payload: StoredCookieConsent = {
      version: COOKIE_CONSENT_CONFIG.version,
      savedAt: savedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      preferences: next,
    }

    window.localStorage.setItem(COOKIE_CONSENT_CONFIG.storageKey, JSON.stringify(payload))
    setPreferences(next)
    setHasDecision(true)
    setPreferencesOpen(false)
  }, [])

  const acceptAll = useCallback(() => {
    persist({ essential: true, analytics: true, marketing: true, preferences: true })
  }, [persist])

  const rejectNonEssential = useCallback(() => {
    persist(DEFAULT_PREFERENCES)
  }, [persist])

  const savePreferences = useCallback(
    (next: Omit<CookieConsentPreferences, "essential">) => {
      persist({ essential: true, ...next })
    },
    [persist]
  )

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      preferences,
      hasDecision,
      isReady,
      preferencesOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openPreferences: () => setPreferencesOpen(true),
      closePreferences: () => setPreferencesOpen(false),
      isAllowed: (category) => category === "essential" || preferences[category],
    }),
    [acceptAll, hasDecision, isReady, preferences, preferencesOpen, rejectNonEssential, savePreferences]
  )

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider")
  }
  return context
}
