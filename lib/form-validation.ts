/**
 * Site genelinde kullanılan form doğrulama ve maskeleme yardımcıları.
 * Tüm mesajlar Türkçe ve kullanıcıya "nasıl düzelteceğini" söyleyecek şekildedir.
 */

/* ─────────────────────────── E-posta ─────────────────────────── */

// Yerel kısım + alan adı + en az 2 harfli TLD. Ardışık nokta ve baş/son nokta reddedilir.
const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/

/** Yaygın yazım hataları: kullanıcıya doğrusunu önermek için. */
const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "hotmail.co": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "yahoo.co": "yahoo.com",
  "outlook.co": "outlook.com",
  "windowslive.com": "hotmail.com",
}

export function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US")
}

/** Geçerliyse undefined, değilse hata mesajı döner. */
export function validateEmail(value: string, { required = true } = {}): string | undefined {
  const email = value.trim()
  if (!email) return required ? "E-posta adresinizi giriniz." : undefined

  if (!email.includes("@")) return "E-posta adresi @ işareti içermelidir."
  if (email.includes(" ")) return "E-posta adresi boşluk içeremez."
  if (email.includes("..")) return "E-posta adresinde arka arkaya nokta olamaz."
  if (!EMAIL_PATTERN.test(email)) {
    return "Geçerli bir e-posta adresi giriniz (örn. ornek@email.com)."
  }

  const domain = email.split("@")[1]?.toLocaleLowerCase("en-US") || ""
  const suggestion = COMMON_DOMAIN_TYPOS[domain]
  if (suggestion) return `Bunu mu demek istediniz: ${email.split("@")[0]}@${suggestion}?`

  return undefined
}

/* ─────────────────────────── Telefon (TR) ─────────────────────────── */

/**
 * Girilen değeri Türkiye numarası olarak normalize eder.
 * "+90 532...", "0532...", "532..." → 10 haneli ulusal numara ("5321234567").
 */
export function normalizePhoneTR(value: string) {
  let digits = value.replace(/\D/g, "")
  if (digits.startsWith("0090")) digits = digits.slice(4)
  else if (digits.startsWith("90") && digits.length > 10) digits = digits.slice(2)
  if (digits.startsWith("0")) digits = digits.slice(1)
  return digits.slice(0, 10)
}

/**
 * Yazarken uygulanan maske: "0532 123 45 67".
 * Kullanıcı silerken takılmaması için kısmi girişlerde de çalışır.
 */
export function formatPhoneTR(value: string) {
  const digits = normalizePhoneTR(value)
  if (!digits) return ""

  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)]
  return `0${parts.filter(Boolean).join(" ")}`.trimEnd()
}

/** Cep (5xx) ve sabit hat (2xx/3xx/4xx) alan kodları kabul edilir. */
const VALID_AREA_PREFIX = /^[2345]/

export function validatePhoneTR(
  value: string,
  { required = true, mobileOnly = false } = {}
): string | undefined {
  const digits = normalizePhoneTR(value)
  if (!digits) return required ? "Telefon numaranızı giriniz." : undefined

  if (digits.length < 10) return "Telefon numarası 10 haneli olmalıdır (örn. 0532 123 45 67)."
  if (!VALID_AREA_PREFIX.test(digits)) {
    return "Numara geçerli bir alan koduyla başlamalıdır (örn. 5xx, 2xx, 3xx)."
  }
  if (mobileOnly && !digits.startsWith("5")) {
    return "Lütfen bir cep telefonu numarası giriniz (5xx ile başlamalıdır)."
  }
  if (/^(\d)\1{9}$/.test(digits)) return "Geçerli bir telefon numarası giriniz."

  return undefined
}

/* ─────────────────────────── Ad Soyad ─────────────────────────── */

const NAME_PATTERN = /^[A-Za-zÇĞİÖŞÜçğıöşü\s'.-]+$/

export function validateFullName(value: string, { required = true } = {}): string | undefined {
  const name = value.trim().replace(/\s+/g, " ")
  if (!name) return required ? "Ad ve soyadınızı giriniz." : undefined
  if (name.length < 3) return "Ad soyad en az 3 karakter olmalıdır."
  if (!NAME_PATTERN.test(name)) return "Ad soyad yalnızca harf içerebilir."
  if (!name.includes(" ")) return "Lütfen adınızı ve soyadınızı birlikte giriniz."
  return undefined
}

/** Yazarken uygulanan maske: rakam ve özel karakterleri ayıklar, çoklu boşluğu teke indirir. */
export function formatFullName(value: string) {
  return value.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü\s'.-]/g, "").replace(/\s{2,}/g, " ")
}

/* ─────────────────────────── Şifre ─────────────────────────── */

export function validatePassword(
  value: string,
  { required = true, minLength = 6 } = {}
): string | undefined {
  if (!value) return required ? "Bir şifre belirleyiniz." : undefined
  if (value.length < minLength) return `Şifreniz en az ${minLength} karakter olmalıdır.`
  if (/^\s|\s$/.test(value)) return "Şifre boşlukla başlayamaz veya bitemez."
  return undefined
}

export function validatePasswordConfirm(
  password: string,
  confirm: string
): string | undefined {
  if (!confirm) return "Şifrenizi tekrar giriniz."
  if (password !== confirm) return "Şifre tekrarı ilk şifreyle aynı değil."
  return undefined
}

/* ─────────────────────────── T.C. Kimlik No ─────────────────────────── */

/** Sadece rakam, en fazla 11 hane. */
export function formatTcKimlik(value: string) {
  return value.replace(/\D/g, "").slice(0, 11)
}

/** Resmi algoritmaya göre kontrol (11 hane, 1. hane 0 olamaz, 10. ve 11. hane doğrulama). */
export function validateTcKimlik(value: string, { required = true } = {}): string | undefined {
  const digits = formatTcKimlik(value)
  if (!digits) return required ? "T.C. kimlik numaranızı giriniz." : undefined
  if (digits.length !== 11) return "T.C. kimlik numarası 11 haneli olmalıdır."
  if (digits[0] === "0") return "T.C. kimlik numarası 0 ile başlayamaz."

  const nums = digits.split("").map(Number)
  const oddSum = nums[0] + nums[2] + nums[4] + nums[6] + nums[8]
  const evenSum = nums[1] + nums[3] + nums[5] + nums[7]
  const tenth = (oddSum * 7 - evenSum) % 10
  const eleventh = (nums.slice(0, 10).reduce((total, digit) => total + digit, 0)) % 10

  if (tenth !== nums[9] || eleventh !== nums[10]) {
    return "Geçerli bir T.C. kimlik numarası giriniz."
  }
  return undefined
}

/* ─────────────────────────── Serbest metin ─────────────────────────── */

export function validateRequiredText(
  value: string,
  label: string,
  { minLength = 1, maxLength = 2000 } = {}
): string | undefined {
  const text = value.trim()
  if (!text) return `${label} alanı zorunludur.`
  if (text.length < minLength) return `${label} en az ${minLength} karakter olmalıdır.`
  if (text.length > maxLength) return `${label} en fazla ${maxLength} karakter olabilir.`
  return undefined
}

/* ─────────────────────────── Tarih aralığı ─────────────────────────── */

/** Yerel saatte "bugün"ü YYYY-MM-DD olarak verir (UTC kayması olmadan). */
export function todayIsoDate() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function validateDateRange(
  checkIn: string,
  checkOut: string,
  { allowPast = false } = {}
): string | undefined {
  if (!checkIn || !checkOut) return "Giriş ve çıkış tarihlerini seçiniz."
  if (!allowPast && checkIn < todayIsoDate()) return "Giriş tarihi bugünden önce olamaz."
  if (checkOut <= checkIn) return "Çıkış tarihi giriş tarihinden sonra olmalıdır."
  return undefined
}
