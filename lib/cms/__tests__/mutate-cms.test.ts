import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AdminSessionUser } from "@/lib/admin/auth"

const mockAdmin: AdminSessionUser = {
  id: "admin-1",
  email: "admin@test.com",
  name: "Test Admin",
  role: "ADMIN",
  isActive: true,
}

const requireCms = vi.fn()
const mutateJson = vi.fn()
const revalidateSite = vi.fn()
const logAuditEvent = vi.fn()

vi.mock("@/lib/admin/permissions", () => ({ requireCms }))
vi.mock("@/lib/cms/store", () => ({ mutateJson, revalidateSite }))
vi.mock("@/lib/audit", () => ({ logAuditEvent }))

const { mutateCms } = await import("@/lib/cms/mutate-cms")

describe("mutateCms", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    logAuditEvent.mockResolvedValue(undefined)
  })

  it("yetki yoksa hata döner, yazma/audit/revalidate çalışmaz", async () => {
    requireCms.mockResolvedValue({ ok: false, error: "Yetki yok" })

    const result = await mutateCms({
      action: "delete",
      file: "items.json",
      entityType: "item",
      auditAction: "item.delete",
      updater: (current) => current,
    })

    expect(result).toEqual({ ok: false, error: "Yetki yok" })
    expect(mutateJson).not.toHaveBeenCalled()
    expect(logAuditEvent).not.toHaveBeenCalled()
    expect(revalidateSite).not.toHaveBeenCalled()
  })

  it("başarılı akış: mutateJson → audit → revalidate", async () => {
    requireCms.mockResolvedValue({ ok: true, admin: mockAdmin })
    mutateJson.mockImplementation(async (_file, updater) =>
      updater([{ id: "1" }] as Array<{ id: string }>),
    )

    const result = await mutateCms<Array<{ id: string }>>({
      action: "update",
      file: "items.json",
      entityType: "item",
      entityId: "1",
      auditAction: "item.update",
      details: { field: "title" },
      updater: (current, admin) => {
        expect(admin).toEqual(mockAdmin)
        return [...current, { id: "2" }]
      },
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual([{ id: "1" }, { id: "2" }])
      expect(result.admin).toEqual(mockAdmin)
    }
    expect(requireCms).toHaveBeenCalledWith("update")
    expect(mutateJson).toHaveBeenCalledWith("items.json", expect.any(Function))
    expect(logAuditEvent).toHaveBeenCalledWith({
      actorUserId: "admin-1",
      actorName: "Test Admin",
      action: "item.update",
      entityType: "item",
      entityId: "1",
      details: { field: "title" },
    })
    expect(revalidateSite).toHaveBeenCalledOnce()
  })

  it("revalidate: false ise revalidateSite çağrılmaz", async () => {
    requireCms.mockResolvedValue({ ok: true, admin: mockAdmin })
    mutateJson.mockImplementation(async (_file, updater) => updater([]))

    await mutateCms({
      action: "update",
      file: "items.json",
      entityType: "item",
      auditAction: "item.update",
      revalidate: false,
      updater: (current) => current,
    })

    expect(revalidateSite).not.toHaveBeenCalled()
  })
})
