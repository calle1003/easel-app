/**
 * 出演者データ管理カスタムフック
 * 
 * 出演者一覧の取得、作成、更新、削除を管理します。
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { Performer } from '@/types/admin';

interface UsePerformersReturn {
  performers: Performer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPerformer: (data: unknown) => Promise<boolean>;
  updatePerformer: (id: number, data: unknown) => Promise<boolean>;
  deletePerformer: (id: number) => Promise<boolean>;
}

export function usePerformers(): UsePerformersReturn {
  const { adminFetch } = useAdminUser();
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 出演者一覧取得
  const fetchPerformers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch('/api/performers');
      if (response.ok) {
        const data = await response.json();
        setPerformers(data);
      } else {
        setError('出演者の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch performers:', err);
      setError('出演者の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  // 初回読み込み
  useEffect(() => {
    fetchPerformers();
  }, [fetchPerformers]);

  // 出演者作成
  const createPerformer = useCallback(
    async (data: unknown): Promise<boolean> => {
      try {
        const response = await adminFetch('/api/performers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await fetchPerformers();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to create performer:', err);
        return false;
      }
    },
    [adminFetch, fetchPerformers]
  );

  // 出演者更新
  const updatePerformer = useCallback(
    async (id: number, data: unknown): Promise<boolean> => {
      try {
        const response = await adminFetch(`/api/performers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await fetchPerformers();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to update performer:', err);
        return false;
      }
    },
    [adminFetch, fetchPerformers]
  );

  // 出演者削除
  const deletePerformer = useCallback(
    async (id: number): Promise<boolean> => {
      if (!confirm('この出演者を削除しますか？関連する引換券も削除されます。')) {
        return false;
      }

      try {
        const response = await adminFetch(`/api/performers/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchPerformers();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to delete performer:', err);
        return false;
      }
    },
    [adminFetch, fetchPerformers]
  );

  return {
    performers,
    loading,
    error,
    refetch: fetchPerformers,
    createPerformer,
    updatePerformer,
    deletePerformer,
  };
}
