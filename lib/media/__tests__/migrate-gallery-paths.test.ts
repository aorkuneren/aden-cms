import { describe, expect, it } from "vitest"
import { remapGalleryCategoryIds } from "../migrate-gallery-paths"

describe("remapGalleryCategoryIds", () => {
  it("gallery-category- önekini name slug'a çevirir ve item'ları günceller", () => {
    const { categories, items, idMap } = remapGalleryCategoryIds(
      [
        { id: "gallery-category-bungalovlar", name: "Bungalovlar", isActive: true },
        { id: "gallery-category-odalar-suit", name: "Odalar/Suit", isActive: true },
      ],
      [
        { id: "g1", categoryId: "gallery-category-bungalovlar", imageUrl: "/uploads/x.jpg" },
      ]
    )
    expect(idMap["gallery-category-bungalovlar"]).toBe("bungalovlar")
    expect(idMap["gallery-category-odalar-suit"]).toBe("odalar-suit")
    expect(categories.map((c) => c.id)).toEqual(["bungalovlar", "odalar-suit"])
    expect(items[0].categoryId).toBe("bungalovlar")
  })

  it("zaten slug olan id'ye dokunmaz", () => {
    const { categories, idMap } = remapGalleryCategoryIds(
      [{ id: "bungalovlar", name: "Bungalovlar", isActive: true }],
      []
    )
    expect(categories[0].id).toBe("bungalovlar")
    expect(Object.keys(idMap)).toHaveLength(0)
  })
})
