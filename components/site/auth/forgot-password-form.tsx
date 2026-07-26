"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { AuthFeedback } from "@/components/site/auth/auth-feedback"
import { EmailField } from "@/components/site/auth/auth-fields"
import { Button } from "@/components/ui/button"
import { validateEmail } from "@/lib/form-validation"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [sentTo, setSentTo] = useState("")

  const emailRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    const nextError = validateEmail(email)
    setFieldError(nextError)
    setTouched(true)
    if (nextError) {
      emailRef.current?.focus()
      return
    }

    setSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 700))
      setSentTo(email.trim())
    } catch {
      setError("Şifre sıfırlama talebi gönderilemedi. Lütfen tekrar deneyin.")
    } finally {
      setSubmitting(false)
    }
  }

  // Başarı durumu: form yerine sonraki adımı anlatan sade bir ekran
  if (sentTo) {
    return (
      <div className="space-y-3.5">
        <AuthFeedback success="Şifre sıfırlama bağlantısı e-posta adresinize gönderildi." />

        <div className="space-y-2 text-[13px] leading-relaxed text-[#5d5d64]">
          <p>
            <span className="font-medium text-[#1a1a1a]">{sentTo}</span> adresine şifrenizi
            yenilemeniz için bir bağlantı gönderdik. Bağlantı 30 dakika geçerlidir.
          </p>
          <p>E-posta gelmediyse spam/gereksiz klasörünü kontrol edin.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            asChild
            className="h-10 flex-1 rounded-lg bg-[#1f3a2e] text-sm font-medium text-white hover:bg-[#15271f]"
          >
            <Link href="/giris">Giriş Ekranına Dön</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSentTo("")
              setTouched(false)
            }}
            className="h-10 flex-1 rounded-lg border-[#e2dacc] bg-white text-sm font-medium text-[#4f4f57] hover:bg-[#f8f4ec]"
          >
            Tekrar Gönder
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
      <EmailField
        id="forgot-email"
        ref={emailRef}
        label="E-posta"
        value={email}
        onValueChange={setEmail}
        onBlur={() => {
          setTouched(true)
          setFieldError(validateEmail(email))
        }}
        error={touched ? fieldError : undefined}
        helperText="Hesabınızı oluştururken kullandığınız adresi girin."
        required
      />

      <AuthFeedback error={error} />

      <Button
        type="submit"
        disabled={submitting}
        className="h-10 w-full rounded-lg bg-[#1f3a2e] text-sm font-medium text-white transition hover:bg-[#15271f] disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gönderiliyor...
          </>
        ) : (
          "Sıfırlama Bağlantısı Gönder"
        )}
      </Button>

      <p className="text-center text-[13px] text-[#75756f]">
        Şifrenizi hatırladınız mı?{" "}
        <Link href="/giris" className="font-medium text-[#2b5a44] underline-offset-4 hover:underline">
          Giriş yapın
        </Link>
      </p>
    </form>
  )
}
