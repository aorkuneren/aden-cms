"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { readString, redirectWithMessage } from "@/lib/admin/action-utils"
import {
  createCustomerSession,
  destroyCustomerSession,
  getCurrentCustomer,
} from "@/lib/auth/customer-session"
import { hashPassword, verifyPassword } from "@/lib/auth/password"

/**
 * Müşteri Giriş Action'ı
 */
export async function customerLoginAction(formData: FormData) {
  const email = readString(formData, "email")
  const password = readString(formData, "password")

  if (!email || !password) {
    return redirectWithMessage("/giris", "error", "E-posta ve parola zorunludur.")
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      actorType: "CUSTOMER",
    },
  })

  if (!user || !user.passwordHash) {
    return redirectWithMessage("/giris", "error", "E-posta adresi veya parola hatalı.")
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    return redirectWithMessage("/giris", "error", "E-posta adresi veya parola hatalı.")
  }

  if (user.status !== "ACTIVE") {
    return redirectWithMessage("/giris", "error", "Hesabınız pasif durumdadır.")
  }

  await createCustomerSession(user.id)

  revalidatePath("/hesabim")
  redirect("/hesabim")
}

/**
 * Müşteri Kayıt Action'ı
 */
export async function customerRegisterAction(formData: FormData) {
  const name = readString(formData, "name")
  const email = readString(formData, "email")
  const phone = readString(formData, "phone")
  const password = readString(formData, "password")

  if (!name || !email || !phone || !password) {
    return redirectWithMessage("/kayit-ol", "error", "Lütfen tüm zorunlu alanları doldurun.")
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return redirectWithMessage("/kayit-ol", "error", "Bu e-posta adresiyle bir hesap zaten mevcut.")
  }

  const passwordHash = await hashPassword(password)

  // Müşteri Kullanıcı Oluştur
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      actorType: "CUSTOMER",
      status: "ACTIVE",
    },
  })

  // Önceden bu e-posta veya telefon ile bırakılan Rezervasyon ve Talepleri otomatik eşle
  await prisma.reservation.updateMany({
    where: {
      customerId: null,
      OR: [{ guestEmail: email }, { guestPhone: phone }],
    },
    data: {
      customerId: user.id,
    },
  })

  await createCustomerSession(user.id)

  revalidatePath("/hesabim")
  redirect("/hesabim?kayit=tamam")
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
export async function updateCustomerProfileAction(formData: FormData) {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return redirectWithMessage("/giris", "error", "Lütfen önce giriş yapın.")
  }

  const name = readString(formData, "name")
  const phone = readString(formData, "phone")
  const newPassword = readString(formData, "newPassword")

  const dataToUpdate: { name?: string; phone?: string; passwordHash?: string } = {}

  if (name) dataToUpdate.name = name
  if (phone) dataToUpdate.phone = phone
  if (newPassword && newPassword.length >= 6) {
    dataToUpdate.passwordHash = await hashPassword(newPassword)
  }

  await prisma.user.update({
    where: { id: customer.id },
    data: dataToUpdate,
  })

  revalidatePath("/hesabim")
  return redirectWithMessage("/hesabim?bolum=profilim", "ok", "Profil bilgileriniz güncellendi.")
}
