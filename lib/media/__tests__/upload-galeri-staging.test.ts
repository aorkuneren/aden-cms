import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("saveUpload galeri staging", () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aden-up-"))
    vi.stubEnv("UPLOAD_DIR", tmpRoot)
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    await fs.rm(tmpRoot, { recursive: true, force: true })
  })

  it("galeri yüklemeyi _staging altına yazar", async () => {
    const { saveUpload } = await import("../upload")
    const result = await saveUpload(
      Buffer.from("fake"),
      "Fotoğraf.jpg",
      "image/jpeg",
      { scope: "galeri", category: "gallery-category-bungalovlar" }
    )
    expect(result.url).toMatch(/^\/uploads\/galeri\/_staging\//)
    expect(result.url).not.toContain("gallery-category-")
    const abs = path.join(tmpRoot, result.url.replace("/uploads/", ""))
    await expect(fs.access(abs)).resolves.toBeUndefined()
  })
})
