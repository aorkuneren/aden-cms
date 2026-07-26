import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const root = process.cwd()

describe("Task 12 CMS bölüm bağlantıları", () => {
  it("SSS ve Neden Aden editörlerinde jenerik bölüm başlığı formlarına bağlantı sunar", async () => {
    const [faqEditor, whyAdenEditor] = await Promise.all([
      readFile(`${root}/components/admin/website/faq-editor.tsx`, "utf8"),
      readFile(`${root}/components/admin/website/why-aden-editor.tsx`, "utf8"),
    ])

    expect(faqEditor).toContain('href="/admin/sayfalar/ana-sayfa/faq"')
    expect(whyAdenEditor).toContain('href="/admin/sayfalar/ana-sayfa/why-aden"')
    expect(faqEditor).toContain("Bölüm başlığını düzenle")
    expect(whyAdenEditor).toContain("Bölüm başlığını düzenle")
  })

  it("CTA rezervasyon düğmesi etiketini CMS'ten olduğu gibi kullanır", async () => {
    const homePage = await readFile(`${root}/app/(site)/page.tsx`, "utf8")

    expect(homePage).toContain("reservationButtonLabel")
    expect(homePage).not.toContain("normalizedCtaReservationButtonLabel")
    // Hedef adres de CMS'ten gelir; güvenli olmayan şemalar safeCmsHref ile elenir.
    expect(homePage).toContain(
      "<Link href={ctaReservationButtonHref}>{ctaReservationButtonLabel}</Link>"
    )
    expect(homePage).toContain('safeCmsHref(\n    getCmsField(cmsPageContent, "cta", "reservationButtonHref", "/bungalovlarimiz"),')
  })
})
