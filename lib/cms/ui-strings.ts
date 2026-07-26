import { readJson } from "@/lib/cms/store"

const UI_STRINGS_FILE = "ui-strings.json"

export async function getUiStrings(): Promise<Record<string, string>> {
  try {
    const raw = await readJson<Record<string, unknown>>(UI_STRINGS_FILE)
    const strings: Record<string, string> = {}
    for (const [key, value] of Object.entries(raw ?? {})) {
      if (typeof value === "string") strings[key] = value
    }
    return strings
  } catch {
    return {}
  }
}

export function t(strings: Record<string, string>, key: string, fallback: string): string {
  const value = strings[key]
  return value !== undefined && value !== "" ? value : fallback
}
