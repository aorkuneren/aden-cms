import { describe, expect, it } from "vitest"
import {
  filterActive,
  filterDeleted,
  isActiveRecord,
  markDeleted,
  restoreDeleted,
} from "@/lib/cms/soft-delete"

describe("soft-delete", () => {
  it("aktif kaydı tanır", () => {
    expect(isActiveRecord({ id: "1", deletedAt: null })).toBe(true)
    expect(isActiveRecord({ id: "1" })).toBe(true)
    expect(isActiveRecord({ id: "1", deletedAt: "2026-07-25T00:00:00.000Z" })).toBe(false)
  })

  it("markDeleted alanları set eder", () => {
    const next = markDeleted({ id: "a", title: "x" }, "admin-1", "2026-07-25T12:00:00.000Z")
    expect(next).toEqual({
      id: "a",
      title: "x",
      deletedAt: "2026-07-25T12:00:00.000Z",
      deletedBy: "admin-1",
    })
  })

  it("restoreDeleted alanları temizler", () => {
    const next = restoreDeleted({
      id: "a",
      deletedAt: "2026-07-25T12:00:00.000Z",
      deletedBy: "admin-1",
    })
    expect(next.deletedAt).toBeNull()
    expect(next.deletedBy).toBeNull()
  })

  it("filterActive / filterDeleted ayırır", () => {
    const list = [
      { id: "1", deletedAt: null },
      { id: "2", deletedAt: "2026-07-25T00:00:00.000Z" },
    ]
    expect(filterActive(list).map((x) => x.id)).toEqual(["1"])
    expect(filterDeleted(list).map((x) => x.id)).toEqual(["2"])
  })
})
