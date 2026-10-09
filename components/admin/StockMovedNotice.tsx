import Link from 'next/link'

/** The Phase 2 web Stock and Quick sale screens were retired: stock is kept
 *  on the SBH Inventory iPad app (see sbh-inventory/docs/ASSUMPTIONS.md B1). */
export default function StockMovedNotice() {
  return (
    <div className="max-w-xl space-y-3" data-testid="stock-moved">
      <h1 className="font-heading text-2xl text-ink">Stock is kept on the iPad</h1>
      <p className="text-sm text-muted">
        Receiving, repacking, counting and stock levels now live in the SBH Inventory app on the shop iPad. The website
        shows each product as in stock, low, out or &ldquo;ask us&rdquo; from there.
      </p>
      <Link href="/admin" className="inline-block text-xs uppercase tracking-widest text-clay hover:text-clay/80 py-2">
        Back to orders
      </Link>
    </div>
  )
}
