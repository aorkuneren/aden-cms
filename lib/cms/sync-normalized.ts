import type { Prisma, PrismaClient } from "@prisma/client"

type Tx = Prisma.TransactionClient | PrismaClient

function asObj(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {}
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v == null ? fallback : String(v)
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v)
  return null
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback
}

function date(v: unknown): Date | null {
  if (!v) return null
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

/** CmsDocument yazıldıktan sonra normalize tabloları senkronlar. */
export async function syncNormalizedFromDocument(
  tx: Tx,
  key: string,
  data: unknown
): Promise<void> {
  switch (key) {
    case "admin-users.json":
      await syncAdminUsers(tx, data)
      break
    case "audit-logs.json":
      await syncAuditLogs(tx, data)
      break
    case "inquiries.json":
      await syncInquiries(tx, data)
      break
    case "bungalovs.json":
      await syncBungalovs(tx, data)
      break
    case "seo-meta.json":
      await syncSeoMeta(tx, data)
      break
    case "url-history.json":
      await syncUrlHistory(tx, data)
      break
    case "seo-legacy-fallback-log.json":
      await syncSeoLegacy(tx, data)
      break
    case "languages.json":
      await syncLanguages(tx, data)
      break
    case "currencies.json":
      await syncCurrencies(tx, data)
      break
    case "ui-strings.json":
      await syncUiStrings(tx, data)
      break
    case "terms.json":
      await syncTerms(tx, data)
      break
    case "page-content.json":
      await syncPageContent(tx, data)
      break
    case "cms-config.json":
      await syncCmsConfig(tx, data)
      break
    case "bungalov-feature-catalog.json":
      await syncFeatureCatalog(tx, data)
      break
    case "bungalov-content-catalog.json":
      await syncContentCatalog(tx, data)
      break
    case "settings.json":
      // settings tam belge olarak CmsDocument'ta; ayrıca AppSetting yok — document yeterli
      break
    default:
      break
  }
}

async function syncAdminUsers(tx: Tx, data: unknown) {
  if (!Array.isArray(data)) return
  await tx.adminUser.deleteMany()
  const rows = data
    .map((raw) => {
      const u = asObj(raw)
      if (!u.id || !u.email) return null
      return {
        id: str(u.id),
        email: str(u.email),
        name: str(u.name, "Admin"),
        role: str(u.role, "ADMIN"),
        passwordHash: str(u.passwordHash),
        isActive: bool(u.isActive, true),
      }
    })
    .filter(Boolean) as Prisma.AdminUserCreateManyInput[]
  if (rows.length) await tx.adminUser.createMany({ data: rows })
}

async function syncAuditLogs(tx: Tx, data: unknown) {
  if (!Array.isArray(data)) return
  await tx.auditLog.deleteMany()
  const rows = data
    .map((raw) => {
      const a = asObj(raw)
      if (!a.id) return null
      return {
        id: str(a.id),
        createdAt: date(a.createdAt) ?? new Date(),
        actorUserId: a.actorUserId ? str(a.actorUserId) : null,
        actorName: a.actorName ? str(a.actorName) : null,
        action: str(a.action),
        entityType: a.entityType ? str(a.entityType) : null,
        entityId: a.entityId ? str(a.entityId) : null,
        details: (a.details as Prisma.InputJsonValue) ?? undefined,
      }
    })
    .filter(Boolean) as Prisma.AuditLogCreateManyInput[]
  if (rows.length) {
    await tx.auditLog.createMany({ data: rows })
  }
}

async function syncInquiries(tx: Tx, data: unknown) {
  if (!Array.isArray(data)) return
  await tx.inquiry.deleteMany()
  const rows: Prisma.InquiryCreateManyInput[] = []
  for (const raw of data) {
    const i = asObj(raw)
    if (!i.id) continue
    const {
      id,
      createdAt,
      updatedAt,
      type,
      name,
      email,
      phone,
      subject,
      message,
      status,
      isRead,
      ip,
      deletedAt,
      deletedBy,
      ...rest
    } = i
    rows.push({
      id: str(id),
      createdAt: date(createdAt) ?? new Date(),
      updatedAt: date(updatedAt) ?? new Date(),
      type: str(type, "CONTACT"),
      name: str(name),
      email: email ? str(email) : null,
      phone: phone ? str(phone) : null,
      subject: subject ? str(subject) : null,
      message: str(message),
      status: str(status, "NEW"),
      isRead: bool(isRead, false),
      ip: ip ? str(ip) : null,
      deletedAt: date(deletedAt),
      deletedBy: deletedBy ? str(deletedBy) : null,
      payload: Object.keys(rest).length ? (rest as Prisma.InputJsonValue) : undefined,
    })
  }
  if (rows.length) await tx.inquiry.createMany({ data: rows })
}

async function syncBungalovs(tx: Tx, data: unknown) {
  if (!Array.isArray(data)) return
  await tx.bungalovImage.deleteMany()
  await tx.bungalovFeature.deleteMany()
  await tx.bungalovRule.deleteMany()
  await tx.bungalovNearby.deleteMany()
  await tx.bungalov.deleteMany()

  const bungalovRows: Prisma.BungalovCreateManyInput[] = []
  const imageRows: Prisma.BungalovImageCreateManyInput[] = []
  const featureRows: Prisma.BungalovFeatureCreateManyInput[] = []
  const ruleRows: Prisma.BungalovRuleCreateManyInput[] = []
  const nearbyRows: Prisma.BungalovNearbyCreateManyInput[] = []

  for (const raw of data) {
    const b = asObj(raw)
    if (!b.id) continue
    const known = new Set([
      "id",
      "name",
      "slug",
      "image",
      "galleryImages",
      "capacity",
      "description",
      "nightlyPrice",
      "status",
      "features",
      "rules",
      "nearbyPlaces",
      "bedrooms",
      "areaSqm",
      "poolType",
      "internet",
      "address",
      "seoTitle",
      "seoDescription",
      "isFeatured",
      "sortOrder",
      "deletedAt",
      "deletedBy",
      "createdAt",
      "updatedAt",
    ])
    const extra: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(b)) {
      if (!known.has(k)) extra[k] = v
    }

    bungalovRows.push({
      id: str(b.id),
      name: str(b.name),
      slug: b.slug ? str(b.slug) : null,
      image: b.image ? str(b.image) : null,
      capacity: num(b.capacity),
      description: b.description ? str(b.description) : null,
      nightlyPrice: num(b.nightlyPrice),
      status: str(b.status, "AKTIF"),
      bedrooms: num(b.bedrooms),
      areaSqm: num(b.areaSqm),
      poolType: b.poolType ? str(b.poolType) : null,
      internet: b.internet ? str(b.internet) : null,
      address: b.address ? str(b.address) : null,
      seoTitle: b.seoTitle ? str(b.seoTitle) : null,
      seoDescription: b.seoDescription ? str(b.seoDescription) : null,
      isFeatured: bool(b.isFeatured, false),
      sortOrder: num(b.sortOrder) ?? 0,
      deletedAt: date(b.deletedAt),
      deletedBy: b.deletedBy ? str(b.deletedBy) : null,
      createdAt: date(b.createdAt),
      updatedAt: date(b.updatedAt),
      extra: Object.keys(extra).length ? (extra as Prisma.InputJsonValue) : undefined,
    })

    const gallery = Array.isArray(b.galleryImages) ? b.galleryImages : []
    for (let i = 0; i < gallery.length; i++) {
      imageRows.push({ bungalovId: str(b.id), url: str(gallery[i]), sortOrder: i })
    }
    const features = Array.isArray(b.features) ? b.features : []
    for (let i = 0; i < features.length; i++) {
      featureRows.push({ bungalovId: str(b.id), label: str(features[i]), sortOrder: i })
    }
    const rules = Array.isArray(b.rules) ? b.rules : []
    for (let i = 0; i < rules.length; i++) {
      const r = asObj(rules[i])
      const ruleId = str(r.id, `rule-${i}`)
      ruleRows.push({
        id: `${str(b.id)}:${ruleId}`,
        bungalovId: str(b.id),
        title: str(r.title),
        description: r.description ? str(r.description) : null,
        visible: bool(r.visible, true),
        sortOrder: i,
      })
    }
    const nearby = Array.isArray(b.nearbyPlaces) ? b.nearbyPlaces : []
    for (let i = 0; i < nearby.length; i++) {
      const n = asObj(nearby[i])
      const { id, title, distance, ...rest } = n
      const nearId = str(id, `near-${i}`)
      nearbyRows.push({
        id: `${str(b.id)}:${nearId}`,
        bungalovId: str(b.id),
        title: str(title),
        distance: distance ? str(distance) : null,
        sortOrder: i,
        extra: Object.keys(rest).length ? (rest as Prisma.InputJsonValue) : undefined,
      })
    }
  }

  if (bungalovRows.length) await tx.bungalov.createMany({ data: bungalovRows })
  if (imageRows.length) await tx.bungalovImage.createMany({ data: imageRows })
  if (featureRows.length) await tx.bungalovFeature.createMany({ data: featureRows })
  if (ruleRows.length) await tx.bungalovRule.createMany({ data: ruleRows })
  if (nearbyRows.length) await tx.bungalovNearby.createMany({ data: nearbyRows })
}

async function syncSeoMeta(tx: Tx, data: unknown) {
  if (!Array.isArray(data)) return
  await tx.seoMeta.deleteMany()
  const rows: Prisma.SeoMetaCreateManyInput[] = []
  for (const raw of data) {
    const s = asObj(raw)
    if (!s.id) continue
    rows.push({
      id: str(s.id),
      entityType: str(s.entityType),
      entityId: str(s.entityId),
      locale: str(s.locale, "tr"),
      path: s.path ? str(s.path) : null,
      slug: s.slug ? str(s.slug) : null,
      metaTitle: s.metaTitle != null ? str(s.metaTitle) : null,
      metaDescription: s.metaDescription != null ? str(s.metaDescription) : null,
      focusKeyword: s.focusKeyword ? str(s.focusKeyword) : null,
      canonicalUrl: s.canonicalUrl ? str(s.canonicalUrl) : null,
      robotsIndex: bool(s.robotsIndex, true),
      robotsFollow: bool(s.robotsFollow, true),
      ogTitle: s.ogTitle ? str(s.ogTitle) : null,
      ogDescription: s.ogDescription ? str(s.ogDescription) : null,
      ogImageUrl: s.ogImageUrl ? str(s.ogImageUrl) : null,
      schemaType: s.schemaType ? str(s.schemaType) : null,
      schemaJson: (s.schemaJson as Prisma.InputJsonValue) ?? undefined,
      priority: num(s.priority),
      changeFreq: s.changeFreq ? str(s.changeFreq) : null,
      createdAt: date(s.createdAt) ?? new Date(),
      updatedAt: date(s.updatedAt) ?? new Date(),
      updatedBy: s.updatedBy ? str(s.updatedBy) : null,
      revision: num(s.revision) ?? 1,
    })
  }
  if (rows.length) await tx.seoMeta.createMany({ data: rows })
}

async function syncUrlHistory(tx: Tx, data: unknown) {
  if (!Array.isArray(data)) return
  await tx.urlHistory.deleteMany()
  for (const raw of data) {
    const u = asObj(raw)
    if (!u.id) continue
    const { id, fromPath, from, toPath, to, code, isActive, createdAt, updatedAt, ...rest } = u
    await tx.urlHistory.create({
      data: {
        id: str(id),
        fromPath: str(fromPath ?? from),
        toPath: str(toPath ?? to),
        code: num(code) ?? 301,
        isActive: bool(isActive, true),
        createdAt: date(createdAt),
        updatedAt: date(updatedAt),
        extra: Object.keys(rest).length ? (rest as Prisma.InputJsonValue) : undefined,
      },
    })
  }
}

async function syncSeoLegacy(tx: Tx, data: unknown) {
  if (!Array.isArray(data)) return
  await tx.seoLegacyLog.deleteMany()
  for (const raw of data) {
    await tx.seoLegacyLog.create({
      data: { payload: raw as Prisma.InputJsonValue },
    })
  }
}

async function syncLanguages(tx: Tx, data: unknown) {
  if (!Array.isArray(data)) return
  await tx.language.deleteMany()
  for (let i = 0; i < data.length; i++) {
    const l = asObj(data[i])
    const id = str(l.id ?? l.code, `lang-${i}`)
    const { code, name, isDefault, isActive, sortOrder, ...rest } = l
    await tx.language.create({
      data: {
        id,
        code: str(code ?? l.id),
        name: str(name ?? code),
        isDefault: bool(isDefault, false),
        isActive: bool(isActive, true),
        sortOrder: num(sortOrder) ?? i,
        extra: Object.keys(asObj(rest)).length ? (rest as Prisma.InputJsonValue) : undefined,
      },
    })
  }
}

async function syncCurrencies(tx: Tx, data: unknown) {
  if (!Array.isArray(data)) return
  await tx.currency.deleteMany()
  for (let i = 0; i < data.length; i++) {
    const c = asObj(data[i])
    const id = str(c.id ?? c.code, `cur-${i}`)
    const { code, name, symbol, isDefault, isActive, sortOrder, ...rest } = c
    await tx.currency.create({
      data: {
        id,
        code: str(code ?? c.id),
        name: str(name ?? code),
        symbol: symbol ? str(symbol) : null,
        isDefault: bool(isDefault, false),
        isActive: bool(isActive, true),
        sortOrder: num(sortOrder) ?? i,
        extra: Object.keys(asObj(rest)).length ? (rest as Prisma.InputJsonValue) : undefined,
      },
    })
  }
}

async function syncUiStrings(tx: Tx, data: unknown) {
  const obj = asObj(data)
  await tx.uiString.deleteMany()
  for (const [key, value] of Object.entries(obj)) {
    await tx.uiString.create({
      data: { key, value: typeof value === "string" ? value : JSON.stringify(value) },
    })
  }
}

async function syncTerms(tx: Tx, data: unknown) {
  await tx.legalTerm.deleteMany()
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const t = asObj(data[i])
      await tx.legalTerm.create({
        data: {
          id: str(t.id, `term-${i}`),
          payload: data[i] as Prisma.InputJsonValue,
        },
      })
    }
  }
}

async function syncPageContent(tx: Tx, data: unknown) {
  const pages = asObj(data)
  await tx.pageSection.deleteMany()
  for (const [pageKey, sectionsRaw] of Object.entries(pages)) {
    const sections = asObj(sectionsRaw)
    for (const [sectionKey, localesRaw] of Object.entries(sections)) {
      if (localesRaw && typeof localesRaw === "object" && !Array.isArray(localesRaw)) {
        const locales = asObj(localesRaw)
        // shape: page → section → locale → values OR page → section → values
        const looksLikeLocale = Object.keys(locales).every((k) => k.length <= 5)
        if (looksLikeLocale && ("tr" in locales || "en" in locales)) {
          for (const [locale, values] of Object.entries(locales)) {
            await tx.pageSection.create({
              data: {
                pageKey,
                sectionKey,
                locale,
                values: values as Prisma.InputJsonValue,
              },
            })
          }
        } else {
          await tx.pageSection.create({
            data: {
              pageKey,
              sectionKey,
              locale: "tr",
              values: localesRaw as Prisma.InputJsonValue,
            },
          })
        }
      } else {
        await tx.pageSection.create({
          data: {
            pageKey,
            sectionKey,
            locale: "tr",
            values: localesRaw as Prisma.InputJsonValue,
          },
        })
      }
    }
  }
}

async function syncCmsConfig(tx: Tx, data: unknown) {
  const cfg = asObj(data)

  // FAQ
  await tx.faqItem.deleteMany()
  const faqs = Array.isArray(cfg.faqManagement) ? cfg.faqManagement : []
  for (let i = 0; i < faqs.length; i++) {
    const f = asObj(faqs[i])
    await tx.faqItem.create({
      data: {
        id: str(f.id, `faq-${i}`),
        question: str(f.question),
        answer: str(f.answer),
        isActive: bool(f.isActive, true),
        sortOrder: i,
        extra: undefined,
      },
    })
  }

  // Why Aden
  await tx.whyAdenItem.deleteMany()
  const why = Array.isArray(cfg.whyAdenManagement) ? cfg.whyAdenManagement : []
  for (let i = 0; i < why.length; i++) {
    const w = asObj(why[i])
    await tx.whyAdenItem.create({
      data: {
        id: str(w.id, `why-${i}`),
        title: str(w.title),
        description: w.description ? str(w.description) : null,
        icon: w.icon ? str(w.icon) : null,
        imageUrl: w.imageUrl ? str(w.imageUrl) : null,
        isActive: bool(w.isActive, true),
        sortOrder: i,
      },
    })
  }

  // Slider
  await tx.sliderSlide.deleteMany()
  const slides = Array.isArray(cfg.sliderManagement) ? cfg.sliderManagement : []
  for (let i = 0; i < slides.length; i++) {
    const s = asObj(slides[i])
    await tx.sliderSlide.create({
      data: {
        id: str(s.id, `slide-${i}`),
        imageUrl: s.imageUrl ? str(s.imageUrl) : null,
        videoUrl: s.videoUrl ? str(s.videoUrl) : null,
        mediaType: s.mediaType ? str(s.mediaType) : null,
        title: s.title ? str(s.title) : null,
        description: s.description ? str(s.description) : null,
        tags: (s.tags as Prisma.InputJsonValue) ?? undefined,
        isActive: bool(s.isActive, true),
        buttonText: s.buttonText ? str(s.buttonText) : null,
        buttonUrl: s.buttonUrl ? str(s.buttonUrl) : null,
        secondaryButtonText: s.secondaryButtonText ? str(s.secondaryButtonText) : null,
        secondaryButtonUrl: s.secondaryButtonUrl ? str(s.secondaryButtonUrl) : null,
        badgeText: s.badgeText ? str(s.badgeText) : null,
        overlayOpacity: num(s.overlayOpacity),
        sortOrder: i,
      },
    })
  }

  // Gallery
  await tx.galleryItem.deleteMany()
  await tx.galleryCategory.deleteMany()
  const gallery = asObj(cfg.galleryManagement)
  const categories = Array.isArray(gallery.categories) ? gallery.categories : []
  for (let i = 0; i < categories.length; i++) {
    const c = asObj(categories[i])
    await tx.galleryCategory.create({
      data: {
        id: str(c.id, `gcat-${i}`),
        name: str(c.name ?? c.title, `Kategori ${i}`),
        slug: c.slug ? str(c.slug) : null,
        isActive: bool(c.isActive, true),
        sortOrder: i,
        extra: c as Prisma.InputJsonValue,
      },
    })
  }
  const items = Array.isArray(gallery.items) ? gallery.items : []
  for (let i = 0; i < items.length; i++) {
    const it = asObj(items[i])
    await tx.galleryItem.create({
      data: {
        id: str(it.id, `gitem-${i}`),
        categoryId: it.categoryId ? str(it.categoryId) : null,
        imageUrl: it.imageUrl || it.url ? str(it.imageUrl ?? it.url) : null,
        title: it.title ? str(it.title) : null,
        isActive: bool(it.isActive, true),
        sortOrder: i,
        extra: it as Prisma.InputJsonValue,
      },
    })
  }

  // Menus
  await tx.menuItem.deleteMany()
  await tx.menuGroup.deleteMany()
  const site = asObj(cfg.siteManagement)
  const groups = Array.isArray(site.menuGroups) ? site.menuGroups : []
  for (const raw of groups) {
    const g = asObj(raw)
    const groupId = str(g.id)
    await tx.menuGroup.create({
      data: {
        id: groupId,
        key: str(g.key) || groupId,
        title: str(g.title, g.key || groupId),
        type: g.type ? str(g.type) : null,
        location: g.location ? str(g.location) : null,
        description: g.description ? str(g.description) : null,
        status: g.status ? str(g.status) : null,
        isActive: bool(g.isActive, true),
        payload: g as Prisma.InputJsonValue,
      },
    })
    await insertMenuTree(tx, groupId, Array.isArray(g.items) ? g.items : [], null, 0)
  }
}

async function insertMenuTree(
  tx: Tx,
  groupId: string,
  items: unknown[],
  parentId: string | null,
  startOrder: number
) {
  for (let i = 0; i < items.length; i++) {
    const item = asObj(items[i])
    const id = str(item.id, `${groupId}-item-${startOrder + i}`)
    const children = Array.isArray(item.children) ? item.children : []
    const { children: _c, ...payload } = item
    await tx.menuItem.create({
      data: {
        id,
        groupId,
        parentId,
        sortOrder: startOrder + i,
        payload: payload as Prisma.InputJsonValue,
      },
    })
    if (children.length) {
      await insertMenuTree(tx, groupId, children, id, 0)
    }
  }
}

async function syncFeatureCatalog(tx: Tx, data: unknown) {
  const catalog = asObj(data)
  await tx.featureCatalogItem.deleteMany()
  for (const [category, labels] of Object.entries(catalog)) {
    if (!Array.isArray(labels)) continue
    for (let i = 0; i < labels.length; i++) {
      await tx.featureCatalogItem.create({
        data: {
          category,
          label: str(labels[i]),
          sortOrder: i,
        },
      })
    }
  }
}

async function syncContentCatalog(tx: Tx, data: unknown) {
  await tx.contentCatalog.upsert({
    where: { id: "default" },
    create: { id: "default", payload: data as Prisma.InputJsonValue },
    update: { payload: data as Prisma.InputJsonValue },
  })
}
