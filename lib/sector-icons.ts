import {
  Armchair,
  Baby,
  Bath,
  Bed,
  BedDouble,
  Bike,
  Car,
  Coffee,
  CookingPot,
  Compass,
  Droplets,
  Flame,
  Gamepad2,
  GlassWater,
  Home,
  Key,
  KeyRound,
  Laptop,
  Lock,
  MapPin,
  Monitor,
  Mountain,
  PawPrint,
  ShieldCheck,
  ShowerHead,
  Snowflake,
  Sparkles,
  Speaker,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  TreePine,
  Trees,
  Tv,
  Users,
  Utensils,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
  Wine,
  type LucideIcon,
} from "lucide-react"

export function cleanFeatureTitle(feature: string): string {
  if (!feature) return ""
  return feature.replace(/^\[icon:[a-zA-Z0-9]+\]\s*/, "")
}

export type SectorIconCategory =
  | "all"
  | "pool_spa"
  | "nature_outdoor"
  | "kitchen_dining"
  | "tech_media"
  | "climate_comfort"
  | "rooms_furniture"
  | "safety_access"
  | "family_pets"

export interface SectorIconItem {
  key: string
  label: string
  category: SectorIconCategory
  keywords: string[]
  icon: LucideIcon
}

export const SECTOR_ICON_CATEGORIES: Array<{ key: SectorIconCategory; label: string }> = [
  { key: "all", label: "Tüm Simgeler" },
  { key: "pool_spa", label: "Havuz, Su & Spa" },
  { key: "nature_outdoor", label: "Doğa, Bahçe & Teras" },
  { key: "kitchen_dining", label: "Mutfak, Yeme & İçme" },
  { key: "tech_media", label: "Teknoloji & TV" },
  { key: "climate_comfort", label: "İklim & Isıtma" },
  { key: "rooms_furniture", label: "Yatak & Mobilya" },
  { key: "safety_access", label: "Güvenlik & Otopark" },
  { key: "family_pets", label: "Aile & Evcil Hayvan" },
]

export const SECTOR_ICONS_CATALOG: SectorIconItem[] = [
  // Havuz & Spa
  { key: "Waves", label: "Havuz / Isıtmalı Havuz", category: "pool_spa", keywords: ["havuz", "pool", "su", "swim", "spa"], icon: Waves },
  { key: "Sparkles", label: "Jakuzi / Spa / Sauna", category: "pool_spa", keywords: ["jakuzi", "jacuzzi", "spa", "sauna", "luks"], icon: Sparkles },
  { key: "Droplets", label: "Su Isıtıcısı / Sıcak Su", category: "pool_spa", keywords: ["su", "sicak", "boyler", "water"], icon: Droplets },
  { key: "ShowerHead", label: "Duşakabin / Duş", category: "pool_spa", keywords: ["dus", "dusakabin", "banyo", "shower"], icon: ShowerHead },
  { key: "Bath", label: "Özel Banyo / Küvet", category: "pool_spa", keywords: ["banyo", "kuvet", "bath", "jakuzi"], icon: Bath },
  { key: "Thermometer", label: "Isıtmalı Havuz Derecesi", category: "pool_spa", keywords: ["isitma", "termostat", "isi", "derece"], icon: Thermometer },
  { key: "Sun", label: "Güneşlenme Alanı / Şezlong", category: "pool_spa", keywords: ["gunes", "sezlong", "teras", "sun"], icon: Sun },

  // Doğa, Bahçe & Teras
  { key: "TreePine", label: "Özel Bahçe / Peyzaj", category: "nature_outdoor", keywords: ["bahce", "agac", "peyzaj", "yesil", "garden"], icon: TreePine },
  { key: "Trees", label: "Orman / Doğa Manzarası", category: "nature_outdoor", keywords: ["orman", "doga", "forest", "tree"], icon: Trees },
  { key: "Mountain", label: "Deniz / Dağ Manzaralı", category: "nature_outdoor", keywords: ["manzara", "dag", "deniz", "mountain", "view"], icon: Mountain },
  { key: "Flame", label: "Şömine / Barbekü / Mangal", category: "nature_outdoor", keywords: ["somine", "barbeku", "ates", "mangal", "fire"], icon: Flame },
  { key: "Sunrise", label: "Gündoğumu Terası", category: "nature_outdoor", keywords: ["teras", "veranda", "manzara", "gunes"], icon: Sunrise },
  { key: "Sunset", label: "Veranda / Günbatımı Terası", category: "nature_outdoor", keywords: ["veranda", "teras", "gunbatimi", "sunset"], icon: Sunset },
  { key: "Home", label: "Müstakil Bungalov", category: "nature_outdoor", keywords: ["bungalov", "ev", "korunakli", "home"], icon: Home },
  { key: "MapPin", label: "Konum / Merkeze Yakın", category: "nature_outdoor", keywords: ["konum", "lokasyon", "harita", "sapanca"], icon: MapPin },
  { key: "Compass", label: "Doğa Yürüyüşü / Konum", category: "nature_outdoor", keywords: ["pusula", "doga", "rotasi"], icon: Compass },

  // Mutfak, Yeme & İçme
  { key: "CookingPot", label: "Amerikan Mutfak / Ocak", category: "kitchen_dining", keywords: ["mutfak", "ocak", "tencere", "kitchen"], icon: CookingPot },
  { key: "UtensilsCrossed", label: "Mutfak Gereçleri / Masası", category: "kitchen_dining", keywords: ["catal", "kasik", "bicak", "masa", "mutfak"], icon: UtensilsCrossed },
  { key: "Utensils", label: "Yemek / Restoran Servisi", category: "kitchen_dining", keywords: ["yemek", "restoran", "servis"], icon: Utensils },
  { key: "Coffee", label: "Oda Kahvaltı / Su Isıtıcısı", category: "kitchen_dining", keywords: ["kahvalti", "kahve", "cay", "kettle", "coffee"], icon: Coffee },
  { key: "GlassWater", label: "Buzdolabı / İçecekler", category: "kitchen_dining", keywords: ["buzdolabi", "su", "icecek", "minibar"], icon: GlassWater },
  { key: "Wine", label: "Minibar / İçecek Köşesi", category: "kitchen_dining", keywords: ["sarap", "minibar", "romantik", "wine"], icon: Wine },

  // Teknoloji & TV
  { key: "Wifi", label: "Wi-Fi / Fiber İnternet", category: "tech_media", keywords: ["wifi", "internet", "kablosuz", "fiber"], icon: Wifi },
  { key: "Tv", label: "Televizyon / Uydu TV (LCD)", category: "tech_media", keywords: ["tv", "televizyon", "uydu", "lcd"], icon: Tv },
  { key: "Monitor", label: "Smart TV / Netflix", category: "tech_media", keywords: ["netflix", "smarttv", "ekran", "film"], icon: Monitor },
  { key: "Gamepad2", label: "Oyun Konsolu / Eğlence", category: "tech_media", keywords: ["oyun", "playstation", "xbox", "game"], icon: Gamepad2 },
  { key: "Speaker", label: "Bluetooth Müzik Sistemi", category: "tech_media", keywords: ["muzik", "hoparlor", "ses", "sound"], icon: Speaker },
  { key: "Laptop", label: "Çalışma Alanı / Masa", category: "tech_media", keywords: ["calisma", "ofis", "laptop", "desk"], icon: Laptop },

  // İklim & Isıtma
  { key: "Snowflake", label: "Klima / Soğutma", category: "climate_comfort", keywords: ["klima", "sogutma", "aircon", "cold"], icon: Snowflake },
  { key: "Wind", label: "Vantilatör / Havalandırma", category: "climate_comfort", keywords: ["ruzgar", "fan", "havalandirma"], icon: Wind },

  // Yatak & Mobilya
  { key: "BedDouble", label: "Çift Kişilik Yatak / Çarşaf", category: "rooms_furniture", keywords: ["yatak", "cift", "bed", "carsaf", "oda"], icon: BedDouble },
  { key: "Bed", label: "Tek Kişilik Yatak / Oda", category: "rooms_furniture", keywords: ["yatak", "single", "oda"], icon: Bed },
  { key: "Armchair", label: "Oturma Alanı / Koltuk", category: "rooms_furniture", keywords: ["koltuk", "oturma", "sofa", "mobilya"], icon: Armchair },
  { key: "KeyRound", label: "Elbise Dolabı / Komidin", category: "rooms_furniture", keywords: ["dolab", "komidin", "gardrop", "kasa"], icon: KeyRound },

  // Güvenlik & Otopark
  { key: "Car", label: "Ücretsiz Özel Otopark", category: "safety_access", keywords: ["otopark", "arac", "park", "car"], icon: Car },
  { key: "Bike", label: "Bisiklet Parkı / Kiralama", category: "safety_access", keywords: ["bisiklet", "bike"], icon: Bike },
  { key: "ShieldCheck", label: "Mahremiyet / Korunaklı Bahçe", category: "safety_access", keywords: ["korunakli", "mahremiyet", "guvenlik", "privacy"], icon: ShieldCheck },
  { key: "Lock", label: "Kilitli Özel Giriş / Kasa", category: "safety_access", keywords: ["kilit", "kasa", "giris", "lock"], icon: Lock },
  { key: "Key", label: "Self Check-in / Anahtar Kutusu", category: "safety_access", keywords: ["anahtar", "checkin", "key"], icon: Key },

  // Aile & Evcil Hayvan
  { key: "Baby", label: "Bebek & Çocuk Uyumlu", category: "family_pets", keywords: ["bebek", "cocuk", "besik", "baby", "family"], icon: Baby },
  { key: "Users", label: "Geniş Aile / Grup Konaklaması", category: "family_pets", keywords: ["aile", "grup", "kisi", "users"], icon: Users },
  { key: "PawPrint", label: "Evcil Hayvan Dostu", category: "family_pets", keywords: ["evcil", "hayvan", "kedi", "kopek", "pet"], icon: PawPrint },
]

export const SECTOR_ICON_MAP_BY_KEY: Record<string, LucideIcon> = SECTOR_ICONS_CATALOG.reduce(
  (acc, item) => {
    acc[item.key.toLowerCase()] = item.icon
    return acc
  },
  {} as Record<string, LucideIcon>
)
