/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  turbopack: {
    root: __dirname,
    resolveAlias: {
      'fs/promises': './src/lib/empty.ts',
      'fs': './src/lib/empty.ts',
      'path': './src/lib/empty.ts',
    },
  },
};
module.exports = nextConfig;
