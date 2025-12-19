import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroSection } from '@/components/ui/hero-section';
import { getAllPerformances } from '@/lib/data/performances';

export default async function EaselLiveTopPage() {
  const performances = await getAllPerformances();

  return (
    <div>
      <HeroSection subtitle="Live" title="easel live" />

      {/* About easel live */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="section-title mb-14 text-center">easel liveとは</h2>
          <div className="text-center text-slate-600 leading-loose space-y-6">
            <p className="font-serif text-xl text-slate-700">
              『踊りだす絵画、響きあう感性』
            </p>
            <p>
              ダンス×絵画、表現の魅力を深めるひととき。
            </p>
            <p>
              第一線で活躍する現代アーティストとダンサーが共鳴し、<br />
              絵画から生まれるダンスパフォーマンスで彩る、<br />
              展覧会型ダンス公演。
            </p>
          </div>
        </div>
      </section>

      {/* Archive */}
      <section className="py-28 px-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title mb-14 text-center">Archive</h2>
          
          {performances.length > 0 ? (
            <div className="space-y-6">
              {performances.map((performance) => {
                const firstSessionDate = performance.sessions[0]?.performanceDate;
                const year = firstSessionDate ? new Date(firstSessionDate).getFullYear() : '----';
                
                return (
                  <Link
                    key={performance.id}
                    href={`/easel-live/${performance.volume?.replace('.', '')}`}
                    className="group block p-8 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs tracking-wider text-slate-400 mb-2">
                          {year}
                        </p>
                        <h3 className="font-serif text-2xl tracking-wider text-slate-700 mb-2">
                          {performance.volume ? `Vol.${performance.volume.replace('vol', '')}` : performance.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm transition-colors duration-300">
                        <span className={`tracking-wider font-medium ${
                          performance.isOnSale 
                            ? 'text-green-600 group-hover:text-green-700' 
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}>
                          {performance.isOnSale ? 'NOW ON SALE' : 'ARCHIVE'}
                        </span>
                        <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  </Link>
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
    </div>
  );
}
