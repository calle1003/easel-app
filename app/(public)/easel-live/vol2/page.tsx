import Link from 'next/link';
import { prisma } from '@/lib/prisma';

function formatDate(date: Date) {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPerformanceLabel(performance: any) {
  const date = new Date(performance.performanceDate);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const time = formatTime(performance.performanceTime);
  const doorsTime = performance.doorsOpenTime ? formatTime(performance.doorsOpenTime) : null;
  
  return {
    dateLabel: `${year}年${month}月${day}日（${weekday}）`,
    timeLabel: doorsTime ? `開場 ${doorsTime} / 開演 ${time}` : `開演 ${time}`,
  };
}

export default async function Vol2DetailPage() {
  const performances = await prisma.performance.findMany({
    where: { volume: 'vol.2' },
    orderBy: [
      { performanceDate: 'asc' },
      { performanceTime: 'asc' },
    ],
  });

  // 最初の公演を代表として使用（フライヤー、会場、価格など）
  const representativePerformance = performances[0] || null;

  return (
    <div>
      {/* Hero */}
      <section className="min-h-[300px] flex flex-col justify-center px-6 bg-warm-50">
        <div className="max-w-3xl mx-auto w-full">
          <nav className="mb-3">
            <Link href="/easel-live" className="text-xs tracking-wider text-slate-400 hover:text-slate-600 transition-colors">
              easel live
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-xs tracking-wider text-slate-500">Vol.2</span>
          </nav>
          <div className="text-center">
            <p className="section-subtitle mb-4">easel live</p>
            <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.2em] text-slate-800">
              VOL.2
            </h1>
          </div>
        </div>
      </section>

      {/* Flyer */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-md mx-auto">
          <h2 className="section-title mb-10 text-center">Flyer</h2>
          {representativePerformance?.flyerImageUrl ? (
            <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden">
              <img
                src={representativePerformance.flyerImageUrl}
                alt={representativePerformance.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[3/4] bg-slate-100 rounded-lg flex items-center justify-center">
              <p className="text-slate-300 text-sm tracking-wider">Coming Soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Date */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title mb-10 text-center">Date</h2>
          {performances.length > 0 ? (
            <div className="space-y-6">
              {performances.map((perf, index) => {
                const { dateLabel, timeLabel } = formatPerformanceLabel(perf);
                return (
                  <div
                    key={perf.id}
                    className={`text-center ${
                      index < performances.length - 1 ? 'border-b border-slate-100 pb-6' : ''
                    }`}
                  >
                    <p className="font-serif text-lg text-slate-700 mb-2">{dateLabel}</p>
                    <p className="text-sm text-slate-500">{timeLabel}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p>Coming Soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Place */}
      <section className="py-20 px-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title mb-10">Place</h2>
          {representativePerformance ? (
            <div className="text-slate-600">
              <p className="text-lg mb-2">{representativePerformance.venueName}</p>
              {representativePerformance.venueAddress && (
                <p className="text-sm text-slate-400 mb-2">{representativePerformance.venueAddress}</p>
              )}
              {representativePerformance.venueAccess && (
                <p className="text-sm text-slate-400">{representativePerformance.venueAccess}</p>
              )}
            </div>
          ) : (
            <div className="text-slate-400">
              <p>Coming Soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Price & Ticket */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title mb-10">Ticket</h2>
          {representativePerformance ? (
            <>
              <div className="mb-10 space-y-4">
                <div>
                  <p className="text-slate-600">一般席: ¥{representativePerformance.generalPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-600">指定席: ¥{representativePerformance.reservedPrice.toLocaleString()}</p>
                </div>
              </div>
              {representativePerformance.saleStatus === 'ON_SALE' && (
                <Link href="/ticket" className="btn-primary">
                  チケットを購入する
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="mb-10">
                <p className="text-slate-400 mb-6">Coming Soon</p>
              </div>
              <Link href="/ticket" className="btn-primary">
                チケットを購入する
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Description */}
      {representativePerformance?.description && (
        <section className="py-20 px-6 bg-slate-50/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="section-title mb-10 text-center">About</h2>
            <div className="text-center text-slate-600 leading-loose whitespace-pre-line">
              {representativePerformance.description}
            </div>
          </div>
        </section>
      )}

      {/* Painter */}
      <section className="py-20 px-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title mb-10 text-center">Painter</h2>
          <div className="text-center text-slate-400">
            <p>Coming Soon</p>
          </div>
        </div>
      </section>

      {/* Choreographer */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title mb-10 text-center">Choreographer</h2>
          <div className="text-center text-slate-400">
            <p>Coming Soon</p>
          </div>
        </div>
      </section>

      {/* Navigator & Guest */}
      <section className="py-20 px-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
            <div>
              <h2 className="text-xs tracking-wider text-slate-400 uppercase mb-6">Navigator</h2>
              <p className="text-slate-400">Coming Soon</p>
            </div>
            <div>
              <h2 className="text-xs tracking-wider text-slate-400 uppercase mb-6">Guest Dancer</h2>
              <p className="text-slate-400">Coming Soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Staff */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title mb-10 text-center">Staff</h2>
          <div className="text-center text-slate-400">
            <p>Coming Soon</p>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 px-6 bg-slate-50/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="section-title mb-10">Photo Gallery</h2>
          <p className="text-slate-400">Coming Soon</p>
        </div>
      </section>
    </div>
  );
}
