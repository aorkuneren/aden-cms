import Link from "next/link"
import { Plus } from "lucide-react"
import { SectionEyebrow } from "@/components/site/section-eyebrow"
import { SiteSection } from "@/components/site/site-section"
import { Button } from "@/components/ui/button"

type FaqItem = {
  question: string
  answer: string
}

type FaqSectionProps = {
  items: readonly FaqItem[]
  eyebrow?: string
  title?: string
  description?: string
  supportTitle?: string
  supportDescription?: string
  supportButtonLabel?: string
}

export function FaqSection({
  items,
  eyebrow = "SSS",
  title = "Sıkça Sorulan Sorular",
  description = "Konaklama süreci, tesis detayları ve rezervasyon adımlarıyla ilgili en çok sorulan soruları tek alanda bulabilirsiniz.",
  supportTitle = "Hala sorularınız mı var?",
  supportDescription = "Aradığınız yanıtı bulamadıysanız ekibimizle hemen iletişime geçin.",
  supportButtonLabel = "İletişime Geç",
}: FaqSectionProps) {
  return (
    <SiteSection id="sss" className="py-12 sm:py-16">
      <div className="grid gap-9 lg:grid-cols-12 lg:gap-14">
        <article className="lg:col-span-5">
          <SectionEyebrow label={eyebrow} />
          <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-[#171717] md:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#54545a] md:text-base">{description}</p>

          <div className="mt-10 max-w-md border-t border-[#d8d3c8] pt-5">
            <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[#171717] md:text-3xl">
              {supportTitle}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#54545a] md:text-base">{supportDescription}</p>
            <Button
              asChild
              className="mt-4 h-10 rounded-full bg-[#1f3a2e] px-5 text-sm font-medium text-white hover:bg-[#1a3127]"
            >
              <Link href="/iletisim">{supportButtonLabel}</Link>
            </Button>
          </div>
        </article>

        <div className="lg:col-span-7">
          <div className="border-t border-[#d8d3c8]">
            {items.map((item, index) => (
              <details key={`${item.question}-${index}`} className="group border-b border-[#d8d3c8]">
                <summary className="flex list-none cursor-pointer items-center justify-between gap-4 py-5 text-left marker:content-none">
                  <span className="text-base font-medium leading-snug text-[#171717] md:text-[1.15rem]">
                    {item.question}
                  </span>
                  <Plus className="h-6 w-6 shrink-0 text-[#171717] transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="pb-5 pr-10 text-sm leading-7 text-[#575760] md:text-base">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </SiteSection>
  )
}
