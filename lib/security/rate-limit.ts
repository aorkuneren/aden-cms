const rateLimitStore = new Map<string, { count: number; expiresAt: number }>()

interface RateLimitOptions {
  windowMs?: number // Varsayılan 60 saniye
  maxRequests?: number // Varsayılan 60 istek
}

/**
 * IP adresi bazlı in-memory rate limiting koruması.
 */
export function checkRateLimit(ip: string, options: RateLimitOptions = {}): { success: boolean; remaining: number } {
  const windowMs = options.windowMs || 60 * 1000
  const maxRequests = options.maxRequests || 60
  const now = Date.now()

  const entry = rateLimitStore.get(ip)

  if (!entry || entry.expiresAt < now) {
    rateLimitStore.set(ip, { count: 1, expiresAt: now + windowMs })
    return { success: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: maxRequests - entry.count }
}
