import { describe, expect, it } from "vitest"
import { withFileLock } from "@/lib/cms/file-lock"

describe("withFileLock", () => {
  it("aynı anahtar için işlemleri sıraya dizer", async () => {
    const order: number[] = []
    const slow = withFileLock("a", async () => {
      order.push(1)
      await new Promise((r) => setTimeout(r, 30))
      order.push(2)
    })
    const fast = withFileLock("a", async () => {
      order.push(3)
    })
    await Promise.all([slow, fast])
    expect(order).toEqual([1, 2, 3])
  })

  it("farklı anahtarlar paralel çalışabilir", async () => {
    const order: string[] = []
    const a = withFileLock("a", async () => {
      order.push("a-start")
      await new Promise((r) => setTimeout(r, 20))
      order.push("a-end")
    })
    const b = withFileLock("b", async () => {
      order.push("b-start")
      await new Promise((r) => setTimeout(r, 5))
      order.push("b-end")
    })
    await Promise.all([a, b])
    expect(order.indexOf("b-end")).toBeLessThan(order.indexOf("a-end"))
  })

  it("aynı anahtarda iç içe withFileLock reentrant hatası fırlatır", async () => {
    await expect(
      withFileLock("a", async () => {
        await withFileLock("a", async () => {})
      }),
    ).rejects.toThrow("Dosya kilidi yeniden giriş (reentrant) desteklenmiyor: a")
  })

  it("ilk iş hata verse bile kilit serbest kalır ve sıradaki iş çalışır", async () => {
    const order: number[] = []

    const first = withFileLock("a", async () => {
      order.push(1)
      throw new Error("fail")
    })

    const second = withFileLock("a", async () => {
      order.push(2)
    })

    await expect(first).rejects.toThrow("fail")
    await second
    expect(order).toEqual([1, 2])
  })
})
