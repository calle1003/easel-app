import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const IS_DEV = process.env.NODE_ENV === 'development';

// 開発環境でAPIキーが未設定の場合は警告を出すのみ
if (!RESEND_API_KEY) {
  if (IS_DEV) {
    console.warn('⚠️  RESEND_API_KEY is not set. Emails will be logged to console only.');
  } else {
    throw new Error('RESEND_API_KEY is not set');
  }
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';

export interface TicketInfo {
  ticketCode: string;
  ticketType: 'GENERAL' | 'RESERVED' | 'VIP1' | 'VIP2';
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
  const ticketListHtml = orderInfo.tickets
    .map(
      (ticket) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <a href="${APP_URL}/tickets/view/${ticket.ticketCode}" style="color: #d4af37; text-decoration: none;">
          ${ticket.ticketCode}
        </a>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        ${ticket.ticketType === 'GENERAL' ? '一般席' : '指定席'}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        ${ticket.isExchanged ? '引換券利用' : '通常購入'}
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>チケット購入完了</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a1a; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">easel</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px;">
          <h2 style="color: #1a1a1a; margin-top: 0;">チケット購入が完了しました</h2>
          
          <p>${orderInfo.customerName} 様</p>
          
          <p>この度は、easel のチケットをご購入いただき、誠にありがとうございます。</p>
          
          <div style="background-color: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #d4af37;">
            <h3 style="margin-top: 0; color: #1a1a1a;">注文情報</h3>
            <p><strong>注文番号:</strong> #${orderInfo.orderId}</p>
            <p><strong>公演:</strong> ${orderInfo.performanceLabel}</p>
            <p><strong>公演日:</strong> ${orderInfo.performanceDate}</p>
            <p><strong>一般席:</strong> ${orderInfo.generalQuantity} 枚</p>
            <p><strong>指定席:</strong> ${orderInfo.reservedQuantity} 枚</p>
            <p><strong>合計金額:</strong> ¥${orderInfo.totalAmount.toLocaleString()}</p>
          </div>
          
          <h3 style="color: #1a1a1a;">チケット一覧</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #1a1a1a; color: #fff;">
                <th style="padding: 10px; text-align: left;">チケットコード</th>
                <th style="padding: 10px; text-align: left;">種別</th>
                <th style="padding: 10px; text-align: left;">備考</th>
              </tr>
            </thead>
            <tbody>
              ${ticketListHtml}
            </tbody>
          </table>
          
          <p style="margin-top: 30px;">
            各チケットの詳細は、上記のチケットコードをクリックしてご確認ください。<br>
            当日は、チケット画面のQRコードをご提示ください。
          </p>
          
          <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
            ご不明な点がございましたら、お気軽にお問い合わせください。<br>
            <a href="${APP_URL}/contact" style="color: #d4af37;">お問い合わせフォーム</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} easel. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  // 開発環境でAPIキーが未設定の場合はコンソールに出力
  if (!resend) {
    console.log('\n📧 ========== EMAIL (DEV MODE) ==========');
    console.log('To:', customerEmail);
    console.log('Subject: 【easel】チケット購入完了のお知らせ');
    console.log('Order ID:', orderInfo.orderId);
    console.log('Performance:', orderInfo.performanceLabel);
    console.log('Tickets:', orderInfo.tickets.length);
    console.log('Ticket Codes:');
    orderInfo.tickets.forEach((ticket, index) => {
      console.log(
        `  ${index + 1}. ${ticket.ticketCode} (${ticket.ticketType === 'GENERAL' ? '一般席' : '指定席'}${ticket.isExchanged ? ' - 引換券' : ''})`
      );
      console.log(`     View URL: ${APP_URL}/tickets/view/${ticket.ticketCode}`);
    });
    console.log('========================================\n');
    return;
  }

  // 実際にメールを送信
  try {
    await resend.emails.send({
      from: 'easel <onboarding@resend.dev>', // Resend sandbox domain
      to: customerEmail,
      subject: '【easel】チケット購入完了のお知らせ',
      html,
    });
    console.log('✅ Email sent successfully to:', customerEmail);
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    // 開発環境ではエラーを投げずにログのみ出力
    if (!IS_DEV) {
      throw error;
    }
  }
}
