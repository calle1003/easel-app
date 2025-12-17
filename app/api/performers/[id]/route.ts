import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleAuthResult } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

// GET: 出演者詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 管理者認証チェック
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;

  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const performer = await prisma.performer.findUnique({
      where: { id },
      include: {
        performances: {
          include: {
            performance: true,
          },
        },
        _count: {
          select: {
            exchangeCodes: true,
          },
        },
      },
    });

    if (!performer) {
      return NextResponse.json(
        { error: 'Performer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(performer);
  } catch (error) {
    logger.error('Failed to fetch performer', { error });
    return NextResponse.json(
      { error: 'Failed to fetch performer' },
      { status: 500 }
    );
  }
}

// PUT: 出演者を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 管理者認証チェック
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;

  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { name, nameKana, performanceIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const performer = await prisma.performer.update({
      where: { id },
      data: {
        name,
        nameKana: nameKana || null,
      },
    });

    // 既存の公演紐付けを削除
    await prisma.performancePerformer.deleteMany({
      where: { performerId: id },
    });

    // 新しい公演紐付けを作成
    if (performanceIds && Array.isArray(performanceIds) && performanceIds.length > 0) {
      const performancePerformers = performanceIds.map((performanceId: number, index: number) => ({
        performanceId,
        performerId: id,
        displayOrder: index,
      }));

      await prisma.performancePerformer.createMany({
        data: performancePerformers,
      });
    }

    return NextResponse.json(performer);
  } catch (error) {
    logger.error('Failed to update performer', { error });
    return NextResponse.json(
      { error: 'Failed to update performer' },
      { status: 500 }
    );
  }
}

// DELETE: 出演者を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 管理者認証チェック
  const auth = await requireAdmin(request);
  const authError = handleAuthResult(auth);
  if (authError) return authError;

  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    // 引換券コードが紐づいているか確認
    const exchangeCodeCount = await prisma.exchangeCode.count({
      where: { performerId: id },
    });

    if (exchangeCodeCount > 0) {
      return NextResponse.json(
        { error: 'この出演者には引換券コードが紐づいているため削除できません' },
        { status: 400 }
      );
    }

    await prisma.performer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete performer', { error });
    return NextResponse.json(
      { error: 'Failed to delete performer' },
      { status: 500 }
    );
  }
}
