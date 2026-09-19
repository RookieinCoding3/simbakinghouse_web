import Link from 'next/link'
import Image from 'next/image'

const CATEGORIES = [
  { title: 'Ingredients', image: '/category-left.png', href: '/products?category=Ingredients' },
  { title: 'Tools', image: '/category-middle.png', href: '/products?category=Tools' },
  { title: 'Decorations', image: '/category-right.png', href: '/products?category=Decorations' },
]

export default function CategoryNavigationSection() {
  return (
    <section id="supplies" className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 border-b border-line">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left: 3-image triptych */}
        <div className="lg:col-span-7 grid grid-cols-3 gap-3 sm:gap-4">
          {CATEGORIES.map((category) => (
            <Link key={category.title} href={category.href} className="group block">
              <div className="relative aspect-[3/4] bg-[#EFECE6] overflow-hidden">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  sizes="(max-width: 1024px) 33vw, 260px"
                  className="object-cover grayscale group-hover:grayscale-0 transition duration-500"
                />
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-wider text-[#3D3A37] font-medium">
                {category.title}
              </p>
            </Link>
          ))}
        </div>

        {/* Right: text lockup */}
        <div className="lg:col-span-5 lg:pl-6 space-y-6">
          <h2 className="text-xs uppercase tracking-[0.25em] font-semibold text-ink">
            Real ingredients, no shortcuts
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            From premium flours to tried-and-tested premixes, baking tools and finishing touches. We keep fresh,
            small-batch stock with carefully tracked expiry dates so your home and commercial bakes rise with total consistency.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="text-xs uppercase tracking-widest text-ink font-medium inline-flex items-center gap-2 hover:gap-3 transition-all"
            >
              Our supplies &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
