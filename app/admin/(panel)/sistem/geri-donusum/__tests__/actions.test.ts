import { beforeEach, describe, expect, it, vi } from "vitest"

const mutateCms = vi.fn()
const requireCms = vi.fn()

vi.mock("@/lib/cms/mutate-cms", () => ({ mutateCms }))
vi.mock("@/lib/admin/permissions", () => ({ requireCms }))

const { purgeTrashItemAction, restoreTrashItemAction } = await import("../actions")

describe("geri dönüşüm aksiyonları", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutateCms.mockResolvedValue({ ok: true, data: {}, admin: {} })
  })

  it("silinen slider kaydını update yetkisiyle geri yükler", async () => {
    const result = await restoreTrashItemAction("cms_slider", "slide-1")

    expect(result).toEqual({ ok: true })
    expect(mutateCms).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        file: "cms-config.json",
        entityType: "cms_slider",
        entityId: "slide-1",
      })
    )

    const options = mutateCms.mock.calls[0]?.[0]
    expect(options.updater({ sliderManagement: [{ id: "slide-1", deletedAt: "2026-07-25", deletedBy: "admin-1" }] })).toEqual({
      sliderManagement: [{ id: "slide-1", deletedAt: null, deletedBy: null }],
    })
  })

  it("SUPERADMIN olmayan kullanıcıların kalıcı silmesini engeller", async () => {
    requireCms.mockResolvedValue({
      ok: true,
      admin: { id: "admin-1", role: "ADMIN", isActive: true },
    })

    await expect(purgeTrashItemAction("bungalow", "bungalow-1")).resolves.toEqual({
      ok: false,
      error: "Kalıcı silme işlemi yalnızca süper yönetici tarafından yapılabilir.",
    })
    expect(mutateCms).not.toHaveBeenCalled()
  })

  it("SUPERADMIN için kaydı delete yetkisiyle fiziksel olarak kaldırır", async () => {
    requireCms.mockResolvedValue({
      ok: true,
      admin: { id: "superadmin-1", role: "SUPERADMIN", isActive: true },
    })

    const result = await purgeTrashItemAction("bungalow", "bungalow-1")

    expect(result).toEqual({ ok: true })
    expect(mutateCms).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "delete",
        file: "bungalovs.json",
        entityType: "bungalow",
        entityId: "bungalow-1",
      })
    )

    const options = mutateCms.mock.calls[0]?.[0]
    expect(options.updater([{ id: "bungalow-1" }, { id: "bungalow-2" }])).toEqual([{ id: "bungalow-2" }])
  })
})
