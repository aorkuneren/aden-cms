export type DefaultFaqItem = {
  question: string
  answer: string
}

export type DefaultWhyAdenItem = {
  icon: string
  label: string
}

export type DefaultSliderItem = {
  imageUrl: string
  title: string
  description: string
  tags: readonly string[]
}

export const DEFAULT_HOME_SLIDER_ITEMS: readonly DefaultSliderItem[] = [
  {
    imageUrl: "https://www.adenbungalov.com/upload/1736514349-67811b2d1db41.webp",
    title: "Sapanca'da Mavi ve Yeşilin Buluşma Noktası",
    description:
      "Doğanın kalbinde, göl manzarası eşliğinde konfor ve huzuru bir arada yaşayın.",
    tags: ["Çift ve Aile Uyumlu", "Göl Manzarası", "Isıtmalı Sıcak Havuz"],
  },
  {
    imageUrl: "https://www.adenbungalov.com/upload/1736429760-677fd0c0d8a17.webp",
    title: "Size Özel Sessiz ve Konforlu Alanlar",
    description:
      "Geniş yaşam alanları, özel bahçeler ve dingin atmosferle unutulmaz bir konaklama.",
    tags: ["Özel Bahçe", "Barbekü Alanı", "Premium Konfor"],
  },
  {
    imageUrl: "https://www.adenbungalov.com/upload/1750063474-684fd972694e7.webp",
    title: "Doğayla İç İçe Ayrıcalıklı Tatil",
    description:
      "Şehirden uzak, sakin ve modern bir konaklama deneyimi için Aden Bungalov'a davetlisiniz.",
    tags: ["Doğa ile İç İçe", "Hızlı Rezervasyon", "Misafir Odaklı Hizmet"],
  },
]

export const DEFAULT_HOME_FAQ_ITEMS: readonly DefaultFaqItem[] = [
  {
    question: "Aden Bungalov tam olarak nerede bulunuyor?",
    answer:
      "Tesisimiz; Sakarya'nın Sapanca ilçesinde, doğayla iç içe ve göl manzarasına hakim olan İlmiye Mahallesi'nde (İlmiye 2. Sokak No:12) konumlanmaktadır.",
  },
  {
    question: "Konaklama fiyatlarına kahvaltı dahil mi?",
    answer:
      'Evet, Aden Bungalov\'da tatil deneyiminizi zenginleştirmek için "Oda Kahvaltı" konseptiyle hizmet vermekteyiz. Her sabah güne enfes bir kahvaltı ile başlayabilirsiniz.',
  },
  {
    question: "Bungalovların içerisinde Wi-Fi bağlantısı var mı?",
    answer:
      "Elbette. Doğa ile iç içe olurken dünyadan kopmamanız adına tüm suitlerimizde misafirlerimizin kullanımına açık, ücretsiz ve hızlı Wi-Fi bağlantısı mevcuttur.",
  },
  {
    question: "Bungalovlarınızın kişi kapasitesi nedir? Kalabalık aileler için uygun mu?",
    answer:
      "Suitlerimiz 2 kişiden başlayarak 5 kişiye kadar konaklama imkanı sunmaktadır. Özellikle 2 ebeveyn yatak odası barındıran Family Suit veya ferah yapısıyla White Suit gibi seçeneklerimiz kalabalık aileler ve gruplar için idealdir.",
  },
  {
    question: "Tesisinizde mangal / barbekü yapma imkanımız var mı?",
    answer:
      "Evet, her bungalovumuzun kendine ait bahçesinde sevdiklerinizle keyifli akşam yemekleri organize edebileceğiniz özel barbekü alanlarımız mevcuttur.",
  },
  {
    question: "Aden Bungalov'a ulaşım nasıl sağlanıyor?",
    answer:
      "Tesisimize özel araçla kolayca ulaşabilirsiniz. Sapanca merkezden kısa sürede erişim sağlanır; toplu taşıma ve transfer desteği için rezervasyon öncesinde ekibimizden yönlendirme alabilirsiniz.",
  },
]

export const DEFAULT_HOME_WHY_ADEN_ITEMS: readonly DefaultWhyAdenItem[] = [
  { icon: "Waves", label: "Eşsiz Göl Manzarası" },
  { icon: "Sparkles", label: "Özel Havuz Keyfi" },
  { icon: "BellRing", label: "Oda Kahvaltı Hizmeti" },
  { icon: "CarFront", label: "Barbekü Alanı" },
  { icon: "ShieldCheck", label: "Üstün Temizlik Anlayışı" },
  { icon: "Users", label: "Ebeveyn Yatak Odaları" },
  { icon: "MapPin", label: "Ulaşım Yardımı" },
  { icon: "Sparkles", label: "Modern İç Tasarım" },
  { icon: "Users", label: "Çift ve Aile Konaklama" },
  { icon: "BellRing", label: "Hızlı Rezervasyon Akışı" },
  { icon: "MessageCircle", label: "WhatsApp Destek Hattı" },
  { icon: "HeartHandshake", label: "Misafir Odaklı Hizmet" },
  { icon: "CarFront", label: "Otopark İmkanı" },
]
