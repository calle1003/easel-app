/**
 * チェックイン統計情報コンポーネント
 */

import { Users, Ticket } from 'lucide-react';
import { Stats } from '../types';

interface CheckInStatsProps {
  stats: Stats;
}

export function CheckInStats({ stats }: CheckInStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="text-blue-600" size={24} />
          <p className="text-sm text-slate-500">入場者数</p>
        </div>
        <p className="text-3xl font-bold text-slate-800">{stats.totalCheckedIn}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Ticket className="text-green-600" size={24} />
          <p className="text-sm text-slate-500">一般席</p>
        </div>
        <p className="text-3xl font-bold text-slate-800">{stats.generalCheckedIn}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Ticket className="text-purple-600" size={24} />
          <p className="text-sm text-slate-500">指定席</p>
        </div>
        <p className="text-3xl font-bold text-slate-800">{stats.reservedCheckedIn}</p>
      </div>
    </div>
  );
}
