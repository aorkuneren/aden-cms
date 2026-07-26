/**
 * RBAC — izin kataloğu ve rol tanımları.
 *
 * Bu dosya TEK GERÇEK KAYNAKTIR: hem seed (veritabanına yazma) hem de gerekirse
 * runtime kontrolleri buradaki katalogdan beslenir. İzinler `modul.eylem`
 * biçimindedir (örn. "reservations.create"). Rol -> izin eşlemesinde `*` tüm
 * izinleri, `modul.*` o modülün tüm eylemlerini ifade eder.
 */

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "update",
  "delete",
  "publish",
  "approve",
  "export",
] as const

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

/** Modül -> etiket + o modülde geçerli eylemler. */
export const PERMISSION_CATALOG: Record<string, { label: string; actions: PermissionAction[] }> = {
  dashboard: { label: "Panel", actions: ["view"] },
  reservations: { label: "Rezervasyon", actions: ["view", "create", "update", "delete", "export"] },
  customers: { label: "Müşteri / CRM", actions: ["view", "create", "update", "delete", "export"] },
  bungalows: { label: "Bungalov", actions: ["view", "create", "update", "delete"] },
  pricing: { label: "Fiyat / Müsaitlik", actions: ["view", "update"] },
  services: { label: "Ek Hizmetler", actions: ["view", "create", "update", "delete"] },
  campaigns: { label: "Kampanya / Kupon", actions: ["view", "create", "update", "delete"] },
  operations: { label: "Operasyon", actions: ["view", "create", "update", "delete"] },
  finance: { label: "Finans / Fatura", actions: ["view", "create", "update", "approve", "export"] },
  reports: { label: "Raporlama", actions: ["view", "export"] },
  cms: { label: "Website / CMS", actions: ["view", "create", "update", "delete", "publish", "approve"] },
  notifications: { label: "Bildirim", actions: ["view", "create", "update", "delete"] },
  modules: { label: "Modül Yönetimi", actions: ["view", "update"] },
  users: { label: "Kullanıcılar", actions: ["view", "create", "update", "delete"] },
  roles: { label: "Roller / Yetki", actions: ["view", "create", "update", "delete"] },
  settings: { label: "Sistem Ayarları", actions: ["view", "update"] },
  audit: { label: "Denetim Logları", actions: ["view", "export"] },
}

export type PermissionDef = {
  key: string
  module: string
  action: PermissionAction
  description: string
}

/** Katalogdan düz izin listesini üretir. */
export function buildPermissionList(): PermissionDef[] {
  const list: PermissionDef[] = []
  for (const [moduleKey, def] of Object.entries(PERMISSION_CATALOG)) {
    for (const action of def.actions) {
      list.push({
        key: `${moduleKey}.${action}`,
        module: moduleKey,
        action,
        description: `${def.label} — ${action}`,
      })
    }
  }
  return list
}

export const ALL_PERMISSION_KEYS = buildPermissionList().map((p) => p.key)

/** `*` ve `modul.*` kalıplarını gerçek izin anahtarlarına açar. */
export function expandPermissionPatterns(patterns: string[]): string[] {
  const result = new Set<string>()
  for (const pattern of patterns) {
    if (pattern === "*") {
      for (const key of ALL_PERMISSION_KEYS) result.add(key)
    } else if (pattern.endsWith(".*")) {
      const moduleKey = pattern.slice(0, -2)
      for (const key of ALL_PERMISSION_KEYS) {
        if (key.startsWith(`${moduleKey}.`)) result.add(key)
      }
    } else {
      result.add(pattern)
    }
  }
  return [...result]
}

export type RoleKey =
  | "SUPERADMIN"
  | "ADMIN"
  | "CONTENT_EDITOR"
  | "RESERVATION"
  | "RECEPTION"
  | "CRM_AGENT"
  | "FINANCE"
  | "REPORT_VIEWER"
  | "SUPPORT"

export type RoleDef = {
  key: RoleKey
  name: string
  description: string
  sortOrder: number
  /** İzin kalıpları (seed'de expandPermissionPatterns ile açılır). */
  permissions: string[]
}

/**
 * Sistem rolleri ve varsayılan izinleri (Bölüm 7 rol-yetki matrisiyle uyumlu).
 * SUPERADMIN, isSuperadmin bayrağıyla zaten tüm izinlere sahiptir; yine de
 * tutarlılık için `*` verilir.
 */
export const ROLE_DEFINITIONS: RoleDef[] = [
  {
    key: "SUPERADMIN",
    name: "Süper Yönetici",
    description: "Tüm sistemin sınırsız yetkilisi. Modül ve rol kısıtlarından muaftır.",
    sortOrder: 0,
    permissions: ["*"],
  },
  {
    key: "ADMIN",
    name: "Firma Yöneticisi",
    description: "Operasyon, içerik, finans ve sistem yönetimi.",
    sortOrder: 10,
    permissions: [
      "dashboard.*",
      "reservations.*",
      "customers.*",
      "bungalows.*",
      "pricing.*",
      "services.*",
      "campaigns.*",
      "operations.*",
      "finance.*",
      "reports.*",
      "cms.*",
      "notifications.*",
      "modules.*",
      "users.*",
      "roles.*",
      "settings.*",
      "audit.*",
    ],
  },
  {
    key: "CONTENT_EDITOR",
    name: "İçerik Editörü",
    description: "İçerik oluşturur, düzenler ve onaya gönderir (doğrudan yayınlayamaz).",
    sortOrder: 20,
    permissions: ["dashboard.view", "cms.view", "cms.create", "cms.update"],
  },
  {
    key: "RESERVATION",
    name: "Rezervasyon Personeli",
    description: "Rezervasyon oluşturma, düzenleme ve takip.",
    sortOrder: 30,
    permissions: [
      "dashboard.view",
      "reservations.*",
      "customers.view",
      "bungalows.view",
      "pricing.view",
      "campaigns.view",
      "services.view",
      "reports.view",
    ],
  },
  {
    key: "RECEPTION",
    name: "Resepsiyon / Operasyon",
    description: "Giriş/çıkış işlemleri ve operasyon görevleri.",
    sortOrder: 40,
    permissions: [
      "dashboard.view",
      "reservations.view",
      "reservations.update",
      "operations.*",
      "bungalows.view",
      "customers.view",
    ],
  },
  {
    key: "CRM_AGENT",
    name: "Müşteri Temsilcisi",
    description: "Müşteri yönetimi, talepler ve iletişim.",
    sortOrder: 50,
    permissions: [
      "dashboard.view",
      "customers.*",
      "reservations.view",
      "notifications.create",
      "reports.view",
    ],
  },
  {
    key: "FINANCE",
    name: "Finans / Muhasebe",
    description: "Tahsilat, iade, fatura ve mali raporlar.",
    sortOrder: 60,
    permissions: [
      "dashboard.view",
      "finance.*",
      "reservations.view",
      "reservations.export",
      "reports.view",
      "reports.export",
    ],
  },
  {
    key: "REPORT_VIEWER",
    name: "Rapor Görüntüleyici",
    description: "Salt-okunur rapor ve gösterge erişimi.",
    sortOrder: 70,
    permissions: [
      "dashboard.view",
      "reports.*",
      "reservations.view",
      "customers.view",
      "bungalows.view",
    ],
  },
  {
    key: "SUPPORT",
    name: "Teknik Destek",
    description: "Sistem gözlemi: kullanıcı, log ve ayar görüntüleme.",
    sortOrder: 80,
    permissions: [
      "dashboard.view",
      "users.view",
      "roles.view",
      "settings.view",
      "audit.view",
      "audit.export",
      "modules.view",
      "cms.view",
      "operations.view",
    ],
  },
]
