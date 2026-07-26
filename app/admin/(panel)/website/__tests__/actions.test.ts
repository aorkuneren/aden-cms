import { beforeEach, describe, expect, it, vi } from "vitest"

const getCurrentAdmin = vi.fn()
const mutateJson = vi.fn()
const revalidateSite = vi.fn()
const logAuditEvent = vi.fn()

vi.mock("@/lib/admin/auth", () => ({ getCurrentAdmin }))
vi.mock("@/lib/cms/store", () => ({ mutateJson, revalidateSite }))
vi.mock("@/lib/audit", () => ({ logAuditEvent }))

const { saveFaqAction, saveSliderAction } = await import("../actions")

describe("toplu CMS kayıtları", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCurrentAdmin.mockResolvedValue({ id: "admin-1", name: "Test Admin" })
    logAuditEvent.mockResolvedValue(undefined)
  })

  it("aktif slider listesi kaydedilince silinmiş slaytı korur", async () => {
    let saved: unknown
    mutateJson.mockImplementation(async (_file, updater) => {
      saved = updater({
        sliderManagement: [
          { id: "active-slide", imageUrl: "/old.jpg", title: "Eski", description: "", tags: [], isActive: true },
          {
            id: "deleted-slide",
            imageUrl: "/deleted.jpg",
            title: "Silinmiş",
            description: "",
            tags: [],
            isActive: false,
            deletedAt: "2026-07-25T00:00:00.000Z",
            deletedBy: "admin-1",
          },
        ],
      })
    })

    await expect(
      saveSliderAction([
        { id: "active-slide", imageUrl: "/new.jpg", title: "Yeni", description: "", tags: [], isActive: true },
      ])
    ).resolves.toEqual({ ok: true })

    expect(saved).toEqual({
      sliderManagement: [
        { id: "active-slide", imageUrl: "/new.jpg", title: "Yeni", description: "", tags: [], isActive: true },
        expect.objectContaining({ id: "deleted-slide", deletedAt: "2026-07-25T00:00:00.000Z", deletedBy: "admin-1" }),
      ],
    })
  })

  it("aktif SSS listesi kaydedilince silinmiş soruyu korur", async () => {
    let saved: unknown
    mutateJson.mockImplementation(async (_file, updater) => {
      saved = updater({
        faqManagement: [
          { id: "active-faq", question: "Eski?", answer: "Eski", isActive: true },
          {
            id: "deleted-faq",
            question: "Silinmiş?",
            answer: "Silinmiş",
            isActive: false,
            deletedAt: "2026-07-25T00:00:00.000Z",
            deletedBy: "admin-1",
          },
        ],
      })
    })

    await expect(
      saveFaqAction([{ id: "active-faq", question: "Yeni?", answer: "Yeni", isActive: true }])
    ).resolves.toEqual({ ok: true })

    expect(saved).toEqual({
      faqManagement: [
        { id: "active-faq", question: "Yeni?", answer: "Yeni", isActive: true },
        expect.objectContaining({ id: "deleted-faq", deletedAt: "2026-07-25T00:00:00.000Z", deletedBy: "admin-1" }),
      ],
    })
  })
})
