#!/usr/bin/env node

const { spawn } = require('child_process');

// Next.js devサーバーを起動
const nextDev = spawn('next', ['dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

// 標準出力をフィルタリング
nextDev.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach((line) => {
    // Next.jsのデフォルトのリクエストログを除外
    // 例: " GET /about 200 in 1085ms"
    if (!line.match(/^\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+\//)) {
      process.stdout.write(line + '\n');
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
