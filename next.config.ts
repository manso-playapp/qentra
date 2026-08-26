import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.13', '127.0.0.1', 'localhost'],
  experimental: {
    proxyClientMaxBodySize: '25mb',
  },
}

export default nextConfig
