'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface News {
  id: number;
  title: string;
  content: string;
  publishedAt: Date;
  category: string | null;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/news/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch news');
        return res.json();
      })
      .then((data) => {
        setNews(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300 mx-auto" />
          <p className="mt-6 text-slate-400 text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-slate-400 mb-10">ニュースが見つかりませんでした</p>
          <Link href="/news" className="btn-secondary">
            <span>ニュース一覧へ</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="min-h-[300px] flex flex-col justify-center px-6 bg-warm-50">
        <div className="max-w-3xl mx-auto w-full">
          <nav className="mb-3">
            <Link href="/news" className="text-xs tracking-wider text-slate-400 hover:text-slate-600 transition-colors">
              News
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-xs tracking-wider text-slate-500">詳細</span>
          </nav>
          <div className="text-center">
            <p className="section-subtitle mb-4">News</p>
            <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.2em] text-slate-800">News</h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <header className="mb-14 pb-14 border-b border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <time className="text-sm text-slate-400">
                {formatDate(new Date(news.publishedAt))}
              </time>
              {news.category && (
                <span className="text-xs px-3 py-1 bg-slate-100 text-slate-500 rounded-full">
                  {news.category}
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl md:text-3xl tracking-wide text-slate-800 leading-relaxed">
              {news.title}
            </h1>
          </header>

          <div className="text-slate-600 leading-loose whitespace-pre-wrap">
            {news.content}
          </div>
        </div>
      </article>
    </div>
  );
}
