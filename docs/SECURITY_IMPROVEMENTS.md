# セキュリティ改善実装ガイド

## ✅ 完了した改善

### Phase 1: 緊急対応（実装済み）

1. **✅ 環境変数の統一管理と検証** (`lib/config.ts`)
   - JWT秘密鍵の強度チェック（32文字以上必須）
   - 弱いデフォルト値の検出
   - Stripe/Database設定の検証
2. **✅ JWT認証の強化** (`lib/auth.ts`)
   - saltRounds を 10 → 12 に変更（セキュリティ強化）
   - デフォルト秘密鍵を削除（config.tsから取得）
3. **✅ Stripe Webhook検証の強化** (`app/api/webhook/stripe/route.ts`)
   - 署名ヘッダーの必須チェック
   - Replay攻撃対策（5分以内のイベントのみ受け入れ）
   - トランザクション処理による原子性保証
   - メール送信失敗時のエラーハンドリング改善
4. **✅ 管理API認証ミドルウェア** (`lib/admin-auth.ts`)
   - `requireAdmin()` - 管理者権限チェック
   - `requireSuperAdmin()` - スーパー管理者権限チェック
   - `handleAuthResult()` - 認証結果処理ヘルパー
5. **✅ 主要API認証の適用**
   - ✅ `app/api/performances/route.ts` (POST)
   - ✅ `app/api/performances/[id]/route.ts` (PUT, DELETE)
   - ✅ `app/api/performances/[id]/sessions/route.ts` (POST)
   - ✅ `app/api/performances/[id]/sessions/[sessionId]/route.ts` (PUT, DELETE)
   - ✅ `app/api/performances/[id]/details/route.ts` (PUT)
   - ✅ `app/api/performers/route.ts` (GET, POST)
   - ✅ `app/api/performers/[id]/route.ts` (GET, PUT, DELETE)
   - ✅ `app/api/performers/batch/route.ts` (POST)
   - ✅ `app/api/news/route.ts` (POST)
   - ✅ `app/api/news/[id]/route.ts` (PUT, DELETE)
   - ✅ `app/api/exchange-codes/route.ts` (GET, POST)
   - ✅ `app/api/exchange-codes/batch/route.ts` (POST)
   - ✅ `app/api/orders/route.ts` (GET)
   - ✅ `app/api/orders/[id]/route.ts` (GET, PUT, DELETE)
   - ✅ `app/api/tickets/route.ts` (GET)
   - ✅ `app/api/tickets/stats/route.ts` (GET)
6. **✅ Rate Limiting実装** (`lib/rate-limit.ts`)
   - メモリベースのレート制限システム
   - ログインAPIに適用（1分に5回まで）
   - Rate limit情報をHTTPヘッダーで返却
   - 自動クリーンアップ機能
7. **✅ ログ統一** (`logger` への移行)
   - `console.log/error/warn` を `logger` に統一
   - 主要APIルート全てに適用
   - 認証失敗やレート制限超過のログ記録

---

## ✅ すべての主要タスク完了！

### 実装済みの項目

- ✅ すべての管理系APIに認証を追加
- ✅ Rate Limiting実装（ログインAPI）
- ✅ console.logをloggerに統一
- ✅ トランザクション処理
- ✅ エラーハンドリング改善

### 📝 補足情報

#### Rate Limiting について

`lib/rate-limit.ts` で実装されたレート制限は、現在メモリベースです。
本番環境で複数サーバーにスケールする場合は、Redis などの外部ストレージを使用することを推奨します。

```typescript
// 現在の実装（メモリベース）
// ✅ 単一サーバー環境で動作
// ⚠️ サーバー再起動でリセット
// ⚠️ 複数サーバーでは個別にカウント

// 将来の推奨（Redisベース）
// npm install ioredis
// Redis を使用して複数サーバー間で共有
```

#### 公開APIについて

以下のAPIは**認証なし**で公開されています（意図的）：

- `app/api/performances/on-sale/route.ts` - 販売中公演の取得（公開情報）
- `app/api/tickets/check-in/route.ts` - チケットチェックイン（QRコード認証）
- `app/api/tickets/view/[ticketCode]/route.ts` - チケット表示（チケットコード認証）
- `app/api/qrcode/*` - QRコード生成（公開機能）

---

### 実装パターン

```typescript
// Before (認証なし)
export async function DELETE(request: NextRequest, { params }: ...) {
  try {
    const { id } = await params;
    // 処理...
  } catch (error) {
    console.error('...', error);
    return NextResponse.json(...);
  }
}

// After (認証あり)
import { requireAdmin, handleAuthResult } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

export async function DELETE(request: NextRequest, { params }: ...) {
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;

  try {
    const { id } = await params;
    // 処理...
  } catch (error) {
    logger.error('...', { error, id });
    return NextResponse.json(...);
  }
}
```

---

## 🔒 セキュリティチェックリスト

### 環境変数

- [ ] `.env` ファイルが `.gitignore` に含まれているか確認
- [ ] `JWT_SECRET` が32文字以上のランダム文字列か確認
- [ ] `STRIPE_WEBHOOK_SECRET` が設定されているか確認
- [ ] 本番環境でデフォルト値を使用していないか確認

### API認証

- [ ] すべての管理系POST/PUT/DELETEエンドポイントに認証を追加
- [ ] 認証失敗時に適切なステータスコード(401/403)を返しているか
- [ ] ログに認証試行情報が記録されているか

### エラーハンドリング

- [ ] `console.log` を `logger` に置き換え
- [ ] エラー時に機密情報を漏らさないか確認
- [ ] トランザクション処理が適切に実装されているか

---

## 🧪 テスト方法

### 1. 環境変数チェック

```bash
# アプリ起動時にエラーが出るか確認
npm run dev

# 成功例:
# ✅ Configuration loaded successfully
#    Environment: development
#    JWT Secret length: 44 characters
```

### 2. 認証テスト

```bash
# 認証なしでアクセス → 401エラー
curl http://localhost:3000/api/performances -X POST

# 認証ありでアクセス → 成功
curl http://localhost:3000/api/performances \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -X POST
```

---

## 📊 期待される効果

### セキュリティ

- ✅ 不正アクセスをAPI層でブロック
- ✅ Webhook偽装攻撃を防御
- ✅ 弱い秘密鍵の使用を防止

### 保守性

- ✅ 統一されたログ出力
- ✅ 一元化された認証ロジック
- ✅ トランザクション処理による一貫性保証

### 監視

- ✅ 認証失敗をログで追跡可能
- ✅ 不正アクセス試行の検出
