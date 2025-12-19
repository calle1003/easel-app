/**
 * 注文データ管理カスタムフック
 * 
 * 注文一覧の取得、ステータス更新を管理します。
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { Order } from '@/types/admin';

interface OrderStats {
  total: number;
  paid: number;
  pending: number;
  cancelled: number;
  revenue: number;
  totalTickets: number;
}

interface UseOrdersReturn {
  orders: Order[];
  stats: OrderStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateStatus: (id: number, status: string) => Promise<boolean>;
}

export function useOrders(): UseOrdersReturn {
  const { adminFetch } = useAdminUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 注文一覧取得
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        setError('注文の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('注文の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  // 初回読み込み
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 統計計算
  const stats = useMemo(
    (): OrderStats => ({
      total: orders.length,
      paid: orders.filter((o) => o.status === 'PAID').length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
      revenue: orders
        .filter((o) => o.status === 'PAID')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      totalTickets: orders
        .filter((o) => o.status === 'PAID')
        .reduce(
          (sum, o) =>
            sum +
            o.generalQuantity +
            o.reservedQuantity +
            (o.vip1Quantity || 0) +
            (o.vip2Quantity || 0),
          0
        ),
    }),
    [orders]
  );

  // ステータス更新
  const updateStatus = useCallback(
    async (id: number, newStatus: string): Promise<boolean> => {
      try {
        const response = await adminFetch(`/api/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          await fetchOrders();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to update order status:', err);
        return false;
      }
    },
    [adminFetch, fetchOrders]
  );

  return {
    orders,
    stats,
    loading,
    error,
    refetch: fetchOrders,
    updateStatus,
  };
}
