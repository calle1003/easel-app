/**
 * 注文管理ページ（カスタムフック版）
 * 133行 → 約70行に削減（-47%）
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { OrderStats } from './components/OrderStats';
import { OrderFilter } from './components/OrderFilter';
import { OrderTable } from './components/OrderTable';
import { useOrders } from '@/hooks/useOrders';

export default function AdminOrdersPage() {
  const { orders, stats, loading, refetch, updateStatus } = useOrders();
  const [filter, setFilter] = useState<string>('ALL');

  // ラッパー関数（OrderTableのインターフェースに合わせる）
  const handleStatusChange = async (id: number, status: string) => {
    await updateStatus(id, status);
  };

  // フィルタリング
  const filteredOrders = useMemo(() => {
    if (filter === 'ALL') return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const filterOptions = [
    { value: 'ALL', label: '全て' },
    { value: 'PAID', label: '支払済' },
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
              <h1 className="text-xl font-medium text-slate-800">注文管理</h1>
            </div>
            <button
              onClick={refetch}
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
