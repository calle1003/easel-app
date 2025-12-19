/**
 * API レスポンス型定義
 * 
 * このファイルはAPIレスポンスの共通型を定義します。
 */

// ============================================
// 汎用APIレスポンス
// ============================================

export interface APIResponse<T> {
  data: T;
  error?: string;
}

export interface APIError {
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// 統計情報レスポンス
// ============================================

export interface StatsResponse {
  total: number;
  [key: string]: number | string;
}

export interface TicketStatsResponse {
  totalTickets: number;
  usedTickets: number;
  unusedTickets: number;
  generalTickets: number;
  reservedTickets: number;
  vip1Tickets: number;
  vip2Tickets: number;
}

export interface OrderStatsResponse {
  totalOrders: number;
  totalRevenue: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
}

// ============================================
// バッチ操作レスポンス
// ============================================

export interface BatchOperationResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{
    item: string;
    error: string;
  }>;
}
