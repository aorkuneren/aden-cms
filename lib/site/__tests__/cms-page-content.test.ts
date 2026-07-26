import { describe, expect, it } from "vitest"
import { getCmsManagedPage } from "@/lib/site/cms-page-content"

describe("ana sayfa CMS bölümleri", () => {
  it("hero bölümünü yönetmez", () => {
    const homePage = getCmsManagedPage("ana-sayfa")

    expect(homePage.sections.some((section) => section.key === "hero")).toBe(false)
  })
})
