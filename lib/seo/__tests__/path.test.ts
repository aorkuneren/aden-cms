import { describe, expect, it } from "vitest"
import { normalizePath, slugifyTr, unicodeLength } from "@/lib/seo/path"

describe("normalizePath", () => {
  it("domain/query/hash temizler ve lower-case yapar", () => {
    expect(normalizePath("https://example.com/Galeri/?page=2#images")).toBe("/galeri")
  })
  it("kök path'i / olarak korur", () => {
    expect(normalizePath("/")).toBe("/")
    expect(normalizePath("")).toBe("/")
  })
  it("sondaki slash'ı kaldırır", () => {
    expect(normalizePath("/bungalovlarimiz/")).toBe("/bungalovlarimiz")
  })
})

describe("slugifyTr", () => {
  it("Türkçe karakterleri dönüştürür", () => {
    expect(slugifyTr("Şömine Göl Evi")).toBe("somine-gol-evi")
  })
  it("boşlukları tire yapar", () => {
    expect(slugifyTr("  Sapanca  Jakuzi  ")).toBe("sapanca-jakuzi")
  })
})

describe("unicodeLength", () => {
  it("karakterleri doğru sayar", () => {
    expect(unicodeLength("abc")).toBe(3)
    expect(unicodeLength("ğüş")).toBe(3)
  })
})
