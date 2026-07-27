/**
 * Davet / parola sıfırlama token akışları.
 * Prisma `User` / `Invitation` / `PasswordResetToken` CMS şemasında yok.
 */

export async function createInvitationForUser(_input: {
  userId: string
  invitedById: string
}): Promise<never> {
  throw new Error(
    "Davet akışı henüz aktif değil: User/Invitation modelleri CMS şemasına eklenmedi."
  )
}

export async function createPasswordResetForUser(_userId: string): Promise<null> {
  return null
}
