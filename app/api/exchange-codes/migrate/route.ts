import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 引換券コード生成関数（英数字5桁のランダム文字列）
function generateRandomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 引換券コード生成（vol-xxxxx形式）
function generateExchangeCode(volume: string): string {
  const randomCode = generateRandomCode();
  return `${volume}-${randomCode}`;
}

// GET: 既存コードを新形式に移行
export async function POST(request: NextRequest) {
  try {
    // すべての引換券コードを取得
    const allCodes = await prisma.exchangeCode.findMany({
      include: {
        performer: {
          include: {
            performances: {
              include: {
                performance: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${allCodes.length} exchange codes to migrate`);

    let migratedCount = 0;
    const errors: Array<{ code: string; error: string }> = [];

    // トランザクションで一括更新
    await prisma.$transaction(async (tx) => {
      for (const exchangeCode of allCodes) {
        try {
          // volで始まる場合は既に新形式なのでスキップ
          if (exchangeCode.code.startsWith('vol')) {
            console.log(`Skipping already migrated code: ${exchangeCode.code}`);
            continue;
          }

          // 出演者の公演情報からvolumeを取得
          let volume = 'vol1'; // デフォルト
          if (exchangeCode.performer?.performances && exchangeCode.performer.performances.length > 0) {
            const firstPerformance = exchangeCode.performer.performances[0].performance;
            if (firstPerformance.volume) {
              volume = firstPerformance.volume;
            }
          }

          // 新しいコードを生成（ユニークになるまで）
          let newCode = generateExchangeCode(volume);
          let attempts = 0;
          while (attempts < 20) {
            const existing = await tx.exchangeCode.findUnique({
              where: { code: newCode },
            });
            if (!existing) break;
            newCode = generateExchangeCode(volume);
            attempts++;
          }

          if (attempts >= 20) {
            errors.push({ 
              code: exchangeCode.code, 
              error: 'Failed to generate unique code' 
            });
            continue;
          }

          // コードを更新
          await tx.exchangeCode.update({
            where: { id: exchangeCode.id },
            data: { code: newCode },
          });

          console.log(`Migrated: ${exchangeCode.code} -> ${newCode}`);
          migratedCount++;
        } catch (error) {
          console.error(`Error migrating code ${exchangeCode.code}:`, error);
          errors.push({ 
            code: exchangeCode.code, 
            error: String(error) 
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      totalCodes: allCodes.length,
      migratedCount,
      skippedCount: allCodes.length - migratedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
