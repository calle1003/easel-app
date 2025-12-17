import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleAuthResult } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

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

// POST: 出演者を一括登録
export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { performers, performanceIds, codesPerSession = {} } = body;

    if (!performers || !Array.isArray(performers) || performers.length === 0) {
      return NextResponse.json(
        { error: '出演者データが必要です' },
        { status: 400 }
      );
    }

    // 公演情報を取得（volを取得するため）
    let volume = 'vol1'; // デフォルト
    if (performanceIds && Array.isArray(performanceIds) && performanceIds.length > 0) {
      const firstPerformance = await prisma.performance.findUnique({
        where: { id: performanceIds[0] },
        select: { volume: true },
      });
      if (firstPerformance?.volume) {
        // ドットを削除
        volume = firstPerformance.volume.replace(/\./g, '');
      }
    }

    // トランザクションで一括登録
    const result = await prisma.$transaction(async (tx) => {
      const createdPerformers = [];
      let totalCodesCreated = 0;

      for (const performerData of performers) {
        const { name, nameKana } = performerData;

        if (!name) {
          continue; // 名前が空の場合はスキップ
        }

        // 出演者を作成
        const performer = await tx.performer.create({
          data: {
            name,
            nameKana: nameKana || null,
          },
        });

        createdPerformers.push(performer);

        // 公演との紐付けを作成
        if (performanceIds && Array.isArray(performanceIds) && performanceIds.length > 0) {
          const performancePerformers = performanceIds.map((performanceId: number, index: number) => ({
            performanceId,
            performerId: performer.id,
            displayOrder: index,
          }));

          await tx.performancePerformer.createMany({
            data: performancePerformers,
          });
        }

        // 引換券コードを自動生成（セッションごと）
        if (codesPerSession && Object.keys(codesPerSession).length > 0) {
          const exchangeCodes = [];
          
          // 各セッションごとにコードを生成
          for (const [sessionId, count] of Object.entries(codesPerSession)) {
            const codeCount = parseInt(count as string) || 0;
            
            for (let i = 0; i < codeCount; i++) {
              // ユニークなコードを生成（最大10回試行）
              let code = generateExchangeCode(volume);
              let attempts = 0;
              while (attempts < 10) {
                const existing = await tx.exchangeCode.findUnique({
                  where: { code },
                });
                if (!existing) break;
                code = generateExchangeCode(volume);
                attempts++;
              }
              
              exchangeCodes.push({
                code,
                performerId: performer.id,
                performerName: name,
                performanceSessionId: parseInt(sessionId),
              });
            }
          }

          if (exchangeCodes.length > 0) {
            await tx.exchangeCode.createMany({
              data: exchangeCodes,
              skipDuplicates: true,
            });

            totalCodesCreated += exchangeCodes.length;
          }
        }
      }

      return { performers: createdPerformers, totalCodes: totalCodesCreated };
    });

    return NextResponse.json(
      { 
        success: true, 
        count: result.performers.length,
        totalCodes: result.totalCodes,
        performers: result.performers,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to batch create performers', { error });
    return NextResponse.json(
      { error: '一括登録に失敗しました' },
      { status: 500 }
    );
  }
}
