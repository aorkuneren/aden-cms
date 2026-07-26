"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Variant = "terms" | "privacy"

const CONTENT: Record<
  Variant,
  { linkLabel: string; title: string; description: string; sections: Array<{ heading: string; body: string }> }
> = {
  terms: {
    linkLabel: "Kullanım Şartları'nı",
    title: "Kullanım Şartları",
    description: "Aden Bungalov konaklama ve kiralama kuralları.",
    sections: [
      {
        heading: "Giriş ve Çıkış Saatleri",
        body: "Tesise giriş saati en erken 14:00, çıkış saati en geç 11:00'dir. Erken giriş ve geç çıkış talepleri müsaitliğe bağlıdır.",
      },
      {
        heading: "Tesis Kullanımı",
        body: "Özel havuz, jakuzi ve peyzaj alanları özenle kullanılmalı; oluşan hasarlar konaklama sonunda tahsil edilir.",
      },
      {
        heading: "İptal Koşulları",
        body: "Giriş tarihine 14 gün kalaya kadar yapılan iptallerde kaporanız iade edilir. Sonrasındaki iptallerde kapora iadesi yapılmaz.",
      },
      {
        heading: "Misafir Sayısı",
        body: "Rezervasyonda belirtilen kişi sayısı aşılamaz. Ek misafir talepleri önceden bildirilmelidir.",
      },
    ],
  },
  privacy: {
    linkLabel: "Gizlilik Politikası'nı",
    title: "Gizlilik Politikası (KVKK)",
    description: "Kişisel verilerinizin işlenmesi hakkında aydınlatma metni.",
    sections: [
      {
        heading: "Veri Sorumlusu",
        body: "Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu'na uygun olarak Aden Bungalov tarafından işlenmektedir.",
      },
      {
        heading: "İşlenen Veriler",
        body: "Ad, soyad, e-posta, telefon ve rezervasyon bilgileriniz; konaklama sözleşmesinin kurulması amacıyla saklanır.",
      },
      {
        heading: "Veri Güvenliği",
        body: "Verileriniz SSL korumalı sunucularda saklanır ve yasal zorunluluk dışında üçüncü taraflarla paylaşılmaz.",
      },
      {
        heading: "Haklarınız",
        body: "Verilerinizin silinmesini, düzeltilmesini veya işlenmesinin durdurulmasını her zaman talep edebilirsiniz.",
      },
    ],
  },
}

/**
 * Kayıt formundaki yasal metin bağlantısı + modal.
 * Modal içinden onaylandığında checkbox otomatik işaretlenir.
 */
export function LegalConsentDialog({
  variant,
  onAccept,
}: {
  variant: Variant
  onAccept: () => void
}) {
  const [open, setOpen] = useState(false)
  const content = CONTENT[variant]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="font-medium text-[#2b5a44] underline underline-offset-2 hover:text-[#162b21]"
        >
          {content.linkLabel}
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-[#e7dfd1] bg-white sm:max-w-lg">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-semibold text-[#1a1a1a]">{content.title}</DialogTitle>
          <DialogDescription className="text-sm text-[#616168]">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {content.sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-sm font-medium text-[#1a1a1a]">{section.heading}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#5c5c63]">{section.body}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 pt-4 sm:flex-row-reverse sm:justify-start">
          <Button
            type="button"
            onClick={() => {
              onAccept()
              setOpen(false)
            }}
            className="h-11 w-full rounded-full bg-[#111111] text-white hover:bg-black sm:w-auto sm:px-6"
          >
            Okudum, kabul ediyorum
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-11 w-full rounded-full border-[#ddd4c6] bg-white text-[#4f4f57] hover:bg-[#f8f4ec] sm:w-auto sm:px-6"
          >
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
