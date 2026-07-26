import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentCustomer } from "@/lib/auth/customer-session"
import { isUserSystemEnabled } from "@/lib/site/modules"
import { AuthShell } from "@/components/site/auth/auth-shell"
import { RegisterForm } from "@/components/site/auth/register-form"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: { absolute: "Ücretsiz Üyelik Oluştur | Aden Bungalov Sapanca" },
  description:
    "Aden Bungalov Sapanca misafir hesabınızı ücretsiz oluşturun; rezervasyon geçmişinizi yönetin, üyeye özel indirim kuponlarından anında yararlanın.",
  alternates: { canonical: "/kayit-ol" },
  openGraph: {
    title: "Ücretsiz Üyelik Oluştur | Aden Bungalov Sapanca",
    description:
      "Sapanca Aden Bungalov misafir hesabı oluşturun ve üyeye özel indirim fırsatlarından yararlanın.",
    url: "https://www.adenbungalov.com/kayit-ol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ücretsiz Üyelik Oluştur | Aden Bungalov Sapanca",
    description: "Misafir hesabınızı oluşturun, üyeye özel indirimlerden yararlanın.",
  },
}

export default async function KayitOlPage() {
  const isEnabled = await isUserSystemEnabled()
  if (!isEnabled) {
    redirect("/")
  }

  const customer = await getCurrentCustomer()
  if (customer) {
    redirect("/hesabim")
  }
  return (
    <AuthShell
      title="Üyeliğinizi oluşturun, ayrıcalıkları keşfedin."
      description="Ücretsiz müşteri hesabınızı açın; rezervasyon geçmişiniz, size özel indirim kuponlarınız ve iletişim tercihleriniz tek yerde toplansın."
      breadcrumbName="Hesap Oluştur"
      breadcrumbUrl="https://www.adenbungalov.com/kayit-ol"
      cardTitle="Aden Bungalov Hesabı"
      cardDescription="Giriş yapın veya yeni bir müşteri hesabı oluşturun."
      activeTab="register"
    >
      <RegisterForm />
    </AuthShell>
  )
}
