"use client"

import * as React from "react"

export interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

export function Switch({
  checked: controlledChecked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className = "",
  id,
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked

  const toggle = () => {
    if (disabled) return
    const next = !isChecked
    if (controlledChecked === undefined) {
      setInternalChecked(next)
    }
    onCheckedChange?.(next)
  }

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={isChecked}
      disabled={disabled}
      onClick={toggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        isChecked ? "bg-[#18261e]" : "bg-neutral-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          isChecked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  )
}
