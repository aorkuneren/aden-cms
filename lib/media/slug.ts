const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i", İ: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
}

export function toSeoSlug(input: string, fallback = "genel", maxLen = 60): string {
  const mapped = String(input || "")
    .normalize("NFKC")
    .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (ch) => TR_MAP[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "")
  return mapped || fallback
}

export function uniqueCategoryId(name: string, existingIds: Iterable<string>): string {
  const used = new Set(Array.from(existingIds, String))
  const base = toSeoSlug(name, "kategori")
  if (!used.has(base)) return base
  let n = 2
  while (used.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}
