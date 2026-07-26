"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin, getAdminUsers, saveAdminUsers, type AdminUser, type AdminRole } from "@/lib/admin/auth"
import { logAuditEvent } from "@/lib/audit"

export async function createAdminUserAction(formData: FormData) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin || currentAdmin.role !== "SUPERADMIN") {
      return { ok: false, error: "Bu işlemi sadece Süper Yöneticiler gerçekleştirebilir." }
    }

    const name = (formData.get("name") as string || "").trim()
    const email = (formData.get("email") as string || "").trim().toLowerCase()
    const password = formData.get("password") as string || ""
    const role = (formData.get("role") as AdminRole) || "STAFF"

    if (!name || !email || !password) {
      return { ok: false, error: "Lütfen tüm zorunlu alanları doldurun." }
    }

    if (password.length < 6) {
      return { ok: false, error: "Parola en az 6 karakter olmalıdır." }
    }

    const users = await getAdminUsers()
    if (users.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, error: "Bu e-posta adresi ile kayıtlı başka bir yönetici bulunuyor." }
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const newUser: AdminUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      email,
      role,
      passwordHash,
      isActive: true,
    }

    await saveAdminUsers([...users, newUser])

    await logAuditEvent({
      actorUserId: currentAdmin.id,
      actorName: currentAdmin.name,
      action: "Yönetic Kullanıcısı Oluşturuldu",
      entityType: "user",
      entityId: newUser.id,
      details: { name: newUser.name, email: newUser.email, role: newUser.role },
    })

    revalidatePath("/admin/kullanicilar")
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || "Kullanıcı oluşturulurken bir hata meydana geldi." }
  }
}

export async function updateAdminUserRoleAction(userId: string, role: AdminRole) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin || currentAdmin.role !== "SUPERADMIN") {
      return { ok: false, error: "Bu işlemi sadece Süper Yöneticiler gerçekleştirebilir." }
    }

    const users = await getAdminUsers()
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, role } : u))
    await saveAdminUsers(updatedUsers)

    await logAuditEvent({
      actorUserId: currentAdmin.id,
      actorName: currentAdmin.name,
      action: "Kullanıcı Rolü Güncellendi",
      entityType: "user",
      entityId: userId,
      details: { role },
    })

    revalidatePath("/admin/kullanicilar")
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || "Rol güncellenirken hata oluştu." }
  }
}

export async function toggleAdminUserStatusAction(userId: string) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin || currentAdmin.role !== "SUPERADMIN") {
      return { ok: false, error: "Bu işlemi sadece Süper Yöneticiler gerçekleştirebilir." }
    }

    if (currentAdmin.id === userId) {
      return { ok: false, error: "Kendi hesabınızın durumunu değiştiremezsiniz." }
    }

    const users = await getAdminUsers()
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    await saveAdminUsers(updatedUsers)

    await logAuditEvent({
      actorUserId: currentAdmin.id,
      actorName: currentAdmin.name,
      action: "Kullanıcı Durumu Değiştirildi",
      entityType: "user",
      entityId: userId,
    })

    revalidatePath("/admin/kullanicilar")
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || "Durum değiştirilirken hata oluştu." }
  }
}

export async function deleteAdminUserAction(userId: string) {
  try {
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin || currentAdmin.role !== "SUPERADMIN") {
      return { ok: false, error: "Bu işlemi sadece Süper Yöneticiler gerçekleştirebilir." }
    }

    if (currentAdmin.id === userId) {
      return { ok: false, error: "Kendi hesabınızı silemezsiniz." }
    }

    const users = await getAdminUsers()
    const updatedUsers = users.filter((u) => u.id !== userId)
    await saveAdminUsers(updatedUsers)

    await logAuditEvent({
      actorUserId: currentAdmin.id,
      actorName: currentAdmin.name,
      action: "Kullanıcı Hesabı Silindi",
      entityType: "user",
      entityId: userId,
    })

    revalidatePath("/admin/kullanicilar")
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || "Kullanıcı silinirken hata oluştu." }
  }
}
