/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@learning-platform/shared', '@learning-platform/ui', '@learning-platform/auth', '@learning-platform/editor'],
  experimental: { externalDir: true },
};

module.exports = nextConfig;