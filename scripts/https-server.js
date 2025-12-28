// Next.js HTTPSサーバー設定
const fs = require('fs');
const https = require('https');
const { parse } = require('url');

const keyFile = process.env.SSL_KEY_FILE;
const certFile = process.env.SSL_CERT_FILE;

if (keyFile && certFile && fs.existsSync(keyFile) && fs.existsSync(certFile)) {
  // HTTPSサーバーの設定を上書き
  const originalCreateServer = https.createServer;
  https.createServer = function (options, requestListener) {
    const httpsOptions = {
      ...options,
      key: fs.readFileSync(keyFile),
      cert: fs.readFileSync(certFile),
    };
    return originalCreateServer(httpsOptions, requestListener);
  };
}

