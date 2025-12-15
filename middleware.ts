import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
    // レスポンス後にログを出力するためのヘッダーを追加
    response.headers.set('x-middleware-start', String(start));
    
    const duration = Date.now() - start;
    const method = request.method;
    
    // カラーコード
    const reset = '\x1b[0m';
    const dim = '\x1b[2m';
    const bold = '\x1b[1m';
    const cyan = '\x1b[36m';
    
    // 日付フォーマット
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    
    // APIリクエストかページリクエストか判定
    const isApi = pathname.startsWith('/api');
    const icon = isApi ? '🔷' : '🌐';
    const type = isApi ? 'API' : 'PAGE';
    
    // ログ出力（Next.jsのデフォルトログの前に出力）
    console.log(
      `${dim}[${timestamp}]${reset} ` +
      `${cyan}${bold}${icon}${type}${reset} ` +
      `${bold}${method}${reset} ` +
      `${pathname} ` +
      `${dim}(middleware: ${duration}ms)${reset}`
    );
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
