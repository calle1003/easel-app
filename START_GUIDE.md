# 🚀 easel Next.js アプリケーション 起動ガイド

## 📋 前提条件

- Node.js 18 以上
- MySQL 8.0 以上
- npm または yarn

## 🔧 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
cp env.example .env.local
```

`.env.local` を編集：

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/easel_db"

# JWT
JWT_SECRET="your-secret-key-change-in-production"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Resend (Email)
RESEND_API_KEY="re_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. データベースのセットアップ

```bash
# Prisma Client を生成
npm run db:generate

# データベーススキーマを適用
npm run db:push

# シードデータを投入
npx prisma db seed
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## 👤 デフォルトアカウント

- Email: `admin@easel.jp`
- Password: `admin123`

## 📚 主要なコマンド

- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run start` - プロダクションサーバー起動
- `npm run db:generate` - Prisma Client 生成
- `npm run db:push` - データベーススキーマ適用
- `npm run db:studio` - Prisma Studio 起動

## 🔗 主要な URL

- トップページ: http://localhost:3000
- 管理画面: http://localhost:3000/admin
- 管理画面ログイン: http://localhost:3000/admin/login
