'use client'

interface ProductFilterSidebarProps {
  categories: string[]
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
}

export default function ProductFilterSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
}: ProductFilterSidebarProps) {
  return (
    <aside className="bg-bakery-cream rounded-lg p-6 shadow-lg paper-texture sticky top-24">
      <h2 className="font-heading text-bakery-brown text-2xl mb-6 tracking-wide">
        Filters
      </h2>

      {/* Categories Filter */}
      <div className="space-y-4">
        <h3 className="font-heading text-bakery-brown text-lg mb-3 tracking-wide">
          Categories
        </h3>

        <div className="space-y-2">
          {/* All Products */}
          <button
            onClick={() => onCategoryChange(null)}
            className={`w-full text-left px-4 py-2 rounded-md transition-all duration-200 ${
              selectedCategory === null
                ? 'bg-bakery-accent text-bakery-cream shadow-md'
                : 'bg-bakery-cream/50 text-bakery-brown hover:bg-bakery-accent/20'
            }`}
          >
            <span className="font-body text-sm">All Products</span>
          </button>

          {/* Category Buttons */}
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`w-full text-left px-4 py-2 rounded-md transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-bakery-accent text-bakery-cream shadow-md'
                  : 'bg-bakery-cream/50 text-bakery-brown hover:bg-bakery-accent/20'
              }`}
            >
              <span className="font-body text-sm">{category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {selectedCategory && (
        <button
          onClick={() => onCategoryChange(null)}
          className="mt-6 w-full py-2 px-4 border border-bakery-accent text-bakery-accent hover:bg-bakery-accent hover:text-bakery-cream rounded-md transition-all duration-200 font-body text-sm"
        >
          Clear Filters
        </button>
      )}
    </aside>
  )
}
