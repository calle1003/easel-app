import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const { pathname } = request.nextUrl;
  
  // 静的ファイルやNext.js内部リクエストは除外
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|css|js|map)$/)
  ) {
    return NextResponse.next();
  }
  
  // レスポンス取得
  const response = NextResponse.next();
  
  // 開発環境でのみログ出力
  if (process.env.NODE_ENV === 'development') {
    const duration = Date.now() - start;
    const method = request.method;
    
    // APIリクエストかページリクエストか判定
    const isApi = pathname.startsWith('/api');
    
    if (isApi) {
      // APIリクエストはlogger.apiを使用（200ステータスを仮定）
      logger.api(method, pathname, 200, duration);
    } else {
      // ページリクエストはlogger.pageを使用
      logger.page(method, pathname, duration);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico, その他の静的ファイル
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
