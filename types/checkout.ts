export interface CheckoutRequest {
  performanceId: number;
  generalQuantity: number;
  reservedQuantity: number;
  vip1Quantity?: number;
  vip2Quantity?: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  exchangeCodes?: string[];
  dateLabel?: string; // 公演日時のラベル（例: "2025年1月1日（水） 14:00"）
}

export interface CheckoutResponse {
  sessionId: string;
  url: string;
  orderId: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface PriceCalculation {
  generalPrice: number;
  reservedPrice: number;
  vip1Price?: number;
  vip2Price?: number;
  generalQuantity: number;
  reservedQuantity: number;
  vip1Quantity?: number;
  vip2Quantity?: number;
  discountedGeneralCount: number;
  discountAmount: number;
  subtotal: number;
  total: number;
}

export interface ExchangeCodeValidation {
  code: string;
  isValid: boolean;
  isUsed: boolean;
  performerName?: string;
}
