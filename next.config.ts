import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // デフォルトのリクエストログを非表示（カスタムログのみ表示）
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
