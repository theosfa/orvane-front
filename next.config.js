const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // генерация рецепта ИИ (с проверкой КБЖУ и исправлением) может идти дольше дефолтных 30 c прокси
  experimental: { proxyTimeout: 120_000 },
  // the browser talks to the API through this app (/api/* -> Nest on port 3001),
  // so only port 3000 needs to be exposed, e.g. through a tunnel
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.API_PROXY_TARGET ?? 'http://localhost:3001'}/:path*` }];
  },
};

module.exports = withNextIntl(nextConfig);
