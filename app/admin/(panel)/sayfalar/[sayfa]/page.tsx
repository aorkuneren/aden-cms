import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { PageEditor, type PageEditorSection } from "@/components/admin/cms/page-editor"
import { CorporateLegalEditor, type LegalPage } from "@/components/admin/legal/corporate-legal-editor"
import { Button } from "@/components/ui/button"
import { readJson } from "@/lib/cms/store"
import { getPage, sectionDefaults } from "@/lib/cms/registry"
import { CORPORATE_PAGES } from "@/lib/site/b2c"
import { buildCorporatePageContent } from "@/lib/site/corporate-content"
import { getCmsPageContent } from "@/lib/site/page-content"

export const dynamic = "force-dynamic"

const PAGE_META: Record<string, { description: string; siteHref: string }> = {
  "ana-sayfa": {
    description: "Anasayfa bölümlerinin metin alanlarını tek ekrandan düzenleyin.",
    siteHref: "/",
  },
  bungalovlarimiz: {
    description: "Liste sayfasının başlığını ve listeleme davranışını tek ekrandan yönetin.",
    siteHref: "/bungalovlarimiz",
  },
  galeri: {
    description: "Galeri sayfasının başlık alanını yönetin.",
    siteHref: "/galeri",
  },
  kurumsal: {
    description: "Kurumsal sayfanın başlığını ve yasal metinleri tek ekrandan yönetin.",
    siteHref: "/kurumsal",
  },
  iletisim: {
    description: "İletişim sayfasının tüm metinlerini ve form ayarlarını tek ekrandan yönetin.",
    siteHref: "/iletisim",
  },
}

async function getLegalPages(): Promise<LegalPage[]> {
  const cmsPageContent = await getCmsPageContent("kurumsal")
  const built = buildCorporatePageContent(cmsPageContent)
  const bySlug = new Map(built.map((page) => [page.slug, page]))

  return CORPORATE_PAGES.map((corporate) => {
    const match = bySlug.get(corporate.slug)
    return {
      slug: corporate.slug,
      label: corporate.title,
      title: match?.title ?? corporate.title,
      description: match?.description ?? corporate.description,
      content: match?.content ?? "",
    }
  })
}

export default async function PageSectionsAdminPage({
  params,
}: {
  params: Promise<{ sayfa: string }>
}) {
  const { sayfa } = await params
  const page = getPage(sayfa)
  if (!page) notFound()

  const pageContent = await readJson<Record<string, Record<string, Record<string, string>>>>(
    "page-content.json"
  )
  const legalPages = sayfa === "kurumsal" ? await getLegalPages() : []
  const meta = PAGE_META[sayfa]

  const sections: PageEditorSection[] = page.sections
    .filter((section) => section.kind === "fields")
    .map((section) => ({
      key: section.key,
      label: section.label,
      fields: section.fields ?? [],
      values: {
        ...sectionDefaults(section),
        ...(pageContent?.[sayfa]?.[section.key] ?? {}),
      },
    }))

  const collectionSections = page.sections.filter((section) => section.kind === "collection-link")

  return (
    <>
      <AdminPageHeader
        title={`${page.title} Yönetimi`}
        description={meta?.description ?? "Bu sayfanın tüm bölümlerini tek ekrandan düzenleyin."}
      />

      <div className="space-y-4">
        <PageEditor
          pageSlug={sayfa}
          scopeLabel={`${page.title} Sayfası`}
          siteHref={meta?.siteHref ?? "/"}
          sections={sections}
        />

        {collectionSections.map((section) => (
          <section
            key={section.key}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {section.label}
              </h2>
              <p className="text-[11px] text-slate-500">Bu bölüm ayrı bir ekrandan yönetilir.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link href={section.collectionHref ?? "#"}>
                Yönet <ExternalLink className="ml-1 size-3" />
              </Link>
            </Button>
          </section>
        ))}

        {sayfa === "kurumsal" ? <CorporateLegalEditor initial={legalPages} /> : null}
      </div>
    </>
  )
}
