import { prisma } from "@/lib/db"
import { getSessionRecord } from "./session"

/**
 * Geçerli oturumdaki kullanıcıyı ve etkin izinlerini çözer.
 * Etkin izin = rol izinleri + kullanıcıya özel ALLOW - kullanıcıya özel DENY.
 * SUPERADMIN tüm izinlere sahiptir (isSuperadmin).
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

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      deletedAt: null,
      status: "ACTIVE",
      actorType: "STAFF",
    },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
      userPermissions: { include: { permission: true } },
    },
  })
  if (!user) return null

  const permissions = new Set<string>()
  if (user.role) {
    for (const rp of user.role.permissions) permissions.add(rp.permission.key)
  }
  for (const up of user.userPermissions) {
    if (up.effect === "ALLOW") permissions.add(up.permission.key)
    else permissions.delete(up.permission.key)
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roleKey: user.role?.key ?? null,
    roleName: user.role?.name ?? null,
    isSuperadmin: user.isSuperadmin,
    permissions,
  }
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
