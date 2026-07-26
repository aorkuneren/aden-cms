import { beforeEach, describe, expect, it, vi } from "vitest"

const { findFirst } = vi.hoisted(() => ({
  findFirst: vi.fn(),
}))

vi.mock("@/lib/data/queries", () => ({
  settingsQueries: { findFirst },
}))

import {
  isUserSystemEnabled,
  isUserSystemPath,
  USER_SYSTEM_PATHS,
} from "@/lib/site/modules"

describe("Kullanıcı Sistemi modülü", () => {
  beforeEach(() => {
    findFirst.mockReset()
  })

  it("ayar olmadığında varsayılan olarak pasiftir", async () => {
    findFirst.mockResolvedValue(null)

    await expect(isUserSystemEnabled()).resolves.toBe(false)
  })

  it.each([true, 1])("enabled değeri %s olduğunda aktiftir", async (enabled) => {
    findFirst.mockResolvedValue({ modules: { userSystem: { enabled } } })

    await expect(isUserSystemEnabled()).resolves.toBe(true)
  })

  it("tanımlı kullanıcı sistemi yollarını ayırt eder", () => {
    for (const pathname of USER_SYSTEM_PATHS) {
      expect(isUserSystemPath(pathname)).toBe(true)
    }

    expect(isUserSystemPath("/")).toBe(false)
    expect(isUserSystemPath("/giris/alt-sayfa")).toBe(false)
  })
})
