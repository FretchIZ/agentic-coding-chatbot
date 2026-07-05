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
};

module.exports = nextConfig;
