import { AsyncLocalStorage } from "node:async_hooks"

const chains = new Map<string, Promise<unknown>>()
const heldKeys = new AsyncLocalStorage<Set<string>>()

export async function withFileLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const current = heldKeys.getStore()
  if (current?.has(key)) {
    throw new Error(`Dosya kilidi yeniden giriş (reentrant) desteklenmiyor: ${key}`)
  }

  const prev = chains.get(key) ?? Promise.resolve()
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const next = prev.then(() => gate).catch(() => undefined)
  chains.set(key, next)

  await prev.catch(() => undefined)

  const keys = new Set(current)
  keys.add(key)

  try {
    return await heldKeys.run(keys, fn)
  } finally {
    release()
    if (chains.get(key) === next) {
      chains.delete(key)
    }
  }
}
