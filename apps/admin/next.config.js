/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@learning-platform/shared', '@learning-platform/ui', '@learning-platform/auth', '@learning-platform/analytics'],
  experimental: { externalDir: true },
};

module.exports = nextConfig;