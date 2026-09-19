'use client'

import { memo } from 'react'

interface CategoryNavProps {
  categories: string[]
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
}

function CategoryNav({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryNavProps) {
  return (
    <div className="sticky top-16 z-30 bg-paper/80 backdrop-blur-md py-3 border-b border-line">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-start md:justify-center space-x-2 md:space-x-3 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => onCategoryChange(null)}
            className={`flex-shrink-0 px-4 md:px-6 py-1.5 md:py-2 text-[11px] font-body font-medium uppercase tracking-widest transition-all duration-300 ${
              !selectedCategory
                ? 'bg-ink text-paper'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`flex-shrink-0 px-4 md:px-6 py-1.5 md:py-2 text-[11px] font-body font-medium uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-ink text-paper'
                  : 'text-ink/60 hover:text-ink'
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

export default memo(CategoryNav)
