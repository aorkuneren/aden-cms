export type AccountEmailTemplate = "INVITATION" | "PASSWORD_RESET"

export type QueueAccountEmailInput = {
  template: AccountEmailTemplate
  recordId: string
  to: string
  name: string
  token: string
  expiresAt: Date
}

export async function queueAccountEmail(input: QueueAccountEmailInput) {
  void input
  return null
}
