/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  transpilePackages: ['@learning-platform/shared', '@learning-platform/ui', '@learning-platform/auth', '@learning-platform/editor'],
  experimental: { externalDir: true },
};

module.exports = nextConfig;