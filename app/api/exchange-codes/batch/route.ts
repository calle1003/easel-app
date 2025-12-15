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

export async function POST(request: NextRequest) {
  try {
    const { performerId, codesPerSession = {} } = await request.json();

    if (!performerId) {
      return NextResponse.json(
        { error: 'Performer is required' },
        { status: 400 }
      );
    }

    if (!codesPerSession || Object.keys(codesPerSession).length === 0) {
      return NextResponse.json(
        { error: 'Codes per session is required' },
        { status: 400 }
      );
    }

    // Get performer with performances to get volume
    const performer = await prisma.performer.findUnique({
      where: { id: parseInt(performerId) },
      include: {
        performances: {
          include: {
            performance: true,
          },
          take: 1,
        },
      },
    });

    if (!performer) {
      return NextResponse.json(
        { error: '出演者が見つかりません' },
        { status: 400 }
      );
    }

    // Get volume from first performance, default to 'vol1'
    let volume = 'vol1';
    if (performer.performances.length > 0 && performer.performances[0].performance.volume) {
      // ドットを削除
      volume = performer.performances[0].performance.volume.replace(/\./g, '');
    }

    const codes = [];
    
    // 各セッションごとにコードを生成
    for (const [sessionId, count] of Object.entries(codesPerSession)) {
      const codeCount = parseInt(count as string) || 0;
      
      for (let i = 0; i < codeCount; i++) {
        // Generate unique code
        let code = generateExchangeCode(volume);
        let attempts = 0;
        while (attempts < 10) {
          const existing = await prisma.exchangeCode.findUnique({
            where: { code },
          });
          if (!existing) break;
          code = generateExchangeCode(volume);
          attempts++;
        }

        codes.push({
          code: code,
          performerId: parseInt(performerId),
          performerName: performer.name,
          performanceSessionId: parseInt(sessionId),
        });
      }
    }

    if (codes.length === 0) {
      return NextResponse.json(
        { error: 'No codes to generate' },
        { status: 400 }
      );
    }

    const created = await prisma.exchangeCode.createMany({
      data: codes,
    });

    return NextResponse.json({
      success: true,
      count: created.count,
    });
  } catch (error) {
    console.error('Failed to create batch exchange codes:', error);
    return NextResponse.json(
      { error: 'Failed to create exchange codes' },
      { status: 500 }
    );
  }
}
