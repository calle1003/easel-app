/**
 * Check-in ページの型定義
 */

export interface TicketInfo {
  id: number;
  ticketCode: string;
  ticketType: 'GENERAL' | 'RESERVED' | 'VIP1' | 'VIP2';
  isExchanged: boolean;
  isUsed: boolean;
  usedAt: string | null;
  order?: {
    id: number;
    customerName: string;
    performanceLabel: string;
  };
}

export interface Stats {
  totalCheckedIn: number;
  generalCheckedIn: number;
  reservedCheckedIn: number;
  vip1CheckedIn?: number;
  vip2CheckedIn?: number;
}

export type ScanStatus = 'idle' | 'scanning' | 'verified' | 'success' | 'error' | 'already-used';
