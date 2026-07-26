import { beforeEach, describe, expect, it, vi } from "vitest"

const { findFirst, getConfig } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  getConfig: vi.fn(),
}))

vi.mock("@/lib/data/queries", () => ({
  settingsQueries: { findFirst },
  websiteCmsQueries: { getConfig },
}))

import { getSiteContactConfig } from "@/lib/site/contact-config"

describe("getSiteContactConfig", () => {
  beforeEach(() => {
    findFirst.mockReset()
    getConfig.mockReset()
  })

  it("CMS header telefonunu ayarlar telefonunun yerine kullanmaz", async () => {
    findFirst.mockResolvedValue({
      companyName: "Aden Bungalov",
      phone: " 0532 111 22 33 ",
      email: " info@adenbungalov.com ",
      address: " Sapanca / Sakarya ",
      website: "https://adenbungalov.com",
    })
    getConfig.mockResolvedValue({
      headerManagement: {
        topHeaderPhone: "0533 999 88 77",
      },
    })

    await expect(getSiteContactConfig()).resolves.toMatchObject({
      phone: "0532 111 22 33",
      whatsappPhone: "05321112233",
      email: "info@adenbungalov.com",
      address: "Sapanca / Sakarya",
    })
    expect(getConfig).not.toHaveBeenCalled()
  })
})
