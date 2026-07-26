import { describe, expect, it } from "vitest"
import uiStrings from "@/data/ui-strings.json"
import { t } from "@/lib/cms/ui-strings"

describe("ui strings", () => {
  it("uses configured values and falls back for empty values", () => {
    expect(t({ "header.login": "Oturum aç" }, "header.login", "Giriş Yap")).toBe("Oturum aç")
    expect(t({ "header.login": "" }, "header.login", "Giriş Yap")).toBe("Giriş Yap")
  })

  it("includes all Task 20 seed keys", () => {
    const keys = [
      "notFound.title",
      "notFound.description",
      "notFound.ctaHome",
      "notFound.ctaBungalows",
      "maintenance.title",
      "maintenance.description",
      "gallery.filterAll",
      "gallery.zoom",
      "gallery.empty",
      "gallery.viewGrid",
      "gallery.viewList",
      "footer.cookiePreferences",
      "header.login",
      "header.register",
      "listing.filterAll",
      "listing.emptyFallback",
    ]

    expect(uiStrings).toEqual(expect.objectContaining(Object.fromEntries(keys.map((key) => [key, expect.any(String)]))))
  })
})
