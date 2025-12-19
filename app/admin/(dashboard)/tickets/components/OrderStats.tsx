/**
 * 注文統計コンポーネント（tickets/orders共通）
 */

'use client';

interface OrderStatsProps {
  stats: {
    total: number;
    paid: number;
    pending: number;
    cancelled: number;
    revenue: number;
    totalTickets: number;
  };
}

export function OrderStats({ stats }: OrderStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-500">売上合計</p>
        <p className="text-xl font-medium text-slate-800">
          ¥{stats.revenue.toLocaleString()}
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-500">発行済みチケット</p>
        <p className="text-xl font-medium text-slate-800">{stats.totalTickets}枚</p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-500">決済完了</p>
        <p className="text-xl font-medium text-green-600">{stats.paid}件</p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-500">決済待ち</p>
        <p className="text-xl font-medium text-yellow-600">{stats.pending}件</p>
      </div>
    </div>
  );
}
