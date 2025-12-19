import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface NewsCardProps {
  id: number;
  title: string;
  publishedAt: Date;
  category: string | null;
}

export function NewsCard({
  id,
  title,
  publishedAt,
  category,
}: NewsCardProps) {
  return (
    <Link
      href={`/news/${id}`}
      className="group block py-6 hover:bg-white/50 transition-colors duration-300 -mx-4 px-4 rounded-lg"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <time className="text-xs text-slate-400">
              {formatDate(publishedAt)}
            </time>
            {category && (
              <span className="text-xs px-2 py-0.5 bg-slate-200/50 text-slate-500 rounded-full">
                {category}
              </span>
            )}
          </div>
          <h3 className="text-slate-700 group-hover:translate-x-1 transition-transform duration-300">
            {title}
          </h3>
        </div>
        <ChevronRight
          size={16}
          className="text-slate-300 group-hover:text-slate-400 transition-colors duration-300 flex-shrink-0"
        />
      </div>
    </Link>
  );
}

