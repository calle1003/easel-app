'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Plus } from 'lucide-react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { Modal } from '@/components/ui/modal';

interface News {
  id: number;
  title: string;
  content: string;
  publishedAt: Date;
  category: string | null;
}

export default function AdminNewsPage() {
  const { adminFetch } = useAdminUser();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
  });

  useEffect(() => {
    fetchNews();
  }, []);

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
    if (!confirm('このニュースを削除しますか？')) return;

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
    setEditingId(null);
    setFormData({ title: '', content: '', category: '' });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-slate-400 hover:text-slate-600">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-medium text-slate-800">ニュース管理</h1>
            </div>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              <Plus size={18} />
              新規作成
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-800">ニュース一覧</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center text-slate-400">読み込み中...</div>
          ) : newsList.length === 0 ? (
            <div className="p-6 text-center text-slate-400">ニュースがありません</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {newsList.map((news) => (
                <div key={news.id} className="p-6 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-400">{formatDate(news.publishedAt)}</span>
                      {news.category && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                          {news.category}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-slate-700 truncate">{news.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{news.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(news)}
                      className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(news.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'ニュースを編集' : '新規ニュース作成'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">タイトル</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">カテゴリ</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            >
              <option value="">選択してください</option>
              <option value="公演情報">公演情報</option>
              <option value="お知らせ">お知らせ</option>
              <option value="メディア">メディア</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">本文</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 h-40"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 transition-colors"
            >
              {editingId ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
