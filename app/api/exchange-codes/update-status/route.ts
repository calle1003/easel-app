import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: vol1を使用済み、vol2を未使用に更新
export async function POST(request: NextRequest) {
  try {
    // トランザクションで一括更新
    const result = await prisma.$transaction(async (tx) => {
      // vol1の引換券を使用済みに更新
      const vol1Updated = await tx.exchangeCode.updateMany({
        where: {
          code: {
            startsWith: 'vol1-',
          },
        },
        data: {
          isUsed: true,
          usedAt: new Date(), // 現在の日時を使用日として設定
        },
      });

      // vol2の引換券を未使用に更新
      const vol2Updated = await tx.exchangeCode.updateMany({
        where: {
          code: {
            startsWith: 'vol2-',
          },
        },
        data: {
          isUsed: false,
          usedAt: null,
        },
      });

      return {
        vol1Updated: vol1Updated.count,
        vol2Updated: vol2Updated.count,
      };
    });

    return NextResponse.json({
      success: true,
      vol1Updated: result.vol1Updated,
      vol2Updated: result.vol2Updated,
      message: `vol1: ${result.vol1Updated}件を使用済みに、vol2: ${result.vol2Updated}件を未使用に更新しました`,
    });
  } catch (error) {
    console.error('Update failed:', error);
    return NextResponse.json(
      { error: 'Update failed', details: String(error) },
      { status: 500 }
    );
  }
}
