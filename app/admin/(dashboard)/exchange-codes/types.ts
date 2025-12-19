/**
 * Exchange Codes ページの型定義
 */

export interface PerformanceSession {
  id: number;
  showNumber: number;
  performanceDate: string;
  performanceTime: string;
  venueName: string;
  saleStatus: string;
}

export interface Performance {
  id: number;
  title: string;
  volume: string | null;
  performanceDate: string;
  performanceTime: string;
  sessions?: PerformanceSession[];
}

export interface Performer {
  id: number;
  name: string;
  nameKana: string | null;
  performances?: {
    performance: Performance;
  }[];
}

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

export interface ExchangeCodeFormData {
  code: string;
  performerId: string;
  performanceIds: number[];
  codesPerSession: Record<number, number>;
}

export interface BatchGenerateData {
  performerId: string;
  performanceIds: number[];
  codesPerSession: Record<number, number>;
}

export interface ExchangeCodeStats {
  total: number;
  used: number;
  unused: number;
  attended: number;
}
