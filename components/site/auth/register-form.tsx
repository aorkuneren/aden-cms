"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { AuthFeedback } from "@/components/site/auth/auth-feedback"
import {
  EmailField,
  NameField,
  PasswordField,
  PhoneField,
} from "@/components/site/auth/auth-fields"
import { LegalConsentDialog } from "@/components/site/auth/legal-consent-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirm,
  validatePhoneTR,
} from "@/lib/form-validation"
import { customerRegisterAction } from "@/app/(site)/auth/actions"

type FieldKey = "name" | "email" | "phone" | "password" | "passwordConfirm" | "terms"
type FieldErrors = Partial<Record<FieldKey, string>>

export function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const passwordConfirmRef = useRef<HTMLInputElement>(null)

  const validate = (): FieldErrors => ({
    name: validateFullName(name),
    email: validateEmail(email),
    // Üyelik iletişimi cep telefonu üzerinden yürüdüğü için sabit hat kabul edilmez
    phone: validatePhoneTR(phone, { mobileOnly: true }),
    password: validatePassword(password),
    passwordConfirm: validatePasswordConfirm(password, passwordConfirm),
    terms: acceptTerms
      ? undefined
      : "Devam etmek için kullanım şartlarını ve gizlilik politikasını onaylayın.",
  })

  const handleBlur = (field: FieldKey) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setFieldErrors((prev) => ({ ...prev, [field]: validate()[field] }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    const nextErrors = validate()
    setFieldErrors(nextErrors)
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      passwordConfirm: true,
      terms: true,
    })

    // Görsel sıraya göre ilk hatalı alana odaklan (WCAG odak yönetimi)
    const order: Array<[FieldKey, React.RefObject<HTMLInputElement | null>]> = [
      ["name", nameRef],
      ["email", emailRef],
      ["phone", phoneRef],
      ["password", passwordRef],
      ["passwordConfirm", passwordConfirmRef],
    ]
    const firstInvalid = order.find(([key]) => nextErrors[key])
    if (firstInvalid) {
      firstInvalid[1].current?.focus()
      return
    }
    if (nextErrors.terms) {
      setError(nextErrors.terms)
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("email", email)
      formData.append("phone", phone)
      formData.append("password", password)
      await customerRegisterAction(formData)
    } catch {
      setError("Hesap oluşturulamadı. E-posta adresi veya telefon adresi zaten kullanımda olabilir.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
      <NameField
        id="register-name"
        ref={nameRef}
        label="Ad Soyad"
        value={name}
        onValueChange={setName}
        onBlur={() => handleBlur("name")}
        error={touched.name ? fieldErrors.name : undefined}
        required
      />

      <div className="grid gap-3.5 sm:grid-cols-2">
        <EmailField
          id="register-email"
          ref={emailRef}
          label="E-posta"
          value={email}
          onValueChange={setEmail}
          onBlur={() => handleBlur("email")}
          error={touched.email ? fieldErrors.email : undefined}
          helperText="Rezervasyon onayları buraya gönderilir."
          required
        />

        <PhoneField
          id="register-phone"
          ref={phoneRef}
          label="Cep Telefonu"
          value={phone}
          onValueChange={setPhone}
          onBlur={() => handleBlur("phone")}
          error={touched.phone ? fieldErrors.phone : undefined}
          helperText="Giriş günü iletişim için kullanılır."
          required
        />
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <PasswordField
          id="register-password"
          ref={passwordRef}
          label="Şifre"
          autoComplete="off"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => handleBlur("password")}
          error={touched.password ? fieldErrors.password : undefined}
          helperText="En az 6 karakter."
          required
        />

        <PasswordField
          id="register-password-confirm"
          ref={passwordConfirmRef}
          label="Şifre Tekrarı"
          autoComplete="off"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          onBlur={() => handleBlur("passwordConfirm")}
          error={touched.passwordConfirm ? fieldErrors.passwordConfirm : undefined}
          required
        />
      </div>

      <div className="flex items-start gap-2 pt-0.5">
        <Checkbox
          id="accept-terms"
          checked={acceptTerms}
          onCheckedChange={(checked) => {
            setAcceptTerms(checked === true)
            if (checked === true) {
              setFieldErrors((prev) => ({ ...prev, terms: undefined }))
              setError("")
            }
          }}
          aria-describedby={touched.terms && fieldErrors.terms ? "accept-terms-error" : undefined}
          // after:* ile görsel boyut korunurken dokunma alanı büyütülür
          className="relative mt-0.5 h-4 w-4 shrink-0 border-[#c9c0b0] bg-white after:absolute after:-inset-3 after:content-[''] data-[state=checked]:border-[#1f3a2e] data-[state=checked]:bg-[#1f3a2e]"
        />
        <div className="min-w-0 text-[13px] leading-relaxed text-[#4f4f57]">
          <LegalConsentDialog variant="terms" onAccept={() => setAcceptTerms(true)} /> ve{" "}
          <LegalConsentDialog variant="privacy" onAccept={() => setAcceptTerms(true)} /> okudum,
          kabul ediyorum.
          {touched.terms && fieldErrors.terms ? (
            <span id="accept-terms-error" role="alert" className="mt-1 block text-xs text-[#a13b2f]">
              {fieldErrors.terms}
            </span>
          ) : null}
        </div>
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
            Hesap Oluşturuluyor...
          </>
        ) : (
          "Hesap Oluştur"
        )}
      </Button>

      <p className="text-center text-[13px] text-[#75756f]">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="font-medium text-[#2b5a44] underline-offset-4 hover:underline">
          Giriş yapın
        </Link>
      </p>
    </form>
  )
}
