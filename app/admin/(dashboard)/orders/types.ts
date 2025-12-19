/**
 * Orders ページの型定義
 */

export interface TicketInfo {
  id: number;
  ticketCode: string;
  ticketType: 'GENERAL' | 'RESERVED' | 'VIP1' | 'VIP2';
  isExchanged: boolean;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
}

export interface Order {
  id: number;
  stripeSessionId: string;
  performanceDate: string;
  performanceLabel: string;
  generalQuantity: number;
  reservedQuantity: number;
  vip1Quantity?: number;
  vip2Quantity?: number;
  generalPrice: number;
  reservedPrice: number;
  vip1Price?: number;
  vip2Price?: number;
  discountedGeneralCount: number;
  discountAmount: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  tickets?: TicketInfo[];
  exchangeCodeList?: string[];
}
