import { prisma } from '@/lib/prisma';

export interface PerformanceWithSessions {
  id: number;
  title: string;
  volume: string | null;
  isOnSale: boolean;
  sessions: {
    performanceDate: Date;
  }[];
}

/**
 * 販売中の公演一覧を取得
 * @returns 販売中の公演配列
 */
export async function getOnSalePerformances(): Promise<
  PerformanceWithSessions[]
> {
  try {
    const performances = await prisma.performance.findMany({
      where: { isOnSale: true },
      select: {
        id: true,
        title: true,
        volume: true,
        isOnSale: true,
        sessions: {
          select: {
            performanceDate: true,
          },
          orderBy: {
            performanceDate: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return performances;
  } catch (error) {
    console.error('Failed to fetch on-sale performances:', error);
    return [];
  }
}

/**
 * 全公演一覧を取得（アーカイブページ用）
 * @returns 全公演配列
 */
export async function getAllPerformances(): Promise<
  PerformanceWithSessions[]
> {
  try {
    const performances = await prisma.performance.findMany({
      select: {
        id: true,
        title: true,
        volume: true,
        isOnSale: true,
        sessions: {
          select: {
            performanceDate: true,
          },
          orderBy: {
            performanceDate: 'asc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return performances;
  } catch (error) {
    console.error('Failed to fetch performances:', error);
    return [];
  }
}

