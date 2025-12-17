/**
 * 環境変数の統一管理と検証
 * アプリケーション起動時に必須の環境変数をチェック
 */

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(
      `❌ Missing required environment variable: ${key}\n` +
      `Please check your .env file and ensure ${key} is set.`
    );
  }
  
  return value || '';
}

function validateJWTSecret(secret: string): void {
  // ビルド時はスキップ（環境変数がテスト値の可能性がある）
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }
  
  if (secret.length < 32) {
    console.warn(
      `⚠️  JWT_SECRET should be at least 32 characters long for security.\n` +
      `   Current length: ${secret.length} characters.\n` +
      `   Generate a secure random string: openssl rand -base64 32`
    );
    return; // 警告のみ
  }
  
  // 弱いデフォルト値の検出（警告のみ）
  const weakSecrets = [
    'your-secret-key',
    'change-in-production',
    'secret',
    'password',
    '12345',
  ];
  
  const lowerSecret = secret.toLowerCase();
  for (const weak of weakSecrets) {
    if (lowerSecret.includes(weak)) {
      console.warn(
        `⚠️  JWT_SECRET appears to be a default/weak value.\n` +
        `   Please use a strong, randomly generated secret for production.\n` +
        `   Generate one with: openssl rand -base64 32`
      );
      return; // 警告のみ
    }
  }
}

// 環境変数の検証と取得
const jwtSecret = getEnvVar('JWT_SECRET');
validateJWTSecret(jwtSecret);

export const config = {
  // データベース
  database: {
    url: getEnvVar('DATABASE_URL'),
  },
  
  // JWT認証
  jwt: {
    secret: jwtSecret,
    expiresIn: '24h',
  },
  
  // Stripe決済
  stripe: {
    secretKey: getEnvVar('STRIPE_SECRET_KEY'),
    publishableKey: getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET'),
  },
  
  // メール送信
  email: {
    // Resend
    resendApiKey: getEnvVar('RESEND_API_KEY', false),
    
    // Nodemailer (SMTP)
    smtp: {
      host: getEnvVar('SMTP_HOST', false),
      port: parseInt(getEnvVar('SMTP_PORT', false) || '587'),
      user: getEnvVar('SMTP_USER', false),
      password: getEnvVar('SMTP_PASSWORD', false),
      fromEmail: getEnvVar('SMTP_FROM_EMAIL', false),
      fromName: getEnvVar('SMTP_FROM_NAME', false) || 'easel',
    },
  },
  
  // アプリケーション
  app: {
    url: getEnvVar('NEXT_PUBLIC_APP_URL', false) || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
} as const;

// 起動時に設定を検証（開発環境でのみ詳細表示）
if (config.app.isDevelopment) {
  console.log('✅ Configuration loaded successfully');
  console.log(`   Environment: ${config.app.env}`);
  console.log(`   JWT Secret length: ${config.jwt.secret.length} characters`);
  console.log(`   Stripe: ${config.stripe.secretKey.substring(0, 7)}...`);
  console.log(`   Database: ${config.database.url.split('@')[1] || 'configured'}`);
}
