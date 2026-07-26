"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatFullName, formatPhoneTR, formatTcKimlik } from "@/lib/form-validation"
import { cn } from "@/lib/utils"

/**
 * Site genelindeki form alanı görünümü.
 * Mobilde 16px (iOS otomatik yakınlaştırmayı engeller), masaüstünde 14px.
 */
const FIELD_CLASS =
  "h-10 rounded-lg border-[#e2dacc] bg-[#fbf9f5] px-3 text-base text-[#1a1a1a] placeholder:text-[#a8a396] md:text-sm"

type BaseFieldProps = {
  id: string
  label: string
  error?: string
  helperText?: string
  className?: string
}

type TextFieldProps = BaseFieldProps & Omit<React.ComponentProps<"input">, "id" | "className">

function FieldMessages({
  id,
  helperText,
  error,
}: {
  id: string
  helperText?: string
  error?: string
}) {
  return (
    <>
      {helperText && !error ? (
        <p id={`${id}-helper`} className="text-xs text-[#8a857a]">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-[#a13b2f]">
          {error}
        </p>
      ) : null}
    </>
  )
}

function describedBy(id: string, helperText?: string, error?: string) {
  return (
    [helperText ? `${id}-helper` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined
  )
}

/** Etiket + input + yardım metni + alan altı hata mesajı. */
export function TextField({
  id,
  label,
  error,
  helperText,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="text-[13px] text-[#3d3d44]">
        {label}
      </Label>
      <Input
        id={id}
        autoComplete="off"
        autoCorrect="off"
        // Şifre yöneticilerinin de alanı atlaması için
        data-form-type="other"
        data-lpignore="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, helperText, error)}
        className={cn(FIELD_CLASS, error && "border-[#c0563f] bg-[#fdf6f4]")}
        {...inputProps}
      />
      <FieldMessages id={id} helperText={helperText} error={error} />
    </div>
  )
}

type MaskedFieldProps = Omit<TextFieldProps, "onChange" | "value"> & {
  value: string
  /** Maskelenmiş değeri döndürür */
  onValueChange: (value: string) => void
}

/**
 * Türkiye telefon maskesi: yazarken "0532 123 45 67" biçimine dönüşür.
 * type="tel" + inputMode="tel" ile mobilde numara klavyesi açılır.
 */
export function PhoneField({ value, onValueChange, ...props }: MaskedFieldProps) {
  return (
    <TextField
      type="tel"
      inputMode="tel"
      placeholder="0532 123 45 67"
      maxLength={14}
      value={value}
      onChange={(event) => onValueChange(formatPhoneTR(event.target.value))}
      {...props}
    />
  )
}

/** E-posta alanı: otomatik büyük harf ve yazım denetimi kapalı, boşluk temizlenir. */
export function EmailField({ value, onValueChange, ...props }: MaskedFieldProps) {
  return (
    <TextField
      type="email"
      inputMode="email"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      placeholder="ornek@email.com"
      value={value}
      onChange={(event) => onValueChange(event.target.value.replace(/\s/g, ""))}
      {...props}
    />
  )
}

/** Ad soyad alanı: rakam ve özel karakterler yazılırken ayıklanır. */
export function NameField({ value, onValueChange, ...props }: MaskedFieldProps) {
  return (
    <TextField
      type="text"
      autoCapitalize="words"
      value={value}
      onChange={(event) => onValueChange(formatFullName(event.target.value))}
      {...props}
    />
  )
}

/** T.C. kimlik alanı: yalnızca 11 haneli rakam kabul eder. */
export function TcKimlikField({ value, onValueChange, ...props }: MaskedFieldProps) {
  return (
    <TextField
      type="text"
      inputMode="numeric"
      maxLength={11}
      value={value}
      onChange={(event) => onValueChange(formatTcKimlik(event.target.value))}
      {...props}
    />
  )
}

/** Göster/gizle düğmeli şifre alanı. */
export function PasswordField({
  id,
  label,
  error,
  helperText,
  className,
  ...inputProps
}: TextFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="text-[13px] text-[#3d3d44]">
        {label}
      </Label>

      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="off"
          autoCorrect="off"
          data-form-type="other"
          data-lpignore="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, helperText, error)}
          className={cn(FIELD_CLASS, "pr-10", error && "border-[#c0563f] bg-[#fdf6f4]")}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#8a857a] transition hover:text-[#1a1a1a]"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Eye aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
      </div>

      <FieldMessages id={id} helperText={helperText} error={error} />
    </div>
  )
}
