import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: コードから「.」を削除
export async function POST(request: NextRequest) {
  try {
    // すべての引換券コードを取得
    const allCodes = await prisma.exchangeCode.findMany({
      where: {
        code: {
          contains: '.',
        },
      },
    });

    console.log(`Found ${allCodes.length} codes with dots`);

    let fixedCount = 0;

    // トランザクションで一括更新
    await prisma.$transaction(async (tx) => {
      for (const exchangeCode of allCodes) {
        const newCode = exchangeCode.code.replace(/\./g, '');
        
        // 新しいコードが既に存在するか確認
        const existing = await tx.exchangeCode.findUnique({
          where: { code: newCode },
        });

        if (existing) {
          console.log(`Skipping ${exchangeCode.code} - ${newCode} already exists`);
          continue;
        }

        // コードを更新
        await tx.exchangeCode.update({
          where: { id: exchangeCode.id },
          data: { code: newCode },
        });

        console.log(`Fixed: ${exchangeCode.code} -> ${newCode}`);
        fixedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      totalFound: allCodes.length,
      fixedCount,
      message: `${fixedCount}件のコードからドットを削除しました`,
    });
  } catch (error) {
    console.error('Fix failed:', error);
    return NextResponse.json(
      { error: 'Fix failed', details: String(error) },
      { status: 500 }
    );
  }
}
