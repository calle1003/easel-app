# 🔔 Webhook テスト手順

チケット購入後のメール送信は、Stripe Webhookをトリガーする必要があります。
ローカル開発環境では、以下の方法でテストできます。

## 🛠️ 方法1: テストAPIを使用（推奨）

### 手順

1. **チケットを購入する**
   - http://localhost:3000/ticket にアクセス
   - チケット情報を入力して購入
   - Stripe決済画面で `4242 4242 4242 4242` のテストカードを使用

2. **Session IDを取得**
   - ブラウザのURL（success画面）から `session_id` をコピー
   - 例: `http://localhost:3000/ticket/success?session_id=cs_test_xxxxx`

3. **テストAPIを実行**
   
   ターミナルで以下のコマンドを実行：
   
   ```bash
   curl -X POST http://localhost:3000/api/webhook/test-complete \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"cs_test_xxxxx"}'
   ```
   
   または、ブラウザの開発者ツールのコンソールで：
   
   ```javascript
   fetch('/api/webhook/test-complete', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ sessionId: 'cs_test_xxxxx' })
   }).then(r => r.json()).then(console.log)
   ```

4. **結果を確認**
   - ターミナル（npm run dev）に📧マークとメール内容が出力される
   - チケットコードと表示URLが表示される
   - `/tickets/view/{ticketCode}` でチケットを確認できる

## 📧 メール送信の設定（本番用）

### Resend APIキーの取得

1. https://resend.com にアクセスして無料アカウント作成
2. API Keys から新しいキーを作成
3. `.env.local` に設定：

```bash
RESEND_API_KEY="re_xxxxxxxxxx"
```

4. 開発サーバーを再起動

### 送信元ドメインの設定

Resendの無料プランでは `onboarding@resend.dev` から送信されます。
独自ドメインを使用するには：

1. Resend Dashboard > Domains
2. ドメインを追加してDNS設定
3. `lib/email.ts` の `from` を変更：

```typescript
from: 'easel <noreply@yourdomain.com>'
```

## 🔄 方法2: Stripe CLI（上級者向）

```bash
# Stripe CLIをインストール
brew install stripe/stripe-cli/stripe

# ログイン
stripe login

# Webhookをリッスン
stripe listen --forward-to localhost:3000/api/webhook/stripe

# 別のターミナルでイベントをトリガー
stripe trigger checkout.session.completed
```

## ✅ 動作確認

### コンソール出力例（開発環境）

```
📧 ========== EMAIL (DEV MODE) ==========
To: customer@example.com
Subject: 【easel】チケット購入完了のお知らせ
Order ID: 1
Performance: easel live vol.2
Tickets: 2
Ticket Codes:
  1. 550e8400-e29b-41d4-a716-446655440000 (一般席)
     View URL: http://localhost:3000/tickets/view/550e8400-e29b-41d4-a716-446655440000
  2. 6fa459ea-ee8a-3ca4-894e-db77e160355e (指定席)
     View URL: http://localhost:3000/tickets/view/6fa459ea-ee8a-3ca4-894e-db77e160355e
========================================
```

### 成功レスポンス例

```json
{
  "success": true,
  "message": "Order completed and email sent",
  "orderId": 1,
  "ticketCount": 2,
  "email": "customer@example.com"
}
```

## 🚨 トラブルシューティング

### "Order not found"
→ Session IDが正しいか確認

### "Order already paid"
→ 既に処理済み。問題なし。

### "Email failed"
→ Resend APIキーを確認。開発環境ではコンソールに出力される。

## 📌 本番環境での設定

本番環境では、Stripe Webhookを正しく設定する必要があります：

1. Stripe Dashboard > Developers > Webhooks
2. エンドポイントを追加: `https://yourdomain.com/api/webhook/stripe`
3. イベントを選択:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
4. Webhook Signing Secretを `.env.local` に設定：

```bash
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxx"
```

