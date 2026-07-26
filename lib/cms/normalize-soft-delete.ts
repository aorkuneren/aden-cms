export function ensureSoftDeleteFields<T extends Record<string, unknown>>(item: T): T & {
  deletedAt: string | null
  deletedBy: string | null
} {
  return {
    ...item,
    deletedAt: typeof item.deletedAt === "string" ? item.deletedAt : null,
    deletedBy: typeof item.deletedBy === "string" ? item.deletedBy : null,
  }
}
