import { mutateJson, readJson } from "@/lib/cms/store"
import {
  filterActive,
  isActiveRecord,
  type SoftDeletable,
} from "@/lib/cms/soft-delete"

/**
 * İletişim formundan gelen mesajların dosya tabanlı deposu.
 *
 * Ziyaretçi mesajı public API'den (oturumsuz) yazılır; panel tarafı listeler,
 * okundu işaretler, durum değiştirir ve yumuşak siler. Silinen kayıtlar
 * geri dönüşüm mantığıyla `deletedAt` ile işaretlenir.
 */

const INQUIRIES_FILE = "inquiries.json"
const MAX_INQUIRIES = 5000

export const INQUIRY_TYPES = ["CONTACT", "COMPLAINT", "REQUEST", "SUGGESTION"] as const
export type InquiryType = (typeof INQUIRY_TYPES)[number]

export const INQUIRY_STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED"] as const
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number]

export type Inquiry = SoftDeletable & {
  id: string
  createdAt: string
  updatedAt: string
  type: InquiryType
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: InquiryStatus
  isRead: boolean
  ip?: string | null
}

export type NewInquiryInput = {
  type?: string
  name: string
  email?: string
  phone?: string
  subject?: string
  message: string
  ip?: string | null
}

function normalizeType(value: unknown): InquiryType {
  return INQUIRY_TYPES.includes(value as InquiryType) ? (value as InquiryType) : "CONTACT"
}

function normalizeStatus(value: unknown): InquiryStatus {
  return INQUIRY_STATUSES.includes(value as InquiryStatus) ? (value as InquiryStatus) : "NEW"
}

type RawRecord = Record<string, unknown>

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

/** Ham kaydı güvenli/eksiksiz bir Inquiry'ye dönüştürür. */
function mapInquiry(input: unknown): Inquiry {
  const raw = (input ?? {}) as RawRecord
  const createdAt = str(raw.createdAt) || new Date().toISOString()
  return {
    id: str(raw.id) || `inq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    updatedAt: str(raw.updatedAt) || createdAt,
    type: normalizeType(raw.type),
    name: str(raw.name).trim(),
    email: str(raw.email).trim(),
    phone: str(raw.phone).trim(),
    subject: str(raw.subject).trim(),
    message: str(raw.message).trim(),
    status: normalizeStatus(raw.status),
    isRead: raw.isRead === true,
    ip: typeof raw.ip === "string" ? raw.ip : null,
    deletedAt: (raw.deletedAt as string | null | undefined) ?? null,
    deletedBy: (raw.deletedBy as string | null | undefined) ?? null,
  }
}

async function readAll(): Promise<Inquiry[]> {
  try {
    const raw = await readJson<unknown[]>(INQUIRIES_FILE)
    return Array.isArray(raw) ? raw.map(mapInquiry) : []
  } catch {
    return []
  }
}

/** Yeni bir mesajı deponun başına ekler (oturumsuz public akış). */
export async function createInquiry(input: NewInquiryInput): Promise<Inquiry> {
  const now = new Date().toISOString()
  const record: Inquiry = {
    id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    type: normalizeType(input.type),
    name: String(input.name ?? "").trim(),
    email: String(input.email ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    subject: String(input.subject ?? "").trim(),
    message: String(input.message ?? "").trim(),
    status: "NEW",
    isRead: false,
    ip: input.ip ?? null,
    deletedAt: null,
    deletedBy: null,
  }

  await mutateJson<unknown[]>(INQUIRIES_FILE, (current) => {
    const list = Array.isArray(current) ? current : []
    return [record, ...list].slice(0, MAX_INQUIRIES)
  })

  return record
}

/** Panelde gösterilecek aktif (silinmemiş) mesajlar, en yeni önce. */
export async function listInquiries(): Promise<Inquiry[]> {
  const all = await readAll()
  return filterActive(all).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export type InquiryStats = {
  total: number
  unread: number
  byStatus: Record<InquiryStatus, number>
}

export async function getInquiryStats(): Promise<InquiryStats> {
  const active = filterActive(await readAll())
  const byStatus: Record<InquiryStatus, number> = {
    NEW: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
  }
  let unread = 0
  for (const item of active) {
    byStatus[item.status] += 1
    if (!item.isRead) unread += 1
  }
  return { total: active.length, unread, byStatus }
}

/** Tek kaydı verilen dönüştürücüyle günceller; aktif kayıt yoksa null döner. */
export async function updateInquiry(
  id: string,
  patch: (item: Inquiry) => Inquiry
): Promise<Inquiry | null> {
  let updated: Inquiry | null = null
  await mutateJson<unknown[]>(INQUIRIES_FILE, (current) => {
    const list = Array.isArray(current) ? current : []
    return list.map((raw) => {
      const item = mapInquiry(raw)
      if (item.id !== id || !isActiveRecord(item)) return raw
      updated = { ...patch(item), updatedAt: new Date().toISOString() }
      return updated
    })
  })
  return updated
}
