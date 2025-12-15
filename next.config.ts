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
  // アップロードファイルサイズ制限を20MBに設定
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
