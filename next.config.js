/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Generate unique build ID to bust browser cache
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
}

module.exports = nextConfig
