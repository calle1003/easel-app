/**
 * Performers ページの型定義
 */

export interface PerformanceSession {
  id: number;
  showNumber: number;
  performanceDate: string;
  performanceTime: string;
  venueName: string;
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
    performanceId: number;
    performance: Performance;
  }[];
  _count: {
    performances: number;
    exchangeCodes: number;
  };
}

export interface PerformerFormData {
  name: string;
  nameKana: string;
  performanceIds: number[];
  codesPerSession: Record<number, number>;
}

export interface CsvPerformerData {
  name: string;
  nameKana: string;
}
