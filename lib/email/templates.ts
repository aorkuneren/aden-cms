import type { AccountEmailTemplate } from "./jobs"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function buildAccountEmail(input: {
  template: AccountEmailTemplate
  name: string
  token: string
  expiresAt: string
  siteOrigin: string
}) {
  const path = input.template === "INVITATION" ? "/admin/hesap-kur" : "/admin/parola-sifirla"
  const url = new URL(path, input.siteOrigin)
  url.searchParams.set("token", input.token)
  const title = input.template === "INVITATION" ? "Aden Yönetim davetiniz" : "Aden Yönetim parola sıfırlama"
  const action = input.template === "INVITATION" ? "Hesabınızı etkinleştirin" : "Parolanızı sıfırlayın"
  const safeName = escapeHtml(input.name)
  const safeUrl = escapeHtml(url.toString())
  const expiry = new Date(input.expiresAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })
  return {
    subject: title,
    text: `Merhaba ${input.name},\n\n${action}: ${url.toString()}\n\nBağlantı ${expiry} tarihine kadar geçerlidir. Bu işlemi siz istemediyseniz e-postayı yok sayın.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#18261e"><h1 style="font-size:22px">${title}</h1><p>Merhaba ${safeName},</p><p>${action} için aşağıdaki bağlantıyı kullanın.</p><p><a href="${safeUrl}" style="display:inline-block;background:#18261e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">${action}</a></p><p style="font-size:13px;color:#666">Bağlantı ${escapeHtml(expiry)} tarihine kadar geçerlidir. Bu işlemi siz istemediyseniz e-postayı yok sayın.</p></div>`,
  }
}
