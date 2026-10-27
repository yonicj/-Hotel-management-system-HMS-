import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ehms/ui',
    '@ehms/types',
    '@ehms/validation',
    '@ehms/localization',
    '@ehms/config',
    '@ehms/api-client'
  ],
  output: process.env.TAURI_BUILD ? 'export' : undefined,
  images: {
    unoptimized: Boolean(process.env.TAURI_BUILD)
  }
};

export default nextConfig;
