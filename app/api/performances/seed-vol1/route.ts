import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // 既存のvol1データを削除
    const existingVol1 = await prisma.performance.findFirst({
      where: { volume: 'vol1' },
    });

    if (existingVol1) {
      await prisma.performance.delete({
        where: { id: existingVol1.id },
      });
    }

    // vol1データを作成
    const performance = await prisma.performance.create({
      data: {
        title: 'easel live vol.1',
        volume: 'vol1',
        isOnSale: false,
        generalPrice: 4500,
        reservedPrice: 5500,
        description: null,
        flyerImages: [
          { url: '/easelLiveVol1/easel_live_vol1_flyer_IguchiMaiko.jpg', name: '井口舞子' },
          { url: '/easelLiveVol1/easel_live_vol1_flyer_KikuchiTakumi.jpg', name: '菊地匠' },
          { url: '/easelLiveVol1/easel_live_vol1_flyer_MatsumuraSaki.jpg', name: '松村咲希' },
        ],
        painters: [
          { name: '井口舞子', instagram: '@maiko_iguchi' },
          { name: '菊地匠', instagram: '@kikuchi_.takumi' },
          { name: '松村咲希', instagram: '@sakimatsumura_' },
        ],
        choreographers: [
          { name: '燦', instagram: '@aki_5651' },
          { name: '池上直子', instagram: '@naoko.ikegami', company: 'Dance Marché' },
          { name: '伊藤蘭', instagram: '@ran_itoh.airamonea', company: 'Dance Company MKMDC' },
          { name: '井上菜々子', instagram: '@naaako_02.28' },
          { name: '関口佳絵', instagram: '@seki_.0._44a' },
          { name: 'たむ', instagram: '@tamtam0624' },
          { name: '森政博', instagram: '@passosupremori' },
          { name: 'DaHLia × Mag', instagram: '@yumiho___ @___isono @kami_kke @sugitaaaa_' },
          { name: 'dayo', instagram: '@dayo._.dayo' },
          { name: 'Hashimi!i!i!', instagram: '@hashim.i.i.i' },
          { name: 'JURI', instagram: '@jurrrrii' },
          { name: 'miotchery', instagram: '@miotchery', company: 'Dance Company MKMDC' },
        ],
        navigators: [
          { name: '下田麻美' },
        ],
        guestDancers: [
          { 
            name: 'YOH UENO', 
            company: 'KEMURI',
            instagram: '@yoh_ueno.kemuri',
          },
        ],
        staff: [
          { role: '企画・運営', name: 'easel（岡嶋秀介、古川理奈）' },
          { role: '広報', name: '関根舞' },
          { role: 'デザイン', name: 'Ricky', instagram: '@ricky__56' },
          { role: '制作', name: '株式会社HIDE&SEEK', instagram: '@hideandseek2012' },
        ],
        sessions: {
          create: [
            {
              showNumber: 1,
              performanceDate: new Date('2025-05-10'),
              performanceTime: new Date('1970-01-01T17:50:00'),
              doorsOpenTime: new Date('1970-01-01T17:00:00'),
              venueName: 'IMAホール',
              venueAddress: '東京都練馬区光が丘5-1-1 光が丘IMA中央館4F',
              venueAccess: '最寄り：都営地下鉄大江戸線 光が丘駅',
              generalCapacity: 100,
              reservedCapacity: 30,
              generalSold: 0,
              reservedSold: 0,
              saleStatus: 'NOT_ON_SALE',
            },
            {
              showNumber: 2,
              performanceDate: new Date('2025-05-11'),
              performanceTime: new Date('1970-01-01T12:00:00'),
              doorsOpenTime: new Date('1970-01-01T11:00:00'),
              venueName: 'IMAホール',
              venueAddress: '東京都練馬区光が丘5-1-1 光が丘IMA中央館4F',
              venueAccess: '最寄り：都営地下鉄大江戸線 光が丘駅',
              generalCapacity: 100,
              reservedCapacity: 30,
              generalSold: 0,
              reservedSold: 0,
              saleStatus: 'NOT_ON_SALE',
            },
            {
              showNumber: 3,
              performanceDate: new Date('2025-05-11'),
              performanceTime: new Date('1970-01-01T16:00:00'),
              doorsOpenTime: new Date('1970-01-01T15:00:00'),
              venueName: 'IMAホール',
              venueAddress: '東京都練馬区光が丘5-1-1 光が丘IMA中央館4F',
              venueAccess: '最寄り：都営地下鉄大江戸線 光が丘駅',
              generalCapacity: 100,
              reservedCapacity: 30,
              generalSold: 0,
              reservedSold: 0,
              saleStatus: 'NOT_ON_SALE',
            },
          ],
        },
      },
      include: {
        sessions: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'vol1データを登録しました',
      performance: {
        id: performance.id,
        title: performance.title,
        volume: performance.volume,
        sessions: performance.sessions.length,
      },
    });
  } catch (error) {
    console.error('Failed to seed vol1 data:', error);
    return NextResponse.json(
      { error: 'Failed to seed vol1 data', details: error },
      { status: 500 }
    );
  }
}
