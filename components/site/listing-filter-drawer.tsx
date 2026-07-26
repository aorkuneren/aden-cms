"use client"

import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type ListingFilterDrawerProps = {
  features: string[]
  initialValues: {
    capacity?: string
    feature?: string
    priceMode?: string
    checkIn?: string
    checkOut?: string
    adults?: string
  }
}

export function ListingFilterDrawer({ features, initialValues }: ListingFilterDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-full border-[#d8cfbf] bg-white md:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          Filtrele
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl border-[#e8e0d3] bg-[#fffdfa] px-5 pb-8">
        <SheetHeader>
          <SheetTitle>Filtreler</SheetTitle>
          <SheetDescription>Bungalovları kapasite, özellik ve fiyat durumuna göre filtreleyin.</SheetDescription>
        </SheetHeader>

        <form action="/bungalovlarimiz" method="GET" className="mt-6 space-y-4">
          <label className="space-y-1 text-sm">
            <span>Kapasite</span>
            <select
              name="capacity"
              defaultValue={initialValues.capacity || ""}
              className="h-10 w-full rounded-lg border border-[#ddd4c6] bg-white px-3"
            >
              <option value="">Tümü</option>
              <option value="2">2+ kişi</option>
              <option value="3">3+ kişi</option>
              <option value="4">4+ kişi</option>
              <option value="5">5+ kişi</option>
              <option value="6">6+ kişi</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Özellik</span>
            <select
              name="feature"
              defaultValue={initialValues.feature || ""}
              className="h-10 w-full rounded-lg border border-[#ddd4c6] bg-white px-3"
            >
              <option value="">Tümü</option>
              {features.map((feature) => (
                <option key={feature} value={feature}>
                  {feature}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Fiyat Durumu</span>
            <select
              name="priceMode"
              defaultValue={initialValues.priceMode || ""}
              className="h-10 w-full rounded-lg border border-[#ddd4c6] bg-white px-3"
            >
              <option value="">Tümü</option>
              <option value="priced">Fiyatı belli olanlar</option>
              <option value="inquire">Fiyat sorunuz olanlar</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm">
              <span>Giriş</span>
              <input
                type="date"
                name="checkIn"
                defaultValue={initialValues.checkIn || ""}
                className="h-10 w-full rounded-lg border border-[#ddd4c6] bg-white px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Çıkış</span>
              <input
                type="date"
                name="checkOut"
                defaultValue={initialValues.checkOut || ""}
                className="h-10 w-full rounded-lg border border-[#ddd4c6] bg-white px-3"
              />
            </label>
          </div>
          <label className="space-y-1 text-sm">
            <span>Yetişkin</span>
            <input
              type="number"
              min={1}
              name="adults"
              defaultValue={initialValues.adults || ""}
              className="h-10 w-full rounded-lg border border-[#ddd4c6] bg-white px-3"
            />
          </label>
          <Button className="w-full rounded-full btn-dark">
            Filtreyi Uygula
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
