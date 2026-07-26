import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageIntroProps = {
  title: string
  description: string
  actions?: ReactNode
  /**
   * "stacked": açıklama başlığın altında (varsayılan)
   * "split": masaüstünde başlık solda, açıklama sağda
   */
  variant?: "stacked" | "split"
  className?: string
}

export function PageIntro({
  title,
  description,
  actions,
  variant = "stacked",
  className,
}: PageIntroProps) {
  if (variant === "split") {
    return (
      <div className={cn("grid gap-4 md:grid-cols-12 md:items-end md:gap-8", className)}>
        <div className="md:col-span-6">
          <h1 className="text-[clamp(1.75rem,2vw+1rem,3rem)] font-semibold leading-tight tracking-tight text-[#171717]">
            {title}
          </h1>
        </div>

        <div className="md:col-span-6 md:pb-1">
          <p className="max-w-2xl text-sm leading-7 text-[#616168] md:text-base">{description}</p>
          {actions ? <div className="mt-4">{actions}</div> : null}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-12 md:items-end", className)}>
      <div className="md:col-span-8">
        <h1 className="mt-4 text-[clamp(1.75rem,2vw+1rem,3rem)] font-semibold leading-tight tracking-tight text-[#171717]">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#616168] md:text-base">
          {description}
        </p>
      </div>

      {actions ? (
        <div className="md:col-span-4 md:flex md:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
