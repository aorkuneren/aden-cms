export type SoftDeletable = {
  deletedAt?: string | null
  deletedBy?: string | null
}

export function isActiveRecord<T extends object>(record: T & SoftDeletable): boolean {
  return record.deletedAt == null || record.deletedAt === ""
}

export function markDeleted<T extends object>(
  record: T,
  adminId: string,
  now: string = new Date().toISOString()
): T & SoftDeletable {
  return { ...record, deletedAt: now, deletedBy: adminId }
}

export function restoreDeleted<T extends SoftDeletable>(record: T): T {
  return { ...record, deletedAt: null, deletedBy: null }
}

export function filterActive<T extends SoftDeletable>(items: T[]): T[] {
  return items.filter(isActiveRecord)
}

export function filterDeleted<T extends SoftDeletable>(items: T[]): T[] {
  return items.filter((item) => !isActiveRecord(item))
}
