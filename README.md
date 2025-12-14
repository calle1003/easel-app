# easel - Next.js フルスタック版

演劇・公演チケット販売 Web アプリケーション「**easel**」

**Spring Boot + React** から **Next.js 15 フルスタック** へ完全移行完了 🎉

---

## 🚀 クイックスタート

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp env.example .env.local
# .env.localを編集してください

# データベースセットアップ
npm run db:generate
npm run db:push
npx prisma db seed

# 開発サーバー起動
npm run dev
```

http://localhost:3000 でアクセス

---

## 📚 ドキュメント

- **[START_GUIDE.md](./START_GUIDE.md)** - 詳細な起動手順
- **[MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md)** - 移行完了レポート
- **[SPECIFICATION.md](./SPECIFICATION.md)** - 仕様書

---

## 🛠️ 技術スタック

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MySQL + Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: JWT (jose)
- **Payment**: Stripe SDK
- **Email**: Resend

---

## 👤 デフォルトアカウント

- Email: `admin@easel.jp`
- Password: `admin123`

---

## 📁 プロジェクト構造

```
easel/
├── app/              # Next.js App Router
├── components/       # React コンポーネント
├── lib/              # ユーティリティ・SDK
├── prisma/           # DBスキーマ
├── public/           # 静的ファイル
└── types/            # TypeScript型定義
```

---

## 🎊 移行完了

- ✅ Spring Boot (11 Controllers) → Next.js (25 API Routes)
- ✅ React (24 Pages) → Next.js (24 Pages)
- ✅ 全機能 100%移行完了

**移行日**: 2025 年 12 月 14 日
# easel-app
