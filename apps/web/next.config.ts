/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    externalDir: true,
  },
  transpilePackages: ['@repo/db', '@repo/ui'],
};

module.exports = nextConfig;