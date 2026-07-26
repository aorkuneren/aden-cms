import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentCustomer } from "@/lib/auth/customer-session"
import { isUserSystemEnabled } from "@/lib/site/modules"
import { CustomerAccountPanel } from "@/components/site/customer-account-panel"
import { PageIntro } from "@/components/site/page-intro"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: { absolute: "Hesabım | Aden Bungalov Sapanca Misafir Portalı" },
  description:
    "Aden Bungalov misafir panelinden rezervasyonlarınızı görüntüleyin, profil bilgilerinizi güncelleyin ve size özel indirim kuponlarınızı yönetin.",
  alternates: { canonical: "/hesabim" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

const TAB_BY_SLUG = {
  rezervasyonlarim: "reservations",
  profilim: "profile",
  kuponlarim: "coupons",
  guvenlik: "security",
} as const

export default async function HesabimPage({
  searchParams,
}: {
  searchParams: Promise<{ bolum?: string }>
}) {
  const isEnabled = await isUserSystemEnabled()
  if (!isEnabled) {
    redirect("/")
  }

  const customer = await getCurrentCustomer()
  if (!customer) {
    redirect("/giris")
  }

  const { bolum } = await searchParams
  const initialTab = TAB_BY_SLUG[bolum as keyof typeof TAB_BY_SLUG] ?? "reservations"

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 pb-28 sm:px-6 md:py-12 md:pb-16">
      <PageIntro
        variant="split"
        title={`Hoş Geldiniz, ${customer.name}`}
        description="Aktif ve geçmiş konaklamalarınızı takip edin, profil bilgilerinizi güncelleyin ve üyeliğinize tanımlı indirim fırsatlarını inceleyin."
      />

      <div className="mt-8">
        <CustomerAccountPanel initialTab={initialTab} />
      </div>
    </div>
  )
}
