/**
 * 引換券コードの統計情報を表示するコンポーネント
 */

import { ExchangeCodeStats as StatsType } from '../types';

interface ExchangeCodeStatsProps {
  stats: StatsType;
}

export function ExchangeCodeStats({ stats }: ExchangeCodeStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-500 mb-1">総コード数</p>
        <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-500 mb-1">使用済み</p>
        <p className="text-2xl font-bold text-green-600">{stats.used}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-500 mb-1">未使用</p>
        <p className="text-2xl font-bold text-slate-800">{stats.unused}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-500 mb-1">来場済み</p>
        <p className="text-2xl font-bold text-blue-600">{stats.attended}</p>
      </div>
    </div>
  );
}
