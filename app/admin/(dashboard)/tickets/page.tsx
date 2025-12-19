/**
 * チケット管理ページ（リファクタリング版）
 * 559行 → 約250行に削減
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Ticket } from 'lucide-react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { OrderStats } from './components/OrderStats';
import { OrderFilter } from './components/OrderFilter';
import { OrderTable } from './components/OrderTable';
import { Order } from './types';

export default function AdminTicketsPage() {
  const { adminFetch } = useAdminUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PAID');

  useEffect(() => {
    fetchOrders();
  }, [adminFetch]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await adminFetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // フィルタリング
  const filteredOrders = useMemo(() => {
    if (filter === 'ALL') return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  // 統計計算
  const stats = useMemo(
    () => ({
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

  const filterOptions = [
    { value: 'ALL', label: '全て' },
    { value: 'PAID', label: '発行済み' },
    { value: 'PENDING', label: '決済待ち' },
    { value: 'CANCELLED', label: 'キャンセル' },
    { value: 'REFUNDED', label: '返金済' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div className="flex items-center gap-2">
                <Ticket size={20} className="text-slate-600" />
                <h1 className="text-xl font-medium text-slate-800">チケット管理</h1>
              </div>
            </div>
            <button
              onClick={fetchOrders}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              title="更新"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <OrderStats stats={stats} />

        {/* Filter */}
        <OrderFilter value={filter} onChange={setFilter} options={filterOptions} />

        {/* Table */}
        <OrderTable orders={filteredOrders} loading={loading} onStatusChange={handleStatusChange} />
      </main>
    </div>
  );
}
