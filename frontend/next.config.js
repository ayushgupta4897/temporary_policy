/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable standalone output for Docker optimization
  output: 'standalone',
  
  // Image optimization
  images: {
    unoptimized: true
  },
  
  // Handle API rewrites for development only
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*'
        }
      ]
    }
    return []
  },

  // Environment variables for frontend
  // NEXT_PUBLIC_API_BASE_URL is now set dynamically:
  // - In production: Set by Azure Container Apps deployment (via --set-env-vars)
  // - In development: Defaults to localhost:8000
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ||
      (process.env.NODE_ENV === 'production'
        ? process.env.BACKEND_URL || 'http://localhost:8000'
        : 'http://localhost:8000')
  }
}

module.exports = nextConfig
