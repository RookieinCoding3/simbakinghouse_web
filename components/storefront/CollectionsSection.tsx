'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/types/product'
import { useLang } from '@/lib/i18n/LangContext'
import { COLLECTIONS } from '@/lib/storefront/collections'
import { formatSen } from '@/lib/money'

type Group = {
  id: string
  products: (Pick<Product, 'id' | 'name' | 'nameZh' | 'imageUrl'> & { priceSen: number | null; fromPrice: boolean })[]
}

/** Collections that have products (empty ones are not passed in). */
export default function CollectionsSection({ groups }: { groups: Group[] }) {
  const { t, pick } = useLang()
  if (groups.length === 0) return null
  return (
    <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-14 md:py-20 space-y-12" data-testid="collections">
      {groups.map((g) => {
        const def = COLLECTIONS.find((c) => c.id === g.id)!
        return (
          <div key={g.id} data-testid={`collection-${g.id}`} id={`collection-${g.id}`}>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div className="space-y-1">
                <h2 className="font-heading text-2xl sm:text-3xl text-ink">{t(def.title)}</h2>
                <p className="text-sm text-ink/70">{t(def.body)}</p>
              </div>
              <Link href={`/products?collection=${g.id}`} className="text-xs uppercase tracking-widest text-ink font-medium underline underline-offset-4">
                {t('col.seeAll')} &rarr;
              </Link>
            </div>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {g.products.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link href={`/products?collection=${g.id}&product=${encodeURIComponent(p.id)}`} className="block group" data-testid="collection-product">
                    <div className="relative aspect-square bg-white border border-line overflow-hidden">
                      <Image src={p.imageUrl || '/images/placeholder-product.jpg'} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                    </div>
                    <p className="mt-2 text-sm text-ink group-hover:text-clay line-clamp-2">{pick(p.name, p.nameZh)}</p>
                    <p className="text-sm font-semibold text-clay whitespace-nowrap" data-testid="collection-price">
                      {p.priceSen === null ? t('product.askPrice') : `${p.fromPrice ? (t('product.from') + ' ') : ''}${formatSen(p.priceSen)}`}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
