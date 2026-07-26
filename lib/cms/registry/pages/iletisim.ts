import type { FieldDef, PageDef } from "../types"

const shortText = (
  name: string,
  label: string,
  defaultValue: string,
  help?: string
): FieldDef => ({
  name,
  label,
  type: "shortText",
  defaultValue,
  help,
})

const longText = (
  name: string,
  label: string,
  defaultValue: string,
  help?: string
): FieldDef => ({
  name,
  label,
  type: "longText",
  defaultValue,
  help,
})

/** Bölümler /iletisim sayfasındaki görünüm sırasıyla dizilidir. */
export const ILETISIM_PAGE: PageDef = {
  slug: "iletisim",
  title: "İletişim",
  sections: [
    {
      key: "contact-hero",
      label: "Sayfa Başlığı",
      kind: "fields",
      fields: [
        shortText("eyebrow", "Üst başlık", "İletişim"),
        shortText("title", "Başlık", "İletişim"),
        longText(
          "description",
          "Açıklama",
          "İletişim, şikayet, talep ve öneri/istek bildirimlerinizi aşağıdaki formdan iletebilirsiniz."
        ),
      ],
    },
    {
      key: "contact-cards",
      label: "Üst Bilgi Kartları",
      kind: "fields",
      fields: [
        shortText("whatsappTitle", "WhatsApp kartı başlığı", "WhatsApp Destek"),
        shortText(
          "whatsappDescription",
          "WhatsApp kartı açıklaması",
          "Ort. 2 Dakikada Hızlı Yanıt"
        ),
        shortText(
          "phoneTitle",
          "Telefon kartı başlığı",
          "Telefon İletişim",
          "Numaranın kendisi Site Ayarları'ndan gelir."
        ),
        shortText(
          "emailTitle",
          "E-posta kartı başlığı",
          "E-Posta Adresi",
          "Adresin kendisi Site Ayarları'ndan gelir."
        ),
        shortText(
          "locationTitle",
          "Konum kartı başlığı",
          "Tesis Konumu",
          "Açık adres Site Ayarları'ndan gelir."
        ),
      ],
    },
    {
      key: "contact-info",
      label: "Form Türleri",
      kind: "fields",
      fields: [
        shortText("communicationLabel", "İletişim seçeneği", "İletişim"),
        shortText(
          "communication",
          "İletişim açıklaması",
          "Genel bilgi ve fiyat soruları",
          "Seçenek işaretliyken form başlığının altında görünür."
        ),
        shortText("complaintLabel", "Şikayet seçeneği", "Şikayet"),
        shortText("complaint", "Şikayet açıklaması", "Hizmet deneyimi ile ilgili bildirimler"),
        shortText("requestLabel", "Talep seçeneği", "Talep"),
        shortText("request", "Talep açıklaması", "Rezervasyon, tarih değişikliği, özel istekler"),
        shortText("suggestionLabel", "Öneri / istek seçeneği", "Öneri / İstek"),
        shortText(
          "suggestion",
          "Öneri / istek açıklaması",
          "Geliştirme fikirleri ve memnuniyet notları"
        ),
      ],
    },
    {
      key: "form-fields",
      label: "Form Alanları",
      kind: "fields",
      fields: [
        shortText("typeLabel", "Form türü etiketi", "Form Türü"),
        shortText("nameLabel", "Ad soyad etiketi", "Ad Soyad"),
        shortText("namePlaceholder", "Ad soyad örnek metni", "Örn: Ahmet Yılmaz"),
        shortText("phoneLabel", "Telefon etiketi", "Telefon"),
        shortText("phonePlaceholder", "Telefon örnek metni", "0532 123 45 67"),
        shortText("emailLabel", "E-posta etiketi", "E-posta"),
        shortText("emailPlaceholder", "E-posta örnek metni", "ornek@email.com"),
        shortText("subjectLabel", "Konu etiketi", "Konu"),
        shortText("subjectPlaceholder", "Konu örnek metni", "Örn: Hafta Sonu Konaklama İsteği"),
        shortText("messageLabel", "Mesaj etiketi", "Mesajınız"),
        longText(
          "messagePlaceholder",
          "Mesaj örnek metni",
          "Sorunuzu veya talebinizi buraya detaylıca yazabilirsiniz..."
        ),
      ],
    },
    {
      key: "form-settings",
      label: "Form Ayarları",
      kind: "fields",
      fields: [
        shortText("formTitle", "Form başlığı", "Bize Mesaj Gönderin"),
        shortText("submitLabel", "Gönder butonu", "Mesajı Gönder"),
        shortText("submittingLabel", "Gönderilirken", "Gönderiliyor..."),
        longText("successMessage", "Başarı mesajı", "Mesajınız başarıyla iletildi."),
        longText("errorMessage", "Hata mesajı", "Mesaj gönderiminde hata oluştu."),
      ],
    },
    {
      key: "contact-region",
      label: "Harita ve Bölge Bilgisi",
      kind: "fields",
      fields: [
        shortText("title", "Kart başlığı", "Bölge Bilgisi"),
        longText(
          "description",
          "Harita altı açıklaması",
          "Aden Bungalov, Sapanca / Sakarya bölgesinde doğa ve göl manzaralı konaklama deneyimi sunar. Rezervasyon taleplerine mobil odaklı hızlı geri dönüş hedeflenir."
        ),
      ],
    },
  ],
}
