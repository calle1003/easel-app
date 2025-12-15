import nodemailer from 'nodemailer';
import { logger } from './logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const IS_DEV = process.env.NODE_ENV === 'development';

// SMTP設定を環境変数から取得
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@easel.jp';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'easel';

// Transporterを作成
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    if (IS_DEV) {
      logger.warn('SMTP settings not configured. Emails will be logged to console only.');
      return null;
    }
    throw new Error('SMTP configuration is missing');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }

  return transporter;
}

export interface TicketInfo {
  ticketCode: string;
  ticketType: 'GENERAL' | 'RESERVED';
  isExchanged: boolean;
}

export interface OrderInfo {
  orderId: number;
  performanceLabel: string;
  performanceDate: string;
  customerName: string;
  totalAmount: number;
  generalQuantity: number;
  reservedQuantity: number;
  tickets: TicketInfo[];
}

export async function sendPurchaseConfirmationEmail(
  customerEmail: string,
  orderInfo: OrderInfo
): Promise<void> {
  // チケットセクションのHTMLを生成（移行元と同じスタイル）
  const ticketSectionsHtml = (() => {
    const generalTickets = orderInfo.tickets.filter(t => t.ticketType === 'GENERAL');
    const reservedTickets = orderInfo.tickets.filter(t => t.ticketType === 'RESERVED');
    
    let html = '';
    
    if (generalTickets.length > 0) {
      html += `<div class="ticket-section">`;
      html += `<h3>一般席（自由席） (${generalTickets.length}枚)</h3>`;
      generalTickets.forEach(ticket => {
        const ticketUrl = `${APP_URL}/tickets/view/${ticket.ticketCode}`;
        html += `
          <div class="ticket-card">
            <div style="margin-bottom: 12px;">
              <span class="ticket-badge badge-general">一般席</span>
              ${ticket.isExchanged ? '<span class="ticket-badge badge-exchanged">引換券使用</span>' : ''}
            </div>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${ticketUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">📱 チケットを表示</a>
            </div>
            <div class="ticket-code">チケットコード: ${ticket.ticketCode}</div>
          </div>
        `;
      });
      html += `</div>`;
    }
    
    if (reservedTickets.length > 0) {
      html += `<div class="ticket-section">`;
      html += `<h3>指定席 (${reservedTickets.length}枚)</h3>`;
      reservedTickets.forEach(ticket => {
        const ticketUrl = `${APP_URL}/tickets/view/${ticket.ticketCode}`;
        html += `
          <div class="ticket-card">
            <div style="margin-bottom: 12px;">
              <span class="ticket-badge badge-reserved">指定席</span>
              ${ticket.isExchanged ? '<span class="ticket-badge badge-exchanged">引換券使用</span>' : ''}
            </div>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${ticketUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">📱 チケットを表示</a>
            </div>
            <div class="ticket-code">チケットコード: ${ticket.ticketCode}</div>
          </div>
        `;
      });
      html += `</div>`;
    }
    
    return html;
  })();

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: #ffffff;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 8px 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            padding: 24px;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 24px;
          }
          .info-section {
            background: #f8fafc;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
          }
          .info-section h3 {
            margin: 0 0 12px;
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #64748b;
            font-size: 14px;
          }
          .info-value {
            font-weight: 500;
            color: #1e293b;
            font-size: 14px;
          }
          .ticket-section {
            margin-bottom: 20px;
          }
          .ticket-section h3 {
            margin: 0 0 12px;
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .ticket-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .ticket-code {
            font-family: 'SF Mono', Monaco, 'Courier New', monospace;
            font-size: 11px;
            color: #64748b;
            background: #ffffff;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px dashed #cbd5e1;
            word-break: break-all;
            text-align: center;
          }
          .ticket-badge {
            display: inline-block;
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 4px;
            margin-bottom: 8px;
          }
          .badge-general {
            background: #dbeafe;
            color: #1d4ed8;
          }
          .badge-reserved {
            background: #f3e8ff;
            color: #7c3aed;
          }
          .badge-exchanged {
            background: #fef3c7;
            color: #b45309;
            margin-left: 4px;
          }
          .total-section {
            background: #1e293b;
            color: #ffffff;
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            font-size: 14px;
            opacity: 0.9;
          }
          .total-value {
            font-size: 24px;
            font-weight: 600;
          }
          .notice {
            background: #fefce8;
            border: 1px solid #fde047;
            border-radius: 8px;
            padding: 16px;
            margin-top: 20px;
            font-size: 13px;
            color: #854d0e;
          }
          .notice strong {
            display: block;
            margin-bottom: 8px;
          }
          .footer {
            text-align: center;
            padding: 24px;
            color: #64748b;
            font-size: 12px;
          }
          .footer a {
            color: #3b82f6;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>ご購入ありがとうございます</h1>
              <p>チケットの購入が完了しました</p>
            </div>

            <div class="content">
              <p class="greeting">
                ${orderInfo.customerName} 様<br><br>
                この度はチケットをご購入いただき、誠にありがとうございます。<br>
                下記の内容をご確認ください。
              </p>

              <div class="info-section">
                <h3>注文情報</h3>
                <div class="info-row">
                  <span class="info-label">注文番号</span>
                  <span class="info-value">#${orderInfo.orderId}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">公演日</span>
                  <span class="info-value">${orderInfo.performanceLabel}</span>
                </div>
              </div>

              ${ticketSectionsHtml}

              <div class="total-section">
                <div class="total-row">
                  <span class="total-label">お支払い金額</span>
                  <span class="total-value">¥${orderInfo.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div class="notice">
                <strong>⚠️ ご注意</strong>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>このメールに記載されたチケットコードは入場時に必要です</li>
                  <li>チケットコードは他の方に共有しないでください</li>
                  <li>当日は本メールをご提示ください</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              <p>
                ご不明点がございましたら、お問い合わせください。<br>
                <a href="${APP_URL}">easel 公式サイト</a>
              </p>
              <p>© easel</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const transport = getTransporter();

  // 開発環境でSMTP未設定の場合はコンソールに出力
  if (!transport) {
    logger.info('📧 EMAIL (DEV MODE - Nodemailer)', {
      to: customerEmail,
      from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
      subject: '【easel】チケット購入完了のお知らせ',
      orderId: orderInfo.orderId,
      performance: orderInfo.performanceLabel,
      ticketCount: orderInfo.tickets.length,
      tickets: orderInfo.tickets.map((t, i) => ({
        num: i + 1,
        code: t.ticketCode,
        type: t.ticketType === 'GENERAL' ? '一般席' : '指定席',
        exchanged: t.isExchanged,
        url: `${APP_URL}/tickets/view/${t.ticketCode}`,
      })),
    });
    return;
  }

  // 実際にメールを送信
  try {
    await transport.sendMail({
      from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
      to: customerEmail,
      subject: '【easel】チケット購入完了のお知らせ',
      html,
    });
    logger.email(customerEmail, '【easel】チケット購入完了のお知らせ', 'sent');
  } catch (error: any) {
    logger.email(customerEmail, '【easel】チケット購入完了のお知らせ', 'failed');
    logger.error('Failed to send email', { error: error.message });
    // 開発環境ではエラーを投げずにログのみ出力
    if (!IS_DEV) {
      throw error;
    }
  }
}
