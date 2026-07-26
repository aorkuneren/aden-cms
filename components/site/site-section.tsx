import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { cn } from "@/lib/utils"

type SiteSectionProps = {
  children: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<"section">, "children" | "className">

export function SiteSection({ children, className, ...props }: SiteSectionProps) {
  return (
    <section
      className={cn("mx-auto w-full max-w-7xl px-[var(--site-gutter-x)]", className)}
      {...props}
    >
      {children}
    </section>
  )
}
