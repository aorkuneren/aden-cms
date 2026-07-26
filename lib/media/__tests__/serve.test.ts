import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("assertPathInsideRoot", () => {
  it("root ile eşit yolu kabul eder", async () => {
    const { assertPathInsideRoot } = await import("../serve")
    expect(assertPathInsideRoot("/var/uploads", "/var/uploads")).toBe(true)
  })

  it("root altındaki yolu kabul eder", async () => {
    const { assertPathInsideRoot } = await import("../serve")
    expect(assertPathInsideRoot("/var/uploads", "/var/uploads/a.jpg")).toBe(true)
  })

  it("root dışındaki yolu reddeder", async () => {
    const { assertPathInsideRoot } = await import("../serve")
    expect(assertPathInsideRoot("/var/uploads", "/var/other/a.jpg")).toBe(false)
  })

  it("prefix tuzağına düşmez", async () => {
    const { assertPathInsideRoot } = await import("../serve")
    expect(assertPathInsideRoot("/var/uploads", "/var/uploads-evil/a.jpg")).toBe(false)
  })
})

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

describe("resolveSafeUploadFilePath", () => {
  let tmpRoot: string
  let outsideDir: string

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aden-upload-"))
    outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), "aden-outside-"))
    vi.stubEnv("UPLOAD_DIR", tmpRoot)
    vi.resetModules()
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    await fs.rm(tmpRoot, { recursive: true, force: true })
    await fs.rm(outsideDir, { recursive: true, force: true })
  })

  it("root altındaki gerçek dosyayı canonical yola çözer", async () => {
    const rel = path.join("galeri", "a.jpg")
    const abs = path.join(tmpRoot, rel)
    await fs.mkdir(path.dirname(abs), { recursive: true })
    await fs.writeFile(abs, "data")

    const { resolveSafeUploadFilePath } = await import("../serve")
    const result = await resolveSafeUploadFilePath(["galeri", "a.jpg"])
    expect(result).toBe(await fs.realpath(abs))
  })

  it("symlink escape dışarıyı reddeder", async () => {
    await fs.writeFile(path.join(outsideDir, "secret.txt"), "secret")
    await fs.symlink(path.join(outsideDir, "secret.txt"), path.join(tmpRoot, "link.txt"))

    const { resolveSafeUploadFilePath } = await import("../serve")
    const result = await resolveSafeUploadFilePath(["link.txt"])
    expect(result).toBeNull()
  })

  it("olmayan dosya için null döner", async () => {
    const { resolveSafeUploadFilePath } = await import("../serve")
    const result = await resolveSafeUploadFilePath(["missing.jpg"])
    expect(result).toBeNull()
  })
})
