import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("space-y-2", align === "center" ? "text-center" : "", className)}>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4f6751]">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-[#171717] md:text-4xl lg:text-5xl">{title}</h2>
      {description ? (
        <p
          className={cn(
            "text-sm leading-7 text-[#616168] md:text-base",
            align === "center" ? "mx-auto max-w-3xl" : "max-w-3xl"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
