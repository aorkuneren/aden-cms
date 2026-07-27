/**
 * MySQL CMS migrasyonu sonrası: müşteri/staff `User` + `Session` tabloları
 * şemada yok (AdminUser cookie auth kullanılıyor). Bu modül derlemeyi kırmaz;
 * çağrıldığında null döner / no-op yapar.
 *
 * Tam müşteri auth ayrı bir migrasyon işidir.
 */

const CUSTOMER_COOKIE_NAME = "aden_customer_session"

export type CustomerUser = {
  id: string
  email: string
  name: string
  phone: string | null
  actorType: "CUSTOMER"
  status: string
}

export async function createCustomerSession(_userId: string): Promise<void> {
  throw new Error(
    "Müşteri oturumu henüz aktif değil: Prisma User/Session modelleri CMS şemasına eklenmedi."
  )
}

export async function getCurrentCustomer(): Promise<CustomerUser | null> {
  return null
}

export async function destroyCustomerSession(): Promise<void> {
  // Cookie varsa temizle — DB session yok.
  try {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    cookieStore.delete(CUSTOMER_COOKIE_NAME)
  } catch {
    // non-request context
  }
}
