import { describe, expect, it } from "vitest"

import { ensureSoftDeleteFields } from "@/lib/cms/normalize-soft-delete"

describe("ensureSoftDeleteFields", () => {
  it("eski aktif kayıtlara boş silme alanlarını ekler", () => {
    expect(ensureSoftDeleteFields({ id: "slider-1", title: "Hero" })).toEqual({
      id: "slider-1",
      title: "Hero",
      deletedAt: null,
      deletedBy: null,
    })
  })

  it("mevcut silme meta verisini korur", () => {
    expect(
      ensureSoftDeleteFields({
        id: "slider-2",
        deletedAt: "2026-07-25T12:00:00.000Z",
        deletedBy: "admin-1",
      })
    ).toEqual({
      id: "slider-2",
      deletedAt: "2026-07-25T12:00:00.000Z",
      deletedBy: "admin-1",
    })
  })
})
