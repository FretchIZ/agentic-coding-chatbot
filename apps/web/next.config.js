/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@codeagent/ui',
    '@codeagent/auth',
    '@codeagent/shared',
    '@codeagent/editor',
  ],
  experimental: {
    externalDir: true,
  },
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
  },
};

module.exports = nextConfig;
