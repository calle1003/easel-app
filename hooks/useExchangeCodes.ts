/**
 * 引換券データ管理カスタムフック
 * 
 * 引換券一覧の取得、作成、削除を管理します。
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { ExchangeCode, ExchangeCodeStats } from '@/types/admin';

interface UseExchangeCodesReturn {
  exchangeCodes: ExchangeCode[];
  stats: ExchangeCodeStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCode: (data: unknown) => Promise<boolean>;
  batchGenerate: (data: unknown) => Promise<boolean>;
  deleteCode: (id: number) => Promise<boolean>;
}

export function useExchangeCodes(): UseExchangeCodesReturn {
  const { adminFetch } = useAdminUser();
  const [exchangeCodes, setExchangeCodes] = useState<ExchangeCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 統計計算
  const calculateStats = useCallback((codes: ExchangeCode[]): ExchangeCodeStats => {
    return {
      total: codes.length,
      used: codes.filter((c) => c.isUsed).length,
      unused: codes.filter((c) => !c.isUsed).length,
      attended: codes.filter((c) => c.hasAttended).length,
    };
  }, []);

  // 引換券一覧取得
  const fetchExchangeCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch('/api/exchange-codes');
      if (response.ok) {
        const data = await response.json();
        setExchangeCodes(data);
      } else {
        setError('引換券の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch exchange codes:', err);
      setError('引換券の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  // 初回読み込み
  useEffect(() => {
    fetchExchangeCodes();
  }, [fetchExchangeCodes]);

  // 引換券作成
  const createCode = useCallback(
    async (data: unknown): Promise<boolean> => {
      try {
        const response = await adminFetch('/api/exchange-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await fetchExchangeCodes();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to create exchange code:', err);
        return false;
      }
    },
    [adminFetch, fetchExchangeCodes]
  );

  // 一括生成
  const batchGenerate = useCallback(
    async (data: unknown): Promise<boolean> => {
      try {
        const response = await adminFetch('/api/exchange-codes/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await fetchExchangeCodes();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to batch generate codes:', err);
        return false;
      }
    },
    [adminFetch, fetchExchangeCodes]
  );

  // 引換券削除
  const deleteCode = useCallback(
    async (id: number): Promise<boolean> => {
      if (!confirm('この引換券を削除しますか？')) {
        return false;
      }

      try {
        const response = await adminFetch(`/api/exchange-codes/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchExchangeCodes();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to delete exchange code:', err);
        return false;
      }
    },
    [adminFetch, fetchExchangeCodes]
  );

  return {
    exchangeCodes,
    stats: calculateStats(exchangeCodes),
    loading,
    error,
    refetch: fetchExchangeCodes,
    createCode,
    batchGenerate,
    deleteCode,
  };
}
