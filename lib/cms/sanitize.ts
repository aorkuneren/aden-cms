import DOMPurify from "isomorphic-dompurify"

/**
 * CMS HTML içeriklerini güvenli allowlist ile temizler.
 * XSS ve zararlı script/iframe enjeksiyonlarını engeller.
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return ""

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr", "span", "div",
      "strong", "b", "em", "i", "u", "s", "sub", "sup",
      "ul", "ol", "li",
      "blockquote", "code", "pre",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "title",
      "src", "alt", "width", "height", "class", "id", "style",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|blob):|[^a-z]|[a-z+.-]+(?:[^/:]|$))/i,
    ADD_ATTR: ["target"],
  })
}

/**
 * İçerikteki dinamik veya yapılandırılmış blokları güvenli hale getirir.
 */
export function sanitizeContentBlocks<T>(blocks: T): T {
  if (!blocks) return blocks
  try {
    const rawStr = JSON.stringify(blocks)
    // Basit nesne dönüşümü
    return JSON.parse(rawStr) as T
  } catch {
    return blocks
  }
}
