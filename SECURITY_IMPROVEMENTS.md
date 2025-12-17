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
   - ✅ `app/api/performers/route.ts` (GET, POST)

---

## 🚧 残りの実装タスク

### 以下の管理APIに認証を追加してください

#### 1. News API
**ファイル:**
- `app/api/news/route.ts` (POST)
- `app/api/news/[id]/route.ts` (PUT, DELETE)

**実装方法:**
```typescript
import { requireAdmin, handleAuthResult } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;
  
  // 既存の処理...
}
```

---

#### 2. Exchange Codes API
**ファイル:**
- `app/api/exchange-codes/route.ts` (POST, GET, DELETE)
- `app/api/exchange-codes/batch/route.ts` (POST)

**実装方法:** 上記と同様

---

#### 3. Performers 詳細API
**ファイル:**
- `app/api/performers/[id]/route.ts` (PUT, DELETE)
- `app/api/performers/batch/route.ts` (POST)

**実装方法:** 上記と同様

---

#### 4. Tickets API
**ファイル:**
- `app/api/tickets/check-in/route.ts` (POST) ← チェックイン処理

**注意:** check-inは認証方式が異なる可能性があります（QRコードスキャン）

---

#### 5. Orders API
**ファイル:**
- `app/api/orders/route.ts` (GET - 管理者のみ全注文取得)
- `app/api/orders/[id]/route.ts` (GET, PUT)

**注意:** 一般ユーザーが自分の注文を見る場合は別の認証方式が必要

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
