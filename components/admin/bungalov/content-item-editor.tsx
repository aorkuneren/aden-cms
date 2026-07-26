"use client"

import { useState } from "react"
import {
  Ban,
  Building2,
  Bus,
  CalendarClock,
  Clock,
  CreditCard,
  Dog,
  Eye,
  EyeOff,
  GripVertical,
  MapPin,
  Plane,
  Plus,
  ShoppingCart,
  Stethoscope,
  TrainFront,
  Trash2,
  UtensilsCrossed,
  VolumeX,
  Waves,
  type LucideIcon,
} from "lucide-react"

import {
  createEmptyContentItem,
  normalizeContentKeyword,
  presetToContentItem,
  type BungalovContentItem,
  type BungalovContentPreset,
} from "@/lib/bungalov-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ContentItemEditorProps = {
  items: BungalovContentItem[]
  onChange: (items: BungalovContentItem[]) => void
  presets: BungalovContentPreset[]
  variant: "rules" | "nearby"
  titlePlaceholder: string
  descriptionPlaceholder: string
  addLabel: string
  emptyTitle: string
  emptyHint: string
  /** Özel başlık+açıklama kalıcı kataloğa yazılsın diye. */
  onRememberPreset?: (preset: BungalovContentPreset) => void
}

const RULE_ICONS: Array<{ pattern: RegExp; icon: LucideIcon }> = [
  { pattern: /minimum|gece|sure/, icon: CalendarClock },
  { pattern: /giris|cikis|saat/, icon: Clock },
  { pattern: /evcil|hayvan|pet/, icon: Dog },
  { pattern: /sessiz|gurultu|muzik/, icon: VolumeX },
  { pattern: /sigara|duman/, icon: Ban },
  { pattern: /odeme|kapora|depozito/, icon: CreditCard },
]

const PLACE_ICONS: Array<{ pattern: RegExp; icon: LucideIcon }> = [
  { pattern: /havaliman|ucus|airport/, icon: Plane },
  { pattern: /sehir merkez|merkez/, icon: Building2 },
  { pattern: /plaj|deniz|gol|sahil/, icon: Waves },
  { pattern: /otogar|terminal/, icon: Bus },
  { pattern: /market|bakkal|alisveris/, icon: ShoppingCart },
  { pattern: /restaurant|restoran|lokanta|kahvalti|kafe/, icon: UtensilsCrossed },
  { pattern: /toplu ulasim|otobus|tren|metro/, icon: TrainFront },
  { pattern: /hastane|saglik|eczane/, icon: Stethoscope },
]

function resolveIcon(title: string, variant: "rules" | "nearby"): LucideIcon {
  const normalized = normalizeContentKeyword(title)
  const rules = variant === "rules" ? RULE_ICONS : PLACE_ICONS
  return rules.find((rule) => rule.pattern.test(normalized))?.icon ?? MapPin
}

function moveItem(items: BungalovContentItem[], from: number, to: number) {
  if (from === to || to < 0 || to >= items.length) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function ContentItemEditor({
  items,
  onChange,
  presets,
  variant,
  titlePlaceholder,
  descriptionPlaceholder,
  addLabel,
  emptyTitle,
  emptyHint,
  onRememberPreset,
}: ContentItemEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    items.find((item) => !item.title.trim())?.id ?? null
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const usedTitles = new Set(items.map((item) => normalizeContentKeyword(item.title)))
  const visibleCount = items.filter((item) => item.visible).length

  const patchItem = (index: number, patch: Partial<BungalovContentItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const addBlank = () => {
    const item = createEmptyContentItem()
    onChange([...items, item])
    setExpandedId(item.id)
  }

  const addPreset = (preset: BungalovContentPreset) => {
    const item = presetToContentItem(preset)
    onChange([...items, item])
    setExpandedId(item.id)
  }

  return (
    <div className="space-y-4">
      {/* Preset strip */}
      {presets.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
              Hızlı ekle
            </p>
            <span className="text-[11px] text-slate-400">
              {visibleCount}/{items.length} görünür
            </span>
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {presets.map((preset) => {
              const isUsed = usedTitles.has(normalizeContentKeyword(preset.title))
              const Icon = resolveIcon(preset.title, variant)
              return (
                <button
                  key={preset.title}
                  type="button"
                  disabled={isUsed}
                  onClick={() => addPreset(preset)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    isUsed
                      ? "cursor-default border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "border-slate-200/80 bg-white/80 text-slate-600 shadow-2xs hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-800 hover:shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-300 dark:hover:border-emerald-700"
                  )}
                >
                  <Icon className="size-3.5 opacity-70" />
                  {preset.title}
                  {isUsed ? <span className="text-[10px] opacity-70">✓</span> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-6 py-12 text-center dark:border-neutral-800 dark:from-neutral-900/50 dark:to-neutral-950">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            {variant === "rules" ? <CalendarClock className="size-5" /> : <MapPin className="size-5" />}
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{emptyTitle}</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">{emptyHint}</p>
          <Button type="button" variant="outline" size="sm" onClick={addBlank} className="mt-4 text-xs">
            <Plus className="mr-1 size-3.5" /> {addLabel}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const Icon = resolveIcon(item.title, variant)
            const isExpanded = expandedId === item.id
            const isDragging = dragIndex === index

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(event) => {
                  setDragIndex(index)
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData("text/plain", String(index))
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = "move"
                  if (dragIndex === null || dragIndex === index) return
                  onChange(moveItem(items, dragIndex, index))
                  setDragIndex(index)
                }}
                onDragEnd={() => setDragIndex(null)}
                className={cn(
                  "group overflow-hidden rounded-2xl border bg-white/90 backdrop-blur-sm transition-all dark:bg-neutral-950/80",
                  isDragging
                    ? "scale-[0.99] border-emerald-400 opacity-60 shadow-lg shadow-emerald-500/10"
                    : item.visible
                      ? "border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm dark:border-neutral-800"
                      : "border-dashed border-slate-200 bg-slate-50/70 opacity-80 dark:border-neutral-800 dark:bg-neutral-900/40",
                  isExpanded && "border-emerald-300/80 ring-1 ring-emerald-500/15 dark:border-emerald-800"
                )}
              >
                {/* Summary row */}
                <div className="flex items-center gap-2 px-2.5 py-2 sm:px-3">
                  <button
                    type="button"
                    className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-slate-400 active:cursor-grabbing hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-neutral-800"
                    title="Sürükle"
                    aria-label="Sıralamayı değiştir"
                    onClick={(event) => event.preventDefault()}
                  >
                    <GripVertical className="size-4" />
                  </button>

                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                      item.visible
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-400 dark:bg-neutral-800"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.title.trim() || (
                        <span className="font-medium text-slate-400">Başlıksız öğe</span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">
                      {item.description.trim() || "Açıklama eklenmedi"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => patchItem(index, { visible: !item.visible })}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold transition-colors",
                      item.visible
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "border-slate-200 bg-white text-slate-500 dark:border-neutral-700 dark:bg-neutral-900"
                    )}
                    title={item.visible ? "Sitede görünür — gizlemek için tıkla" : "Gizli — göstermek için tıkla"}
                  >
                    {item.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    <span className="hidden sm:inline">{item.visible ? "Görünür" : "Gizli"}</span>
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-8 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    onClick={() => {
                      const next = items.filter((_, i) => i !== index)
                      onChange(next)
                      if (expandedId === item.id) setExpandedId(null)
                    }}
                    title="Sil"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                {/* Expanded editor */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-3 border-t border-slate-100 px-3 py-3 sm:px-4 dark:border-neutral-800">
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium text-slate-500">Başlık</label>
                          <Input
                            value={item.title}
                            onChange={(event) => patchItem(index, { title: event.target.value })}
                            placeholder={titlePlaceholder}
                            className="h-9 rounded-xl border-slate-200 bg-slate-50/50 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                            autoFocus={isExpanded && !item.title.trim()}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium text-slate-500">
                            {variant === "nearby" ? "Mesafe / Açıklama" : "Açıklama"}
                          </label>
                          <Textarea
                            rows={2}
                            value={item.description}
                            onChange={(event) => patchItem(index, { description: event.target.value })}
                            placeholder={descriptionPlaceholder}
                            className="min-h-[72px] rounded-xl border-slate-200 bg-slate-50/50 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-slate-500"
                          onClick={() => {
                            if (item.title.trim() && onRememberPreset) {
                              onRememberPreset({
                                title: item.title.trim(),
                                description: item.description.trim(),
                              })
                            }
                            setExpandedId(null)
                          }}
                        >
                          Tamam
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {items.length > 0 ? (
        <button
          type="button"
          onClick={addBlank}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-3 text-xs font-semibold text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800 dark:border-neutral-800 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-300"
        >
          <Plus className="size-3.5" /> {addLabel}
        </button>
      ) : null}
    </div>
  )
}
