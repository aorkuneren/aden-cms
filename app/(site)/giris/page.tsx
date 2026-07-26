import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentCustomer } from "@/lib/auth/customer-session"
import { isUserSystemEnabled } from "@/lib/site/modules"
import { AuthShell } from "@/components/site/auth/auth-shell"
import { LoginForm } from "@/components/site/auth/login-form"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: { absolute: "Üye Girişi | Aden Bungalov Sapanca Misafir Portalı" },
  description:
    "Aden Bungalov misafir portalına giriş yapın; Sapanca bungalov rezervasyonlarınızı görüntüleyin, profil bilgilerinizi ve indirim kuponlarınızı yönetin.",
  alternates: { canonical: "/giris" },
  openGraph: {
    title: "Üye Girişi | Aden Bungalov Sapanca",
    description:
      "Sapanca Aden Bungalov misafir portalına giriş yaparak rezervasyonlarınızı tek ekrandan yönetin.",
    url: "https://www.adenbungalov.com/giris",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Üye Girişi | Aden Bungalov Sapanca",
    description: "Rezervasyonlarınızı yönetmek için misafir portalına giriş yapın.",
  },
}

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; kayit?: string }>
}) {
  const isEnabled = await isUserSystemEnabled()
  if (!isEnabled) {
    redirect("/")
  }

  const customer = await getCurrentCustomer()
  if (customer) {
    redirect("/hesabim")
  }

  const { tab, kayit } = await searchParams
  if (tab === "register") redirect("/kayit-ol")
  if (tab === "forgot-password") redirect("/sifremi-unuttum")

  return (
    <AuthShell
      title="Rezervasyonlarınızı tek ekrandan yönetin."
      description="Giriş yaptıktan sonra rezervasyon durumunuzu takip edebilir, detaylarını görüntüleyebilir ve hesabınızla ilgili ayarları güncelleyebilirsiniz."
      breadcrumbName="Üye Girişi"
      breadcrumbUrl="https://www.adenbungalov.com/giris"
      cardTitle="Aden Bungalov Hesabı"
      cardDescription="Giriş yapın veya yeni bir müşteri hesabı oluşturun."
      activeTab="login"
    >
      <LoginForm justRegistered={kayit === "tamam"} />
    </AuthShell>
  )
}
