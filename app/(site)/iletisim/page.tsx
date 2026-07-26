import type { Metadata } from "next"
import Link from "next/link"
import {
  ChevronRight,
  Mail,
  MapPin,
  PhoneCall,
} from "lucide-react"
import { WhatsappIcon } from "@/components/site/brand-icons"
import { ContactInquiryForm } from "@/components/site/contact-inquiry-form"
import { ContactMethodCard } from "@/components/site/contact-method-card"
import { BreadcrumbJsonLd } from "@/components/site/json-ld"
import { normalizePhoneHref } from "@/lib/site/b2c"
import { getSiteContactConfig } from "@/lib/site/contact-config"
import { getCmsField, getCmsPageContent } from "@/lib/site/page-content"
import { getSitePublicContent } from "@/lib/site/public-content"
import { resolvePageSeo } from "@/lib/site/page-seo"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolvePageSeo("/iletisim", {
    title: "İletişim & Konum Adres | Aden Bungalov Sapanca",
    description:
      "Aden Bungalov Sapanca iletişim bilgileri: telefon numarası, WhatsApp destek hattı, e-posta, açık adres ve harita konumu. Bizimle hemen iletişime geçin.",
  })

  return {
    title: { absolute: seo.title },
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: "/iletisim" },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: "https://www.adenbungalov.com/iletisim",
    },
  }
}

export default async function ContactPage() {
  const [{ settings }, cmsPageContent, contact] = await Promise.all([
    getSitePublicContent(),
    getCmsPageContent("iletisim"),
    getSiteContactConfig(),
  ])

  const phone = contact.phone
  const email = contact.email
  const address = contact.address
  const heroEyebrow = getCmsField(cmsPageContent, "contact-hero", "eyebrow", "İletişim")
  const heroTitle = getCmsField(cmsPageContent, "contact-hero", "title", "Bizimle İletişime Geçin")
  const heroDescription = getCmsField(
    cmsPageContent,
    "contact-hero",
    "description",
    "Sapanca'nın kalbinde doğa ile iç içe unutulmaz bir tatil deneyimi için sorularınızı, rezervasyon taleplerinizi veya önerilerinizi iletişim kanallarımız üzerinden iletebilirsiniz."
  )
  const cardText = (field: string, fallback: string) =>
    getCmsField(cmsPageContent, "contact-cards", field, fallback)
  const typeText = (field: string, fallback: string) =>
    getCmsField(cmsPageContent, "contact-info", field, fallback)
  const formText = (field: string, fallback: string) =>
    getCmsField(cmsPageContent, "form-fields", field, fallback)
  const contactRegionTitle = getCmsField(cmsPageContent, "contact-region", "title", "Harita Konumu")
  const contactRegionDescription = getCmsField(cmsPageContent, "contact-region", "description")
  const whatsappPhone = contact.whatsappPhone
  const whatsappHref = whatsappPhone ? `https://wa.me/${whatsappPhone}` : "https://wa.me/"
  const phoneHref = normalizePhoneHref(phone)
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 pb-28 sm:px-6 md:py-10 md:pb-16 space-y-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "https://www.adenbungalov.com" },
          { name: "İletişim", url: "https://www.adenbungalov.com/iletisim" },
        ]}
      />

      {/* Header & Breadcrumb */}
      <section className="space-y-4 border-b border-[#e2dcd2] pb-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[#66666d] font-medium">
            <li>
              <Link href="/" className="transition hover:text-[#18261e]">
                Ana Sayfa
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5 text-[#b0b0b8]" />
            </li>
            <li className="font-bold text-[#18261e]">İletişim & Konum</li>
          </ol>
        </nav>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5c714e]">
            {heroEyebrow}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#18261e] sm:text-3xl lg:text-4xl">
            {heroTitle}
          </h1>
          <p className="text-xs text-[#55555e] sm:text-sm max-w-3xl leading-relaxed">
            {heroDescription}
          </p>
        </div>
      </section>

      {/* Contact Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ContactMethodCard
          icon={WhatsappIcon as unknown as typeof PhoneCall}
          title={cardText("whatsappTitle", "WhatsApp Destek")}
          description={cardText("whatsappDescription", "Ort. 2 Dakikada Hızlı Yanıt")}
          href={whatsappHref || undefined}
          external
          isHighlight
        />
        <ContactMethodCard
          icon={PhoneCall}
          title={cardText("phoneTitle", "Telefon İletişim")}
          description={phone}
          href={phoneHref || undefined}
        />
        <ContactMethodCard
          icon={Mail}
          title={cardText("emailTitle", "E-Posta Adresi")}
          description={email}
          href={email ? `mailto:${email}` : undefined}
        />
        <ContactMethodCard
          icon={MapPin}
          title={cardText("locationTitle", "Tesis Konumu")}
          description={address}
        />
      </section>

      {/* Main Grid: Form on Left + Map & Hours on Right */}
      <section className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left: Contact Form (lg:col-span-7) */}
        <div className="lg:col-span-7">
          <ContactInquiryForm
            typeLabels={{
              CONTACT: typeText("communicationLabel", "İletişim"),
              COMPLAINT: typeText("complaintLabel", "Şikayet"),
              REQUEST: typeText("requestLabel", "Talep"),
              SUGGESTION: typeText("suggestionLabel", "Öneri / İstek"),
            }}
            typeDescriptions={{
              CONTACT: typeText("communication", "Genel bilgi ve fiyat soruları"),
              COMPLAINT: typeText("complaint", "Hizmet deneyimi ile ilgili bildirimler"),
              REQUEST: typeText("request", "Rezervasyon, tarih değişikliği, özel istekler"),
              SUGGESTION: typeText("suggestion", "Geliştirme fikirleri ve memnuniyet notları"),
            }}
            fieldTexts={{
              typeLabel: formText("typeLabel", "Form Türü"),
              nameLabel: formText("nameLabel", "Ad Soyad"),
              namePlaceholder: formText("namePlaceholder", "Örn: Ahmet Yılmaz"),
              phoneLabel: formText("phoneLabel", "Telefon"),
              phonePlaceholder: formText("phonePlaceholder", "0532 123 45 67"),
              emailLabel: formText("emailLabel", "E-posta"),
              emailPlaceholder: formText("emailPlaceholder", "ornek@email.com"),
              subjectLabel: formText("subjectLabel", "Konu"),
              subjectPlaceholder: formText("subjectPlaceholder", "Örn: Hafta Sonu Konaklama İsteği"),
              messageLabel: formText("messageLabel", "Mesajınız"),
              messagePlaceholder: formText(
                "messagePlaceholder",
                "Sorunuzu veya talebinizi buraya detaylıca yazabilirsiniz..."
              ),
              submittingLabel: getCmsField(
                cmsPageContent,
                "form-settings",
                "submittingLabel",
                "Gönderiliyor..."
              ),
            }}
            formTitle={getCmsField(cmsPageContent, "form-settings", "formTitle", "Bize Mesaj Gönderin")}
            successMessage={getCmsField(
              cmsPageContent,
              "form-settings",
              "successMessage",
              "Mesajınız başarıyla iletildi."
            )}
            errorMessage={getCmsField(
              cmsPageContent,
              "form-settings",
              "errorMessage",
              "Mesaj gönderiminde hata oluştu."
            )}
            submitLabel={getCmsField(cmsPageContent, "form-settings", "submitLabel", "Mesajı Gönder")}
          />
        </div>

        {/* Right: Map Card (lg:col-span-5) */}
        <div className="lg:col-span-5">
          {/* Map Embed Card */}
          <div className="rounded-2xl border border-[#e2dcd2] bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#f0e8db] px-4 py-3">
              <span className="text-xs font-bold text-[#18261e] flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-700" />
                {contactRegionTitle}
              </span>
              <span className="text-[10px] text-[#777780] font-semibold">{address}</span>
            </div>
            <div className="overflow-hidden">
              <iframe
                title="Aden Bungalov Harita Konumu"
                src={mapSrc}
                className="h-[430px] w-full border-0 block"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            {contactRegionDescription ? (
              <p className="border-t border-[#f0e8db] px-4 py-3 text-xs leading-relaxed text-[#66666d]">
                {contactRegionDescription}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "İletişim",
            "description": "Sapanca Aden Bungalov iletişim bilgileri ve konum detayları.",
            "url": "https://www.adenbungalov.com/iletisim",
            "mainEntity": {
              "@type": "LocalBusiness",
              "name": settings?.companyName || "Aden Bungalov Sapanca",
              "telephone": phone,
              "email": email,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": address,
                "addressCountry": "TR"
              }
            }
          }),
        }}
      />
    </div>
  )
}
