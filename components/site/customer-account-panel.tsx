"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  BadgePercent,
  CalendarCheck2,
  Check,
  Copy,
  LogOut,
  Plus,
  ShieldCheck,
  User,
} from "lucide-react"
import { AuthFeedback } from "@/components/site/auth/auth-feedback"
import {
  EmailField,
  NameField,
  PasswordField,
  PhoneField,
  TextField,
} from "@/components/site/auth/auth-fields"
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirm,
  validatePhoneTR,
} from "@/lib/form-validation"
import { customerLogoutAction } from "@/app/(site)/auth/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type TabKey = "reservations" | "profile" | "coupons" | "security"

const TABS: Array<{ key: TabKey; label: string; icon: typeof CalendarCheck2 }> = [
  { key: "reservations", label: "Rezervasyonlar", icon: CalendarCheck2 },
  { key: "profile", label: "Profil", icon: User },
  { key: "coupons", label: "Kuponlar", icon: BadgePercent },
  { key: "security", label: "Güvenlik", icon: ShieldCheck },
]

/** URL'de kullanılan okunabilir bölüm adları (derin bağlantı için) */
const TAB_SLUGS: Record<TabKey, string> = {
  reservations: "rezervasyonlarim",
  profile: "profilim",
  coupons: "kuponlarim",
  security: "guvenlik",
}

type Reservation = {
  code: string
  bungalowName: string
  bungalowSlug: string
  status: "confirmed" | "pending"
  dateRange: string
  nights: string
  guests: string
  total: string
  paymentNote: string
}

const RESERVATIONS: Reservation[] = [
  {
    code: "ADN-2026-8842",
    bungalowName: "Aden Havuzlu Lüks Bungalov",
    bungalowSlug: "aden-havuzlu-luks-bungalov",
    status: "confirmed",
    dateRange: "12 - 15 Ağustos 2026",
    nights: "3 gece",
    guests: "2 Yetişkin",
    total: "18.500 ₺",
    paymentNote: "4.500 ₺ kapora ödendi",
  },
  {
    code: "ADN-2026-9012",
    bungalowName: "Aden Doğa Manzaralı İki Katlı Bungalov",
    bungalowSlug: "aden-doga-manzarali-iki-katli-bungalov",
    status: "pending",
    dateRange: "24 - 27 Eylül 2026",
    nights: "3 gece",
    guests: "4 Yetişkin",
    total: "21.000 ₺",
    paymentNote: "Onay bekleniyor",
  },
]

const COUPONS = [
  {
    code: "ADEN15VIP",
    badge: "%15 indirim",
    title: "Erken Rezervasyon Kuponu",
    description: "Tüm bungalov rezervasyonlarında geçerlidir.",
    validUntil: "31 Aralık 2026",
  },
  {
    code: "HAFTAICI1000",
    badge: "1.000 ₺ indirim",
    title: "Hafta İçi Kaçamağı",
    description: "Pazartesi–Perşembe girişli, 2 gece ve üzeri konaklamalarda geçerlidir.",
    validUntil: "30 Kasım 2026",
  },
]

export function CustomerAccountPanel({ initialTab = "reservations" }: { initialTab?: TabKey }) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  /** Sekme değişince adres çubuğu güncellenir; bağlantı paylaşılabilir kalır. */
  const selectTab = (tab: TabKey) => {
    setActiveTab(tab)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set("bolum", TAB_SLUGS[tab])
      window.history.replaceState({}, "", url.toString())
    } catch {}
  }

  /** Sekmeler arasında ok tuşlarıyla gezinme (WAI-ARIA tabs pattern) */
  const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown"
    const backward = event.key === "ArrowLeft" || event.key === "ArrowUp"
    if (!forward && !backward) return

    event.preventDefault()
    const nextIndex = forward
      ? (index + 1) % TABS.length
      : (index - 1 + TABS.length) % TABS.length
    const nextTab = TABS[nextIndex]
    selectTab(nextTab.key)
    tabRefs.current[nextTab.key]?.focus()
  }

  const handleLogout = async () => {
    await customerLogoutAction()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.28fr_0.72fr]">
      {/* Sol sütun: hesap kartı + bölüm menüsü */}
      <div className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
        <Card className="rounded-2xl border-[#e7dfd1] bg-white shadow-sm">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5f1e8] text-sm font-semibold text-[#2b5a44]"
              >
                AY
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-[#1a1a1a]">Ahmet Yılmaz</p>
                <p className="truncate text-sm text-[#75756f]">ahmet.yilmaz@example.com</p>
              </div>
            </div>

            <dl className="space-y-2 border-t border-[#f0e9dc] pt-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#75756f]">Üyelik</dt>
                <dd className="font-medium text-[#1a1a1a]">VIP Misafir</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#75756f]">Telefon</dt>
                <dd className="font-medium text-[#1a1a1a]">0532 123 45 67</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#75756f]">Aktif rezervasyon</dt>
                <dd className="font-medium text-[#1a1a1a]">{RESERVATIONS.length}</dd>
              </div>
            </dl>

            <Button
              asChild
              className="h-11 w-full rounded-lg bg-[#1f3a2e] text-sm font-medium text-white hover:bg-[#15271f]"
            >
              <Link href="/rezervasyon-talep">
                <Plus className="h-4 w-4" />
                Yeni Rezervasyon
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#e7dfd1] bg-white py-2 shadow-sm">
          <CardContent className="px-2">
            <div
              role="tablist"
              aria-label="Hesap bölümleri"
              aria-orientation="vertical"
              className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1"
            >
              {TABS.map((tab, index) => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    ref={(node) => {
                      tabRefs.current[tab.key] = node
                    }}
                    type="button"
                    role="tab"
                    id={`tab-${tab.key}`}
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.key}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => selectTab(tab.key)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    className={cn(
                      "flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                      isActive
                        ? "bg-[#f5f1e8] font-medium text-[#1a1a1a]"
                        : "text-[#5d5d64] hover:bg-[#faf7f1] hover:text-[#1a1a1a]"
                    )}
                  >
                    <tab.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Button
          type="button"
          variant="outline"
          onClick={() => setLogoutOpen(true)}
          className="h-11 w-full rounded-lg border-[#e2dacc] bg-white text-sm font-medium text-[#4f4f57] hover:bg-[#f8f4ec]"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </Button>
      </div>

      {/* Sağ sütun: aktif bölüm */}
      <div>
        {activeTab === "reservations" ? <ReservationsPanel /> : null}
        {activeTab === "profile" ? <ProfilePanel /> : null}
        {activeTab === "coupons" ? <CouponsPanel /> : null}
        {activeTab === "security" ? <SecurityPanel /> : null}
      </div>

      {/* Çıkış onayı — yıkıcı işlem öncesi doğrulama */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="rounded-2xl border-[#e7dfd1] bg-white sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-semibold text-[#1a1a1a]">
              Çıkış yapmak istiyor musunuz?
            </DialogTitle>
            <DialogDescription className="text-sm text-[#616168]">
              Oturumunuz kapatılacak ve rezervasyonlarınızı görmek için tekrar giriş yapmanız
              gerekecek.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 sm:flex-row-reverse sm:justify-start">
            <Button
              type="button"
              onClick={handleLogout}
              className="h-11 w-full rounded-lg bg-[#8c3423] text-sm font-medium text-white hover:bg-[#71291b] sm:w-auto sm:px-6"
            >
              Çıkış Yap
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLogoutOpen(false)}
              className="h-11 w-full rounded-lg border-[#e2dacc] bg-white text-sm font-medium text-[#4f4f57] hover:bg-[#f8f4ec] sm:w-auto sm:px-6"
            >
              Vazgeç
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Tüm bölümler için ortak kart iskeleti (sitedeki diğer form kartlarıyla aynı). */
function PanelCard({
  tab,
  title,
  description,
  children,
  contentClassName,
}: {
  tab: TabKey
  title: string
  description?: string
  children: React.ReactNode
  contentClassName?: string
}) {
  return (
    <Card
      role="tabpanel"
      id={`panel-${tab}`}
      aria-labelledby={`tab-${tab}`}
      tabIndex={0}
      className="rounded-2xl border-[#e7dfd1] bg-white shadow-sm focus-visible:outline-none"
    >
      <CardHeader>
        <CardTitle className="text-xl text-[#1a1a1a]">{title}</CardTitle>
        {description ? <p className="text-sm text-[#616168]">{description}</p> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}

function ReservationsPanel() {
  return (
    <PanelCard
      tab="reservations"
      title="Rezervasyonlarım"
      description="Onaylanan ve inceleme aşamasındaki konaklama talepleriniz."
      contentClassName="p-0"
    >
      {RESERVATIONS.length === 0 ? (
        <div className="px-6">
          <EmptyState
            title="Henüz rezervasyonunuz yok"
            description="Bungalovlarımızı inceleyerek ilk rezervasyon talebinizi oluşturabilirsiniz."
            actionHref="/bungalovlarimiz"
            actionLabel="Bungalovları İncele"
          />
        </div>
      ) : (
        <ul className="divide-y divide-[#f0e9dc] border-t border-[#f0e9dc]">
          {RESERVATIONS.map((reservation) => (
            <li key={reservation.code} className="px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-sans font-medium text-[#1a1a1a]">
                    {reservation.bungalowName}
                  </h3>
                  <p className="mt-1 text-sm text-[#75756f]">
                    {reservation.dateRange} · {reservation.nights} · {reservation.guests}
                  </p>
                </div>
                <StatusBadge status={reservation.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-lg font-medium text-[#1a1a1a]">{reservation.total}</p>
                  <p className="text-xs text-[#8a857a]">
                    {reservation.paymentNote} · No: {reservation.code}
                  </p>
                </div>

                <Link
                  href={`/bungalovlarimiz/${reservation.bungalowSlug}`}
                  className="inline-flex min-h-11 items-center text-sm text-[#2b5a44] underline-offset-4 hover:underline"
                >
                  Detayları gör
                  <span className="sr-only"> — {reservation.bungalowName}</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  )
}

function StatusBadge({ status }: { status: Reservation["status"] }) {
  const isConfirmed = status === "confirmed"
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
        isConfirmed ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
      )}
    >
      {isConfirmed ? "Onaylandı" : "İnceleniyor"}
    </span>
  )
}

function ProfilePanel() {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState("")
  const [profile, setProfile] = useState({
    name: "Ahmet Yılmaz",
    email: "ahmet.yilmaz@example.com",
    phone: "0532 123 45 67",
    address: "Bağdat Cad. No: 142 D: 8, Kadıköy / İstanbul",
  })
  const [draft, setDraft] = useState(profile)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  const validate = () => ({
    name: validateFullName(draft.name),
    email: validateEmail(draft.email),
    phone: validatePhoneTR(draft.phone, { mobileOnly: true }),
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)

    // İlk hatalı alana odaklan
    const order: Array<[string, React.RefObject<HTMLInputElement | null>]> = [
      ["name", nameRef],
      ["email", emailRef],
      ["phone", phoneRef],
    ]
    const firstInvalid = order.find(([key]) => nextErrors[key as keyof typeof nextErrors])
    if (firstInvalid) {
      firstInvalid[1].current?.focus()
      return
    }

    setProfile(draft)
    setEditing(false)
    setErrors({})
    setSaved("Profil bilgileriniz güncellendi.")
    setTimeout(() => setSaved(""), 4000)
  }

  const rows: Array<[string, string]> = [
    ["Ad Soyad", profile.name],
    ["E-posta", profile.email],
    ["Telefon", profile.phone],
    ["Fatura Adresi", profile.address],
  ]

  return (
    <PanelCard
      tab="profile"
      title="Profil Bilgilerim"
      description="Rezervasyon onaylarının ulaşabilmesi için bilgilerinizi güncel tutun."
    >
      {/* Önce özet gösterilir; düzenleme yalnızca istendiğinde açılır */}
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <NameField
            id="profile-name"
            ref={nameRef}
            label="Ad Soyad"
            value={draft.name}
            onValueChange={(value) => setDraft((prev) => ({ ...prev, name: value }))}
            onBlur={() => setErrors((prev) => ({ ...prev, name: validate().name }))}
            error={errors.name}
            required
          />

          <div className="grid gap-4 md:grid-cols-2">
            <EmailField
              id="profile-email"
              ref={emailRef}
              label="E-posta"
              value={draft.email}
              onValueChange={(value) => setDraft((prev) => ({ ...prev, email: value }))}
              onBlur={() => setErrors((prev) => ({ ...prev, email: validate().email }))}
              error={errors.email}
              required
            />
            <PhoneField
              id="profile-phone"
              ref={phoneRef}
              label="Cep Telefonu"
              value={draft.phone}
              onValueChange={(value) => setDraft((prev) => ({ ...prev, phone: value }))}
              onBlur={() => setErrors((prev) => ({ ...prev, phone: validate().phone }))}
              error={errors.phone}
              required
            />
          </div>

          <TextField
            id="profile-address"
            label="Fatura Adresi"
            autoComplete="off"
            value={draft.address}
            onChange={(event) => setDraft((prev) => ({ ...prev, address: event.target.value }))}
          />

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
            <Button
              type="submit"
              className="h-11 rounded-lg bg-[#1f3a2e] text-sm font-medium text-white hover:bg-[#15271f] sm:px-8"
            >
              Kaydet
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft(profile)
                setEditing(false)
              }}
              className="h-11 rounded-lg border-[#e2dacc] bg-white text-sm font-medium text-[#4f4f57] hover:bg-[#f8f4ec] sm:px-8"
            >
              Vazgeç
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <AuthFeedback success={saved} />

          <dl className="divide-y divide-[#f0e9dc] border-y border-[#f0e9dc]">
            {rows.map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
                <dt className="text-sm text-[#75756f]">{label}</dt>
                <dd className="text-sm text-[#1a1a1a]">{value}</dd>
              </div>
            ))}
          </dl>

          <Button
            type="button"
            onClick={() => {
              setDraft(profile)
              setEditing(true)
            }}
            className="h-11 w-full rounded-lg bg-[#1f3a2e] text-sm font-medium text-white hover:bg-[#15271f] sm:w-auto sm:px-8"
          >
            Bilgileri Düzenle
          </Button>
        </div>
      )}
    </PanelCard>
  )
}

function CouponsPanel() {
  const [copied, setCopied] = useState("")

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(""), 2500)
    } catch {
      setCopied("")
    }
  }

  return (
    <PanelCard
      tab="coupons"
      title="İndirim Kuponlarım"
      description="Aktif kupon kodlarınızı rezervasyon formunda kullanabilirsiniz."
      contentClassName="space-y-3"
    >
      {/* Kopyalama geri bildirimi ekran okuyucuya duyurulur */}
      <p aria-live="polite" className="sr-only">
        {copied ? `${copied} kupon kodu kopyalandı.` : ""}
      </p>

      {COUPONS.length === 0 ? (
        <EmptyState
          title="Tanımlı kuponunuz yok"
          description="Kampanya dönemlerinde size özel kuponlar bu alanda görüntülenir."
          actionHref="/bungalovlarimiz"
          actionLabel="Bungalovları İncele"
        />
      ) : (
        <ul className="divide-y divide-[#f0e9dc]">
          {COUPONS.map((coupon) => (
            <li
              key={coupon.code}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between md:gap-6"
            >
              <div className="min-w-0 md:flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-sans font-medium text-[#1a1a1a]">{coupon.title}</h3>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    {coupon.badge}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#5d5d64]">{coupon.description}</p>
                <p className="mt-1 text-xs text-[#8a857a]">Son kullanma: {coupon.validUntil}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <code className="flex-1 rounded-lg border border-dashed border-[#ddd4c6] bg-[#fcfaf6] px-3 py-2 text-center font-mono text-sm text-[#1a1a1a] md:flex-none">
                  {coupon.code}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopy(coupon.code)}
                  aria-label={`${coupon.code} kupon kodunu kopyala`}
                  className="h-11 rounded-lg border-[#e2dacc] bg-white text-sm font-medium text-[#4f4f57] hover:bg-[#f8f4ec]"
                >
                  {copied === coupon.code ? (
                    <>
                      <Check className="h-4 w-4" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Kopyala
                    </>
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  )
}

function SecurityPanel() {
  const [editing, setEditing] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const newPasswordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      newPasswordRef.current?.focus()
      return
    }
    const confirmError = validatePasswordConfirm(newPassword, confirmPassword)
    if (confirmError) {
      setError(confirmError)
      confirmPasswordRef.current?.focus()
      return
    }

    resetForm()
    setEditing(false)
    setSuccess("Şifreniz başarıyla güncellendi.")
    setTimeout(() => setSuccess(""), 4000)
  }

  return (
    <PanelCard
      tab="security"
      title="Güvenlik"
      description="Hesap şifrenizi düzenli olarak yenileyerek bilgilerinizi koruyun."
    >
      {/* Şifre formu yalnızca istendiğinde açılır (aşamalı gösterim) */}
      {editing ? (
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          <PasswordField
            id="current-password"
            label="Mevcut Şifre"
            autoComplete="off"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />

          <PasswordField
            id="new-password"
            ref={newPasswordRef}
            label="Yeni Şifre"
            autoComplete="off"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            helperText="En az 6 karakter olmalıdır."
            required
          />

          <PasswordField
            id="confirm-password"
            ref={confirmPasswordRef}
            label="Yeni Şifre Tekrarı"
            autoComplete="off"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          <AuthFeedback error={error} />

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
            <Button
              type="submit"
              className="h-11 rounded-lg bg-[#1f3a2e] text-sm font-medium text-white hover:bg-[#15271f] sm:px-8"
            >
              Şifreyi Güncelle
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                setEditing(false)
              }}
              className="h-11 rounded-lg border-[#e2dacc] bg-white text-sm font-medium text-[#4f4f57] hover:bg-[#f8f4ec] sm:px-8"
            >
              Vazgeç
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <AuthFeedback success={success} />

          <dl className="divide-y divide-[#f0e9dc] border-y border-[#f0e9dc]">
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
              <dt className="text-sm text-[#75756f]">Şifre</dt>
              <dd className="text-sm text-[#1a1a1a]">••••••••</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
              <dt className="text-sm text-[#75756f]">Son güncelleme</dt>
              <dd className="text-sm text-[#1a1a1a]">12 Mart 2026</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
              <dt className="text-sm text-[#75756f]">Kayıtlı e-posta</dt>
              <dd className="text-sm text-[#1a1a1a]">ahmet.yilmaz@example.com</dd>
            </div>
          </dl>

          <Button
            type="button"
            onClick={() => setEditing(true)}
            className="h-11 w-full rounded-lg bg-[#1f3a2e] text-sm font-medium text-white hover:bg-[#15271f] sm:w-auto sm:px-8"
          >
            Şifreyi Değiştir
          </Button>
        </div>
      )}
    </PanelCard>
  )
}

function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string
  description: string
  actionHref: string
  actionLabel: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#ddd4c6] bg-[#fcfaf6] p-8 text-center">
      <h3 className="font-sans font-medium text-[#1a1a1a]">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-[#5d5d64]">{description}</p>
      <Button asChild className="mt-4 h-11 rounded-lg bg-[#1f3a2e] text-sm font-medium text-white hover:bg-[#15271f]">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  )
}
