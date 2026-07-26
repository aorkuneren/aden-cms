import { prisma } from "@/lib/db"
import { queueAccountEmail } from "@/lib/email/jobs"
import { generateToken, hashToken } from "./tokens"

export async function createInvitationForUser(input: {
  userId: string
  invitedById: string
}) {
  const user = await prisma.user.findFirst({
    where: { id: input.userId, actorType: "STAFF", deletedAt: null },
  })
  if (!user?.roleId) throw new Error("Davet için rolü olan bir kullanıcı gerekli.")
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.invitation.deleteMany({ where: { email: user.email, acceptedAt: null } })
  const invitation = await prisma.invitation.create({
    data: {
      email: user.email,
      roleId: user.roleId,
      token: hashToken(token),
      invitedById: input.invitedById,
      expiresAt,
    },
  })
  await queueAccountEmail({
    template: "INVITATION",
    recordId: invitation.id,
    to: user.email,
    name: user.name,
    token,
    expiresAt,
  })
  return invitation
}

export async function createPasswordResetForUser(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, actorType: "STAFF", deletedAt: null, status: "ACTIVE" },
  })
  if (!user) return null
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } })
  const reset = await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
  })
  await queueAccountEmail({
    template: "PASSWORD_RESET",
    recordId: reset.id,
    to: user.email,
    name: user.name,
    token,
    expiresAt,
  })
  return reset
}
