import Link from "next/link"
import {
  BellRing,
  CarFront,
  HeartHandshake,
  MapPin,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AboutIntroSection } from "@/components/site/about-intro-section"
import { DeferredSection } from "@/components/site/deferred-section"
import { FaqSection } from "@/components/site/faq-section"
import { FaqJsonLd } from "@/components/site/json-ld"
import { FeaturedBungalowsCarousel } from "@/components/site/featured-bungalows-carousel"
import { GallerySection } from "@/components/site/gallery-section"
import { HeroSection } from "@/components/site/hero-section"
import { HomeGsapAnimations } from "@/components/site/home-gsap-animations"
import { SectionEyebrow } from "@/components/site/section-eyebrow"
import { SiteSection } from "@/components/site/site-section"
import { normalizePhoneHref, toSiteBungalov } from "@/lib/site/b2c"
import { bungalovQueries, websiteCmsQueries } from "@/lib/data/queries"
import { getSitePublicContent } from "@/lib/site/public-content"
import {
  DEFAULT_HOME_SLIDER_ITEMS,
  DEFAULT_HOME_FAQ_ITEMS,
  DEFAULT_HOME_WHY_ADEN_ITEMS,
} from "@/lib/site/default-site-content"
import { getCmsField, getCmsPageContent } from "@/lib/site/page-content"
import { buildHomeGalleryCategories, normalizeImages } from "@/lib/site/gallery-content"
import { isSafeHref } from "@/lib/site/menu-resolver"
import type {
  CmsFaqItem,
  CmsSliderItem,
  CmsWhyAdenItem,
} from "@/lib/site/website-cms-types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1800&q=80"

const ABOUT_PLACEHOLDER_IMAGES = [
  "https://www.adenbungalov.com/upload/1736422460-677fb43c8174a.webp",
  "https://www.adenbungalov.com/upload/1736422456-677fb43805e75.webp",
  "https://www.adenbungalov.com/upload/1736422460-677fb43c8174a.webp",
  "https://www.adenbungalov.com/upload/1736422456-677fb43805e75.webp",
] as const

const WHY_ADEN_ICON_MAP = {
  Waves,
  Sparkles,
  BellRing,
  CarFront,
  ShieldCheck,
  Users,
  MapPin,
  MessageCircle,
  HeartHandshake,
} as const

function resolveWhyAdenIcon(iconName: string) {
  const icon = WHY_ADEN_ICON_MAP[iconName as keyof typeof WHY_ADEN_ICON_MAP]
  return icon || Sparkles
}

type HeroSlideContent = {
  imageUrl: string
  videoUrl?: string
  mediaType?: "IMAGE" | "VIDEO"
  title: string
  description: string
  tags: string[]
  overlayOpacity?: number
  badgeText?: string
  buttonText?: string
  buttonUrl?: string
  secondaryButtonText?: string
  secondaryButtonUrl?: string
}

function toHeroSlide(item: {
  imageUrl?: string
  videoUrl?: string
  mediaType?: "IMAGE" | "VIDEO"
  title?: string
  description?: string
  tags?: readonly string[]
  overlayOpacity?: number
  badgeText?: string
  buttonText?: string
  buttonUrl?: string
  secondaryButtonText?: string
  secondaryButtonUrl?: string
}): HeroSlideContent | null {
  const imageUrl = item.imageUrl?.trim() || ""
  const videoUrl = item.videoUrl?.trim() || ""
  const isVideo = item.mediaType === "VIDEO" && videoUrl.length > 0
  // Görsel veya video yoksa slaytı atla (video slaytlar imageUrl'siz olabilir).
  if (!imageUrl && !isVideo) return null

  const tags = Array.isArray(item.tags)
    ? item.tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .slice(0, 6)
    : []

  return {
    imageUrl,
    videoUrl: videoUrl || undefined,
    mediaType: isVideo ? "VIDEO" : "IMAGE",
    title: item.title?.trim() || "",
    description: item.description?.trim() || "",
    tags,
    overlayOpacity: typeof item.overlayOpacity === "number" ? item.overlayOpacity : undefined,
    badgeText: item.badgeText?.trim() || undefined,
    buttonText: item.buttonText?.trim() || undefined,
    buttonUrl: item.buttonUrl?.trim() || undefined,
    secondaryButtonText: item.secondaryButtonText?.trim() || undefined,
    secondaryButtonUrl: item.secondaryButtonUrl?.trim() || undefined,
  }
}

function heroMediaKey(slide: HeroSlideContent): string {
  return slide.mediaType === "VIDEO" ? slide.videoUrl || "" : slide.imageUrl
}

function dedupeHeroSlides(slides: HeroSlideContent[]) {
  const seen = new Set<string>()
  return slides.filter((slide) => {
    const key = heroMediaKey(slide)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildHeroSlides(sliderItems: CmsSliderItem[], fallbackImage: string) {
  const cmsSlides = dedupeHeroSlides(
    sliderItems
      .filter((item) => item.isActive)
      .map((item) =>
        toHeroSlide({
          imageUrl: item.imageUrl,
          videoUrl: item.videoUrl,
          mediaType: item.mediaType,
          title: item.title,
          description: item.description,
          tags: item.tags,
          overlayOpacity: item.overlayOpacity,
          badgeText: item.badgeText,
          buttonText: item.buttonText,
          buttonUrl: item.buttonUrl,
          secondaryButtonText: item.secondaryButtonText,
          secondaryButtonUrl: item.secondaryButtonUrl,
        })
      )
      .filter((item): item is HeroSlideContent => Boolean(item))
  )

  if (cmsSlides.length > 0) {
    return cmsSlides
  }

  const defaultSlides = dedupeHeroSlides(
    DEFAULT_HOME_SLIDER_ITEMS.map((item) => toHeroSlide(item)).filter(
      (item): item is HeroSlideContent => Boolean(item)
    )
  )

  if (defaultSlides.length > 0) {
    return defaultSlides
  }

  const fallbackSlide = toHeroSlide({ imageUrl: fallbackImage })
  return fallbackSlide ? [fallbackSlide] : []
}

/**
 * CMS'ten gelen bağlantıyı doğrular. javascript:/data: gibi şemalar
 * reddedilir; geçersizse varsayılan hedefe düşülür.
 */
function safeCmsHref(value: string, fallback: string) {
  const trimmed = String(value || "").trim()
  return isSafeHref(trimmed) ? trimmed : fallback
}

/** CMS'te metin olarak tutulan sayısal ayarları güvenli aralığa sıkıştırır. */
function clampCmsNumber(value: string, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function buildGalleryPool(images: string[], fallback: string, size: number) {
  if (images.length === 0) {
    return Array.from({ length: size }, () => fallback)
  }

  const pool = [...images]
  while (pool.length < size) {
    pool.push(images[pool.length % images.length])
  }

  return pool.slice(0, size)
}

function buildAboutVisualImages(cmsImages: string[], fallbackImages: string[], size: number) {
  const preferred = normalizeImages(cmsImages)
  const fallback = normalizeImages(fallbackImages)
  const visuals: string[] = []

  for (const image of preferred) {
    if (visuals.length >= size) break
    visuals.push(image)
  }

  for (const image of fallback) {
    if (visuals.length >= size) break
    visuals.push(image)
  }

  if (visuals.length === 0) {
    return Array.from({ length: size }, () => HERO_FALLBACK)
  }

  const cyclePool = [...visuals]
  let cursor = 0
  while (visuals.length < size) {
    visuals.push(cyclePool[cursor % cyclePool.length] || HERO_FALLBACK)
    cursor += 1
  }

  return visuals.slice(0, size)
}


function buildFaqItems(cmsFaqItems: CmsFaqItem[]) {
  const items = cmsFaqItems
    .filter((item) => item.isActive)
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question.length > 0 && item.answer.length > 0)

  if (items.length > 0) {
    return items
  }

  return DEFAULT_HOME_FAQ_ITEMS.map((item) => ({ ...item }))
}

function buildWhyAdenTags(cmsItems: CmsWhyAdenItem[]) {
  const items = cmsItems
    .filter((item) => item.isActive)
    .map((item) => ({
      icon: resolveWhyAdenIcon(item.icon),
      label: item.title.trim(),
    }))
    .filter((item) => item.label.length > 0)

  if (items.length > 0) {
    return items
  }

  return DEFAULT_HOME_WHY_ADEN_ITEMS.map((item) => ({
    icon: resolveWhyAdenIcon(item.icon),
    label: item.label,
  }))
}

export default async function SiteHomePage() {
  const [{ settings }, rawBungalovs, cmsConfig, cmsPageContent] = await Promise.all([
    getSitePublicContent(),
    bungalovQueries.findMany({ status: "AKTIF" }, { orderBy: { name: "asc" } }),
    websiteCmsQueries.getConfig().catch(() => null),
    getCmsPageContent("ana-sayfa"),
  ])

  const bungalovs = rawBungalovs.map((item) =>
    toSiteBungalov(item as unknown as Record<string, unknown>)
  )

  const companyName = settings?.companyName || "Aden Bungalov"
  const companyPhone = settings?.phone || ""
  const companyPhoneHref = normalizePhoneHref(companyPhone)
  const aboutEyebrow = getCmsField(cmsPageContent, "about", "eyebrow", "Hakkımızda")
  const aboutTitle = getCmsField(cmsPageContent, "about", "title", "Doğanın Kalbindeki Eviniz")
  const aboutDescription = getCmsField(
    cmsPageContent,
    "about",
    "description",
    "Sapanca'nın eşsiz doğasıyla iç içe, mavi ve yeşilin en güzel tonlarını bir araya getiren Aden Bungalov, misafirlerine unutulmaz bir huzur deneyimi sunuyor."
  )
  const aboutButtonLabel = getCmsField(cmsPageContent, "about", "buttonLabel", "Devamını oku")
  const aboutButtonVisible = getCmsField(cmsPageContent, "about", "buttonVisible", "true") !== "false"
  const aboutButtonHref = safeCmsHref(
    getCmsField(cmsPageContent, "about", "buttonHref", "/kurumsal/hakkimizda"),
    "/kurumsal/hakkimizda"
  )
  const featuredEyebrow = getCmsField(cmsPageContent, "featured-bungalows", "eyebrow", "Bungalovlarımız")
  const featuredTitle = getCmsField(
    cmsPageContent,
    "featured-bungalows",
    "title",
    "Her İhtiyaca Uygun, Lüks ve Konforlu Suitlerimiz"
  )
  const featuredDescription = getCmsField(
    cmsPageContent,
    "featured-bungalows",
    "description",
    "Sizlere en iyi deneyimi sunmak için özenle tasarlanmış bungalovlarımızda; ücretsiz yüksek hızlı Wi-Fi, rahat çift kişilik yataklar ve ferah yaşam alanları standarttır."
  )
  const featuredEmptyStateText = getCmsField(
    cmsPageContent,
    "featured-bungalows",
    "emptyStateText",
    "Şu anda yayında aktif bungalow bulunmuyor."
  )
  const featuredLimitRaw = Number(getCmsField(cmsPageContent, "featured-bungalows", "limit", "5"))
  const featuredLimit = Number.isFinite(featuredLimitRaw)
    ? Math.min(24, Math.max(1, Math.round(featuredLimitRaw)))
    : 5
  const featuredAutoplayEnabled =
    getCmsField(cmsPageContent, "featured-bungalows", "autoplayEnabled", "true") !== "false"
  const featuredAutoplaySecondsRaw = Number(
    getCmsField(cmsPageContent, "featured-bungalows", "autoplaySeconds", "5")
  )
  const featuredAutoplaySeconds = Number.isFinite(featuredAutoplaySecondsRaw)
    ? Math.min(30, Math.max(2, Math.round(featuredAutoplaySecondsRaw)))
    : 5
  const featuredPauseOnHover =
    getCmsField(cmsPageContent, "featured-bungalows", "pauseOnHover", "true") !== "false"
  const featuredShowDots =
    getCmsField(cmsPageContent, "featured-bungalows", "showDots", "true") !== "false"
  const featuredLoop =
    getCmsField(cmsPageContent, "featured-bungalows", "loop", "true") !== "false"
  const whyEyebrow = getCmsField(cmsPageContent, "why-aden", "eyebrow", "Neden Aden Bungalov?")
  const whyTitle = getCmsField(
    cmsPageContent,
    "why-aden",
    "title",
    "Tatiliniz İçin Neden Bizi Seçmelisiniz?"
  )
  const whyDescription = getCmsField(
    cmsPageContent,
    "why-aden",
    "description",
    "Sapanca'da bungalov kiralarken beklentilerinizin ötesine geçiyoruz. İşte Aden Bungalov'da sizi bekleyen ayrıcalıklar:"
  )
  const galleryEyebrow = getCmsField(cmsPageContent, "gallery", "eyebrow", "Galeri")
  const galleryTitle = getCmsField(cmsPageContent, "gallery", "title", "Göz Atın: Cennetten Bir Köşe")
  const galleryDescription = getCmsField(
    cmsPageContent,
    "gallery",
    "description",
    "Aden Bungalov'un modern mimarisini, huzur dolu bahçelerini, özel havuzlarını ve Sapanca'nın eşsiz göl manzarasını fotoğraf galerimizde keşfedin."
  )
  const galleryMaxImagesPerCategory = clampCmsNumber(
    getCmsField(cmsPageContent, "gallery", "maxImagesPerCategory", "5"),
    5,
    1,
    24
  )
  const galleryShowViewAllButton =
    getCmsField(cmsPageContent, "gallery", "showViewAllButton", "true") !== "false"
  const galleryViewAllLabel = getCmsField(
    cmsPageContent,
    "gallery",
    "viewAllLabel",
    "Tümünü Görüntüle"
  )
  const ctaEyebrow = getCmsField(cmsPageContent, "cta", "eyebrow", "Rezervasyon")
  const ctaTitle = getCmsField(
    cmsPageContent,
    "cta",
    "title",
    "Doğanın Kalbindeki Yerinizi Ayırtmak İçin Geç Kalmayın!"
  )
  const ctaDescription = getCmsField(
    cmsPageContent,
    "cta",
    "description",
    "Şehrin gürültüsünü geride bırakmanın ve kendinize bir iyilik yapmanın zamanı gelmedi mi? İhtiyacınız olan huzur, konfor ve doğa Aden Bungalov'da sizi bekliyor."
  )
  const ctaResponseTitle = getCmsField(cmsPageContent, "cta", "responseTitle", "Hızlı Dönüş")
  const ctaResponseDescription = getCmsField(
    cmsPageContent,
    "cta",
    "responseDescription",
    "Rezervasyon taleplerine aynı gün içinde geri dönüş sağlıyoruz."
  )
  const ctaReservationButtonLabel = getCmsField(
    cmsPageContent,
    "cta",
    "reservationButtonLabel",
    "Hızlı Rezervasyon"
  )
  const ctaReservationButtonEnabled = getCmsField(cmsPageContent, "cta", "reservationButtonEnabled", "true") === "true"
  const ctaReservationButtonHref = safeCmsHref(
    getCmsField(cmsPageContent, "cta", "reservationButtonHref", "/bungalovlarimiz"),
    "/bungalovlarimiz"
  )
  const ctaPhoneButtonEnabled = getCmsField(cmsPageContent, "cta", "phoneButtonEnabled", "true") === "true"
  const ctaPhoneButtonPrefix = getCmsField(cmsPageContent, "cta", "phoneButtonPrefix", "Bizi Arayın:")
  const ctaImageUrl1 = getCmsField(cmsPageContent, "cta", "imageUrl1", "")
  const ctaImageUrl2 = getCmsField(cmsPageContent, "cta", "imageUrl2", "")
  const faqEyebrow = getCmsField(cmsPageContent, "faq", "eyebrow", "SSS")
  const faqTitle = getCmsField(cmsPageContent, "faq", "title", "Sıkça Sorulan Sorular")
  const faqDescription = getCmsField(
    cmsPageContent,
    "faq",
    "description",
    "Konaklama süreci, tesis detayları ve rezervasyon adımlarıyla ilgili en çok sorulan soruları tek alanda bulabilirsiniz."
  )
  const faqSupportTitle = getCmsField(cmsPageContent, "faq", "supportTitle", "Hala sorularınız mı var?")
  const faqSupportDescription = getCmsField(
    cmsPageContent,
    "faq",
    "supportDescription",
    "Aradığınız yanıtı bulamadıysanız ekibimizle hemen iletişime geçin."
  )
  const faqSupportButtonLabel = getCmsField(cmsPageContent, "faq", "supportButtonLabel", "İletişime Geç")

  const firstImage = bungalovs.find((item) => item.image)?.image || HERO_FALLBACK
  const bungalowImages = bungalovs
    .map((item) => item.image || "")
    .filter((value) => value.trim().length > 0)
  const galleryCategories = buildHomeGalleryCategories(cmsConfig?.galleryManagement, bungalowImages)
  const heroSlides = buildHeroSlides(cmsConfig?.sliderManagement || [], firstImage)
  const whyAdenTags = buildWhyAdenTags(cmsConfig?.whyAdenManagement || [])
  const faqItems = buildFaqItems(cmsConfig?.faqManagement || [])
  const heroPrimaryImage = heroSlides[0]?.imageUrl || firstImage
  const heroSliderImages = heroSlides.slice(1).map((slide) => slide.imageUrl).filter(Boolean)
  const galleryPoolSource = galleryCategories.flatMap((category) => category.images)
  const galleryPool = buildGalleryPool(galleryPoolSource, firstImage, 10)
  const aboutCmsImages = [
    getCmsField(cmsPageContent, "about", "imageUrl1", ""),
    getCmsField(cmsPageContent, "about", "imageUrl2", ""),
    getCmsField(cmsPageContent, "about", "imageUrl3", ""),
    getCmsField(cmsPageContent, "about", "imageUrl4", ""),
  ]
  const aboutImages = buildAboutVisualImages(
    aboutCmsImages,
    [...galleryPool, ...ABOUT_PLACEHOLDER_IMAGES, firstImage],
    4
  )
  const featuredBungalows = [...rawBungalovs]
    .sort((a, b) => {
      const aFeat = Boolean((a as { isFeatured?: boolean }).isFeatured) ? 1 : 0
      const bFeat = Boolean((b as { isFeatured?: boolean }).isFeatured) ? 1 : 0
      if (bFeat !== aFeat) return bFeat - aFeat
      const aOrder = Number((a as { sortOrder?: number }).sortOrder) || 0
      const bOrder = Number((b as { sortOrder?: number }).sortOrder) || 0
      if (aOrder !== bOrder) return aOrder - bOrder
      return String((a as { name?: string }).name || "").localeCompare(
        String((b as { name?: string }).name || ""),
        "tr"
      )
    })
    .slice(0, featuredLimit)
    .map((item) => toSiteBungalov(item as unknown as Record<string, unknown>))

  return (
    <div className="home-motion-root pb-[calc(var(--site-bottom-chrome)+1rem)] md:pb-0">
      <HomeGsapAnimations />

      <div data-gsap-hero>
        <HeroSection
          companyName={companyName}
          slides={heroSlides}
          autoplayEnabled={cmsConfig?.sliderSettings?.autoplayEnabled !== false}
          autoplaySeconds={
            typeof cmsConfig?.sliderSettings?.autoplaySeconds === "number" && cmsConfig.sliderSettings.autoplaySeconds >= 2
              ? cmsConfig.sliderSettings.autoplaySeconds
              : 5
          }
          pauseOnHover={cmsConfig?.sliderSettings?.pauseOnHover !== false}
        />
      </div>

      <DeferredSection placeholderClassName="min-h-[540px]">
        <AboutIntroSection
          companyName={companyName}
          images={aboutImages}
          eyebrow={aboutEyebrow}
          title={aboutTitle}
          description={aboutDescription}
          buttonLabel={aboutButtonLabel}
          buttonHref={aboutButtonHref}
          buttonVisible={aboutButtonVisible}
        />
      </DeferredSection>

      <DeferredSection placeholderClassName="min-h-[600px]">
        <SiteSection id="bungalovlar">
          <div className="w-full">
            <div className="grid gap-4 pb-6 md:grid-cols-12 md:items-end md:gap-6">
              <div className="md:col-span-7">
                <SectionEyebrow label={featuredEyebrow} />
                <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#171717] md:text-4xl lg:text-5xl">
                  {featuredTitle}
                </h2>
              </div>
              <p className="text-sm leading-7 text-[#616168] md:col-span-5 md:text-base">
                {featuredDescription}
              </p>
            </div>
            {featuredBungalows.length === 0 ? (
              <Card className="mt-6 rounded-2xl border-[#e8dfcf] bg-white">
                <CardContent className="p-6 text-sm text-[#5f5f66]">
                  {featuredEmptyStateText}
                </CardContent>
              </Card>
            ) : (
              <FeaturedBungalowsCarousel
                items={featuredBungalows}
                settings={{
                  autoplayEnabled: featuredAutoplayEnabled,
                  autoplaySeconds: featuredAutoplaySeconds,
                  pauseOnHover: featuredPauseOnHover,
                  showDots: featuredShowDots,
                  loop: featuredLoop,
                }}
              />
            )}
          </div>
        </SiteSection>
      </DeferredSection>

      <DeferredSection placeholderClassName="min-h-[520px]">
        <SiteSection className="flex flex-col justify-center py-12 sm:py-16">
          <div className="w-full rounded-[30px] border border-[#e8dfcf] bg-[#f8f4ec] px-5 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-12">
            <div className="mx-auto max-w-4xl text-center">
              <SectionEyebrow label={whyEyebrow} className="justify-center" />
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[#171717] md:text-4xl lg:text-5xl">
                {whyTitle}
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#616168] md:text-base">
                {whyDescription}
              </p>
            </div>

            <div className="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-2">
              {whyAdenTags.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#dfd6c8] bg-[#f2ede4] px-2.5 py-1.5 text-xs font-medium text-[#4f4f58]"
                >
                  <item.icon className="h-3.5 w-3.5 text-[#5c7450]" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </SiteSection>
      </DeferredSection>

      <DeferredSection placeholderClassName="min-h-[640px]">
        <GallerySection
          eyebrow={galleryEyebrow}
          title={galleryTitle}
          description={galleryDescription}
          categories={galleryCategories}
          maxImagesPerCategory={galleryMaxImagesPerCategory}
          showViewAllButton={galleryShowViewAllButton}
          viewAllLabel={galleryViewAllLabel}
        />
      </DeferredSection>

      <DeferredSection placeholderClassName="min-h-[560px]">
        <SiteSection className="py-12 sm:py-16">
          <div className="relative overflow-hidden rounded-[34px] border border-[#e4dbc9] bg-[linear-gradient(120deg,#f4f0e7_0%,#f1eee8_45%,#ece8de_100%)] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#dce5d8]/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-[-32px] h-56 w-56 rounded-full bg-[#f0dcc0]/35 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-transparent via-[#cea160] to-transparent" />

            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6">
                <SectionEyebrow label={ctaEyebrow} />
                <h3 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[#171717] md:text-4xl">
                  {ctaTitle}
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#5f5f66] md:text-base">
                  {ctaDescription}
                </p>

                <div className="mt-7 flex flex-wrap gap-2.5">
                  {ctaReservationButtonEnabled ? (
                    <Button asChild className="rounded-full bg-[#1f3a2e] text-white hover:bg-[#1a3127]">
                      <Link href={ctaReservationButtonHref}>{ctaReservationButtonLabel}</Link>
                    </Button>
                  ) : null}
                  {ctaPhoneButtonEnabled && companyPhoneHref ? (
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full border-[#d8cbb8] bg-[#f8f5ef] text-[#202025] hover:bg-[#f1ece3]"
                    >
                      <a href={companyPhoneHref}>
                        <PhoneCall className="h-4 w-4" />
                        {`${ctaPhoneButtonPrefix} ${companyPhone}`}
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="overflow-hidden rounded-[20px] border border-[#ddd3c3] bg-white/70 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ctaImageUrl1 || aboutImages[0] || heroPrimaryImage}
                      alt="Aden Bungalov CTA görsel 1"
                      className="h-[290px] w-full object-cover sm:h-[340px] lg:h-[380px]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="overflow-hidden rounded-[20px] border border-[#ddd3c3] bg-white/70 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ctaImageUrl2 || aboutImages[1] || heroSliderImages[0] || heroPrimaryImage}
                        alt="Aden Bungalov CTA görsel 2"
                        className="h-[150px] w-full object-cover sm:h-[170px] lg:h-[184px]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <div className="rounded-[20px] border border-[#ddd3c3] bg-white/70 px-4 py-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f725f]">{ctaResponseTitle}</p>
                      <p className="mt-2 text-sm leading-6 text-[#49494f]">
                        {ctaResponseDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SiteSection>
      </DeferredSection>

      <DeferredSection placeholderClassName="min-h-[560px]">
        <FaqSection
          items={faqItems}
          eyebrow={faqEyebrow}
          title={faqTitle}
          description={faqDescription}
          supportTitle={faqSupportTitle}
          supportDescription={faqSupportDescription}
          supportButtonLabel={faqSupportButtonLabel}
        />
        {faqItems && faqItems.length > 0 && (
          <FaqJsonLd
            items={faqItems.map((item) => ({
              question: item.question,
              answer: item.answer,
            }))}
          />
        )}
      </DeferredSection>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": settings?.companyName || "Aden Bungalov",
            "image": heroPrimaryImage || "https://www.adenbungalov.com/icons/icon-512x512.png",
            "@id": "https://www.adenbungalov.com",
            "url": "https://www.adenbungalov.com",
            "telephone": settings?.phone || "",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": settings?.address || "Sapanca",
              "addressLocality": "Sakarya",
              "addressCountry": "TR"
            },
            "priceRange": "₺₺",
          }),
        }}
      />
    </div>
  )
}