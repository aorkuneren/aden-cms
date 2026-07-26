import { beforeEach, describe, expect, it, vi } from "vitest"

const mutateCms = vi.fn()
const requireCms = vi.fn()

vi.mock("@/lib/cms/mutate-cms", () => ({ mutateCms }))
vi.mock("@/lib/admin/permissions", () => ({ requireCms }))

const deleteUploadByUrl = vi.fn().mockResolvedValue({ deleted: true })
const collectMediaUrls = vi.fn().mockReturnValue(["/uploads/galeri/x.jpg"])
const isUploadUrlReferencedElsewhere = vi.fn().mockResolvedValue(false)

vi.mock("@/lib/media/delete", () => ({
  deleteUploadByUrl,
  collectMediaUrls,
  isUploadUrlReferencedElsewhere,
}))

const { purgeTrashItemAction, restoreTrashItemAction } = await import("../actions")

describe("geri dönüşüm aksiyonları", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutateCms.mockResolvedValue({ ok: true, data: {}, admin: {} })
    isUploadUrlReferencedElsewhere.mockResolvedValue(false)
    collectMediaUrls.mockReturnValue(["/uploads/galeri/x.jpg"])
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

  it("SUPERADMIN için soft-delete edilmiş kaydı fiziksel olarak kaldırır", async () => {
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
    expect(
      options.updater([
        { id: "bungalow-1", deletedAt: "2026-07-27" },
        { id: "bungalow-2" },
      ])
    ).toEqual([{ id: "bungalow-2" }])
  })

  it("aktif (soft-delete edilmemiş) kaydı purge etmez ve dosya silmez", async () => {
    requireCms.mockResolvedValue({
      ok: true,
      admin: { id: "superadmin-1", role: "SUPERADMIN", isActive: true },
    })

    mutateCms.mockImplementation(async (options: any) => {
      const current = {
        galleryManagement: {
          items: [{ id: "gal-1", imageUrl: "/uploads/galeri/x.jpg", deletedAt: null }],
        },
      }
      options.updater(current)
      return { ok: true, data: {}, admin: {} }
    })

    const result = await purgeTrashItemAction("cms_gallery", "gal-1")
    expect(result).toEqual({
      ok: false,
      error: "Yalnızca geri dönüşümdeki kayıtlar kalıcı silinebilir.",
    })
    expect(deleteUploadByUrl).not.toHaveBeenCalled()
  })

  it("SUPERADMIN purge sonrası yerel medya URL’lerini siler", async () => {
    requireCms.mockResolvedValue({
      ok: true,
      admin: { id: "superadmin-1", role: "SUPERADMIN", isActive: true },
    })

    const target = { id: "gal-1", imageUrl: "/uploads/galeri/x.jpg", deletedAt: "2026-07-27" }
    mutateCms.mockImplementation(async (options: any) => {
      const current = { galleryManagement: { items: [target] } }
      options.updater(current)
      return { ok: true, data: {}, admin: {} }
    })

    const result = await purgeTrashItemAction("cms_gallery", "gal-1")
    expect(result).toEqual({ ok: true })
    expect(collectMediaUrls).toHaveBeenCalledWith("cms_gallery", expect.objectContaining({ id: "gal-1" }))
    expect(isUploadUrlReferencedElsewhere).toHaveBeenCalledWith("/uploads/galeri/x.jpg", {
      excludeEntityType: "cms_gallery",
      excludeId: "gal-1",
    })
    expect(deleteUploadByUrl).toHaveBeenCalledWith("/uploads/galeri/x.jpg")
  })

  it("paylaşılan medya URL’sini diskten silmez", async () => {
    requireCms.mockResolvedValue({
      ok: true,
      admin: { id: "superadmin-1", role: "SUPERADMIN", isActive: true },
    })
    isUploadUrlReferencedElsewhere.mockResolvedValue(true)

    mutateCms.mockImplementation(async (options: any) => {
      options.updater({
        galleryManagement: {
          items: [{ id: "gal-copy", imageUrl: "/uploads/galeri/x.jpg", deletedAt: "2026-07-27" }],
        },
      })
      return { ok: true, data: {}, admin: {} }
    })

    const result = await purgeTrashItemAction("cms_gallery", "gal-copy")
    expect(result).toEqual({ ok: true })
    expect(deleteUploadByUrl).not.toHaveBeenCalled()
  })
})
