"use client"

import { useState } from "react"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  formatFullName,
  formatPhoneTR,
  validateEmail,
  validateFullName,
  validatePhoneTR,
  validateRequiredText,
} from "@/lib/form-validation"

type ContactType = "CONTACT" | "COMPLAINT" | "REQUEST" | "SUGGESTION"

/** Formdaki etiket ve örnek metinlerin panelden gelmeyen varsayılanları. */
const DEFAULT_FIELD_TEXTS = {
  typeLabel: "Form Türü",
  typePlaceholder: "Form Türü Seçiniz",
  nameLabel: "Ad Soyad",
  namePlaceholder: "Örn: Ahmet Yılmaz",
  phoneLabel: "Telefon",
  phonePlaceholder: "0532 123 45 67",
  emailLabel: "E-posta",
  emailPlaceholder: "ornek@email.com",
  subjectLabel: "Konu",
  subjectPlaceholder: "Örn: Hafta Sonu Konaklama İsteği",
  messageLabel: "Mesajınız",
  messagePlaceholder: "Sorunuzu veya talebinizi buraya detaylıca yazabilirsiniz...",
  submittingLabel: "Gönderiliyor...",
}

type FieldTextKey = keyof typeof DEFAULT_FIELD_TEXTS

type ContactInquiryFormProps = {
  typeLabels?: Partial<Record<ContactType, string>>
  typeDescriptions?: Partial<Record<ContactType, string>>
  fieldTexts?: Partial<Record<FieldTextKey, string>>
  formTitle?: string
  successMessage?: string
  errorMessage?: string
  submitLabel?: string
}

/** Boş bırakılan panel alanları varsayılan metne düşer. */
function mergeFieldTexts(overrides?: Partial<Record<FieldTextKey, string>>) {
  const merged = { ...DEFAULT_FIELD_TEXTS }
  for (const [key, value] of Object.entries(overrides ?? {})) {
    const trimmed = value?.trim()
    if (trimmed) merged[key as FieldTextKey] = trimmed
  }
  return merged
}

const TYPE_OPTIONS: Array<{ value: ContactType; label: string; description: string }> = [
  {
    value: "CONTACT",
    label: "İletişim",
    description: "Genel bilgi, fiyat ve müsaitlik soruları",
  },
  {
    value: "COMPLAINT",
    label: "Şikayet",
    description: "Hizmet deneyimi ile ilgili geri bildirimler",
  },
  {
    value: "REQUEST",
    label: "Talep",
    description: "Rezervasyon, tarih değişikliği ve özel istekler",
  },
  {
    value: "SUGGESTION",
    label: "Öneri / İstek",
    description: "Geliştirme önerileri ve memnuniyet mesajları",
  },
]

export function ContactInquiryForm({
  typeLabels,
  typeDescriptions,
  fieldTexts,
  formTitle = "Bize Mesaj Gönderin",
  successMessage = "Mesajınız başarıyla iletildi.",
  errorMessage = "Mesaj gönderiminde hata oluştu.",
  submitLabel = "Mesajı Gönder",
}: ContactInquiryFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [form, setForm] = useState({
    type: "CONTACT" as ContactType,
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const texts = mergeFieldTexts(fieldTexts)
  const typeOptions = TYPE_OPTIONS.map((option) => ({
    ...option,
    label: typeLabels?.[option.value]?.trim() || option.label,
    description: typeDescriptions?.[option.value]?.trim() || option.description,
  }))
  const selectedType = typeOptions.find((item) => item.value === form.type)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    const nextFieldErrors = {
      name: validateFullName(form.name),
      email: validateEmail(form.email, { required: false }),
      phone: validatePhoneTR(form.phone, { required: false }),
      message: validateRequiredText(form.message, "Mesaj", { minLength: 10 }),
    }
    setFieldErrors(nextFieldErrors)

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setError(errorMessage)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/public/iletisim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          honeypot: "",
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || errorMessage)
      }

      setSuccess(successMessage)
      setFieldErrors({})
      setForm({
        type: "CONTACT",
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      })
    } catch {
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e2dcd2] bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-[#f0e8db] px-5 py-3.5 space-y-0.5">
        <div className="text-base font-bold text-[#18261e] flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-emerald-700" />
          <span>{formTitle}</span>
        </div>
        {selectedType ? (
          <p className="text-xs text-[#66666e]">{selectedType.description}</p>
        ) : null}
      </div>

      <div className="px-5 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact-type" className="text-xs font-bold text-[#18261e]">
              {texts.typeLabel}
            </Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, type: value as ContactType }))
              }
            >
              <SelectTrigger id="contact-type" className="w-full h-11 rounded-xl border-[#dcd4c8] bg-[#fbf9f6] text-xs font-semibold text-[#18261e]">
                <SelectValue placeholder={texts.typePlaceholder} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#e2dcd2]">
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs font-medium">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="text-xs font-bold text-[#18261e]">
                {texts.nameLabel} *
              </Label>
              <Input
                id="contact-name"
                autoComplete="off"
                autoCapitalize="words"
                placeholder={texts.namePlaceholder}
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: formatFullName(event.target.value) }))
                }
                onBlur={() =>
                  setFieldErrors((prev) => ({ ...prev, name: validateFullName(form.name) }))
                }
                aria-invalid={fieldErrors.name ? true : undefined}
                aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
                className="h-11 rounded-xl border-[#dcd4c8] bg-[#fbf9f6] text-xs font-semibold text-[#18261e] aria-invalid:border-red-400"
                required
              />
              {fieldErrors.name ? (
                <p id="contact-name-error" role="alert" className="text-xs text-red-600 font-medium">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-phone" className="text-xs font-bold text-[#18261e]">
                {texts.phoneLabel}
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder={texts.phonePlaceholder}
                maxLength={14}
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: formatPhoneTR(event.target.value) }))
                }
                onBlur={() =>
                  setFieldErrors((prev) => ({
                    ...prev,
                    phone: validatePhoneTR(form.phone, { required: false }),
                  }))
                }
                aria-invalid={fieldErrors.phone ? true : undefined}
                aria-describedby={fieldErrors.phone ? "contact-phone-error" : undefined}
                className="h-11 rounded-xl border-[#dcd4c8] bg-[#fbf9f6] text-xs font-semibold text-[#18261e] aria-invalid:border-red-400"
              />
              {fieldErrors.phone ? (
                <p id="contact-phone-error" role="alert" className="text-xs text-red-600 font-medium">
                  {fieldErrors.phone}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-email" className="text-xs font-bold text-[#18261e]">
                {texts.emailLabel}
              </Label>
              <Input
                id="contact-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder={texts.emailPlaceholder}
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value.replace(/\s/g, "") }))
                }
                onBlur={() =>
                  setFieldErrors((prev) => ({
                    ...prev,
                    email: validateEmail(form.email, { required: false }),
                  }))
                }
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
                className="h-11 rounded-xl border-[#dcd4c8] bg-[#fbf9f6] text-xs font-semibold text-[#18261e] aria-invalid:border-red-400"
              />
              {fieldErrors.email ? (
                <p id="contact-email-error" role="alert" className="text-xs text-red-600 font-medium">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-subject" className="text-xs font-bold text-[#18261e]">
                {texts.subjectLabel}
              </Label>
              <Input
                id="contact-subject"
                placeholder={texts.subjectPlaceholder}
                value={form.subject}
                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                className="h-11 rounded-xl border-[#dcd4c8] bg-[#fbf9f6] text-xs font-semibold text-[#18261e]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-message" className="text-xs font-bold text-[#18261e]">
              {texts.messageLabel} *
            </Label>
            <Textarea
              id="contact-message"
              rows={5}
              maxLength={2000}
              placeholder={texts.messagePlaceholder}
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              onBlur={() =>
                setFieldErrors((prev) => ({
                  ...prev,
                  message: validateRequiredText(form.message, "Mesaj", { minLength: 10 }),
                }))
              }
              aria-invalid={fieldErrors.message ? true : undefined}
              aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
              className="rounded-xl border-[#dcd4c8] bg-[#fbf9f6] text-xs font-semibold text-[#18261e] aria-invalid:border-red-400"
              required
            />
            {fieldErrors.message ? (
              <p id="contact-message-error" role="alert" className="text-xs text-red-600 font-medium">
                {fieldErrors.message}
              </p>
            ) : null}
          </div>

          {error ? (
            <Alert className="border-red-200 bg-red-50 text-red-900 rounded-xl">
              <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
            </Alert>
          ) : null}

          {success ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 rounded-xl">
              <AlertDescription className="text-xs font-semibold">{success}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl btn-dark text-white font-bold text-xs sm:text-sm uppercase tracking-wide shadow-md transition gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{texts.submittingLabel}</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>{submitLabel}</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
