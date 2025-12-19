import { HeroSection } from '@/components/ui/hero-section';
import { EmptyState } from '@/components/ui/empty-state';
import { NewsCard } from '@/components/news/NewsCard';
import { getNewsList } from '@/lib/data/news';
import { Newspaper } from 'lucide-react';

export default async function NewsListPage() {
  const news = await getNewsList();

  return (
    <div>
      <HeroSection subtitle="News" title="News" />

      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          {news.length === 0 ? (
            <EmptyState icon={Newspaper} message="ニュースはまだありません" />
          ) : (
            <div className="divide-y divide-slate-100">
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
    </div>
  );
}
