import { describe, expect, it } from "vitest"
import { toSeoSlug, uniqueCategoryId } from "../slug"

describe("toSeoSlug", () => {
  it("başlığı slug yapar", () => {
    expect(toSeoSlug("Aden Aile Suit")).toBe("aden-aile-suit")
  })

  it("Türkçe karakterleri transliterate eder", () => {
    expect(toSeoSlug("Bungalovlar")).toBe("bungalovlar")
    expect(toSeoSlug("Şömine & Göl")).toBe("somine-gol")
  })

  it("Odalar/Suit → odalar-suit", () => {
    expect(toSeoSlug("Odalar/Suit")).toBe("odalar-suit")
  })

  it("boş girişte fallback döner", () => {
    expect(toSeoSlug("   ", "genel")).toBe("genel")
  })

  it("maxLen uygular", () => {
    expect(toSeoSlug("a".repeat(100), "x", 40).length).toBeLessThanOrEqual(40)
  })
})

describe("uniqueCategoryId", () => {
  it("name'den slug üretir", () => {
    expect(uniqueCategoryId("Bungalovlar", [])).toBe("bungalovlar")
  })

  it("çakışmada -2, -3 ekler", () => {
    expect(uniqueCategoryId("Odalar/Suit", ["odalar-suit"])).toBe("odalar-suit-2")
    expect(uniqueCategoryId("Odalar/Suit", ["odalar-suit", "odalar-suit-2"])).toBe("odalar-suit-3")
  })
})
