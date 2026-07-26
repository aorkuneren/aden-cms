"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { AuthFeedback } from "@/components/site/auth/auth-feedback"
import { EmailField, PasswordField } from "@/components/site/auth/auth-fields"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { validateEmail } from "@/lib/form-validation"
import { customerLoginAction } from "@/app/(site)/auth/actions"

type FieldErrors = {
  email?: string
  password?: string
}

export function LoginForm({ justRegistered = false }: { justRegistered?: boolean }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(
    justRegistered ? "Kaydınız tamamlandı. Belirlediğiniz şifreyle giriş yapabilirsiniz." : ""
  )

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const validate = (): FieldErrors => ({
    email: validateEmail(email),
    // Girişte şifre kuralları uygulanmaz; yalnızca boş olup olmadığına bakılır
    password: password ? undefined : "Şifrenizi giriniz.",
  })

  /** Kullanıcı alandan çıkınca doğrula (her tuş vuruşunda değil). */
  const handleBlur = (field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setFieldErrors((prev) => ({ ...prev, [field]: validate()[field] }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    const nextErrors = validate()
    setFieldErrors(nextErrors)
    setTouched({ email: true, password: true })

    if (nextErrors.email || nextErrors.password) {
      // İlk hatalı alana odaklan (WCAG odak yönetimi)
      if (nextErrors.email) emailRef.current?.focus()
      else passwordRef.current?.focus()
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)
      await customerLoginAction(formData)
    } catch {
      setError("Giriş yapılamadı. E-posta adresi veya parola hatalı.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
      <EmailField
        id="login-email"
        ref={emailRef}
        label="E-posta"
        value={email}
        onValueChange={setEmail}
        onBlur={() => handleBlur("email")}
        error={touched.email ? fieldErrors.email : undefined}
        required
      />

      <PasswordField
        id="login-password"
        ref={passwordRef}
        label="Şifre"
        autoComplete="off"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        onBlur={() => handleBlur("password")}
        error={touched.password ? fieldErrors.password : undefined}
        required
      />

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-0.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            // after:* ile görsel boyut korunurken dokunma alanı büyütülür
            className="relative h-4 w-4 border-[#c9c0b0] after:absolute after:-inset-3 after:content-[''] data-[state=checked]:border-[#1f3a2e] data-[state=checked]:bg-[#1f3a2e]"
          />
          <Label
            htmlFor="remember-me"
            className="cursor-pointer text-[13px] font-normal text-[#4f4f57]"
          >
            Beni hatırla
          </Label>
        </div>

        <Link
          href="/sifremi-unuttum"
          className="text-[13px] text-[#2b5a44] underline-offset-4 hover:underline"
        >
          Şifremi unuttum
        </Link>
      </div>

      <AuthFeedback error={error} success={success} />

      <Button
        type="submit"
        disabled={submitting}
        className="h-10 w-full rounded-lg bg-[#1f3a2e] text-sm font-medium text-white transition hover:bg-[#15271f] disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Giriş Yapılıyor...
          </>
        ) : (
          "Giriş Yap"
        )}
      </Button>

      <p className="text-center text-[13px] text-[#75756f]">
        Hesabınız yok mu?{" "}
        <Link
          href="/kayit-ol"
          className="font-medium text-[#2b5a44] underline-offset-4 hover:underline"
        >
          Hesap oluşturun
        </Link>
      </p>
    </form>
  )
}
