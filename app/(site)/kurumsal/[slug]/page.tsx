import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LegalPageLayout } from "@/components/site/legal-page-layout"
import {
  type CorporateSlug,
  CORPORATE_PAGES,
} from "@/lib/site/b2c"
import { buildCorporatePageContent } from "@/lib/site/corporate-content"
import { getCmsPageContent } from "@/lib/site/page-content"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TITLE_BY_SLUG = CORPORATE_PAGES.reduce((acc, item) => {
  acc[item.slug] = item.title
  return acc
}, {} as Record<CorporateSlug, string>)

function isCorporateSlug(value: string): value is CorporateSlug {
  return CORPORATE_PAGES.some((item) => item.slug === value)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  if (!isCorporateSlug(slug)) {
    return { title: "Kurumsal Sayfa | Aden Bungalov" }
  }

  const cmsPageContent = await getCmsPageContent("kurumsal")
  const corporatePages = buildCorporatePageContent(cmsPageContent)
  const currentPage = corporatePages.find((item) => item.slug === slug)
  const title = currentPage?.title || TITLE_BY_SLUG[slug]
  const description =
    currentPage?.description || `${TITLE_BY_SLUG[slug]} | Aden Bungalov kurumsal bilgilendirme sayfası.`

  return {
    title,
    description: description.slice(0, 158),
    alternates: {
      canonical: `/kurumsal/${slug}`,
    },
    openGraph: {
      title,
      description: description.slice(0, 158),
      url: `https://www.adenbungalov.com/kurumsal/${slug}`,
      type: "article",
    },
  }
}

export default async function CorporateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!isCorporateSlug(slug)) {
    notFound()
  }

  const cmsPageContent = await getCmsPageContent("kurumsal")
  const corporatePages = buildCorporatePageContent(cmsPageContent)
  const currentPage = corporatePages.find((item) => item.slug === slug)
  const pageTitle = currentPage?.title || TITLE_BY_SLUG[slug]
  const pageDescription = currentPage?.description || ""
  const pageContent = currentPage?.content || ""
  const hasHtmlContent = /<\/?[a-z][\s\S]*>/i.test(pageContent)

  return (
    <LegalPageLayout
      slug={slug}
      title={pageTitle}
      description={pageDescription}
      menuItems={corporatePages.map((item) => ({ slug: item.slug, title: item.title }))}
    >
      {pageContent ? (
        hasHtmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: pageContent }} />
        ) : (
          <p className="whitespace-pre-line text-[#52525a]">{pageContent}</p>
        )
      ) : (
        <p>Bu sayfa için içerik henüz girilmemiştir.</p>
      )}
    </LegalPageLayout>
  )
}
