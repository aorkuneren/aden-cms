import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type FeatureIconCardProps = {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureIconCard({ icon: Icon, title, description }: FeatureIconCardProps) {
  return (
    <Card className="h-full rounded-2xl border-[#e7dfd1] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#edf4ed] text-[#355733]">
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 text-base font-semibold text-[#1a1a1a]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-[#64646c]">{description}</p>
      </CardContent>
    </Card>
  )
}
