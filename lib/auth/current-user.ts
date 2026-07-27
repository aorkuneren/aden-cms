import { getSessionRecord } from "./session"

/**
 * Geçerli oturumdaki staff kullanıcıyı ve etkin izinlerini çözer.
 * CMS migrasyonu sonrası Prisma `User`/RBAC tabloları yok — her zaman null.
 * Admin paneli `getCurrentAdmin()` kullanır.
 */
export type CurrentUser = {
  id: string
  email: string
  name: string
  roleKey: string | null
  roleName: string | null
  isSuperadmin: boolean
  permissions: Set<string>
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionRecord()
  if (!session) return null
  return null
}

/** Kullanıcının belirli bir izne sahip olup olmadığını döndürür. */
export function userCan(user: CurrentUser | null, permissionKey: string): boolean {
  if (!user) return false
  if (user.isSuperadmin) return true
  return user.permissions.has(permissionKey)
}

/** Verilen izinlerden en az birine sahip mi? (menü/erişim kararları için) */
export function userCanAny(user: CurrentUser | null, permissionKeys: string[]): boolean {
  if (!user) return false
  if (user.isSuperadmin) return true
  return permissionKeys.some((key) => user.permissions.has(key))
}
