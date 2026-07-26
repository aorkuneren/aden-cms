"use client"

import { useState, useTransition } from "react"
import {
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react"

import { type AdminUser, type AdminRole } from "@/lib/admin/auth"
import {
  createAdminUserAction,
  updateAdminUserRoleAction,
  toggleAdminUserStatusAction,
  deleteAdminUserAction,
} from "@/app/admin/(panel)/kullanicilar/actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPERADMIN: "Süper Yönetici",
  ADMIN: "Firma Yöneticisi",
  CONTENT_EDITOR: "İçerik Editörü",
  STAFF: "Personel",
}

export function UserManager({
  users: initialUsers,
  currentUserId,
}: {
  users: Omit<AdminUser, "passwordHash">[]
  currentUserId: string
}) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState("")
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)

  // Yeni Kullanıcı Modalı
  const [openNewUser, setOpenNewUser] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<AdminRole>("STAFF")

  // Silme onay
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("name", name)
    formData.append("email", email)
    formData.append("password", password)
    formData.append("role", role)

    startTransition(async () => {
      setStatus(null)
      const res = await createAdminUserAction(formData)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Yeni yönetici kullanıcısı başarıyla eklendi." })
        setOpenNewUser(false)
        setName("")
        setEmail("")
        setPassword("")
        setRole("STAFF")
        // Sayfa reload ile güncel liste gelir
        window.location.reload()
      } else {
        setStatus({ type: "err", msg: res.error || "Oluşturma başarısız." })
      }
    })
  }

  const handleRoleChange = (userId: string, newRole: AdminRole) => {
    startTransition(async () => {
      const res = await updateAdminUserRoleAction(userId, newRole)
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
        setStatus({ type: "ok", msg: "Kullanıcı rolü güncellendi." })
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  const handleToggleStatus = (userId: string) => {
    startTransition(async () => {
      const res = await toggleAdminUserStatusAction(userId)
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)))
        setStatus({ type: "ok", msg: "Kullanıcı durumu güncellendi." })
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  const handleDelete = (userId: string) => {
    startTransition(async () => {
      const res = await deleteAdminUserAction(userId)
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        setStatus({ type: "ok", msg: "Kullanıcı hesabı silindi." })
        setDeleteId(null)
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <SaveStatusBanner status={status} />

      {/* Üst İşlem Barları */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya e-posta ile ara..."
            className="pl-9 text-sm"
          />
        </div>

        <Button onClick={() => setOpenNewUser(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="mr-1 size-4" /> Yeni Yönetici Ekle
        </Button>
      </div>

      {/* Kullanıcılar Listesi */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Yönetici</th>
                  <th className="px-4 py-3">E-Posta</th>
                  <th className="px-4 py-3">Rol & İzin Derecesi</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {filtered.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-neutral-900/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {user.name} {user.id === currentUserId ? <span className="text-xs font-normal text-emerald-600">(Siz)</span> : null}
                          </p>
                          <p className="text-xs text-slate-400">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={user.role}
                        onValueChange={(val) => handleRoleChange(user.id, val as AdminRole)}
                        disabled={pending}
                      >
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue>{ROLE_LABELS[user.role] || user.role}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUPERADMIN">Süper Yönetici</SelectItem>
                          <SelectItem value="ADMIN">Firma Yöneticisi</SelectItem>
                          <SelectItem value="CONTENT_EDITOR">İçerik Editörü</SelectItem>
                          <SelectItem value="STAFF">Personel</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-emerald-600" : ""}>
                        {user.isActive ? <CheckCircle2 className="mr-1 size-3" /> : <XCircle className="mr-1 size-3" />}
                        {user.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.id !== currentUserId ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleToggleStatus(user.id)}
                              disabled={pending}
                              title={user.isActive ? "Pasife Al" : "Aktif Et"}
                            >
                              {user.isActive ? <UserX className="size-4 text-amber-600" /> : <UserCheck className="size-4 text-emerald-600" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(user.id)}
                              disabled={pending}
                              title="Sil"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Yeni Kullanıcı Modalı */}
      <Dialog open={openNewUser} onOpenChange={setOpenNewUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Yönetici Kullanıcısı Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Ad Soyad *</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">E-Posta Adresi *</label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ahmet@adenbungalov.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Giriş Parolası *</label>
              <Input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Kullanıcı Rolü *</label>
              <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPERADMIN">Süper Yönetici (Tam Yetki)</SelectItem>
                  <SelectItem value="ADMIN">Firma Yöneticisi</SelectItem>
                  <SelectItem value="CONTENT_EDITOR">İçerik Editörü</SelectItem>
                  <SelectItem value="STAFF">Personel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenNewUser(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
                Kullanıcıyı Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Modalı */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bu yönetici hesabını silmek istediğinizden emin misiniz? Kullanıcı panele giriş yapamayacaktır.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={pending}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
