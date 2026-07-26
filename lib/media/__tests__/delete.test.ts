import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("deleteUploadByUrl", () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aden-upload-"))
    vi.stubEnv("UPLOAD_DIR", tmpRoot)
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    await fs.rm(tmpRoot, { recursive: true, force: true })
  })

  it("harici URL için no-op döner", async () => {
    const { deleteUploadByUrl } = await import("../delete")
    await expect(deleteUploadByUrl("https://cdn.example.com/a.jpg")).resolves.toEqual({
      deleted: false,
      reason: "external",
    })
  })

  it("legacy /upload/ path için no-op döner", async () => {
    const { deleteUploadByUrl } = await import("../delete")
    await expect(deleteUploadByUrl("/upload/eski.webp")).resolves.toEqual({
      deleted: false,
      reason: "not-managed",
    })
  })

  it("/uploads altındaki dosyayı siler", async () => {
    const rel = path.join("galeri", "bungalovlar", "img-1.jpeg")
    const abs = path.join(tmpRoot, rel)
    await fs.mkdir(path.dirname(abs), { recursive: true })
    await fs.writeFile(abs, "x")

    const { deleteUploadByUrl } = await import("../delete")
    const result = await deleteUploadByUrl("/uploads/galeri/bungalovlar/img-1.jpeg")
    expect(result).toEqual({ deleted: true })
    await expect(fs.access(abs)).rejects.toThrow()
  })

  it("olmayan dosya için deleted: true (idempotent)", async () => {
    const { deleteUploadByUrl } = await import("../delete")
    await expect(deleteUploadByUrl("/uploads/yok.jpeg")).resolves.toEqual({ deleted: true })
  })

  it("path traversal engeller", async () => {
    const { deleteUploadByUrl } = await import("../delete")
    await expect(deleteUploadByUrl("/uploads/../../etc/passwd")).resolves.toEqual({
      deleted: false,
      reason: "invalid-path",
    })
  })

  it("query/hash içeren URL ile dosyayı siler", async () => {
    const abs = path.join(tmpRoot, "a.jpg")
    await fs.writeFile(abs, "x")
    const { deleteUploadByUrl } = await import("../delete")
    await expect(deleteUploadByUrl("/uploads/a.jpg?v=2#top")).resolves.toEqual({ deleted: true })
    await expect(fs.access(abs)).rejects.toThrow()
  })

  it("collectMediaUrls galeri ve bungalov alanlarını toplar", async () => {
    const { collectMediaUrls } = await import("../delete")
    expect(collectMediaUrls("cms_gallery", { imageUrl: "/uploads/a.jpg" })).toEqual(["/uploads/a.jpg"])
    expect(
      collectMediaUrls("cms_slider", { imageUrl: "/uploads/i.jpg", videoUrl: "/uploads/v.mp4" })
    ).toEqual(["/uploads/i.jpg", "/uploads/v.mp4"])
    expect(
      collectMediaUrls("bungalow", {
        image: "/uploads/cover.jpg",
        galleryImages: ["/uploads/g1.jpg", "https://x.com/y.jpg"],
      })
    ).toEqual(["/uploads/cover.jpg", "/uploads/g1.jpg", "https://x.com/y.jpg"])
    expect(collectMediaUrls("cms_faq", { question: "x" })).toEqual([])
  })
})
