import type { FieldDef, PageDef } from "../types"

const text = (name: string, label: string, defaultValue: string): FieldDef => ({
  name,
  label,
  type: "shortText",
  defaultValue,
})

const longText = (name: string, label: string, defaultValue: string): FieldDef => ({
  name,
  label,
  type: "longText",
  defaultValue,
})

const image = (name: string, label: string, defaultValue = ""): FieldDef => ({
  name,
  label,
  type: "image",
  defaultValue,
  required: false,
})

const boolean = (name: string, label: string, defaultValue: "true" | "false"): FieldDef => ({
  name,
  label,
  type: "boolean",
  defaultValue,
})

const number = (name: string, label: string, defaultValue: string): FieldDef => ({
  name,
  label,
  type: "number",
  defaultValue,
})

export const ANA_SAYFA_PAGE: PageDef = {
  slug: "ana-sayfa",
  title: "Ana Sayfa",
  sections: [
    {
      key: "about",
      label: "Hakkımızda Alanı",
      kind: "fields",
      fields: [
        text("eyebrow", "Üst başlık", "Hakkımızda"),
        text("title", "Başlık", "Doğanın Kalbindeki Eviniz"),
        longText(
          "description",
          "Açıklama",
          "Sapanca'nın eşsiz doğasıyla iç içe, mavi ve yeşilin en güzel tonlarını bir araya getiren Aden Bungalov, misafirlerine unutulmaz bir huzur deneyimi sunuyor."
        ),
        image("imageUrl1", "Görsel 1"),
        image("imageUrl2", "Görsel 2"),
        image("imageUrl3", "Görsel 3"),
        image("imageUrl4", "Görsel 4"),
        text("buttonLabel", "Buton metni", "Devamını oku"),
        text("buttonHref", "Buton hedefi", "/kurumsal/hakkimizda"),
        boolean("buttonVisible", "Buton görünür", "true"),
      ],
    },
    {
      key: "featured-bungalows",
      label: "Öne Çıkan Bungalovlar",
      kind: "fields",
      fields: [
        text("eyebrow", "Üst başlık", "Bungalovlarımız"),
        text("title", "Başlık", "Her İhtiyaca Uygun, Lüks ve Konforlu Suitlerimiz"),
        longText(
          "description",
          "Açıklama",
          "Sizlere en iyi deneyimi sunmak için özenle tasarlanmış bungalovlarımızda; ücretsiz yüksek hızlı Wi-Fi, rahat çift kişilik yataklar ve ferah yaşam alanları standarttır."
        ),
        text("emptyStateText", "Boş durum metni", "Şu anda yayında aktif bungalow bulunmuyor."),
        number("limit", "Gösterilecek bungalov sayısı", "5"),
        boolean("autoplayEnabled", "Otomatik oynat", "true"),
        number("autoplaySeconds", "Otomatik oynatma süresi", "5"),
        boolean("pauseOnHover", "Üzerine gelince durdur", "true"),
        boolean("showDots", "Noktaları göster", "true"),
        boolean("loop", "Döngü", "true"),
      ],
    },
    {
      key: "why-aden",
      label: "Neden Aden Alanı",
      kind: "fields",
      fields: [
        text("eyebrow", "Üst başlık", "Neden Aden Bungalov?"),
        text("title", "Başlık", "Tatiliniz İçin Neden Bizi Seçmelisiniz?"),
        longText(
          "description",
          "Açıklama",
          "Sapanca'da bungalov kiralarken beklentilerinizin ötesine geçiyoruz. İşte Aden Bungalov'da sizi bekleyen ayrıcalıklar:"
        ),
      ],
    },
    {
      key: "gallery",
      label: "Galeri Alanı",
      kind: "fields",
      fields: [
        text("eyebrow", "Üst etiket", "Galeri"),
        text("title", "Başlık", "Göz Atın: Cennetten Bir Köşe"),
        longText(
          "description",
          "Açıklama",
          "Aden Bungalov'un modern mimarisini, huzur dolu bahçelerini, özel havuzlarını ve Sapanca'nın eşsiz göl manzarasını fotoğraf galerimizde keşfedin."
        ),
        number("maxImagesPerCategory", "Kategori başına görsel", "5"),
        boolean("showViewAllButton", "Tümünü görüntüle butonu", "true"),
        text("viewAllLabel", "Buton metni", "Tümünü Görüntüle"),
      ],
    },
    {
      key: "cta",
      label: "CTA",
      kind: "fields",
      fields: [
        text("eyebrow", "Üst başlık", "Rezervasyon"),
        text("title", "Başlık", "Doğanın Kalbindeki Yerinizi Ayırtmak İçin Geç Kalmayın!"),
        longText(
          "description",
          "Açıklama",
          "Şehrin gürültüsünü geride bırakmanın ve kendinize bir iyilik yapmanın zamanı gelmedi mi? İhtiyacınız olan huzur, konfor ve doğa Aden Bungalov'da sizi bekliyor."
        ),
        text("responseTitle", "Dönüş başlığı", "Hızlı Dönüş"),
        text("responseDescription", "Dönüş açıklaması", "Rezervasyon taleplerine aynı gün içinde geri dönüş sağlıyoruz."),
        boolean("reservationButtonEnabled", "Rezervasyon butonu görünür", "true"),
        text("reservationButtonLabel", "Rezervasyon butonu metni", "Hızlı Rezervasyon"),
        text("reservationButtonHref", "Rezervasyon butonu hedefi", "/bungalovlarimiz"),
        boolean("phoneButtonEnabled", "Telefon butonu görünür", "true"),
        text("phoneButtonPrefix", "Telefon butonu ön eki", "Bizi Arayın:"),
        image("imageUrl1", "Görsel 1"),
        image("imageUrl2", "Görsel 2"),
      ],
    },
    {
      key: "faq",
      label: "SSS Başlığı",
      kind: "fields",
      fields: [
        text("eyebrow", "Üst başlık", "SSS"),
        text("title", "Başlık", "Sıkça Sorulan Sorular"),
        longText(
          "description",
          "Açıklama",
          "Konaklama süreci, tesis detayları ve rezervasyon adımlarıyla ilgili en çok sorulan soruları tek alanda bulabilirsiniz."
        ),
        text("supportTitle", "Destek başlığı", "Hala sorularınız mı var?"),
        longText("supportDescription", "Destek açıklaması", "Aradığınız yanıtı bulamadıysanız ekibimizle hemen iletişime geçin."),
        text("supportButtonLabel", "Destek butonu metni", "İletişime Geç"),
      ],
    },
    {
      key: "slider",
      label: "Slider",
      kind: "collection-link",
      collectionHref: "/admin/website/slider",
    },
    {
      key: "why-aden-cards",
      label: "Neden Aden Kartları",
      kind: "collection-link",
      collectionHref: "/admin/website/neden-aden",
    },
  ],
}
