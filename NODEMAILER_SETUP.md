# 📧 Nodemailer セットアップガイド

## 🚀 インストール

```bash
npm install nodemailer @types/nodemailer
```

## ⚙️ 環境変数の設定

`.env.local` に以下を追加：

### 開発環境（Gmail を使う場合）

```bash
# SMTP設定（Gmail）
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"  # ← Gmailアプリパスワード
SMTP_FROM_EMAIL="your-email@gmail.com"
SMTP_FROM_NAME="easel"
```

### Gmail アプリパスワードの取得方法

1. https://myaccount.google.com/security にアクセス
2. 「2段階認証プロセス」を有効化
3. 「アプリパスワード」を検索
4. アプリを選択：「メール」
5. デバイスを選択：「その他」→「easel」
6. 生成された16桁のパスワードをコピー
7. `.env.local` の `SMTP_PASSWORD` に設定

### 本番環境（独自ドメインのSMTP）

```bash
# SMTP設定（独自ドメイン）
SMTP_HOST="smtp.yourdomain.com"
SMTP_PORT="587"  # または 465（SSL）
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM_EMAIL="noreply@yourdomain.com"
SMTP_FROM_NAME="easel"
```

## 📝 コード変更

### 1. `lib/email.ts` を切り替え

**オプションA: ファイル名を変更して切り替え**

```bash
# 現在のResend版をバックアップ
mv lib/email.ts lib/email-resend.ts

# Nodemailer版を有効化
mv lib/email-nodemailer.ts lib/email.ts
```

**オプションB: 内容をコピーして置き換え**

`lib/email.ts` の内容を `lib/email-nodemailer.ts` の内容で置き換える

### 2. 開発サーバーを再起動

```bash
npm run dev
```

## ✅ 動作確認

### テスト送信

1. チケットを購入
2. Session IDを取得
3. テストAPIを実行：

```bash
curl -X POST http://localhost:3000/api/webhook/test-complete \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"cs_test_xxxxx"}'
```

### 期待される動作

**SMTP設定済み：**
→ 実際にメールが送信される ✉️

**SMTP未設定：**
→ コンソールにログ出力される 📝

```
📧 ========== EMAIL (DEV MODE - Nodemailer) ==========
To: customer@example.com
From: easel <noreply@easel.jp>
Subject: 【easel】チケット購入完了のお知らせ
...
====================================================
```

## 🔧 トラブルシューティング

### Gmail: "Less secure app access"

Gmail は2段階認証 + アプリパスワードが必須です。
通常のパスワードでは送信できません。

### "Authentication failed"

- SMTPユーザー名とパスワードを確認
- ポート番号を確認（587 または 465）
- 2段階認証が有効か確認（Gmail）

### "Connection timeout"

- SMTP_HOST が正しいか確認
- ファイアウォール設定を確認
- ポート 587 または 465 が開いているか確認

## 📊 各種SMTPプロバイダーの設定

### Gmail（無料、1日500通まで）

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="16-digit-app-password"
```

### Outlook/Office365（無料、1日300通まで）

```bash
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASSWORD="your-password"
```

### AWS SES（$0.10/1,000通）

```bash
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-username"
SMTP_PASSWORD="your-smtp-password"
```

### SendGrid（月100通無料、$15/月〜）

```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
```

### 独自ドメインのSMTP

レンタルサーバーやドメインプロバイダーから提供される
SMTP設定を使用してください。

## 🎯 推奨設定

### スタート段階（今）

```
Gmail + アプリパスワード（無料）
→ 1日500通まで、設定が簡単
```

### 本番環境準備

```
独自ドメインのSMTP設定
→ プロフェッショナル、送信者の信頼性向上
```

### 大規模運用

```
AWS SES（$0.10/1,000通）
→ コスト効率が良い、無制限
```

## 📌 次のステップ

1. ✅ Nodemailerをインストール
2. ✅ Gmail アプリパスワードを取得
3. ✅ `.env.local` に設定
4. ✅ `lib/email.ts` を切り替え
5. ✅ 開発サーバーを再起動
6. ✅ テスト送信
7. ⏳ 本番環境で独自ドメインのSMTP設定

完了したら、実際にメールが届くようになります！ ✉️
