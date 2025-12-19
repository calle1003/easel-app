/**
 * ニュース管理ページ（リファクタリング版）
 * 252行 → 約120行に削減
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { NewsTable } from './components/NewsTable';
import { NewsModal } from './modals/NewsModal';
import { News, NewsFormData } from './types';

export default function AdminNewsPage() {
  const { adminFetch } = useAdminUser();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    content: '',
    category: '',
  });

  useEffect(() => {
    fetchNews();
  }, [adminFetch]);

  const fetchNews = async () => {
    try {
      const response = await adminFetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        setNewsList(data);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingId ? `/api/news/${editingId}` : '/api/news';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          publishedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        fetchNews();
        resetForm();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to save news:', error);
    }
  };

  const handleEdit = (news: News) => {
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

  const handleDelete = async (id: number) => {
    try {
      const response = await adminFetch(`/api/news/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchNews();
      }
    } catch (error) {
      console.error('Failed to delete news:', error);
    }
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
        <NewsTable newsList={newsList} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
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
