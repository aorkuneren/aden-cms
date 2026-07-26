/**
 * Menü ağacı yardımcıları — saf (yan etkisiz) fonksiyonlar. Hem builder UI'si
 * hem de doğrulama bunları kullanır. Ağaç, RawMenuItem.children ile temsil
 * edilir. Tüm işlemler yeni referans döner (immutable), böylece React tespit
 * eder ve döngüsel hiyerarşi imkânsızdır (bir düğüm asla kendi alt ağacına
 * taşınamaz).
 */
import { MAX_MENU_DEPTH, type RawMenuItem } from "@/lib/site/menu-model"

export type TreeItem = RawMenuItem & { children?: TreeItem[] }

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

/** Belirtilen id'li düğümü (ve ebeveyn zincirini) bulur. */
export function findNode(items: TreeItem[], id: string): TreeItem | null {
  for (const it of items) {
    if (it.id === id) return it
    if (it.children) {
      const f = findNode(it.children, id)
      if (f) return f
    }
  }
  return null
}

/** Bir düğümü kaldırır ve kaldırılan düğümü döndürür. */
function extract(items: TreeItem[], id: string): { tree: TreeItem[]; removed: TreeItem | null } {
  let removed: TreeItem | null = null
  const walk = (list: TreeItem[]): TreeItem[] => {
    const out: TreeItem[] = []
    for (const it of list) {
      if (it.id === id) {
        removed = it
        continue
      }
      out.push(it.children ? { ...it, children: walk(it.children) } : it)
    }
    return out
  }
  return { tree: walk(items), removed }
}

/** Bir alt ağacın derinliğini (kendisi 1) döndürür. */
export function subtreeDepth(item: TreeItem): number {
  if (!item.children || item.children.length === 0) return 1
  return 1 + Math.max(...item.children.map(subtreeDepth))
}

/** id → ebeveyn id ve sibling index bilgisini döndürür (kök için parent=null). */
function locate(
  items: TreeItem[],
  id: string,
  parent: string | null = null
): { parent: string | null; index: number; siblings: TreeItem[] } | null {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) return { parent, index: i, siblings: items }
    const kids = items[i].children
    if (kids) {
      const r = locate(kids, id, items[i].id)
      if (r) return r
    }
  }
  return null
}

/** Sibling'ler arasında yukarı/aşağı taşır. */
export function moveSibling(items: TreeItem[], id: string, dir: -1 | 1): TreeItem[] {
  const tree = clone(items)
  const loc = locate(tree, id)
  if (!loc) return items
  const target = loc.index + dir
  if (target < 0 || target >= loc.siblings.length) return items
  ;[loc.siblings[loc.index], loc.siblings[target]] = [loc.siblings[target], loc.siblings[loc.index]]
  return tree
}

/**
 * Öğeyi bir alt seviyeye indirger (bir önceki sibling'in çocuğu yapar).
 * MAX_MENU_DEPTH aşılıyorsa işlem yapılmaz.
 */
export function indent(items: TreeItem[], id: string): TreeItem[] {
  const tree = clone(items)
  const loc = locate(tree, id)
  if (!loc || loc.index === 0) return items
  const node = loc.siblings[loc.index]
  const prev = loc.siblings[loc.index - 1]
  // Yeni derinlik kontrolü: prev'in derinliği + taşınan alt ağacın derinliği
  const prevDepth = depthOf(tree, prev.id)
  if (prevDepth + subtreeDepth(node) > MAX_MENU_DEPTH) return items
  loc.siblings.splice(loc.index, 1)
  prev.children = prev.children || []
  prev.children.push(node)
  return tree
}

/** Öğeyi bir üst seviyeye çıkarır (ebeveyninin sibling'i yapar). */
export function outdent(items: TreeItem[], id: string): TreeItem[] {
  const loc0 = locate(items, id)
  if (!loc0 || loc0.parent === null) return items // zaten kökte
  const tree = clone(items)
  const { removed, tree: without } = extract(tree, id)
  if (!removed) return items
  // Ebeveynin bulunduğu sibling listesine, ebeveynden hemen sonra ekle
  const parentLoc = locate(without, loc0.parent)
  if (!parentLoc) return items
  parentLoc.siblings.splice(parentLoc.index + 1, 0, removed)
  return without
}

/** Bir düğümün kök seviyesinden derinliğini (kök=1) döndürür. */
export function depthOf(items: TreeItem[], id: string, depth = 1): number {
  for (const it of items) {
    if (it.id === id) return depth
    if (it.children) {
      const d = depthOf(it.children, id, depth + 1)
      if (d) return d
    }
  }
  return 0
}

/** Düğümü siler (alt ağacıyla birlikte). */
export function removeNode(items: TreeItem[], id: string): TreeItem[] {
  return extract(clone(items), id).tree
}

/** Kök seviyeye yeni öğe ekler. */
export function appendRoot(items: TreeItem[], node: TreeItem): TreeItem[] {
  return [...items, node]
}

/** Bir öğeyi (yeni id'lerle) kopyalar ve hemen ardına ekler. */
export function duplicateNode(items: TreeItem[], id: string, genId: () => string): TreeItem[] {
  const tree = clone(items)
  const loc = locate(tree, id)
  if (!loc) return items
  const reid = (n: TreeItem): TreeItem => ({
    ...n,
    id: genId(),
    title: (n.title ?? n.text) ? `${n.title ?? n.text} (Kopya)` : n.title,
    children: n.children?.map(reid),
  })
  loc.siblings.splice(loc.index + 1, 0, reid(loc.siblings[loc.index]))
  return tree
}

/** Bir öğenin alanlarını günceller. */
export function patchNode(items: TreeItem[], id: string, patch: Partial<TreeItem>): TreeItem[] {
  const walk = (list: TreeItem[]): TreeItem[] =>
    list.map((it) =>
      it.id === id ? { ...it, ...patch } : it.children ? { ...it, children: walk(it.children) } : it
    )
  return walk(items)
}

/** Ağaçtaki toplam düğüm sayısı. */
export function countNodes(items: TreeItem[]): number {
  return items.reduce((n, it) => n + 1 + (it.children ? countNodes(it.children) : 0), 0)
}
