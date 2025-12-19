import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getLatestNews } from '@/lib/data/news';
import { NewsCard } from '@/components/news/NewsCard';
import { EmptyState } from '@/components/ui/empty-state';

export default async function HomePage() {
  const news = await getLatestNews(3);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-warm-50">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-warm-100/50" />
        <div className="relative z-10 text-center px-6 py-32">
          <p className="section-subtitle mb-6">Theater Company</p>
          <img src="/easel_logo.png" alt="easel" className="h-32 md:h-44 w-auto mx-auto mb-8" />
          <Link
            href="/about"
            className="btn-secondary group"
          >
            <span>ABOUT US</span>
            <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Latest Performance */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="section-subtitle mb-4">Latest</p>
          <h2 className="section-title mb-8">VOL.2</h2>
          <p className="text-slate-500 leading-relaxed mb-14">
            easelの新作公演情報をお届けします。<br />
            チケットのご予約を受付中です。
          </p>
          <Link href="/easel-live/vol2" className="btn-primary">
            詳細を見る
          </Link>
        </div>
      </section>

      {/* News Section */}
      <section className="py-28 px-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-14">
            <h2 className="section-title">News</h2>
            <Link
              href="/news"
              className="text-sm tracking-wider text-slate-400 hover:text-slate-700 transition-colors duration-300 flex items-center gap-2"
            >
              <span>VIEW ALL</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {news.length === 0 ? (
            <EmptyState message="最新のお知らせはありません" />
          ) : (
            <div className="divide-y divide-slate-200/50">
              {news.map((item) => (
                <NewsCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  publishedAt={item.publishedAt}
                  category={item.category}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Links Section */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/easel-live"
            className="group p-10 border border-slate-100 rounded-2xl hover:border-slate-200 hover:bg-slate-50/50 transition-all duration-300"
          >
            <h3 className="font-serif text-lg tracking-wider text-slate-700 mb-3 group-hover:translate-x-1 transition-transform duration-300">
              easel live
            </h3>
            <p className="text-sm text-slate-400">過去の公演アーカイブ</p>
          </Link>
          <Link
            href="/goods"
            className="group p-10 border border-slate-100 rounded-2xl hover:border-slate-200 hover:bg-slate-50/50 transition-all duration-300"
          >
            <h3 className="font-serif text-lg tracking-wider text-slate-700 mb-3 group-hover:translate-x-1 transition-transform duration-300">
              Goods
            </h3>
            <p className="text-sm text-slate-400">オフィシャルグッズ</p>
          </Link>
          <Link
            href="/contact"
            className="group p-10 border border-slate-100 rounded-2xl hover:border-slate-200 hover:bg-slate-50/50 transition-all duration-300"
          >
            <h3 className="font-serif text-lg tracking-wider text-slate-700 mb-3 group-hover:translate-x-1 transition-transform duration-300">
              Contact
            </h3>
            <p className="text-sm text-slate-400">お問い合わせ</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
