import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { CORPORATE_PAGES } from "@/lib/site/b2c"
import { cn } from "@/lib/utils"

type LegalPageLayoutProps = {
  slug: string
  title: string
  description?: string
  menuItems?: Array<{ slug: string; title: string }>
  children: ReactNode
}

export function LegalPageLayout({
  slug,
  title,
  description,
  menuItems,
  children,
}: LegalPageLayoutProps) {
  const resolvedItems = menuItems && menuItems.length > 0 ? menuItems : CORPORATE_PAGES

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 pb-24 sm:px-6 md:pb-12">
      <div className="mb-6 flex items-center gap-2 text-sm text-[#696970]">
        <Link href="/" className="hover:text-[#1f3120]">
          Anasayfa
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/kurumsal" className="hover:text-[#1f3120]">
          Kurumsal
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[#222224]">{title}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-[#e8e0d3] bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5c714e]">Kurumsal Sayfalar</p>
          <div className="mt-3 space-y-1">
            {resolvedItems.map((item) => {
              const active = item.slug === slug
              return (
                <Link
                  key={item.slug}
                  href={`/kurumsal/${item.slug}`}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm transition",
                    active
                      ? "bg-[#efe7d9] font-medium text-[#1d1d1f]"
                      : "text-[#5f5f66] hover:bg-[#f2ede4] hover:text-[#1f3120]"
                  )}
                >
                  {item.title}
                </Link>
              )
            })}
          </div>
        </aside>

        <article className="rounded-2xl border border-[#e8e0d3] bg-white p-5 shadow-sm md:p-8">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#171717] md:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-sm leading-7 text-[#616168] md:text-base">{description}</p>
          ) : null}
          <div className="prose prose-neutral mt-6 max-w-none prose-headings:text-[#151515] prose-p:text-[#52525a] prose-li:text-[#52525a]">
            {children}
          </div>
        </article>
      </div>
    </div>
  )
}
