import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin User
  const hashedPassword = await hashPassword('admin123');
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@easel.jp' },
    update: {},
    create: {
      email: 'admin@easel.jp',
      password: hashedPassword,
      name: '管理者',
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);
  console.log('   Email: admin@easel.jp');
  console.log('   Password: admin123');

  // News
  const existingNewsCount = await prisma.news.count();
  if (existingNewsCount === 0) {
    const newsData = [
      {
        title: 'easel live vol.2 チケット販売開始のお知らせ',
        content: `いつもeaselを応援いただきありがとうございます。

このたび、easel live vol.2のチケット販売を開始いたしました。

公演日程：2025年○月○日（○）〜○月○日（○）
会場：○○劇場
チケット料金：¥4,000（全席自由・税込）

皆様のご来場を心よりお待ちしております。`,
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1日前
        category: '公演情報',
      },
      {
        title: '新メンバー加入のお知らせ',
        content: `easelに新たなメンバーが加わりました。

今後の活動にもご期待ください。
詳細はABOUTページをご覧ください。`,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7日前
        category: 'お知らせ',
      },
      {
        title: '公式サイト開設のお知らせ',
        content: `easelの公式サイトを開設いたしました。

このサイトでは、公演情報やニュース、グッズ販売など、
easelに関する最新情報をお届けしてまいります。

今後とも、easelをよろしくお願いいたします。`,
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14日前
        category: 'お知らせ',
      },
    ];

    await prisma.news.createMany({
      data: newsData,
    });
    console.log('✅ Created news:', newsData.length);
  } else {
    console.log('⏭️  News already exists, skipping...');
  }

  // Exchange Codes
  const exchangeCodes = [
    { code: 'TEST001', performerName: '山田太郎' },
    { code: 'TEST002', performerName: '山田太郎' },
    { code: 'TEST003', performerName: '鈴木花子' },
    { code: 'ABC123', performerName: '佐藤一郎' },
    { code: 'XYZ789', performerName: '田中美咲' },
  ];

  for (const codeData of exchangeCodes) {
    await prisma.exchangeCode.upsert({
      where: { code: codeData.code },
      update: {},
      create: codeData,
    });
  }
  console.log('✅ Created exchange codes:', exchangeCodes.length);
  console.log('   TEST001, TEST002 - 山田太郎');
  console.log('   TEST003 - 鈴木花子');
  console.log('   ABC123 - 佐藤一郎');
  console.log('   XYZ789 - 田中美咲');

  // Performance (Vol.2) - 3公演
  const now = new Date();
  const saleStartAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7日前

  const targetPerformances = [
    {
      title: 'easel live vol.2',
      volume: 'vol.2',
      performanceDate: new Date('2025-01-01'),
      performanceTime: new Date('1970-01-01T14:00:00'),
      doorsOpenTime: new Date('1970-01-01T13:30:00'),
      venueName: '○○劇場',
      venueAddress: '東京都○○区○○1-2-3',
      generalPrice: 4500,
      reservedPrice: 5500,
      generalCapacity: 100,
      reservedCapacity: 30,
      saleStatus: 'ON_SALE' as const,
      saleStartAt: saleStartAt,
      description: 'easel live vol.2 新春特別公演',
    },
    {
      title: 'easel live vol.2',
      volume: 'vol.2',
      performanceDate: new Date('2025-01-01'),
      performanceTime: new Date('1970-01-01T18:00:00'),
      doorsOpenTime: new Date('1970-01-01T17:30:00'),
      venueName: '○○劇場',
      venueAddress: '東京都○○区○○1-2-3',
      generalPrice: 4500,
      reservedPrice: 5500,
      generalCapacity: 100,
      reservedCapacity: 30,
      saleStatus: 'ON_SALE' as const,
      saleStartAt: saleStartAt,
      description: 'easel live vol.2 新春特別公演（夜の部）',
    },
    {
      title: 'easel live vol.2',
      volume: 'vol.2',
      performanceDate: new Date('2025-01-02'),
      performanceTime: new Date('1970-01-01T14:00:00'),
      doorsOpenTime: new Date('1970-01-01T13:30:00'),
      venueName: '○○劇場',
      venueAddress: '東京都○○区○○1-2-3',
      generalPrice: 4500,
      reservedPrice: 5500,
      generalCapacity: 100,
      reservedCapacity: 30,
      saleStatus: 'ON_SALE' as const,
      saleStartAt: saleStartAt,
      description: 'easel live vol.2 新春特別公演（千秋楽）',
    },
  ];

  // vol.2の既存公演を確認
  const existingVol2Performances = await prisma.performance.findMany({
    where: { volume: 'vol.2' },
  });

  let createdCount = 0;
  for (const perfData of targetPerformances) {
    // 同じ日時・同じvolumeの公演が既に存在するか確認
    const exists = existingVol2Performances.some(
      (p) =>
        p.volume === perfData.volume &&
        p.performanceDate.getTime() === perfData.performanceDate.getTime() &&
        p.performanceTime.getTime() === perfData.performanceTime.getTime()
    );

    if (!exists) {
      await prisma.performance.create({
        data: perfData,
      });
      createdCount++;
    }
  }

  if (createdCount > 0) {
    console.log('✅ Created performances:', createdCount);
    console.log('   vol.2 - 2025/1/1 14:00 (販売中)');
    console.log('   vol.2 - 2025/1/1 18:00 (販売中)');
    console.log('   vol.2 - 2025/1/2 14:00 (販売中)');
  } else {
    console.log('⏭️  All vol.2 performances already exist, skipping...');
  }

  // 既存の引換券コード（出演者に紐づくもの）を削除
  console.log('🗑️  Deleting existing exchange codes with performers...');
  const deletedExchangeCodes = await prisma.exchangeCode.deleteMany({
    where: {
      performerId: { not: null },
    },
  });
  console.log(`   Deleted ${deletedExchangeCodes.count} exchange codes`);

  // 既存の出演者-公演の紐付けを削除
  console.log('🗑️  Deleting existing performance-performer links...');
  const deletedLinks = await prisma.performancePerformer.deleteMany({});
  console.log(`   Deleted ${deletedLinks.count} links`);

  // 既存の出演者を削除
  console.log('🗑️  Deleting existing performers...');
  const deletedPerformers = await prisma.performer.deleteMany({});
  console.log(`   Deleted ${deletedPerformers.count} performers`);

  // 出演者を作成
  console.log('👥 Creating performers...');
  const performerNames = [
    { name: '山田太郎', kana: 'やまだたろう' },
    { name: '佐藤花子', kana: 'さとうはなこ' },
    { name: '鈴木一郎', kana: 'すずきいちろう' },
    { name: '高橋美咲', kana: 'たかはしみさき' },
    { name: '田中健太', kana: 'たなかけんた' },
    { name: '伊藤あやか', kana: 'いとうあやか' },
    { name: '渡辺翔太', kana: 'わたなべしょうた' },
    { name: '中村さくら', kana: 'なかむらさくら' },
    { name: '小林大輔', kana: 'こばやしだいすけ' },
    { name: '加藤結衣', kana: 'かとうゆい' },
  ];

  const performers = [];
  for (const performerData of performerNames) {
    const performer = await prisma.performer.create({
      data: {
        name: performerData.name,
        nameKana: performerData.kana,
      },
    });
    performers.push(performer);
  }
  console.log(`✅ Created ${performers.length} performers`);

  // 公演を取得
  const performances = await prisma.performance.findMany();
  
  if (performances.length > 0 && performers.length > 0) {
    // 出演者と公演を関連付け
    console.log('🔗 Linking performers to performances...');
    let linkCount = 0;
    for (let i = 0; i < performers.length; i++) {
      const performer = performers[i];
      // 各出演者を1〜3つの公演に割り当て
      const performanceCount = Math.min(Math.floor(Math.random() * 3) + 1, performances.length);
      const selectedPerformances = performances
        .sort(() => Math.random() - 0.5)
        .slice(0, performanceCount);

      for (let j = 0; j < selectedPerformances.length; j++) {
        const performance = selectedPerformances[j];
        await prisma.performancePerformer.create({
          data: {
            performanceId: performance.id,
            performerId: performer.id,
            displayOrder: j,
          },
        });
        linkCount++;
      }
    }
    console.log(`✅ Created ${linkCount} performance-performer links`);
  }

  // 引換券コードを作成（各出演者に3件ずつ、合計30件）
  console.log('🎫 Creating exchange codes...');
  const exchangeCodesToCreate = [];
  for (const performer of performers) {
    for (let i = 0; i < 3; i++) {
      const timestamp = Date.now() + i;
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const prefix = performer.name.substring(0, 2);
      const code = `${prefix}${timestamp}${random}`;
      
      exchangeCodesToCreate.push({
        code: code,
        performerId: performer.id,
        performerName: performer.name,
        isUsed: Math.random() > 0.7, // 30%の確率で使用済み
        usedAt: Math.random() > 0.7 ? new Date() : null,
      });
    }
  }

  await prisma.exchangeCode.createMany({
    data: exchangeCodesToCreate,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${exchangeCodesToCreate.length} exchange codes`)

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
