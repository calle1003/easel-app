import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 一時的なAPI: 既存の重複したPerformanceを統合する
 */
export async function POST() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // すべてのPerformanceとそのSessionsを取得
      const allPerformances = await tx.performance.findMany({
        include: { sessions: true, performers: true }
      });

      console.log(`Found ${allPerformances.length} performances`);

      // volumeごとにグループ化
      const groupedByVolume = allPerformances.reduce((acc, perf) => {
        const key = perf.volume || 'no_volume';
        if (!acc[key]) acc[key] = [];
        acc[key].push(perf);
        return acc;
      }, {} as Record<string, typeof allPerformances>);

      const consolidated = [];

      for (const [volume, perfs] of Object.entries(groupedByVolume)) {
        if (perfs.length === 1) {
          console.log(`Volume ${volume}: Already consolidated (1 performance)`);
          consolidated.push(perfs[0]);
          continue;
        }

        console.log(`Volume ${volume}: Consolidating ${perfs.length} performances`);

        // 最初のPerformanceを代表として残す
        const mainPerformance = perfs[0];
        const otherPerformances = perfs.slice(1);

        // 他のPerformanceのSessionsを代表Performanceに移行
        for (const perf of otherPerformances) {
          for (const session of perf.sessions) {
            await tx.performanceSession.update({
              where: { id: session.id },
              data: { performanceId: mainPerformance.id }
            });
            console.log(`  Moved session ${session.id} to performance ${mainPerformance.id}`);
          }

          // 他のPerformanceのPerformersを代表Performanceに移行
          for (const perfPerformer of perf.performers) {
            // 既に同じperformerが存在するかチェック
            const existing = await tx.performancePerformer.findFirst({
              where: {
                performanceId: mainPerformance.id,
                performerId: perfPerformer.performerId
              }
            });

            if (!existing) {
              await tx.performancePerformer.create({
                data: {
                  performanceId: mainPerformance.id,
                  performerId: perfPerformer.performerId,
                  role: perfPerformer.role,
                  displayOrder: perfPerformer.displayOrder
                }
              });
              console.log(`  Moved performer ${perfPerformer.performerId} to performance ${mainPerformance.id}`);
            }
          }

          // 古いPerformanceのPerformersを削除
          await tx.performancePerformer.deleteMany({
            where: { performanceId: perf.id }
          });

          // 古いPerformanceを削除
          await tx.performance.delete({
            where: { id: perf.id }
          });
          console.log(`  Deleted performance ${perf.id}`);
        }

        consolidated.push(mainPerformance);
      }

      return {
        success: true,
        before: allPerformances.length,
        after: consolidated.length,
        consolidated: consolidated.map(p => ({
          id: p.id,
          title: p.title,
          volume: p.volume,
          sessionCount: p.sessions.length
        }))
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to consolidate performances:', error);
    return NextResponse.json(
      { error: 'Failed to consolidate performances', details: error },
      { status: 500 }
    );
  }
}
