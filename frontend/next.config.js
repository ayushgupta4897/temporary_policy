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
          destination: 'http://localhost:8000/:path*'
        }
      ]
    }
    return []
  },

  // Environment variables for frontend
  env: {
    API_BASE_URL: process.env.NODE_ENV === 'production' 
      ? 'https://ca-policy-backend.whitestone-31d90b86.eastus.azurecontainerapps.io'
      : 'http://localhost:8000'
  }
}

module.exports = nextConfig
