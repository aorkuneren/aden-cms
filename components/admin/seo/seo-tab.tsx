"use client"

import { useState } from "react"
import { AlertTriangle, Sparkles } from "lucide-react"

import { CharCounter } from "@/components/admin/seo/char-counter"
import { SeoScorePanel } from "@/components/admin/seo/seo-score-panel"
import { SerpPreview } from "@/components/admin/seo/serp-preview"
import { SocialPreview } from "@/components/admin/seo/social-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { bungalowPathFromSlug } from "@/lib/seo/path"
import type { SeoSchemaType } from "@/lib/seo/types"

export type SeoTabValue = {
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  slug: string
  ogTitle: string
  ogDescription: string
  ogImageUrl: string
  canonicalUrl: string
  robotsIndex: boolean
  robotsFollow: boolean
  schemaType: string
  schemaJsonText: string
  path?: string | null
}

type ScoreItem = {
  id: string
  label: string
  passed: boolean
  weight: number
}

type Props = {
  entityType: "page" | "bungalow"
  value: SeoTabValue
  onChange: (patch: Partial<SeoTabValue>) => void
  score: { score: number; items: ScoreItem[] }
  warnings?: { message: string }[]
  canEditAdvanced: boolean
  slugLocked?: boolean
  onAutoFill?: () => void
}

const SCHEMA_TYPES: { value: SeoSchemaType; label: string }[] = [
  { value: "WebPage", label: "WebPage" },
  { value: "AboutPage", label: "AboutPage" },
  { value: "ContactPage", label: "ContactPage" },
  { value: "CollectionPage", label: "CollectionPage" },
  { value: "LodgingBusiness", label: "LodgingBusiness" },
  { value: "FAQPage", label: "FAQPage" },
  { value: "Organization", label: "Organization" },
]

function resolveUrlPath(entityType: "page" | "bungalow", value: SeoTabValue): string {
  if (value.path) return value.path
  if (entityType === "bungalow" && value.slug) return bungalowPathFromSlug(value.slug)
  return "/"
}

export function SeoTab({
  entityType,
  value,
  onChange,
  score,
  warnings = [],
  canEditAdvanced,
  slugLocked = false,
  onAutoFill,
}: Props) {
  const [serpMode, setSerpMode] = useState<"desktop" | "mobile">("desktop")
  const urlPath = resolveUrlPath(entityType, value)
  const serpTitle = value.metaTitle
  const serpDescription = value.metaDescription
  const socialTitle = value.ogTitle || value.metaTitle
  const socialDescription = value.ogDescription || value.metaDescription

  return (
    <div className="space-y-4">
      {onAutoFill ? (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={onAutoFill}>
            <Sparkles className="mr-1 size-3.5" />
            Otomatik doldur
          </Button>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30">
          {warnings.map((w, i) => (
            <p key={i} className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {w.message}
            </p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {/* Temel meta */}
          <div className="rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div className="border-b border-slate-200 px-3 py-2 dark:border-neutral-800">
              <p className="text-sm font-medium">Temel Meta</p>
            </div>
            <div className="space-y-3 p-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Meta başlık</Label>
                  <CharCounter value={value.metaTitle} softMax={70} ideal={[50, 60]} />
                </div>
                <Input
                  value={value.metaTitle}
                  onChange={(e) => onChange({ metaTitle: e.target.value })}
                  placeholder="Arama sonuçlarında görünen başlık"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Meta açıklama</Label>
                  <CharCounter value={value.metaDescription} softMax={180} ideal={[140, 160]} />
                </div>
                <Textarea
                  rows={3}
                  value={value.metaDescription}
                  onChange={(e) => onChange({ metaDescription: e.target.value })}
                  placeholder="Arama sonuçlarında görünen açıklama"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Odak anahtar kelime</Label>
                <Input
                  value={value.focusKeyword}
                  onChange={(e) => onChange({ focusKeyword: e.target.value })}
                  placeholder="sapanca bungalov"
                />
              </div>

              {entityType === "bungalow" && !slugLocked ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">URL slug</Label>
                  <Input
                    value={value.slug}
                    onChange={(e) => onChange({ slug: e.target.value })}
                    placeholder="aden-bungalov"
                  />
                  {value.slug ? (
                    <p className="text-[10px] text-slate-400">
                      Önizleme: {bungalowPathFromSlug(value.slug)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* Open Graph */}
          <div className="rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div className="border-b border-slate-200 px-3 py-2 dark:border-neutral-800">
              <p className="text-sm font-medium">Open Graph (Sosyal Paylaşım)</p>
            </div>
            <div className="space-y-3 p-3">
              <div className="space-y-1.5">
                <Label className="text-xs">OG başlık</Label>
                <Input
                  value={value.ogTitle}
                  onChange={(e) => onChange({ ogTitle: e.target.value })}
                  placeholder="Boş bırakılırsa meta başlık kullanılır"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">OG açıklama</Label>
                <Textarea
                  rows={2}
                  value={value.ogDescription}
                  onChange={(e) => onChange({ ogDescription: e.target.value })}
                  placeholder="Boş bırakılırsa meta açıklama kullanılır"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">OG görsel URL</Label>
                <Input
                  value={value.ogImageUrl}
                  onChange={(e) => onChange({ ogImageUrl: e.target.value })}
                  placeholder="/uploads/og-gorsel.jpg"
                />
              </div>
            </div>
          </div>

          {/* Gelişmiş */}
          {canEditAdvanced ? (
            <div className="rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-neutral-800">
                <p className="text-sm font-medium">Gelişmiş SEO</p>
                <Badge variant="outline" className="h-5 text-[10px]">
                  Yönetici
                </Badge>
              </div>
              <div className="space-y-3 p-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Canonical URL</Label>
                  <Input
                    value={value.canonicalUrl}
                    onChange={(e) => onChange({ canonicalUrl: e.target.value })}
                    placeholder="Boş bırakılırsa otomatik (self-canonical)"
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={value.robotsIndex}
                      onCheckedChange={(checked) =>
                        onChange({ robotsIndex: checked === true })
                      }
                    />
                    İndeksle (robots index)
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={value.robotsFollow}
                      onCheckedChange={(checked) =>
                        onChange({ robotsFollow: checked === true })
                      }
                    />
                    Takip et (robots follow)
                  </label>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Schema türü</Label>
                  <Select
                    value={value.schemaType || "WebPage"}
                    onValueChange={(v) => onChange({ schemaType: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Schema türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEMA_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value!}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Schema JSON (isteğe bağlı)</Label>
                  <Textarea
                    rows={6}
                    value={value.schemaJsonText}
                    onChange={(e) => onChange({ schemaJsonText: e.target.value })}
                    placeholder='{"@context":"https://schema.org", ...}'
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <SeoScorePanel score={score.score} items={score.items} />
        </div>
      </div>

      <SerpPreview
        title={serpTitle}
        description={serpDescription}
        urlPath={urlPath}
        mode={serpMode}
        onModeChange={setSerpMode}
      />

      <SocialPreview
        title={socialTitle}
        description={socialDescription}
        imageUrl={value.ogImageUrl}
        urlPath={urlPath}
      />
    </div>
  )
}
