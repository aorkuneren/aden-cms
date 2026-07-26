const MAX_SCHEMA_CHARS = 50_000

export type SchemaValidateResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string }

export function validateSchemaJson(input: unknown): SchemaValidateResult {
  if (input == null) {
    return { ok: true, value: {} }
  }

  let value: unknown = input
  if (typeof input === "string") {
    const trimmed = input.trim()
    if (!trimmed) return { ok: true, value: {} }
    if (/<\/script/i.test(trimmed) || /<script/i.test(trimmed)) {
      return { ok: false, error: "Schema JSON içinde script ifadesi bulunamaz." }
    }
    try {
      value = JSON.parse(trimmed)
    } catch {
      return { ok: false, error: "Schema JSON geçerli bir JSON değil." }
    }
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "Schema JSON bir nesne olmalıdır." }
  }

  const obj = value as Record<string, unknown>
  const serialized = JSON.stringify(obj)
  if (serialized.length > MAX_SCHEMA_CHARS) {
    return { ok: false, error: `Schema JSON çok büyük (en fazla ${MAX_SCHEMA_CHARS} karakter).` }
  }
  if (/<\/script/i.test(serialized)) {
    return { ok: false, error: "Schema JSON güvenlik kontrolünden geçemedi." }
  }

  const hasGraph = Array.isArray(obj["@graph"])
  if (!hasGraph) {
    if (!obj["@context"]) {
      return { ok: false, error: "Schema JSON içinde @context zorunludur." }
    }
    if (!obj["@type"]) {
      return { ok: false, error: "Schema JSON içinde @type zorunludur." }
    }
  }

  return { ok: true, value: obj }
}

/** JSON-LD script içeriği için güvenli serialize */
export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
