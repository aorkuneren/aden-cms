import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price without decimal places (e.g., 20.000 instead of 20.000,00)
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// Format number with thousand separator for input fields
export function formatNumberWithSeparator(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return ""
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

// Parse formatted number string to number
export function parseFormattedNumber(value: string): number | null {
  if (!value || value.trim() === "") return null
  // Remove all non-digit characters except comma and period
  let cleaned = value.replace(/[^\d,.]/g, "")
  // In Turkish format: period (.) is thousand separator, comma (,) is decimal separator
  // Remove all periods (thousand separators)
  cleaned = cleaned.replace(/\./g, "")
  // Replace comma with period for decimal separator
  cleaned = cleaned.replace(",", ".")
  if (cleaned === "" || cleaned === ".") return null
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}
