/**
 * Auth sabitleri — hem sunucu (session.ts) hem middleware tarafından
 * kullanılır. Bu modül Prisma/next-headers İÇERMEZ; böylece middleware
 * bundle'ına ağır bağımlılık girmez.
 */
export const SESSION_COOKIE = "aden_session"

/** Kimlik doğrulaması gerektirmeyen /admin yolları. */
export const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/hesap-kur",
  "/admin/parola-sifirla",
  "/admin/403",
]
