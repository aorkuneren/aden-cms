import { beforeEach, describe, expect, it, vi } from "vitest"

const { getConfig } = vi.hoisted(() => ({ getConfig: vi.fn() }))

vi.mock("@/lib/data/queries", () => ({
  websiteCmsQueries: { getConfig },
}))

import { resolvePageSeo } from "@/lib/site/page-seo"

const fallback = {
  title: "Varsayılan başlık",
  description: "Varsayılan açıklama",
  keywords: "varsayılan, anahtar",
}

describe("resolvePageSeo", () => {
  beforeEach(() => {
    getConfig.mockReset()
  })

  it("CMS alanları boş olduğunda fallback değerlerini döner", async () => {
    getConfig.mockResolvedValue({
      siteManagement: {
        pageSeoItems: [{ slug: "/galeri", title: "  ", description: "", keywords: " " }],
      },
    })

    await expect(resolvePageSeo("/galeri", fallback)).resolves.toEqual(fallback)
  })

  it("dolu CMS alanları fallback yerine kullanır", async () => {
    getConfig.mockResolvedValue({
      siteManagement: {
        pageSeoItems: [
          {
            slug: "/galeri",
            title: "  CMS Galeri Başlığı  ",
            description: "  CMS Galeri Açıklaması  ",
            keywords: "  sapanca, galeri  ",
          },
        ],
      },
    })

    await expect(resolvePageSeo("/galeri", fallback)).resolves.toEqual({
      title: "CMS Galeri Başlığı",
      description: "CMS Galeri Açıklaması",
      keywords: "sapanca, galeri",
    })
  })

  it.each([
    ["/iletisim/", "/iletisim"],
    ["/", ""],
  ])("sondaki eğik çizgiyi ve ana sayfa eşdeğerlerini normalize eder", async (pathname, slug) => {
    getConfig.mockResolvedValue({
      siteManagement: {
        pageSeoItems: [
          { slug, title: "CMS Başlık", description: "CMS Açıklama", keywords: "cms" },
        ],
      },
    })

    await expect(resolvePageSeo(pathname, fallback)).resolves.toEqual({
      title: "CMS Başlık",
      description: "CMS Açıklama",
      keywords: "cms",
    })
  })
})
