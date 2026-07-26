"use server"

import { z } from "zod"

import { getCurrentAdmin } from "@/lib/admin/auth"
import { mutateCms } from "@/lib/cms/mutate-cms"
import { ensureSoftDeleteFields } from "@/lib/cms/normalize-soft-delete"
import { markDeleted } from "@/lib/cms/soft-delete"
import { mutateJson, revalidateSite } from "@/lib/cms/store"
import { logAuditEvent } from "@/lib/audit"
import { upsertFeatureCatalog } from "@/lib/bungalov-feature-catalog"
import { upsertContentCatalog } from "@/lib/bungalov-content-catalog"
import {
  BUNGALOW_FEATURE_CATEGORY_KEYS,
  createEmptyFeatureCatalog,
  extractCustomFeaturesForCatalog,
  normalizeFeatureCatalog,
  type BungalowFeatureCatalog,
  type BungalowFeatureCategoryKey,
} from "@/lib/bungalov-feature-categories"
import {
  extractCustomContentPresets,
  type BungalovContentCatalog,
  type BungalovContentPreset,
} from "@/lib/bungalov-content"

const BUNGALOVS_FILE = "bungalovs.json"

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string }

async function assertAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin) return { admin: null, guard: { ok: false as const, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." } }
  return { admin, guard: null }
}

const contentItemInputSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  visible: z.boolean(),
})

const featureCatalogSchema = z.object({
  genel: z.array(z.string()),
  mutfak: z.array(z.string()),
  mobilya: z.array(z.string()),
  banyo: z.array(z.string()),
  bahce: z.array(z.string()),
})

const bungalovInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "İsim gerekli"),
  slug: z.string().optional().nullable(),
  image: z.string(),
  galleryImages: z.array(z.string()),
  capacity: z.number().int().positive(),
  description: z.string(),
  nightlyPrice: z.number().nonnegative(),
  status: z.string().min(1),
  features: z.array(z.string()),
  rules: z.array(contentItemInputSchema),
  nearbyPlaces: z.array(contentItemInputSchema),
  bedrooms: z.number().int().nullable().optional(),
  areaSqm: z.number().int().nullable().optional(),
  poolType: z.string().nullable().optional(),
  internet: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  /** Kategori bazlı özellik haritası — özel önerileri kataloğa yazmak için. */
  featureGroups: featureCatalogSchema.optional(),
})

function slugifyBungalovName(text: string) {
  return text
    .toString()
    .toLocaleLowerCase("tr-TR")
    .trim()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
}

/** Başlığı boş kalan satırlar kaydedilmez; sıra korunur. */
function cleanContentItems(items: z.infer<typeof contentItemInputSchema>[]) {
  return items
    .map((item) => ({
      id: item.id,
      title: item.title.trim(),
      description: item.description.trim(),
      visible: item.visible,
    }))
    .filter((item) => item.title.length > 0)
}

export async function saveBungalovAction(input: unknown): Promise<ActionResult> {
  const { admin, guard } = await assertAdmin()
  if (guard) return guard

  const parsed = bungalovInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Bungalov verisi geçersiz." }
  }
  const { featureGroups, ...bungalovFields } = parsed.data
  const data = {
    ...bungalovFields,
    slug: bungalovFields.slug?.trim() || slugifyBungalovName(bungalovFields.name),
    rules: cleanContentItems(bungalovFields.rules),
    nearbyPlaces: cleanContentItems(bungalovFields.nearbyPlaces),
  }
  const now = new Date().toISOString()
  let isNew = true

  await mutateJson<any[]>(BUNGALOVS_FILE, (list) => {
    const arr = Array.isArray(list) ? [...list] : []
    const idx = arr.findIndex((b) => String(b.id) === data.id)
    if (idx >= 0) {
      isNew = false
      arr[idx] = { ...arr[idx], ...data, updatedAt: now }
    } else {
      arr.push({ ...data, createdAt: now, updatedAt: now })
    }
    return arr
  })

  if (featureGroups) {
    const custom = extractCustomFeaturesForCatalog(featureGroups)
    await upsertFeatureCatalog(custom)
  }

  await upsertContentCatalog({
    rules: extractCustomContentPresets("rules", data.rules),
    nearbyPlaces: extractCustomContentPresets("nearbyPlaces", data.nearbyPlaces),
  })

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: isNew ? "Yeni Bungalov Eklendi" : "Bungalov Güncellendi",
    entityType: "bungalow",
    entityId: data.id,
    details: { name: data.name, status: data.status, price: data.nightlyPrice },
  })

  revalidateSite()
  return { ok: true, id: data.id }
}

export async function upsertFeatureCatalogAction(
  input: unknown
): Promise<ActionResult & { catalog?: BungalowFeatureCatalog }> {
  const { guard } = await assertAdmin()
  if (guard) return guard

  const parsed = featureCatalogSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Özellik kataloğu geçersiz." }
  }

  const catalog = await upsertFeatureCatalog(
    extractCustomFeaturesForCatalog(normalizeFeatureCatalog(parsed.data))
  )
  revalidateSite()
  return { ok: true, catalog }
}

export async function addFeatureCatalogItemAction(
  category: BungalowFeatureCategoryKey,
  label: string
): Promise<ActionResult & { catalog?: BungalowFeatureCatalog }> {
  const { guard } = await assertAdmin()
  if (guard) return guard

  if (!BUNGALOW_FEATURE_CATEGORY_KEYS.includes(category)) {
    return { ok: false, error: "Geçersiz özellik kategorisi." }
  }

  const text = String(label || "").trim()
  if (!text) {
    return { ok: false, error: "Özellik adı boş olamaz." }
  }

  const incoming = createEmptyFeatureCatalog()
  incoming[category] = [text]
  const catalog = await upsertFeatureCatalog(extractCustomFeaturesForCatalog(incoming))
  revalidateSite()
  return { ok: true, catalog }
}

export async function addContentCatalogItemAction(
  kind: "rules" | "nearbyPlaces",
  preset: BungalovContentPreset
): Promise<ActionResult & { catalog?: BungalovContentCatalog }> {
  const { guard } = await assertAdmin()
  if (guard) return guard

  if (kind !== "rules" && kind !== "nearbyPlaces") {
    return { ok: false, error: "Geçersiz içerik türü." }
  }

  const title = String(preset?.title || "").trim()
  if (!title) {
    return { ok: false, error: "Başlık boş olamaz." }
  }

  const incoming: BungalovContentCatalog = {
    rules: kind === "rules" ? [{ title, description: String(preset.description || "").trim() }] : [],
    nearbyPlaces:
      kind === "nearbyPlaces" ? [{ title, description: String(preset.description || "").trim() }] : [],
  }

  const catalog = await upsertContentCatalog({
    rules: extractCustomContentPresets("rules", incoming.rules),
    nearbyPlaces: extractCustomContentPresets("nearbyPlaces", incoming.nearbyPlaces),
  })
  revalidateSite()
  return { ok: true, catalog }
}

export async function deleteBungalovAction(id: string): Promise<ActionResult> {
  const result = await mutateCms<any[]>({
    action: "delete",
    file: BUNGALOVS_FILE,
    entityType: "bungalow",
    entityId: id,
    auditAction: "Bungalov Silindi (çöp kutusu)",
    updater: (list, admin) =>
      (Array.isArray(list) ? list : []).map((bungalov) => {
        const normalized = ensureSoftDeleteFields(bungalov)
        return String(bungalov.id) === String(id) ? markDeleted(normalized, admin.id) : normalized
      }),
  })
  return result.ok ? { ok: true } : result
}
