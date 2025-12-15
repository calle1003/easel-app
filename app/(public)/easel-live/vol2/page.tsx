import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { FlyerCarousel } from '../FlyerCarousel';

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
  const performance: any = await prisma.performance.findFirst({
    where: { volume: 'vol2' },
    // @ts-ignore
    include: {
      sessions: {
        orderBy: {
          performanceDate: 'asc',
        },
      },
    },
  });

  const representativeSession = performance?.sessions?.[0] || null;
  const flyers = (performance?.flyerImages as any) || [];

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
            <div className="flex items-center justify-center gap-3 mb-4">
              <p className="section-subtitle">easel live</p>
              {performance?.isOnSale && (
                <span className="px-3 py-1 text-xs font-medium tracking-wider text-green-700 bg-green-100 rounded-full">
                  NOW ON SALE
                </span>
              )}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.2em] text-slate-800">
              VOL.2
            </h1>
          </div>
        </div>
      </section>

      {/* Sticky Ticket Button */}
      {performance?.isOnSale && (
        <section className="sticky top-20 z-40 py-4 px-6 bg-white/98 backdrop-blur-sm border-b border-slate-100">
          <div className="max-w-3xl mx-auto text-center">
            <Link 
              href="/ticket" 
              className="inline-block px-10 py-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-all duration-300 tracking-wider text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              チケットを購入する
            </Link>
          </div>
        </section>
      )}

      {/* Flyer */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-md mx-auto">
          <h2 className="section-title mb-10 text-center">Flyer</h2>
          <FlyerCarousel flyers={flyers} />
        </div>
      </section>

      {/* Date */}
      <section className="py-20 px-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title mb-10 text-center">Date</h2>
          {performance?.sessions && performance.sessions.length > 0 ? (
            <div className="space-y-6">
              {performance.sessions.map((session: any, index: number) => {
                const { dateLabel, timeLabel } = formatPerformanceLabel(session);
                return (
                  <div
                    key={session.id}
                    className={`text-center ${
                      index < performance.sessions.length - 1 ? 'border-b border-slate-100 pb-6' : ''
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
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title mb-10">Place</h2>
          {representativeSession ? (
            <div className="text-slate-600">
              <p className="text-lg mb-2">{representativeSession.venueName}</p>
              {representativeSession.venueAddress && (
                <p className="text-sm text-slate-400 mb-2">{representativeSession.venueAddress}</p>
              )}
              {representativeSession.venueAccess && (
                <p className="text-sm text-slate-400">{representativeSession.venueAccess}</p>
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
      <section className="py-20 px-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title mb-10">Ticket</h2>
          {performance ? (
            <div className="space-y-4">
              <div>
                <p className="text-slate-600">一般席: ¥{performance.generalPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-600">指定席: ¥{performance.reservedPrice.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-slate-400 mb-6">Coming Soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Description */}
      {performance?.description && (
        <section className="py-20 px-6 bg-slate-50/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="section-title mb-10 text-center">About</h2>
            <div className="text-center text-slate-600 leading-loose whitespace-pre-line">
              {performance.description}
            </div>
          </div>
        </section>
      )}

      {/* Painter */}
      <section className="py-20 px-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title mb-10 text-center">Painter</h2>
          {performance?.painters && (performance.painters as any).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {(performance.painters as any).map((painter: any, index: number) => (
                <div key={index} className="p-6">
                  <p className="font-serif text-lg text-slate-700 mb-1">{painter.name}</p>
                  {painter.instagram && (
                    <a
                      href={`https://instagram.com/${painter.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {painter.instagram.startsWith('@') ? painter.instagram : `@${painter.instagram}`}
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p>Coming Soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Choreographer */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title mb-10 text-center">Choreographer</h2>
          {performance?.choreographers && (performance.choreographers as any).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(performance.choreographers as any).map((choreo: any, index: number) => (
                <div key={index} className="p-4 text-center">
                  <p className="font-serif text-slate-700 mb-1">{choreo.name}</p>
                  {choreo.company && (
                    <p className="text-xs text-slate-500 mb-1">{choreo.company}</p>
                  )}
                  {choreo.instagram && (
                    <a
                      href={`https://instagram.com/${choreo.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {choreo.instagram.startsWith('@') ? choreo.instagram : `@${choreo.instagram}`}
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p>Coming Soon</p>
            </div>
          )}
          {performance?.choreographers && (performance.choreographers as any).length > 0 && (
            <p className="text-center text-sm text-slate-400 mt-6">*順不同</p>
          )}
        </div>
      </section>

      {/* Navigator & Guest */}
      <section className="py-20 px-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
            <div>
              <h2 className="text-xs tracking-wider text-slate-400 uppercase mb-6">Navigator</h2>
              {performance?.navigators && (performance.navigators as any).length > 0 ? (
                <div className="space-y-4">
                  {(performance.navigators as any).map((nav: any, index: number) => (
                    <div key={index}>
                      <p className="font-serif text-xl text-slate-700 mb-2">{nav.name}</p>
                      {nav.company && <p className="text-sm text-slate-500 mb-1">{nav.company}</p>}
                      {nav.instagram && (
                        <a
                          href={`https://instagram.com/${nav.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {nav.instagram.startsWith('@') ? nav.instagram : `@${nav.instagram}`}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">Coming Soon</p>
              )}
            </div>
            <div>
              <h2 className="text-xs tracking-wider text-slate-400 uppercase mb-6">Guest Dancer</h2>
              {performance?.guestDancers && (performance.guestDancers as any).length > 0 ? (
                <div className="space-y-4">
                  {(performance.guestDancers as any).map((guest: any, index: number) => (
                    <div key={index}>
                      <p className="font-serif text-xl text-slate-700 mb-2">{guest.name}</p>
                      {guest.company && <p className="text-sm text-slate-500 mb-1">{guest.company}</p>}
                      {guest.instagram && (
                        <a
                          href={`https://instagram.com/${guest.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {guest.instagram.startsWith('@') ? guest.instagram : `@${guest.instagram}`}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">Coming Soon</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Staff */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title mb-10 text-center">Staff</h2>
          {performance?.staff && (performance.staff as any).length > 0 ? (
            <div className="space-y-6 text-center">
              {(() => {
                // 役割と所属でグループ化
                const grouped = (performance.staff as any).reduce((acc: any, staff: any) => {
                  const key = `${staff.role}|||${staff.company || ''}`;
                  if (!acc[key]) {
                    acc[key] = {
                      role: staff.role,
                      company: staff.company,
                      members: [],
                    };
                  }
                  acc[key].members.push(staff);
                  return acc;
                }, {});

                return Object.values(grouped).map((group: any, groupIndex: number) => (
                  <div key={groupIndex}>
                    <p className="text-xs tracking-wider text-slate-400 uppercase mb-2">{group.role}</p>
                    {group.company && <p className="text-sm text-slate-500 mb-3">{group.company}</p>}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
                      {group.members.map((staff: any, staffIndex: number) => (
                        <div key={staffIndex} className="inline-flex flex-col items-center">
                          <p className="text-slate-700 mb-1">{staff.name}</p>
                          {staff.instagram && (
                            <a
                              href={`https://instagram.com/${staff.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {staff.instagram.startsWith('@') ? staff.instagram : `@${staff.instagram}`}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p>Coming Soon</p>
            </div>
          )}
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
