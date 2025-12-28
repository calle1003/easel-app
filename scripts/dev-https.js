#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 証明書ファイルのパス
const certDir = path.join(__dirname, '..', '.cert');
const keyFile = path.join(certDir, 'localhost-key.pem');
const certFile = path.join(certDir, 'localhost.pem');

// 証明書の存在確認
if (!fs.existsSync(keyFile) || !fs.existsSync(certFile)) {
  console.error('❌ 証明書が見つかりません。以下のコマンドで証明書を作成してください:');
  console.error('   mkcert -key-file .cert/localhost-key.pem -cert-file .cert/localhost.pem localhost 127.0.0.1 172.20.10.9 ::1');
  process.exit(1);
}

console.log('🔒 HTTPSモードで起動します...');
console.log(`📜 証明書: ${certFile}`);
console.log(`🔑 秘密鍵: ${keyFile}`);

// Next.js devサーバーを起動（HTTPSモード、全インターフェースでリスン）
const nextDev = spawn('next', ['dev', '-H', '0.0.0.0'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--require ./scripts/https-server.js',
    SSL_KEY_FILE: keyFile,
    SSL_CERT_FILE: certFile,
  },
});

// 標準出力をフィルタリング
nextDev.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach((line) => {
    // Next.jsのデフォルトのリクエストログを除外
    if (!line.match(/^\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+\//)) {
      // URLをHTTPSに置き換えて表示
      const httpsLine = line.replace(/http:\/\//g, 'https://');
      process.stdout.write(httpsLine + '\n');
    }
  });
});

// 標準エラー出力をそのまま表示
nextDev.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// プロセス終了時の処理
nextDev.on('close', (code) => {
  process.exit(code);
});

// Ctrl+C対応
process.on('SIGINT', () => {
  nextDev.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM');
  process.exit(0);
});

