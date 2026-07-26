"use server"

import { z } from "zod"

import { getCurrentAdmin } from "@/lib/admin/auth"
import { requireCms } from "@/lib/admin/permissions"
import { mutateCms } from "@/lib/cms/mutate-cms"
import { ensureSoftDeleteFields } from "@/lib/cms/normalize-soft-delete"
import { filterDeleted, markDeleted } from "@/lib/cms/soft-delete"
import { mutateJson, revalidateSite } from "@/lib/cms/store"
import { MAX_MENU_DEPTH, MENU_ITEM_TYPES } from "@/lib/site/menu-model"
import { isSafeHref } from "@/lib/site/menu-resolver"

const CMS_CONFIG_FILE = "cms-config.json"

export type ActionResult = { ok: true } | { ok: false; error: string }

async function assertAdmin(): Promise<ActionResult | null> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }
  return null
}

/** Aktif düzenleyici listesini yazarken çöp kutusundaki kayıtları korur. */
async function replaceActiveConfigCollection(section: string, activeItems: unknown[]): Promise<void> {
  await mutateJson<Record<string, unknown>>(CMS_CONFIG_FILE, (cfg) => {
    const current = Array.isArray(cfg[section]) ? cfg[section] : []
    return {
      ...cfg,
      [section]: [...activeItems, ...filterDeleted(current)],
    }
  })
  revalidateSite()
}

/* ------------------------------- SLIDER ------------------------------- */

import { logAuditEvent } from "@/lib/audit"

const sliderItemSchema = z.object({
  id: z.string().min(1),
  imageUrl: z.string().trim(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  videoUrl: z.string().optional().nullable(),
  mediaType: z.enum(["IMAGE", "VIDEO"]).optional().nullable(),
  buttonText: z.string().optional().nullable(),
  buttonUrl: z.string().optional().nullable(),
  secondaryButtonText: z.string().optional().nullable(),
  secondaryButtonUrl: z.string().optional().nullable(),
  badgeText: z.string().optional().nullable(),
  overlayOpacity: z.number().optional().nullable(),
})

export async function saveSliderAction(items: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = z.array(sliderItemSchema).safeParse(items)
  if (!parsed.success) {
    return { ok: false, error: "Slider verisi geçersiz: " + (parsed.error.issues[0]?.message ?? "") }
  }

  await replaceActiveConfigCollection("sliderManagement", parsed.data)

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "Slider Yönetimi Güncellendi",
    entityType: "cms_slider",
    details: { count: parsed.data.length },
  })

  return { ok: true }
}

export async function saveSingleSliderAction(itemInput: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = sliderItemSchema.safeParse(itemInput)
  if (!parsed.success) {
    return { ok: false, error: "Slayt verisi geçersiz: " + (parsed.error.issues[0]?.message ?? "") }
  }
  const slide = parsed.data

  await mutateJson<Record<string, any>>(CMS_CONFIG_FILE, (cfg = {}) => {
    const list = Array.isArray(cfg.sliderManagement) ? [...cfg.sliderManagement] : []
    const idx = list.findIndex((s) => String(s.id) === String(slide.id))
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...slide }
    } else {
      list.push(slide)
    }
    return { ...cfg, sliderManagement: list }
  })

  revalidateSite()

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "Tekil Slayt Kaydedildi",
    entityType: "cms_slider",
    entityId: slide.id,
    details: { title: slide.title },
  })

  return { ok: true }
}

export async function deleteSingleSliderAction(id: string): Promise<ActionResult> {
  const result = await mutateCms<Record<string, any>>({
    action: "delete",
    file: CMS_CONFIG_FILE,
    entityType: "cms_slider",
    entityId: id,
    auditAction: "Tekil Slayt Silindi (çöp kutusu)",
    updater: (cfg = {}, admin) => {
      const list = Array.isArray(cfg.sliderManagement) ? cfg.sliderManagement : []
      return {
        ...cfg,
        sliderManagement: list.map((slide) => {
          const normalized = ensureSoftDeleteFields(slide)
          return String(slide.id) === String(id) ? markDeleted(normalized, admin.id) : normalized
        }),
      }
    },
  })
  return result.ok ? { ok: true } : result
}

/* ---------------------------- SLIDER AYARLARI ---------------------------- */

const sliderSettingsSchema = z.object({
  autoplayEnabled: z.boolean(),
  autoplaySeconds: z.number().min(2).max(30),
  pauseOnHover: z.boolean().optional().default(true),
})

export async function saveSliderSettingsAction(input: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = sliderSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Slider ayarı geçersiz: " + (parsed.error.issues[0]?.message ?? "") }
  }

  await mutateJson<Record<string, any>>(CMS_CONFIG_FILE, (cfg = {}) => ({
    ...cfg,
    sliderSettings: parsed.data,
  }))
  revalidateSite()

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "Slider Ayarları Güncellendi",
    entityType: "cms_slider",
    details: { autoplaySeconds: parsed.data.autoplaySeconds, autoplayEnabled: parsed.data.autoplayEnabled },
  })

  return { ok: true }
}

/* --------------------------------- SSS -------------------------------- */

const faqItemSchema = z.object({
  id: z.string().min(1),
  question: z.string(),
  answer: z.string(),
  isActive: z.boolean(),
  category: z.string().optional().nullable(),
  isFeatured: z.boolean().optional().nullable(),
})

export async function saveFaqAction(items: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = z.array(faqItemSchema).safeParse(items)
  if (!parsed.success) {
    return { ok: false, error: "SSS verisi geçersiz: " + (parsed.error.issues[0]?.message ?? "") }
  }

  await replaceActiveConfigCollection("faqManagement", parsed.data)

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "SSS Yönetimi Güncellendi",
    entityType: "cms_faq",
    details: { count: parsed.data.length },
  })

  return { ok: true }
}

export async function saveSingleFaqAction(itemInput: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = faqItemSchema.safeParse(itemInput)
  if (!parsed.success) {
    return { ok: false, error: "SSS verisi geçersiz: " + (parsed.error.issues[0]?.message ?? "") }
  }
  const item = parsed.data

  await mutateJson<Record<string, any>>(CMS_CONFIG_FILE, (cfg = {}) => {
    const list = Array.isArray(cfg.faqManagement) ? [...cfg.faqManagement] : []
    const idx = list.findIndex((f) => String(f.id) === String(item.id))
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item }
    } else {
      list.push(item)
    }
    return { ...cfg, faqManagement: list }
  })

  revalidateSite()

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "Tekil SSS Soru Kaydedildi",
    entityType: "cms_faq",
    entityId: item.id,
    details: { question: item.question },
  })

  return { ok: true }
}

export async function deleteSingleFaqAction(id: string): Promise<ActionResult> {
  const result = await mutateCms<Record<string, any>>({
    action: "delete",
    file: CMS_CONFIG_FILE,
    entityType: "cms_faq",
    entityId: id,
    auditAction: "Tekil SSS Soru Silindi (çöp kutusu)",
    updater: (cfg = {}, admin) => {
      const list = Array.isArray(cfg.faqManagement) ? cfg.faqManagement : []
      return {
        ...cfg,
        faqManagement: list.map((faq) => {
          const normalized = ensureSoftDeleteFields(faq)
          return String(faq.id) === String(id) ? markDeleted(normalized, admin.id) : normalized
        }),
      }
    },
  })
  return result.ok ? { ok: true } : result
}

/* ----------------------------- NEDEN ADEN ----------------------------- */

const whyItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  imageUrl: z.string(),
  isActive: z.boolean(),
})
export async function saveWhyAdenAction(items: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = z.array(whyItemSchema).safeParse(items)
  if (!parsed.success) {
    return { ok: false, error: "Neden Aden verisi geçersiz: " + (parsed.error.issues[0]?.message ?? "") }
  }

  await replaceActiveConfigCollection("whyAdenManagement", parsed.data)

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "Neden Aden Yönetimi Güncellendi",
    entityType: "cms_why_aden",
    details: { count: parsed.data.length },
  })

  return { ok: true }
}

export async function saveSingleWhyAdenAction(itemInput: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = whyItemSchema.safeParse(itemInput)
  if (!parsed.success) {
    return { ok: false, error: "Özellik verisi geçersiz: " + (parsed.error.issues[0]?.message ?? "") }
  }
  const item = parsed.data

  await mutateJson<Record<string, any>>(CMS_CONFIG_FILE, (cfg = {}) => {
    const list = Array.isArray(cfg.whyAdenManagement) ? [...cfg.whyAdenManagement] : []
    const idx = list.findIndex((w) => String(w.id) === String(item.id))
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item }
    } else {
      list.push(item)
    }
    return { ...cfg, whyAdenManagement: list }
  })

  revalidateSite()

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "Tekil Özellik Kaydedildi",
    entityType: "cms_why_aden",
    entityId: item.id,
    details: { title: item.title },
  })

  return { ok: true }
}

export async function deleteSingleWhyAdenAction(id: string): Promise<ActionResult> {
  const result = await mutateCms<Record<string, any>>({
    action: "delete",
    file: CMS_CONFIG_FILE,
    entityType: "cms_why_aden",
    entityId: id,
    auditAction: "Tekil Özellik Silindi (çöp kutusu)",
    updater: (cfg = {}, admin) => {
      const list = Array.isArray(cfg.whyAdenManagement) ? cfg.whyAdenManagement : []
      return {
        ...cfg,
        whyAdenManagement: list.map((whyAden) => {
          const normalized = ensureSoftDeleteFields(whyAden)
          return String(whyAden.id) === String(id) ? markDeleted(normalized, admin.id) : normalized
        }),
      }
    },
  })
  return result.ok ? { ok: true } : result
}

/* ------------------------------- GALERİ ------------------------------- */

const galleryCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  isActive: z.boolean(),
})

const galleryItemSchema = z.object({
  id: z.string().min(1),
  imageUrl: z.string().trim(),
  title: z.string(),
  description: z.string(),
  categoryId: z.string(),
  isActive: z.boolean(),
  tags: z.array(z.string()).optional(),
  aspectRatio: z.string().optional(),
  /** Vitrin: anasayfa galeri bloğunda gösterilir (kategori başına en fazla 5). */
  isFeatured: z.boolean().optional(),
})

export async function saveGalleryAction(payload: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = z
    .object({
      categories: z.array(galleryCategorySchema),
      items: z.array(galleryItemSchema),
    })
    .safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: "Galeri verisi geçersiz: " + (parsed.error.issues[0]?.message ?? "") }
  }

  await mutateJson<Record<string, any>>(CMS_CONFIG_FILE, (cfg = {}) => {
    const gallery = cfg.galleryManagement ?? {}
    const categories = Array.isArray(gallery.categories) ? gallery.categories : []
    const items = Array.isArray(gallery.items) ? gallery.items : []

    return {
      ...cfg,
      galleryManagement: {
        ...gallery,
        categories: [...parsed.data.categories, ...filterDeleted(categories)],
        items: [...parsed.data.items, ...filterDeleted(items)],
      },
    }
  })
  revalidateSite()

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "Galeri Yönetimi Güncellendi",
    entityType: "cms_gallery",
    details: { categoriesCount: parsed.data.categories.length, itemsCount: parsed.data.items.length },
  })

  return { ok: true }
}

export async function saveSingleGalleryAction(itemInput: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = galleryItemSchema.safeParse(itemInput)
  if (!parsed.success) {
    return { ok: false, error: "Galeri görsel verisi geçersiz: " + (parsed.error.issues[0]?.message ?? "") }
  }
  const item = parsed.data

  await mutateJson<Record<string, any>>(CMS_CONFIG_FILE, (cfg = {}) => {
    const gallery = cfg.galleryManagement || { categories: [], items: [] }
    const items = Array.isArray(gallery.items) ? [...gallery.items] : []
    const idx = items.findIndex((g) => String(g.id) === String(item.id))
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...item }
    } else {
      items.push(item)
    }
    return { ...cfg, galleryManagement: { ...gallery, items } }
  })

  revalidateSite()

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "Tekil Galeri Görseli Kaydedildi",
    entityType: "cms_gallery",
    entityId: item.id,
    details: { title: item.title, imageUrl: item.imageUrl },
  })

  return { ok: true }
}

export async function deleteSingleGalleryAction(id: string): Promise<ActionResult> {
  const result = await mutateCms<Record<string, any>>({
    action: "delete",
    file: CMS_CONFIG_FILE,
    entityType: "cms_gallery",
    entityId: id,
    auditAction: "Tekil Galeri Görseli Silindi (çöp kutusu)",
    updater: (cfg = {}, admin) => {
      const gallery = cfg.galleryManagement || { categories: [], items: [] }
      const items = Array.isArray(gallery.items) ? gallery.items : []
      return {
        ...cfg,
        galleryManagement: {
          ...gallery,
          items: items.map((galleryItem: any) => {
            const normalized = ensureSoftDeleteFields(galleryItem)
            return String(galleryItem.id) === String(id) ? markDeleted(normalized, admin.id) : normalized
          }),
        },
      }
    },
  })
  return result.ok ? { ok: true } : result
}

/* --------------------------- ANASAYFA HAKKIMIZDA --------------------------- */

const PAGE_CONTENT_FILE = "page-content.json"

const aboutSectionSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl1: z.string(),
  imageUrl2: z.string(),
  imageUrl3: z.string(),
  imageUrl4: z.string(),
  buttonLabel: z.string(),
  buttonHref: z.string(),
  buttonVisible: z.boolean(),
})

export async function saveAboutSectionAction(payload: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = aboutSectionSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: "Hakkımızda verisi geçersiz: " + (parsed.error.issues[0]?.message ?? "") }
  }

  const data = parsed.data

  await mutateJson<Record<string, any>>(PAGE_CONTENT_FILE, (file = {}) => {
    const home = { ...(file["ana-sayfa"] ?? {}) }
    home.about = {
      eyebrow: data.eyebrow,
      title: data.title,
      description: data.description,
      imageUrl1: data.imageUrl1,
      imageUrl2: data.imageUrl2,
      imageUrl3: data.imageUrl3,
      imageUrl4: data.imageUrl4,
      buttonLabel: data.buttonLabel,
      buttonHref: data.buttonHref,
      buttonVisible: data.buttonVisible ? "true" : "false",
    }
    return { ...file, "ana-sayfa": home }
  })

  revalidateSite()

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "Anasayfa Hakkımızda Güncellendi",
    entityType: "cms_about",
    details: { title: data.title, buttonVisible: data.buttonVisible },
  })

  return { ok: true }
}

/* --------------------- ANASAYFA BUNGALOV VİTRİNİ --------------------- */

const featuredBungalowsSectionSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  description: z.string(),
  emptyStateText: z.string(),
  limit: z.number().int().min(1).max(24),
  autoplayEnabled: z.boolean(),
  autoplaySeconds: z.number().int().min(2).max(30),
  pauseOnHover: z.boolean(),
  showDots: z.boolean(),
  loop: z.boolean(),
})

export async function saveFeaturedBungalowsSectionAction(payload: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = featuredBungalowsSectionSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Bungalov vitrin verisi geçersiz: " + (parsed.error.issues[0]?.message ?? ""),
    }
  }

  const data = parsed.data

  await mutateJson<Record<string, any>>(PAGE_CONTENT_FILE, (file = {}) => {
    const home = { ...(file["ana-sayfa"] ?? {}) }
    home["featured-bungalows"] = {
      eyebrow: data.eyebrow,
      title: data.title,
      description: data.description,
      emptyStateText: data.emptyStateText,
      limit: String(data.limit),
      autoplayEnabled: data.autoplayEnabled ? "true" : "false",
      autoplaySeconds: String(data.autoplaySeconds),
      pauseOnHover: data.pauseOnHover ? "true" : "false",
      showDots: data.showDots ? "true" : "false",
      loop: data.loop ? "true" : "false",
    }
    return { ...file, "ana-sayfa": home }
  })

  revalidateSite()

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "Anasayfa Bungalov Vitrini Güncellendi",
    entityType: "cms_featured_bungalows",
    details: {
      title: data.title,
      limit: data.limit,
      autoplayEnabled: data.autoplayEnabled,
    },
  })

  return { ok: true }
}

/* ------------------------- SOSYAL MEDYA & SEO ------------------------- */

const socialProfileSchema = z.object({
  id: z.string().min(1),
  platform: z.string(),
  icon: z.string(),
  url: z.string().trim(),
})

const pageSeoItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string(),
  label: z.string(),
  title: z.string(),
  description: z.string(),
  keywords: z.string(),
})

const siteSeoSchema = z.object({
  seoTitle: z.string(),
  seoDescription: z.string(),
  seoKeywords: z.string(),
  logoDarkUrl: z.string().trim(),
  logoLightUrl: z.string().trim(),
  pageSeoItems: z.array(pageSeoItemSchema),
})

/** siteManagement bölümündeki belirli alanları (diğerlerini bozmadan) günceller. */
async function patchSiteManagement(patch: Record<string, unknown>): Promise<void> {
  await mutateJson<Record<string, any>>(CMS_CONFIG_FILE, (cfg) => ({
    ...cfg,
    siteManagement: { ...(cfg.siteManagement ?? {}), ...patch },
  }))
  revalidateSite()
}

export async function saveSocialAction(profiles: unknown): Promise<ActionResult> {
  const guard = await assertAdmin()
  if (guard) return guard

  const parsed = z.array(socialProfileSchema).safeParse(profiles)
  if (!parsed.success) {
    return { ok: false, error: "Sosyal medya verisi geçersiz." }
  }
  await patchSiteManagement({ socialProfiles: parsed.data })
  return { ok: true }
}

export async function saveSeoAction(payload: unknown): Promise<ActionResult> {
  const guard = await assertAdmin()
  if (guard) return guard

  const parsed = siteSeoSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: "SEO verisi geçersiz." }
  }
  await patchSiteManagement(parsed.data)

  // Sayfa SEO’larını merkezi seo-meta deposuna yaz
  try {
    const { getCurrentAdmin } = await import("@/lib/admin/auth")
    const { saveSeo, findByEntity } = await import("@/lib/seo/seo-meta-service")
    const admin = await getCurrentAdmin()
    const items = parsed.data.pageSeoItems ?? []
    for (const item of items) {
      const existing = await findByEntity("page", item.id, "tr")
      await saveSeo({
        entityType: "page",
        entityId: item.id,
        revision: existing?.revision,
        actorId: admin?.id ?? null,
        allowAdvanced: false,
        fallbackTitle: item.label || item.slug,
        patch: {
          metaTitle: String(item.title || "").trim(),
          metaDescription: String(item.description || "").trim(),
          path: item.slug,
          focusKeyword: existing?.focusKeyword ?? null,
        },
      })
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Sayfa SEO kaydı yazılamadı.",
    }
  }

  return { ok: true }
}

/* ------------------------------ MENÜLER ------------------------------ */

/** headerManagement bölümündeki belirli alanları (diğerlerini bozmadan) günceller. */
async function patchHeaderManagement(patch: Record<string, unknown>): Promise<void> {
  await mutateJson<Record<string, any>>(CMS_CONFIG_FILE, (cfg) => ({
    ...cfg,
    headerManagement: { ...(cfg.headerManagement ?? {}), ...patch },
  }))
  revalidateSite()
}

/* --------------------------- MENÜ GRUPLARI --------------------------- */

const menuGroupTypeEnum = z.enum(["ANA_MENU", "HIZLI_ERISIM", "BUNGALOVLAR", "SOZLESMELER", "OZEL_MENU"])

const menuItemTypeEnum = z.enum(MENU_ITEM_TYPES as [string, ...string[]])
const displayStyleEnum = z.enum(["link", "primary_button", "secondary_button", "highlight"])
const dynamicSettingsSchema = z.object({
  source: z.enum(["all_active", "all_published", "featured", "newest"]),
  limit: z.number().int().min(1).max(50),
  sort: z.enum(["manual", "name", "price", "created"]),
})

// Özyinelemeli (children) öğe şeması
type MenuItemInput = {
  id: string
  itemType?: string
  referenceId?: string | null
  routeName?: string | null
  title?: string
  text?: string
  url?: string
  href?: string
  target?: "SELF" | "BLANK"
  nofollow?: boolean
  icon?: string
  description?: string
  cssClass?: string
  isActive?: boolean
  showOnDesktop?: boolean
  showOnMobile?: boolean
  showForGuests?: boolean
  showForAuthenticated?: boolean
  isHighlighted?: boolean
  displayStyle?: string
  dynamicSettings?: z.infer<typeof dynamicSettingsSchema> | null
  children?: MenuItemInput[]
}

const menuItemSchema: z.ZodType<MenuItemInput> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    itemType: menuItemTypeEnum.optional(),
    referenceId: z.string().nullable().optional(),
    routeName: z.string().nullable().optional(),
    title: z.string().optional(),
    text: z.string().optional(),
    url: z.string().optional(),
    href: z.string().optional(),
    target: z.enum(["SELF", "BLANK"]).optional(),
    nofollow: z.boolean().optional(),
    icon: z.string().optional(),
    description: z.string().optional(),
    cssClass: z.string().optional(),
    isActive: z.boolean().optional(),
    showOnDesktop: z.boolean().optional(),
    showOnMobile: z.boolean().optional(),
    showForGuests: z.boolean().optional(),
    showForAuthenticated: z.boolean().optional(),
    isHighlighted: z.boolean().optional(),
    displayStyle: displayStyleEnum.optional(),
    dynamicSettings: dynamicSettingsSchema.nullable().optional(),
    children: z.array(menuItemSchema).optional(),
  })
)

const menuGroupSchema = z.object({
  id: z.string().min(1),
  key: z.string().optional(),
  title: z.string(),
  type: menuGroupTypeEnum.optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "passive", "archived"]).optional(),
  isActive: z.boolean(),
  items: z.array(menuItemSchema),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  publishedAt: z.string().nullable().optional(),
})

/** Derinlik, benzersiz ID ve URL güvenliğini doğrular. */
function validateMenuGroups(groups: z.infer<typeof menuGroupSchema>[]): string | null {
  const keys = new Set<string>()
  const ids = new Set<string>()

  for (const g of groups) {
    if (g.key) {
      const k = g.key.trim().toLowerCase()
      if (k && keys.has(k)) return `Sistem anahtarı benzersiz olmalı: "${g.key}"`
      if (k) keys.add(k)
    }
    const walk = (items: MenuItemInput[], depth: number): string | null => {
      if (depth > MAX_MENU_DEPTH) return `Menü derinliği en fazla ${MAX_MENU_DEPTH} seviye olabilir.`
      for (const it of items) {
        if (ids.has(it.id)) return "Menü öğesi ID'leri benzersiz olmalı."
        ids.add(it.id)
        const type = it.itemType ?? "custom_link"
        if (type === "custom_link") {
          const href = (it.url ?? it.href ?? "").trim()
          if (href && !isSafeHref(href)) return `Güvensiz bağlantı engellendi: "${href}"`
        }
        if (it.children?.length) {
          const err = walk(it.children, depth + 1)
          if (err) return err
        }
      }
      return null
    }
    const err = walk(g.items, 1)
    if (err) return err
  }
  return null
}

export async function saveMenuGroupsAction(groups: unknown): Promise<ActionResult> {
  const gate = await requireCms("update")
  if (!gate.ok) return gate

  const parsed = z.array(menuGroupSchema).safeParse(groups)
  if (!parsed.success) {
    return { ok: false, error: "Menü grubu verisi geçersiz: " + (parsed.error.issues[0]?.message ?? "") }
  }
  const validationError = validateMenuGroups(parsed.data)
  if (validationError) return { ok: false, error: validationError }

  const now = new Date().toISOString()
  const stamped = parsed.data.map((g) => ({
    ...g,
    updatedBy: gate.admin.id,
    updatedAt: now,
    createdBy: g.createdBy ?? gate.admin.id,
    createdAt: g.createdAt ?? now,
  }))

  await patchSiteManagement({ menuGroups: stamped })

  await logAuditEvent({
    actorUserId: gate.admin.id,
    actorName: gate.admin.name,
    action: "Menü Grupları Güncellendi",
    entityType: "cms_menu_groups",
    details: { count: stamped.length },
  })
  return { ok: true }
}

/** Bir menü grubunun yayın durumunu değiştirir. Yayınlama ayrı yetki ister. */
export async function setMenuGroupStatusAction(
  groupId: string,
  status: "draft" | "published" | "passive" | "archived"
): Promise<ActionResult> {
  const gate = await requireCms(status === "published" ? "publish" : "update")
  if (!gate.ok) return gate

  const now = new Date().toISOString()
  await mutateJson<Record<string, any>>(CMS_CONFIG_FILE, (cfg) => {
    const sm = cfg.siteManagement ?? {}
    const groups = Array.isArray(sm.menuGroups) ? sm.menuGroups : []
    const next = groups.map((g: any) =>
      String(g.id) === groupId
        ? {
            ...g,
            status,
            isActive: status === "published",
            updatedBy: gate.admin.id,
            updatedAt: now,
            publishedAt: status === "published" ? now : g.publishedAt ?? null,
          }
        : g
    )
    return { ...cfg, siteManagement: { ...sm, menuGroups: next } }
  })
  revalidateSite()

  await logAuditEvent({
    actorUserId: gate.admin.id,
    actorName: gate.admin.name,
    action: `Menü Grubu Durumu: ${status}`,
    entityType: "cms_menu_groups",
    entityId: groupId,
  })
  return { ok: true }
}

/* --------------------------- HEADER & FOOTER --------------------------- */

const buttonSchema = z.object({
  enabled: z.boolean(),
  label: z.string(),
  url: z.string(),
})

const footerColumnAssignmentSchema = z.object({
  id: z.string().min(1),
  menuGroupId: z.string(),
  menuType: menuGroupTypeEnum,
})

const headerFooterSchema = z.object({
  topHeaderEnabled: z.boolean(),
  topHeaderText: z.string(),
  topHeaderPhone: z.string(),
  buttons: z.object({
    whatsapp: buttonSchema,
    phone: buttonSchema,
    reservation: buttonSchema,
  }),
  // Header'a atanan menü grubu
  headerMenuGroupId: z.string().optional().default(""),
  headerMenuType: menuGroupTypeEnum.optional().default("ANA_MENU"),
  footerEnabled: z.boolean(),
  copyrightText: z.string(),
  // Footer sütunlarına atanan menü grupları (id ile mevcut sütunlara birleştirilir)
  footerColumnAssignments: z.array(footerColumnAssignmentSchema).optional().default([]),
})

export async function saveHeaderFooterAction(payload: unknown): Promise<ActionResult> {
  const guard = await assertAdmin()
  if (guard) return guard

  const parsed = headerFooterSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: "Header/Footer verisi geçersiz." }
  }
  const {
    topHeaderEnabled,
    topHeaderText,
    topHeaderPhone,
    buttons,
    headerMenuGroupId,
    headerMenuType,
    footerEnabled,
    copyrightText,
    footerColumnAssignments,
  } = parsed.data

  await patchHeaderManagement({
    topHeaderEnabled,
    topHeaderText,
    topHeaderPhone,
    buttons,
    menuGroupId: headerMenuGroupId,
    menuType: headerMenuType,
  })

  const assignMap = new Map(footerColumnAssignments.map((a) => [a.id, a]))
  await mutateJson<Record<string, any>>(CMS_CONFIG_FILE, (cfg) => {
    const fm = cfg.siteManagement?.footerManagement ?? {}
    const columns = Array.isArray(fm.columns) ? fm.columns : []
    const nextColumns = columns.map((col: any) => {
      const a = assignMap.get(String(col.id))
      return a ? { ...col, menuGroupId: a.menuGroupId, menuType: a.menuType } : col
    })
    return {
      ...cfg,
      siteManagement: {
        ...(cfg.siteManagement ?? {}),
        footerManagement: {
          ...fm,
          enabled: footerEnabled,
          copyrightText,
          columns: nextColumns,
        },
      },
    }
  })
  revalidateSite()
  return { ok: true }
}