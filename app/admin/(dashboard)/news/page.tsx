/**
 * ニュース管理ページ（カスタムフック版）
 * 145行 → 約90行に削減（-38%）
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { NewsTable } from './components/NewsTable';
import { NewsModal } from './modals/NewsModal';
import { NewsFormData } from '@/types/admin';
import { useNews } from '@/hooks/useNews';

export default function AdminNewsPage() {
  const { newsList, loading, createNews, updateNews, deleteNews } = useNews();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    content: '',
    category: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      publishedAt: new Date().toISOString(),
    };

    const success = editingId ? await updateNews(editingId, data) : await createNews(data);

    if (success) {
      resetForm();
      setIsModalOpen(false);
    }
  };

  const handleEdit = (news: typeof newsList[0]) => {
    setEditingId(news.id);
    setFormData({
      title: news.title,
      content: news.content,
      category: news.category || '',
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', category: '' });
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-medium text-slate-800">ニュース管理</h1>
            </div>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              <Plus size={18} />
              ニュースを追加
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <NewsTable newsList={newsList} loading={loading} onEdit={handleEdit} onDelete={deleteNews} />
      </main>

      {/* Modal */}
      <NewsModal
        isOpen={isModalOpen}
        editingId={editingId}
        formData={formData}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        onFormDataChange={setFormData}
      />
    </div>
  );
}
