/**
 * ニュース一覧テーブルコンポーネント
 */

'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { News } from '../types';

interface NewsTableProps {
  newsList: News[];
  loading: boolean;
  onEdit: (news: News) => void;
  onDelete: (id: number) => void;
}

export function NewsTable({ newsList, loading, onEdit, onDelete }: NewsTableProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto" />
      </div>
    );
  }

  if (newsList.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <p className="text-slate-500">ニュースがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">タイトル</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">カテゴリ</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">公開日</th>
            <th className="px-6 py-3 text-center text-sm font-medium text-slate-600">アクション</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {newsList.map((news) => (
            <tr key={news.id} className="hover:bg-slate-50">
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{news.title}</p>
                  <p className="text-sm text-slate-500 line-clamp-1">{news.content}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                {news.category && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {news.category}
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-slate-600">{formatDate(news.publishedAt)}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(news)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="編集"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`「${news.title}」を削除しますか？`)) {
                        onDelete(news.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
