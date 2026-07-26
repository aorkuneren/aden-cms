import { describe, expect, it } from "vitest"
import { getPageDefByEntityId, getPageDefByPath, PAGE_ENTITY_IDS } from "@/lib/seo/page-ids"

describe("page-ids", () => {
  it("entityId ile bulur", () => {
    expect(getPageDefByEntityId("seo-galeri")?.path).toBe("/galeri")
  })
  it("path ile bulur", () => {
    expect(getPageDefByPath("/Galeri/")?.entityId).toBe("seo-galeri")
  })
  it("home entityId sabittir", () => {
    expect(PAGE_ENTITY_IDS.home.entityId).toBe("seo-home")
  })
})
