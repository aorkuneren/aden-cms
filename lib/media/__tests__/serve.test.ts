import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("resolveUploadFilePath", () => {
  beforeEach(() => {
    vi.stubEnv("UPLOAD_DIR", "/var/uploads")
    vi.resetModules()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("geçerli segmentleri root altına çözer", async () => {
    const { resolveUploadFilePath } = await import("../serve")
    const abs = resolveUploadFilePath(["galeri", "cat", "a.jpg"])
    expect(abs).toBe(path.join("/var/uploads", "galeri", "cat", "a.jpg"))
  })

  it(".. segmentini reddeder", async () => {
    const { resolveUploadFilePath } = await import("../serve")
    expect(resolveUploadFilePath(["galeri", "..", "secret"])).toBeNull()
  })

  it("boş segment reddeder", async () => {
    const { resolveUploadFilePath } = await import("../serve")
    expect(resolveUploadFilePath([])).toBeNull()
    expect(resolveUploadFilePath(["galeri", ""])).toBeNull()
  })
})
