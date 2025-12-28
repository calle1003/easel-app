# HTTPS開発環境セットアップガイド

## 概要

このプロジェクトでは、カメラアクセスが必要な機能（QRコードスキャン、チケット表示など）のため、HTTPS環境での開発が推奨されます。

## セットアップ済みの内容

✅ mkcertによるローカル証明書の作成
✅ HTTPSサーバーの設定
✅ メール内リンクのHTTPS化

## 使い方

### 1. HTTPSサーバーの起動

```bash
npm run dev:https
```

### 2. アクセス方法

**PC（localhost）からアクセス**
```
https://localhost:3000
```

**スマホ（同じWi-Fi）からアクセス**
```
https://172.20.10.9:3000
```

※ IPアドレスは環境によって異なります。確認方法：
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 3. 証明書の警告について

初回アクセス時に「安全ではありません」という警告が表示されます。

**Safariの場合**
1. 「詳細を表示」をタップ
2. 「このWebサイトを閲覧」をタップ

**Chromeの場合**
1. 「詳細設定」をクリック
2. 「localhost にアクセスする（安全ではありません）」をクリック

## 環境変数の設定

本番環境では`.env.local`に以下を設定してください：

```bash
# 本番環境のURL
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# 開発環境でスマホからアクセスする場合
# NEXT_PUBLIC_APP_URL="https://172.20.10.9:3000"
```

## 証明書の再作成

証明書を再作成する場合：

```bash
# 証明書ディレクトリを削除
rm -rf .cert

# 再作成
mkdir -p .cert
mkcert -key-file .cert/localhost-key.pem -cert-file .cert/localhost.pem localhost 127.0.0.1 172.20.10.9 ::1
```

## トラブルシューティング

### カメラが起動しない

- HTTPSでアクセスしていることを確認
- ブラウザのカメラ許可設定を確認
- 証明書の警告を承認していることを確認

### メール内のリンクがHTTPになる

- `.env.local`の`NEXT_PUBLIC_APP_URL`を確認
- サーバーを再起動

### IPアドレスが変わった

- Wi-Fiを変更すると IPアドレスが変わります
- 新しいIPアドレスで証明書を再作成してください

## HTTPモード（参考）

カメラ機能が不要な場合は、HTTPモードでも動作します：

```bash
npm run dev
# → http://localhost:3000
```

ただし、以下の機能は制限されます：
- QRコードスキャン（カメラアクセス）
- 一部のブラウザでの位置情報
- Service Worker

