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

// GET: 出演者一覧を取得
export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;

  try {
    const performers = await prisma.performer.findMany({
      orderBy: { nameKana: 'asc' },
      include: {
        performances: {
          include: {
            performance: true,
          },
        },
        _count: {
          select: {
            performances: true,
            exchangeCodes: true,
          },
        },
      },
    });

    return NextResponse.json(performers);
  } catch (error) {
    logger.error('Failed to fetch performers', { error });
    return NextResponse.json(
      { error: 'Failed to fetch performers' },
      { status: 500 }
    );
  }
}

// POST: 新規出演者を作成
export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, nameKana, performanceIds, codesPerSession = {} } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
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

    // トランザクションで実行
    const result = await prisma.$transaction(async (tx) => {
      // 出演者を作成
      const performer = await tx.performer.create({
        data: {
          name,
          nameKana: nameKana || null,
        },
      });

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
      let totalCodesCreated = 0;
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

          totalCodesCreated = exchangeCodes.length;
        }
      }

      return { performer, totalCodesCreated };
    });

    return NextResponse.json(
      { 
        ...result.performer, 
        totalCodesCreated: result.totalCodesCreated 
      }, 
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create performer', { error });
    return NextResponse.json(
      { error: 'Failed to create performer' },
      { status: 500 }
    );
  }
}
