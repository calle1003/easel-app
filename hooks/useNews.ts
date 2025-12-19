/**
 * ニュースデータ管理カスタムフック
 * 
 * ニュース一覧の取得、作成、更新、削除を管理します。
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { News } from '@/types/admin';

interface UseNewsReturn {
  newsList: News[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createNews: (data: unknown) => Promise<boolean>;
  updateNews: (id: number, data: unknown) => Promise<boolean>;
  deleteNews: (id: number) => Promise<boolean>;
}

export function useNews(): UseNewsReturn {
  const { adminFetch } = useAdminUser();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ニュース一覧取得
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        setNewsList(data);
      } else {
        setError('ニュースの取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('ニュースの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  // 初回読み込み
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // ニュース作成
  const createNews = useCallback(
    async (data: unknown): Promise<boolean> => {
      try {
        const response = await adminFetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await fetchNews();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to create news:', err);
        return false;
      }
    },
    [adminFetch, fetchNews]
  );

  // ニュース更新
  const updateNews = useCallback(
    async (id: number, data: unknown): Promise<boolean> => {
      try {
        const response = await adminFetch(`/api/news/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await fetchNews();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to update news:', err);
        return false;
      }
    },
    [adminFetch, fetchNews]
  );

  // ニュース削除
  const deleteNews = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const response = await adminFetch(`/api/news/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchNews();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to delete news:', err);
        return false;
      }
    },
    [adminFetch, fetchNews]
  );

  return {
    newsList,
    loading,
    error,
    refetch: fetchNews,
    createNews,
    updateNews,
    deleteNews,
  };
}
