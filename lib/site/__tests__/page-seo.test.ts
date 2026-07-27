import { beforeEach, describe, expect, it, vi } from "vitest"

const { resolveSeo } = vi.hoisted(() => ({ resolveSeo: vi.fn() }))

vi.mock("@/lib/seo/seo-meta-service", () => ({
  resolveSeo,
}))

import { resolvePageSeo } from "@/lib/site/page-seo"

const fallback = {
  title: "Varsayılan başlık",
  description: "Varsayılan açıklama",
  keywords: "varsayılan, anahtar",
}

describe("resolvePageSeo", () => {
  beforeEach(() => {
    resolveSeo.mockReset()
  })

  it("CMS alanları boş olduğunda fallback değerlerini döner", async () => {
    resolveSeo.mockResolvedValue({
      metaTitle: "",
      metaDescription: "",
    })

    await expect(resolvePageSeo("/galeri", fallback)).resolves.toEqual(fallback)
  })

  it("dolu CMS alanları fallback yerine kullanır", async () => {
    resolveSeo.mockResolvedValue({
      metaTitle: "CMS Galeri Başlığı",
      metaDescription: "CMS Galeri Açıklaması",
    })

    await expect(resolvePageSeo("/galeri", fallback)).resolves.toEqual({
      title: "CMS Galeri Başlığı",
      description: "CMS Galeri Açıklaması",
      keywords: fallback.keywords,
    })
  })

  it.each([
    ["/iletisim/", "/iletisim"],
    ["/", ""],
  ])("sondaki eğik çizgiyi ve ana sayfa eşdeğerlerini normalize eder (%s)", async (pathname) => {
    resolveSeo.mockResolvedValue({
      metaTitle: "CMS Başlık",
      metaDescription: "CMS Açıklama",
    })

    await expect(resolvePageSeo(pathname, fallback)).resolves.toEqual({
      title: "CMS Başlık",
      description: "CMS Açıklama",
      keywords: fallback.keywords,
    })
  })
})
