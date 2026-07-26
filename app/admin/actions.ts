"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import {
  createAdminSession,
  destroyAdminSession,
  verifyCredentials,
  ADMIN_LOGIN_PATH,
} from "@/lib/admin/auth"

const loginSchema = z.object({
  email: z.string().trim().min(1, "E-posta gerekli").email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Parola gerekli"),
})

export type LoginState = {
  error?: string
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz giriş bilgileri" }
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password)
  if (!user) {
    return { error: "E-posta veya parola hatalı" }
  }

  await createAdminSession(user.id)
  redirect("/admin")
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession()
  redirect(ADMIN_LOGIN_PATH)
}
