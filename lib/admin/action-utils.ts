import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function getAuditRequestMeta() {
  const requestHeaders = await headers()
  return {
    ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: requestHeaders.get("user-agent"),
  }
}

export function redirectWithMessage(
  path: string,
  kind: "ok" | "error",
  message: string
): never {
  const separator = path.includes("?") ? "&" : "?"
  redirect(`${path}${separator}${kind}=${encodeURIComponent(message)}`)
}

export function readString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

export function readStringList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)
}
