import { describe, expect, it, vi } from "vitest"

const mutateCms = vi.fn()

vi.mock("@/lib/cms/mutate-cms", () => ({ mutateCms }))

const { saveSectionAction } = await import("../actions")

describe("saveSectionAction", () => {
  it("CTA değerlerini string-map olarak günceller", async () => {
    mutateCms.mockResolvedValue({ ok: true, data: {}, admin: {} })

    const result = await saveSectionAction("ana-sayfa", "cta", {
      eyebrow: "Rezervasyon",
      title: "Yerinizi ayırtın",
      description: "Açıklama",
      responseTitle: "Hızlı Dönüş",
      responseDescription: "Aynı gün dönüş sağlıyoruz.",
      reservationButtonEnabled: false,
      reservationButtonLabel: "Rezervasyon Yap",
      reservationButtonHref: "/bungalovlarimiz",
      phoneButtonEnabled: true,
      phoneButtonPrefix: "Bizi arayın:",
      imageUrl1: "/uploads/cta-1.jpg",
      imageUrl2: "",
    })

    expect(result).toEqual({ ok: true })
    expect(mutateCms).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        file: "page-content.json",
        entityType: "page_section",
        entityId: "ana-sayfa.cta",
      })
    )

    const options = mutateCms.mock.calls[0]?.[0]
    expect(options.updater({ "ana-sayfa": { cta: { title: "Eski başlık" } } })).toEqual({
      "ana-sayfa": {
        cta: expect.objectContaining({
          title: "Yerinizi ayırtın",
          reservationButtonEnabled: "false",
          phoneButtonEnabled: "true",
        }),
      },
    })
  })
})
