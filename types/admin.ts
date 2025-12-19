/**
 * 管理画面の共通型定義
 * 
 * このファイルは各管理ページで使用される共通の型を定義します。
 * 個別ページの型定義ファイル（app/admin/(dashboard)/[page]/types.ts）から
 * 徐々に移行していきます。
 */

// ============================================
// Performance 関連
// ============================================

export interface PerformanceSession {
  id: number;
  performanceId: number;
  showNumber: number;
  performanceDate: string;
  performanceTime: string;
  doorsOpenTime: string | null;
  venueName: string;
  venueAddress: string | null;
  venueAccess: string | null;
  generalCapacity: number;
  reservedCapacity: number;
  vip1Capacity: number;
  vip2Capacity: number;
  generalSold: number;
  reservedSold: number;
  vip1Sold: number;
  vip2Sold: number;
  saleStatus: string;
  saleStartAt: string | null;
  saleEndAt: string | null;
}

export interface Performance {
  id: number;
  title: string;
  volume: string | null;
  isOnSale?: boolean;
  generalPrice: number;
  reservedPrice: number;
  vip1Price: number | null;
  vip2Price: number | null;
  vip1Note: string | null;
  vip2Note: string | null;
  flyerImages?: Array<{ url: string; name: string }>;
  description: string | null;
  painters?: Array<{ name: string; instagram?: string }>;
  choreographers?: Array<{ name: string; instagram?: string; company?: string }>;
  navigators?: Array<{ name: string; note?: string; instagram?: string; company?: string }>;
  guestDancers?: Array<{ name: string; instagram?: string; company?: string; note?: string }>;
  staff?: Array<{ role: string; names: string; instagram?: string; company?: string }>;
  sessions?: PerformanceSession[];
}

// ============================================
// Performer 関連
// ============================================

export interface Performer {
  id: number;
  name: string;
  nameKana: string | null;
  performances?: {
    performanceId?: number;
    performance: Performance;
  }[];
  _count?: {
    performances: number;
    exchangeCodes: number;
  };
}

// ============================================
// ExchangeCode 関連
// ============================================

export interface ExchangeCode {
  id: number;
  code: string;
  performerId: number | null;
  performerName: string;
  performanceSessionId: number | null;
  performer: Performer | null;
  performanceSession?: PerformanceSession | null;
  isUsed: boolean;
  usedAt: string | null;
  orderId: number | null;
  createdAt: string;
  hasAttended: boolean;
  attendedAt: string | null;
}

export interface ExchangeCodeStats {
  total: number;
  used: number;
  unused: number;
  attended: number;
}

// ============================================
// Order & Ticket 関連
// ============================================

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

// ============================================
// News 関連
// ============================================

export interface News {
  id: number;
  title: string;
  content: string;
  publishedAt: Date;
  category: string | null;
}

// ============================================
// フォームデータ型
// ============================================

export interface PerformerFormData {
  name: string;
  nameKana: string;
  performanceIds: number[];
  codesPerSession: Record<number, number>;
}

export interface ExchangeCodeFormData {
  code: string;
  performerId: string;
  performanceIds: number[];
  codesPerSession: Record<number, number>;
}

export interface NewsFormData {
  title: string;
  content: string;
  category: string;
}

// ============================================
// バッチ操作データ型
// ============================================

export interface BatchGenerateData {
  performerId: string;
  performanceIds: number[];
  codesPerSession: Record<number, number>;
}

export interface CsvPerformerData {
  name: string;
  nameKana: string;
}
