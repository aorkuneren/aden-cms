import { cache } from "react"

export const getEnabledModuleAccess = cache(async () => {
  return new Map<string, string[] | null>([
    ["RESERVATIONS", null],
    ["CUSTOMER", null],
    ["SERVICES", null],
    ["NOTIFICATIONS", null],
    ["FINANCE", null],
    ["OPERATIONS", null],
  ])
})

export async function isModuleEnabled(moduleKey: string): Promise<boolean> {
  void moduleKey
  return true
}

export async function userCanAccessModule(user: any, moduleKey: string): Promise<boolean> {
  void user
  void moduleKey
  return true
}

export async function requireModulePermission(moduleKey: string, permissionKey: string) {
  void moduleKey
  void permissionKey
  return null
}
