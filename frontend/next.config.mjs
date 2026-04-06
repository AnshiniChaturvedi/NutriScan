/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['world.openfoodfacts.org', 'images.openfoodfacts.org'],
  },
  env: {
    NEXT_PUBLIC_API_URL: BACKEND_URL,
  },
  // Proxy /backend/* → FastAPI.  This means browser requests stay same-origin
  // (no CORS required) and the backend URL is never exposed.
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/(.*)',
        headers: [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }],
      },
    ];
  },
};

export default nextConfig;
