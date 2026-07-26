import { getCmsPageContent } from "@/lib/site/page-content"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import {
  AboutSectionEditor,
  type AboutSectionData,
} from "@/components/admin/website/about-section-editor"

export const dynamic = "force-dynamic"

export default async function AboutSectionAdminPage() {
  const content = await getCmsPageContent("ana-sayfa")
  const about = content.about ?? {}

  const initial: AboutSectionData = {
    eyebrow: String(about.eyebrow ?? "Hakkımızda"),
    title: String(about.title ?? "Hakkımızda"),
    description: String(about.description ?? ""),
    imageUrl1: String(about.imageUrl1 ?? ""),
    imageUrl2: String(about.imageUrl2 ?? ""),
    imageUrl3: String(about.imageUrl3 ?? ""),
    imageUrl4: String(about.imageUrl4 ?? ""),
    buttonLabel: String(about.buttonLabel ?? "Devamını oku"),
    buttonHref: String(about.buttonHref ?? "/kurumsal/hakkimizda"),
    buttonVisible: String(about.buttonVisible ?? "true") !== "false",
  }

  return (
    <>
      <AdminPageHeader
        title="Hakkımızda Alanı"
        description="Anasayfa tanıtım bloğunun metinlerini, butonunu ve görsel collage'ını düzenleyin."
      />
      <AboutSectionEditor initial={initial} />
    </>
  )
}
