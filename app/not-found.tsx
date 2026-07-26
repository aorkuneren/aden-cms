import Link from "next/link"
import { ArrowRight, Home, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUiStrings, t } from "@/lib/cms/ui-strings"

export default async function NotFound() {
  const strings = await getUiStrings()
  const title = t(strings, "notFound.title", "Aradığınız sayfaya ulaşamadık")
  const description = t(
    strings,
    "notFound.description",
    "Bağlantı değişmiş veya sayfa kaldırılmış olabilir. Ana sayfaya dönebilir ya da konaklama seçeneklerimizi inceleyebilirsiniz."
  )
  const ctaHome = t(strings, "notFound.ctaHome", "Ana sayfaya dön")
  const ctaBungalows = t(strings, "notFound.ctaBungalows", "Bungalovları incele")

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f3ee] px-4 py-12 text-[#18261e]">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#d5dfd1]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#e7d9c4]/50 blur-3xl" />

      <section className="relative w-full max-w-2xl rounded-[28px] border border-[#ddd4c5] bg-[#fffdf8]/95 p-7 text-center shadow-[0_24px_70px_-38px_rgba(24,38,30,0.55)] sm:p-12">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#e9efe8] text-[#1f3a2e]">
          <SearchX className="h-8 w-8" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#7a756d]">404 · Sayfa Bulunamadı</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#62616a] sm:text-base">
          {description}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-12 rounded-xl btn-dark sm:min-w-44">
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden="true" />
              {ctaHome}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-xl border-[#d7cdbd] bg-white sm:min-w-44">
            <Link href="/bungalovlarimiz">
              {ctaBungalows}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
