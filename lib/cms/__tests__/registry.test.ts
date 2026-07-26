import { describe, expect, it } from "vitest"
import { buildSectionZod, getSection, sectionDefaults } from "@/lib/cms/registry"

describe("registry", () => {
  it("CTA bölümünü döner", () => {
    const section = getSection("ana-sayfa", "cta")

    expect(section?.label).toBe("CTA")
    expect(section?.kind).toBe("fields")
  })

  it("defaults ve zod üretir", () => {
    const section = getSection("ana-sayfa", "cta")!
    const defaults = sectionDefaults(section)

    expect(defaults.title).toBeTruthy()

    const schema = buildSectionZod(section)
    const parsed = schema.safeParse(defaults)

    expect(parsed.success).toBe(true)
  })

  it("Bungalovlarımız liste davranışı bölümünü ve varsayılanlarını üretir", () => {
    const section = getSection("bungalovlarimiz", "listing-behavior")

    expect(section?.kind).toBe("fields")

    const defaults = sectionDefaults(section!)
    expect(defaults).toMatchObject({ limit: "9", loadMode: "load-more" })
    expect(buildSectionZod(section!).safeParse(defaults).success).toBe(true)
  })

  it("Galeri sayfa başlığı bölümünü ve varsayılanlarını üretir", () => {
    const section = getSection("galeri", "page-hero")

    expect(section?.label).toBe("Sayfa Başlığı")
    expect(section?.kind).toBe("fields")

    const defaults = sectionDefaults(section!)
    expect(defaults).toMatchObject({
      title: "Foto Galeri",
      description: "Aden Bungalov galerisi: tüm kategorilerdeki görselleri keşfedin.",
    })
    expect(buildSectionZod(section!).safeParse(defaults).success).toBe(true)
  })

  it("İletişim bölümlerini ve form varsayılanlarını üretir", () => {
    const hero = getSection("iletisim", "contact-hero")
    const info = getSection("iletisim", "contact-info")
    const region = getSection("iletisim", "contact-region")
    const formSettings = getSection("iletisim", "form-settings")

    expect(hero?.kind).toBe("fields")
    expect(sectionDefaults(info!)).toMatchObject({
      communication: "Genel bilgi ve fiyat soruları",
      complaint: "Hizmet deneyimi ile ilgili bildirimler",
    })
    expect(sectionDefaults(region!)).toMatchObject({
      title: "Bölge Bilgisi",
    })
    expect(sectionDefaults(formSettings!)).toMatchObject({
      formTitle: "Bize Mesaj Gönderin",
      submitLabel: "Mesajı Gönder",
    })
    expect(buildSectionZod(formSettings!).safeParse(sectionDefaults(formSettings!)).success).toBe(true)
  })
})
