const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@codeagent/ui',
    '@codeagent/auth',
    '@codeagent/shared',
    '@codeagent/editor',
    '@codeagent/ai',
    '@codeagent/agents',
    '@codeagent/telemetry',
    '@codeagent/memory',
    '@codeagent/terminal',
    '@codeagent/git',
    '@codeagent/search',
    '@codeagent/review',
    '@codeagent/database',
  ],
  experimental: {
    externalDir: true,
  },
  outputFileTracingRoot: path.resolve(__dirname),
};

module.exports = nextConfig;
