/** Path / slug yardımcileri — locale-aware, Türkçe uyumlu */

export function unicodeLength(input: string): number {
  return Array.from(String(input ?? "")).length
}

export function normalizePath(input: string): string {
  let raw = String(input ?? "").trim()
  if (!raw) return "/"

  try {
    if (/^https?:\/\//i.test(raw)) {
      raw = new URL(raw).pathname
    }
  } catch {
    /* ignore invalid URL — treat as path */
  }

  raw = raw.split("?")[0]?.split("#")[0] ?? raw
  raw = raw.replace(/\/+/g, "/")
  if (!raw.startsWith("/")) raw = `/${raw}`
  raw = raw.toLocaleLowerCase("tr-TR")
  if (raw.length > 1) raw = raw.replace(/\/+$/, "")
  return raw || "/"
}

const TR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
}

export function slugifyTr(input: string): string {
  const mapped = Array.from(String(input ?? ""))
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("")

  return mapped
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

export function normalizeMetaTitleKey(title: string): string {
  return String(title ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("tr-TR")
}

export function normalizeSlugKey(slug: string): string {
  return slugifyTr(slug)
}

export function bungalowPathFromSlug(slug: string): string {
  const s = normalizeSlugKey(slug)
  return s ? `/bungalovlarimiz/${s}` : "/bungalovlarimiz"
}

export function isSystemPath(path: string): boolean {
  const p = normalizePath(path)
  return (
    p === "/admin" ||
    p.startsWith("/admin/") ||
    p === "/api" ||
    p.startsWith("/api/") ||
    p === "/uploads" ||
    p.startsWith("/uploads/")
  )
}

export function stripHtml(html: string): string {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Kelime sınırında keser; veri kaybı için kayıtta kullanılmaz — yalnızca öneri üretir. */
export function suggestTruncated(value: string, max: number): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim()
  if (unicodeLength(text) <= max) return text
  const chars = Array.from(text)
  const sliced = chars.slice(0, Math.max(0, max - 1)).join("")
  const lastSpace = sliced.lastIndexOf(" ")
  const base =
    lastSpace > Math.floor(max * 0.6) ? sliced.slice(0, lastSpace) : sliced
  return `${base.trimEnd()}…`
}
