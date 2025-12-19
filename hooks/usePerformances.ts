/**
 * 公演データ管理カスタムフック
 * 
 * 公演一覧の取得、作成、更新、削除を管理します。
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { Performance } from '@/types/admin';

interface UsePerformancesReturn {
  performances: Performance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPerformance: (data: unknown) => Promise<boolean>;
  updatePerformance: (id: number, data: unknown) => Promise<boolean>;
  deletePerformance: (id: number) => Promise<boolean>;
}

export function usePerformances(): UsePerformancesReturn {
  const { adminFetch } = useAdminUser();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 公演一覧取得
  const fetchPerformances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch('/api/performances');
      if (response.ok) {
        const data = await response.json();
        // volume による降順ソート
        const sorted = data.sort((a: Performance, b: Performance) => {
          const volA = a.volume || '';
          const volB = b.volume || '';
          return volB.localeCompare(volA);
        });
        setPerformances(sorted);
      } else {
        setError('公演の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch performances:', err);
      setError('公演の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  // 初回読み込み
  useEffect(() => {
    fetchPerformances();
  }, [fetchPerformances]);

  // 公演作成
  const createPerformance = useCallback(
    async (data: unknown): Promise<boolean> => {
      try {
        const response = await adminFetch('/api/performances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await fetchPerformances();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to create performance:', err);
        return false;
      }
    },
    [adminFetch, fetchPerformances]
  );

  // 公演更新
  const updatePerformance = useCallback(
    async (id: number, data: unknown): Promise<boolean> => {
      try {
        const response = await adminFetch(`/api/performances/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await fetchPerformances();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to update performance:', err);
        return false;
      }
    },
    [adminFetch, fetchPerformances]
  );

  // 公演削除
  const deletePerformance = useCallback(
    async (id: number): Promise<boolean> => {
      if (!confirm('この公演を削除しますか？関連するセッションやチケットも削除されます。')) {
        return false;
      }

      try {
        const response = await adminFetch(`/api/performances/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchPerformances();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to delete performance:', err);
        return false;
      }
    },
    [adminFetch, fetchPerformances]
  );

  return {
    performances,
    loading,
    error,
    refetch: fetchPerformances,
    createPerformance,
    updatePerformance,
    deletePerformance,
  };
}
