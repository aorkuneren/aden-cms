import { describe, expect, it } from "vitest"
import { flattenRedirects, wouldCreateLoop } from "@/lib/seo/seo-redirect-service"

describe("wouldCreateLoop", () => {
  it("A→A döngüdür", () => {
    expect(wouldCreateLoop("/a", "/a", [])).toBe(true)
  })
  it("A→B, B→A döngüdür", () => {
    expect(wouldCreateLoop("/b", "/a", [{ fromPath: "/a", toPath: "/b" }])).toBe(true)
  })
  it("A→B güvenlidir", () => {
    expect(wouldCreateLoop("/a", "/b", [])).toBe(false)
  })
})

describe("flattenRedirects", () => {
  it("A→B, B→C ⇒ A→C", () => {
    const flat = flattenRedirects([
      { fromPath: "/a", toPath: "/b" },
      { fromPath: "/b", toPath: "/c" },
    ])
    expect(flat.find((r) => r.fromPath === "/a")?.toPath).toBe("/c")
    expect(flat.find((r) => r.fromPath === "/b")?.toPath).toBe("/c")
  })
})
