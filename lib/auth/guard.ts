import { redirect } from "next/navigation"
import { getCurrentUser, userCan, type CurrentUser } from "./current-user"

/**
 * Sunucu tarafı yetki guard'ları. Server Component / Server Action / Route
 * Handler içinde çağrılır. Kaba koruma middleware'de; ince (izin bazlı)
 * koruma burada yapılır.
 */

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/admin/login")
  }
  return user
}

export async function requirePermission(permissionKey: string): Promise<CurrentUser> {
  const user = await requireUser()
  if (!userCan(user, permissionKey)) {
    redirect("/admin/403")
  }
  return user
}
