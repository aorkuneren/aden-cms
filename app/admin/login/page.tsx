import { redirect } from "next/navigation"

import { getCurrentAdmin } from "@/lib/admin/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { LoginForm } from "./login-form"

export default async function AdminLoginPage() {
  // Zaten girişliyse doğrudan panele al.
  const admin = await getCurrentAdmin()
  if (admin) redirect("/admin")

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-semibold">
            A
          </div>
          <CardTitle className="text-xl">Aden Yönetim Paneli</CardTitle>
          <CardDescription>Devam etmek için giriş yapın</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
