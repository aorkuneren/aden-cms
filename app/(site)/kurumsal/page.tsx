import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Building2,
  FileBadge2,
  Landmark,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { PageIntro } from "@/components/site/page-intro"
import { buildCorporatePageContent } from "@/lib/site/corporate-content"
import { getCmsField, getCmsPageContent } from "@/lib/site/page-content"
import { resolvePageSeo } from "@/lib/site/page-seo"

import { BreadcrumbJsonLd } from "@/components/site/json-ld"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolvePageSeo("/kurumsal", {
    title: "Kurumsal & Yasal Bilgiler | Aden Bungalov Sapanca",
    description:
      "Aden Bungalov kurumsal bilgileri: banka hesap detayları, kiralama sözleşmesi şartları, KVKK aydınlatma metni, gizlilik ve iptal politikası.",
  })

  return {
    title: { absolute: seo.title },
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: "/kurumsal" },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: "https://www.adenbungalov.com/kurumsal",
    },
  }
}

const CORPORATE_ICON_MAP: Record<string, LucideIcon> = {
  hakkimizda: Building2,
  "hesap-numaralarimiz": Landmark,
  "kiralama-sartlari": Scale,
  "kvkk-aydinlatma-metni": ShieldCheck,
  "iptal-politikasi": FileBadge2,
  "gizlilik-bildirimi": FileBadge2,
}

export default async function KurumsalPage() {
  const cmsPageContent = await getCmsPageContent("kurumsal")
  const title = getCmsField(cmsPageContent, "corporate-hero", "title", "Kurumsal ve Yasal Bilgiler")
  const description = getCmsField(
    cmsPageContent,
    "corporate-hero",
    "description",
    "Rezervasyon öncesi ihtiyaç duyulan resmi metinler ve işletme bilgilerine buradan ulaşabilirsiniz."
  )
  const intro = getCmsField(
    cmsPageContent,
    "corporate-hero",
    "intro",
    "Bu alan; Hakkımızda, banka hesap bilgileri, kiralama şartları, KVKK, iptal politikası ve gizlilik metinlerini tek noktada erişilebilir kılar."
  )
  const introVisibleRaw = getCmsField(cmsPageContent, "corporate-hero", "introVisible", "true")
  const introVisible = !["0", "false", "hayir", "no"].includes(
    introVisibleRaw.trim().toLocaleLowerCase("tr-TR")
  )
  const corporatePages = buildCorporatePageContent(cmsPageContent)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 pb-24 sm:px-6 md:pb-12">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "https://www.adenbungalov.com" },
          { name: "Kurumsal", url: "https://www.adenbungalov.com/kurumsal" },
        ]}
      />
      <PageIntro title={title} description={description} />

      {introVisible ? (
        <div className="mt-6 rounded-2xl border border-[#e7dfd1] bg-white p-5 text-sm leading-7 text-[#5f5f66] shadow-sm">
          {intro}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {corporatePages.map((page) => {
          const Icon = CORPORATE_ICON_MAP[page.slug] || FileBadge2
          return (
            <Link
              key={page.slug}
              href={`/kurumsal/${page.slug}`}
              className="group rounded-2xl border border-[#e8dfcf] bg-white p-5 shadow-sm transition hover:border-[#d8cdb8] hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8cfbe] bg-[#f8f4ec] text-[#355733]">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-[#1a1a1a]">{page.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#616168]">{page.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#355733]">
                İncele
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
