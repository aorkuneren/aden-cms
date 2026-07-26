"use client"

/**
 * Auth yerine geçen yalın shim.
 *
 * Bu tanıtım sitesinde kimlik doğrulama yoktur. Bileşenler eskiden
 * `next-auth/react` kullanıyordu; burada aynı arayüz "hiçbir zaman giriş
 * yapılmamış" davranışıyla sağlanır. Böylece auth'a bağlı arayüz doğal olarak
 * çıkış yapmış hâlini render eder ve büyük bileşenleri kesip biçmeye gerek
 * kalmaz.
 *
 * Panel/auth yazıldığında bu dosyayı gerçek next-auth ile değiştirmek yeterli.
 */

export type SessionUser = {
  id?: string
  email?: string | null
  name?: string | null
  actorType?: "STAFF" | "CUSTOMER"
  customerId?: string
}

export type Session = { user?: SessionUser } | null

export function useSession(): {
  data: Session
  status: "authenticated" | "unauthenticated" | "loading"
} {
  return { data: null, status: "unauthenticated" }
}

export async function signOut(): Promise<void> {
  // Oturum yok; yapılacak bir şey de yok.
}

export async function signIn(): Promise<void> {
  // Oturum yok.
}
