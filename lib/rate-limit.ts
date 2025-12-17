/**
 * Rate Limiting ユーティリティ
 * ブルートフォース攻撃や不正アクセスを防ぐため、特定の操作（ログインなど）の頻度を制限
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// メモリベースのレート制限（開発・小規模運用向け）
// 本番環境でスケールする場合は Redis などの外部ストレージを推奨
const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  /**
   * 制限期間内の最大リクエスト数
   * @default 5
   */
  maxRequests?: number;

  /**
   * 制限期間（ミリ秒）
   * @default 60000 (1分)
   */
  windowMs?: number;

  /**
   * レート制限到達時のメッセージ
   * @default 'Too many requests. Please try again later.'
   */
  message?: string;
}

/**
 * レート制限チェック
 * @param identifier ユーザーを識別する文字列（IPアドレス、メールアドレスなど）
 * @param options オプション設定
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const {
    maxRequests = 5,
    windowMs = 60000, // 1分
  } = options;

  const now = Date.now();
  const entry = store.get(identifier);

  // エントリが存在しない、または期間が過ぎている場合は新規作成
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    store.set(identifier, {
      count: 1,
      resetTime,
    });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
    };
  }

  // 制限に達している場合
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000); // 秒単位

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // カウントを増やす
  entry.count += 1;
  store.set(identifier, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * 特定の識別子のレート制限をリセット（管理者による手動リセットなど）
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}

/**
 * 古いエントリをクリーンアップ（メモリリーク防止）
 * 定期的に実行することを推奨
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

// 1時間ごとに自動クリーンアップ
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 60 * 60 * 1000); // 1時間
}
