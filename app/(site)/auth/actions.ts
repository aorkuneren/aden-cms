"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { redirectWithMessage } from "@/lib/admin/action-utils"
import { destroyCustomerSession, getCurrentCustomer } from "@/lib/auth/customer-session"

const UNAVAILABLE =
  "Müşteri hesabı geçici olarak kullanılamıyor. Yönetim paneli girişi için /admin/login kullanın."

/**
 * Müşteri Giriş Action'ı
 * Not: Prisma User/Session CMS migrasyonunda yok; build için stub.
 */
export async function customerLoginAction(_formData: FormData) {
  return redirectWithMessage("/giris", "error", UNAVAILABLE)
}

/**
 * Müşteri Kayıt Action'ı
 */
export async function customerRegisterAction(_formData: FormData) {
  return redirectWithMessage("/kayit-ol", "error", UNAVAILABLE)
}

/**
 * Müşteri Çıkış Action'ı
 */
export async function customerLogoutAction() {
  await destroyCustomerSession()
  revalidatePath("/")
  redirect("/giris")
}

/**
 * Müşteri Profil Güncelleme Action'ı
 */
export async function updateCustomerProfileAction(_formData: FormData) {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return redirectWithMessage("/giris", "error", "Lütfen önce giriş yapın.")
  }
  return redirectWithMessage("/hesabim?bolum=profilim", "error", UNAVAILABLE)
}
