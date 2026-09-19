import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </main>
  )
}
