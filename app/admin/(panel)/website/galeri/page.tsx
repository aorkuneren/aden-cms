import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { getSection, sectionDefaults } from "@/lib/cms/registry"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { PageEditor } from "@/components/admin/cms/page-editor"
import {
  GalleryEditor,
  type GalleryCategory,
  type GalleryItem,
} from "@/components/admin/website/gallery-editor"

export const dynamic = "force-dynamic"

export default async function GalleryAdminPage() {
  const [cfg, pageContent] = await Promise.all([
    readJson<any>("cms-config.json"),
    readJson<Record<string, Record<string, Record<string, string>>>>("page-content.json"),
  ])
  const gm = cfg?.galleryManagement ?? {}

  const categories: GalleryCategory[] = Array.isArray(gm.categories)
    ? filterActive(gm.categories).map((c: any) => ({
        id: String(c?.id ?? `gallery-category-${Math.random().toString(36).slice(2, 8)}`),
        name: String(c?.name ?? ""),
        isActive: c?.isActive !== false,
      }))
    : []

  const items: GalleryItem[] = Array.isArray(gm.items)
    ? filterActive(gm.items).map((it: any) => ({
        id: String(it?.id ?? `gallery-${Math.random().toString(36).slice(2, 8)}`),
        imageUrl: String(it?.imageUrl ?? ""),
        title: String(it?.title ?? ""),
        description: String(it?.description ?? ""),
        categoryId: String(it?.categoryId ?? ""),
        isActive: it?.isActive !== false,
        isFeatured: it?.isFeatured === true,
      }))
    : []

  const heroSection = getSection("galeri", "page-hero")
  const heroValues = {
    ...(heroSection ? sectionDefaults(heroSection) : {}),
    ...(pageContent?.galeri?.["page-hero"] ?? {}),
  }

  return (
    <>
      <AdminPageHeader
        title="Galeri Yönetimi"
        description="Galeri sayfasının başlığını, kategorilerini ve görsellerini tek ekrandan yönetin."
      />

      <div className="space-y-4">
        {heroSection ? (
          <PageEditor
            pageSlug="galeri"
            scopeLabel="Galeri Sayfası"
            siteHref="/galeri"
            sections={[
              {
                key: "page-hero",
                label: "Sayfa Başlığı",
                description: "/galeri sayfasının üst bloğundaki başlık ve açıklama.",
                fields: heroSection.fields ?? [],
                values: heroValues,
              },
            ]}
          />
        ) : null}

        <GalleryEditor initialCategories={categories} initialItems={items} />
      </div>
    </>
  )
}
