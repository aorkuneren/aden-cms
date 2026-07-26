import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * Form geneli hata/başarı bildirimi — sitedeki diğer formlarla aynı Alert görünümü.
 * `aria-live` bölgesi DOM'da kalıcıdır; içerik değişince ekran okuyucu duyurur.
 */
export function AuthFeedback({ error, success }: { error?: string; success?: string }) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {error ? (
        <Alert className="border-rose-200 bg-rose-50 text-rose-900">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
