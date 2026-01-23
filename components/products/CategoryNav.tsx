'use client'

interface CategoryNavProps {
  categories: string[]
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
}

export default function CategoryNav({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryNavProps) {
  return (
    <div className="sticky top-16 md:top-20 z-30 bg-bakery-dark/80 backdrop-blur-md py-3 md:py-4 border-b border-bakery-cream/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-start md:justify-center space-x-2 md:space-x-3 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => onCategoryChange(null)}
            className={`flex-shrink-0 px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-heading tracking-widest transition-all duration-300 ${
              !selectedCategory
                ? 'bg-bakery-accent text-bakery-dark shadow-lg'
                : 'text-bakery-cream/60 hover:text-bakery-cream'
            }`}
          >
            ALL BAKES
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`flex-shrink-0 px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-heading tracking-widest whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-bakery-accent text-bakery-dark shadow-lg'
                  : 'text-bakery-cream/60 hover:text-bakery-cream'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
