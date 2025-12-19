export interface Performance {
  id: number;
  title: string;
  volume: string;
  performanceDate: string; // ISO string from API
  performanceTime: string; // ISO string from API
  doorsOpenTime: string | null; // ISO string from API
  venueName: string;
  generalPrice: number;
  reservedPrice: number;
  vip1Price: number | null;
  vip2Price: number | null;
  vip1Note: string | null;
  vip2Note: string | null;
  generalCapacity: number;
  generalSold: number;
  reservedCapacity: number;
  reservedSold: number;
  vip1Capacity: number;
  vip1Sold: number;
  vip2Capacity: number;
  vip2Sold: number;
}

export interface PerformanceSession {
  id: number;
  showNumber: number;
  performanceDate: string;
  performanceTime: string;
  venueName: string;
  performance: {
    id: number;
    title: string;
    volume: string;
  };
}

export interface CodeValidationResult {
  code: string;
  valid: boolean;
  used: boolean;
  performerName?: string;
  performanceSession?: PerformanceSession | null;
}

export interface TicketQuantities {
  general: number;
  reserved: number;
  vip1: number;
  vip2: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  performanceId: string;
}

export type TicketType = 'general' | 'reserved' | 'vip1' | 'vip2';

