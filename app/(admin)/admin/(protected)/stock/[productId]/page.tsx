import { redirect } from 'next/navigation'

// Old Phase 2 stock links: everything is on the Stock & batches page now.
export default function Page() {
  redirect('/admin/stock')
}
