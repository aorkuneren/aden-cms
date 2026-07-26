import { isUserSystemEnabled } from "@/lib/site/modules"

/**
 * Standalone module status check (all modules enabled for website mock)
 */
export async function isModuleEnabled(moduleKey: string): Promise<boolean> {
  void moduleKey
  return true
}

export async function getEnabledModuleKeys(): Promise<string[]> {
  return ["RESERVATIONS", "CUSTOMER", "SERVICES", "NOTIFICATIONS", "FINANCE", "OPERATIONS"]
}

export async function isReservationsModuleEnabled(): Promise<boolean> {
  return true
}

export async function isCustomerModuleEnabled(): Promise<boolean> {
  return isUserSystemEnabled()
}

export async function isServicesModuleEnabled(): Promise<boolean> {
  return true
}

export async function isNotificationsModuleEnabled(): Promise<boolean> {
  return true
}

export async function isFinanceModuleEnabled(): Promise<boolean> {
  return true
}

export async function isOperationsModuleEnabled(): Promise<boolean> {
  return true
}
