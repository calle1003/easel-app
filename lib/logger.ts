/**
 * 開発環境用のロガーユーティリティ
 * コンソールログを見やすくフォーマット
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

const colors = {
  info: '\x1b[36m',    // Cyan
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  success: '\x1b[32m', // Green
  debug: '\x1b[35m',   // Magenta
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

const icons = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  success: '✅',
  debug: '🔍',
};

function formatTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function log(level: LogLevel, message: string, data?: any) {
  const timestamp = formatTimestamp();
  const color = colors[level];
  const icon = icons[level];
  
  // 日付（薄い色）
  const formattedTimestamp = `${colors.dim}[${timestamp}]${colors.reset}`;
  
  // レベル（色付き、[]なし）
  const formattedLevel = `${color}${colors.bold}${icon}${level.toUpperCase()}${colors.reset}`;
  
  // メッセージ
  console.log(`${formattedTimestamp} ${formattedLevel} ${message}`);
  
  // データがある場合は整形して表示
  if (data !== undefined) {
    if (typeof data === 'object') {
      console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
    } else {
      console.log(`${colors.dim}${data}${colors.reset}`);
    }
  }
}

export const logger = {
  info: (message: string, data?: any) => log('info', message, data),
  warn: (message: string, data?: any) => log('warn', message, data),
  error: (message: string, data?: any) => log('error', message, data),
  success: (message: string, data?: any) => log('success', message, data),
  debug: (message: string, data?: any) => log('debug', message, data),
  
  // API リクエスト専用
  api: (method: string, path: string, status: number, duration: number) => {
    const statusColor = status >= 500 ? colors.error : 
                       status >= 400 ? colors.warn : 
                       status >= 300 ? colors.info : 
                       colors.success;
    
    const timestamp = formatTimestamp();
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
      `${colors.bold}🔷API${colors.reset} ` +
      `${colors.bold}${method}${colors.reset} ` +
      `${path} ` +
      `${statusColor}${status}${colors.reset} ` +
      `${colors.dim}${duration}ms${colors.reset}`
    );
  },
  
  // ページリクエスト専用
  page: (method: string, path: string, duration: number) => {
    const timestamp = formatTimestamp();
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
      `${colors.bold}🌐PAGE${colors.reset} ` +
      `${colors.bold}${method}${colors.reset} ` +
      `${path} ` +
      `${colors.dim}(middleware: ${duration}ms)${colors.reset}`
    );
  },
  
  // Email送信専用
  email: (to: string, subject: string, status: 'sent' | 'failed') => {
    const icon = status === 'sent' ? '📧' : '❌';
    const color = status === 'sent' ? colors.success : colors.error;
    const timestamp = formatTimestamp();
    
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
      `${color}${colors.bold}${icon}EMAIL${colors.reset} ` +
      `${status === 'sent' ? '送信成功' : '送信失敗'} ` +
      `${colors.dim}to${colors.reset} ${to} ` +
      `${colors.dim}|${colors.reset} ${subject}`
    );
  },
  
  // データベースクエリ専用
  db: (query: string, duration: number) => {
    const timestamp = formatTimestamp();
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
      `${colors.info}${colors.bold}🗄️DB${colors.reset} ` +
      `${colors.dim}${query}${colors.reset} ` +
      `${colors.dim}(${duration}ms)${colors.reset}`
    );
  },
  
  // Stripe イベント専用
  stripe: (event: string, status: 'received' | 'processed' | 'failed') => {
    const icon = status === 'received' ? '📥' : status === 'processed' ? '✅' : '❌';
    const color = status === 'processed' ? colors.success : status === 'failed' ? colors.error : colors.info;
    const timestamp = formatTimestamp();
    const statusText = status === 'received' ? '受信' : status === 'processed' ? '処理完了' : '失敗';
    
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
      `${color}${colors.bold}${icon}STRIPE${colors.reset} ` +
      `${event} ` +
      `${colors.dim}(${statusText})${colors.reset}`
    );
  },
};
