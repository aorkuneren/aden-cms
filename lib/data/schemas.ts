import { z } from "zod"

const stringListSchema = z.array(z.string())

export const bungalowContentItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  visible: z.boolean(),
})

export const bungalowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  image: z.string().min(1),
  galleryImages: stringListSchema,
  capacity: z.number().int().positive(),
  description: z.string(),
  nightlyPrice: z.number().nonnegative(),
  status: z.string().min(1),
  features: stringListSchema,
  rules: z.array(bungalowContentItemSchema),
  nearbyPlaces: z.array(bungalowContentItemSchema),
  // H4 — yapısal & SEO alanları (opsiyonel/nullable)
  slug: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  bedrooms: z.number().int().nullable().optional(),
  bathrooms: z.number().int().nullable().optional(),
  beds: z.number().int().nullable().optional(),
  areaSqm: z.number().int().nullable().optional(),
  poolType: z.string().nullable().optional(),
  internet: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  deletedAt: z.string().nullable().optional(),
  deletedBy: z.string().nullable().optional(),
})

export const bungalowListSchema = z.array(bungalowSchema)

const menuItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
  isActive: z.boolean(),
})

const cmsItemSchema = z.object({
  id: z.string(),
  deletedAt: z.string().nullable().optional(),
  deletedBy: z.string().nullable().optional(),
}).loose()

export const websiteCmsConfigSchema = z.object({
  siteManagement: z.object({
    seoTitle: z.string(),
    seoDescription: z.string(),
    seoKeywords: z.string(),
    logoDarkUrl: z.string(),
    logoLightUrl: z.string(),
    pageSeoItems: z.array(cmsItemSchema),
    menuGroups: z.array(cmsItemSchema),
    socialProfiles: z.array(cmsItemSchema),
    footerManagement: z.object({ enabled: z.boolean() }).loose(),
  }).loose(),
  headerManagement: z.object({
    topHeaderEnabled: z.boolean(),
    topHeaderText: z.string(),
    topHeaderPhone: z.string(),
    menuItems: z.array(menuItemSchema),
    actionButtons: z.array(cmsItemSchema),
    buttons: z.object({
      whatsapp: z.object({ enabled: z.boolean(), label: z.string(), url: z.string() }),
      phone: z.object({ enabled: z.boolean(), label: z.string(), url: z.string() }),
      reservation: z.object({ enabled: z.boolean(), label: z.string(), url: z.string() }),
    }),
  }).loose(),
  sliderManagement: z.array(cmsItemSchema),
  galleryManagement: z.object({
    categories: z.array(cmsItemSchema),
    items: z.array(cmsItemSchema),
  }),
  faqManagement: z.array(cmsItemSchema),
  whyAdenManagement: z.array(cmsItemSchema),
  sliderSettings: z
    .object({
      autoplayEnabled: z.boolean(),
      autoplaySeconds: z.number(),
      pauseOnHover: z.boolean(),
    })
    .partial()
    .optional(),
})

export const cmsPageContentSchema = z.record(
  z.string(),
  z.record(z.string(), z.string()),
)

export const cmsPageContentCollectionSchema = z.record(z.string(), cmsPageContentSchema)

export const publicSettingsSchema = z.object({
  companyLogo: z.string().nullable(),
  companyName: z.string().nullable(),
  companyType: z.string().nullable(),
  taxNumber: z.string().nullable(),
  taxOffice: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  bankName: z.string().nullable(),
  accountNumber: z.string().nullable(),
  iban: z.string().nullable(),
  googleBusinessProfileUrl: z.string().nullable(),
  checkInTime: z.string(),
  checkOutTime: z.string(),
  minStayDays: z.number().int().positive(),
  requiredDepositAmount: z.number().nonnegative(),
  depositRatePercent: z.number().nonnegative().default(0),
  serviceFeeRatePercent: z.number().nonnegative().default(0),
  cancellationDaysBefore: z.number().int().nonnegative(),
  smtpHost: z.string().nullable(),
  smtpPort: z.number().int().positive(),
  smtpUser: z.string().nullable(),
  smtpSecure: z.boolean(),
  emailFromName: z.string(),
  emailFromAddress: z.string().nullable(),
  emailReplyTo: z.string().nullable(),
  sessionMaxAge: z.number().int().positive(),
  maxLoginAttempts: z.number().int().positive(),
  lockoutDuration: z.number().int().nonnegative(),
  ipRestrictionEnabled: z.union([z.boolean(), z.number()]).transform(Boolean),
  allowedIPs: z.string().nullable(),
  blockedIPs: z.string().nullable(),
  themePrimaryColor: z.string(),
  themeSecondaryColor: z.string(),
  themeFontFamily: z.string(),
  themeLogoUrl: z.string().nullable(),
  themeFaviconUrl: z.string().nullable(),
  language: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
  maintenanceModeEnabled: z.union([z.boolean(), z.number()]).transform(Boolean),
  logRetentionDays: z.number().int().positive(),
  logLevel: z.string(),
  paymentGatewayProvider: z.string(),
}).loose()

export const languageListSchema = z.array(z.object({
  code: z.string().min(2),
  name: z.string().min(1),
  isActive: z.boolean(),
  isDefault: z.boolean(),
}))

export const currencyListSchema = z.array(z.object({
  code: z.string().min(3),
  symbol: z.string().min(1),
  isActive: z.boolean(),
  isDefault: z.boolean(),
}))

export const termsListSchema = z.array(z.record(z.string(), z.unknown()))

export type BungalowData = z.infer<typeof bungalowSchema>
export type PublicSettingsData = z.infer<typeof publicSettingsSchema>
export type LanguageData = z.infer<typeof languageListSchema>[number]
export type CurrencyData = z.infer<typeof currencyListSchema>[number]
