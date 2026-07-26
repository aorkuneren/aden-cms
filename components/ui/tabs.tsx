"use client"

import * as React from "react"

type TabsContextType = {
  activeTab: string
  setActiveTab: (val: string) => void
}

const TabsContext = React.createContext<TabsContextType | null>(null)

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className = "",
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  const [tab, setTab] = React.useState(defaultValue || "")
  const activeTab = value !== undefined ? value : tab

  const setActiveTab = (val: string) => {
    if (value === undefined) {
      setTab(val)
    }
    onValueChange?.(val)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex items-center gap-1 ${className}`}>{children}</div>
}

export function TabsTrigger({
  value,
  children,
  className = "",
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) return null
  const isActive = ctx.activeTab === value

  return (
    <button
      type="button"
      onClick={() => ctx.setActiveTab(value)}
      className={`px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
        isActive ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-600 hover:text-neutral-900"
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className = "",
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(TabsContext)
  if (!ctx || ctx.activeTab !== value) return null

  return <div className={className}>{children}</div>
}
