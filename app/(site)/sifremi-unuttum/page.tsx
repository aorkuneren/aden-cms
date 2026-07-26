import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthShell } from "@/components/site/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/site/auth/forgot-password-form"
import { isUserSystemEnabled } from "@/lib/site/modules"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  // 47 karakter
  title: { absolute: "Şifremi Unuttum | Aden Bungalov Sapanca Portalı" },
  // 139 karakter
  description:
    "Aden Bungalov misafir hesabınızın şifresini unuttuysanız e-posta adresinizi girerek güvenli şifre sıfırlama bağlantısı talep edebilirsiniz.",
  alternates: { canonical: "/sifremi-unuttum" },
  openGraph: {
    title: "Şifremi Unuttum | Aden Bungalov Sapanca",
    description: "Misafir hesabınızın şifresini e-posta ile güvenle sıfırlayın.",
    url: "https://www.adenbungalov.com/sifremi-unuttum",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Şifremi Unuttum | Aden Bungalov Sapanca",
    description: "Misafir hesabınızın şifresini e-posta ile güvenle sıfırlayın.",
  },
}

export default async function SifremiUnuttumPage() {
  if (!(await isUserSystemEnabled())) {
    redirect("/")
  }

  return (
    <AuthShell
      title="Şifrenizi güvenle yenileyin."
      description="Hesabınıza kayıtlı e-posta adresinizi girin; şifrenizi yenilemeniz için size güvenli bir sıfırlama bağlantısı gönderelim."
      breadcrumbName="Şifremi Unuttum"
      breadcrumbUrl="https://www.adenbungalov.com/sifremi-unuttum"
      cardEyebrow="Şifre Sıfırlama"
      cardTitle="Şifremi Unuttum"
      cardDescription="Sıfırlama bağlantısı e-posta adresinize gönderilir."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
