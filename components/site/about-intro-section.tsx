import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SectionEyebrow } from "@/components/site/section-eyebrow"
import { SiteSection } from "@/components/site/site-section"

type AboutIntroSectionProps = {
  companyName: string
  images: string[]
  eyebrow?: string
  title?: string
  description?: string
  buttonLabel?: string
  /** Butonun gideceği adres — CMS'ten yönetilir. */
  buttonHref?: string
  /** false ise "Devamını oku" butonu gizlenir. */
  buttonVisible?: boolean
}

export function AboutIntroSection({
  companyName,
  images,
  eyebrow = "Hakkımızda",
  title = "Doğanın Kalbindeki Eviniz",
  description = "Sapanca'nın eşsiz doğasıyla iç içe, mavi ve yeşilin en güzel tonlarını bir araya getiren Aden Bungalov, misafirlerine unutulmaz bir huzur deneyimi sunuyor. Sakarya, İlmiye'nin tertemiz havasında konumlanan tesisimiz; şehrin yorucu temposundan ve stresinden uzaklaşıp derin bir nefes almak isteyenler için özel olarak tasarlandı.",
  buttonLabel = "Devamını oku",
  buttonHref = "/kurumsal/hakkimizda",
  buttonVisible = true,
}: AboutIntroSectionProps) {
  const imagePool = images
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
  const visuals = imagePool.length > 0 ? imagePool : [""]
  const [heroImage, sideTopImage, sideMiddleImage, sideBottomImage] = Array.from(
    { length: 4 },
    (_, index) => visuals[index % visuals.length] || ""
  )

  return (
    <SiteSection>
      <div className="py-12 sm:py-16">
        <div className="grid w-full gap-8 lg:grid-cols-12 lg:items-start">
          <article className="space-y-5 lg:col-span-5">
            <SectionEyebrow label={eyebrow} />
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[#171717] md:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[#616168] md:text-base">{description}</p>
            {buttonVisible ? (
              <Button
                asChild
                className="h-10 rounded-full bg-[#1f3a2e] px-5 text-sm font-medium text-white hover:bg-[#1a3127]"
              >
                <Link href={buttonHref}>{buttonLabel}</Link>
              </Button>
            ) : null}
          </article>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {[heroImage, sideTopImage, sideMiddleImage, sideBottomImage].map((image, index) => (
                <div
                  key={`about-mobile-${index + 1}`}
                  className="overflow-hidden rounded-[18px] border border-[#e8dfcf] bg-white shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={`${companyName} hakkında görsel ${index + 1}`}
                    className="site-media aspect-[4/3] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>

            <div className="relative mx-auto hidden h-[470px] w-full max-w-[620px] md:block">
              <div className="absolute left-0 top-0 z-[2] h-[320px] w-[56%] overflow-hidden rounded-[18px] border border-[#e8dfcf] bg-white shadow-[0_14px_28px_-20px_rgba(0,0,0,0.6)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage}
                  alt={`${companyName} hakkında ana görsel`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="absolute right-[18%] top-[36px] z-[3] h-[128px] w-[33%] overflow-hidden rounded-[16px] border border-[#e8dfcf] bg-white shadow-[0_10px_20px_-18px_rgba(0,0,0,0.7)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sideTopImage}
                  alt={`${companyName} hakkında görsel 2`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="absolute right-0 top-[160px] z-[1] h-[240px] w-[58%] overflow-hidden rounded-[20px] border border-[#e8dfcf] bg-white shadow-[0_14px_30px_-22px_rgba(0,0,0,0.65)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sideMiddleImage}
                  alt={`${companyName} hakkında görsel 3`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="absolute bottom-[20px] left-[10%] z-[4] h-[128px] w-[33%] overflow-hidden rounded-[16px] border border-[#e8dfcf] bg-white shadow-[0_10px_22px_-18px_rgba(0,0,0,0.7)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sideBottomImage}
                  alt={`${companyName} hakkında görsel 4`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteSection>
  )
}
