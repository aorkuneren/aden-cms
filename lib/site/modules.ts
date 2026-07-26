import { settingsQueries } from "@/lib/data/queries"

export const USER_SYSTEM_PATHS = ["/giris", "/kayit-ol", "/sifremi-unuttum", "/hesabim"] as const

export async function isUserSystemEnabled(): Promise<boolean> {
  const settings = await settingsQueries.findFirst()
  const enabled = (settings as { modules?: { userSystem?: { enabled?: unknown } } } | null)?.modules?.userSystem?.enabled

  return enabled === true || enabled === 1
}

export function isUserSystemPath(pathname: string): boolean {
  return USER_SYSTEM_PATHS.some((path) => path === pathname)
}
