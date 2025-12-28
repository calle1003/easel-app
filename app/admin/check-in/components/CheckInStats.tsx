/**
 * チェックイン統計情報コンポーネント
 */

import { Users, Ticket } from 'lucide-react';
import { Stats } from '../types';

interface CheckInStatsProps {
  stats: Stats;
}

export function CheckInStats({ stats }: CheckInStatsProps) {
  const hasVip = (stats.vip1CheckedIn !== undefined && stats.vip1CheckedIn > 0) || 
                 (stats.vip2CheckedIn !== undefined && stats.vip2CheckedIn > 0);
  
  return (
    <div className={`grid grid-cols-1 ${hasVip ? 'md:grid-cols-5' : 'md:grid-cols-3'} gap-2 md:gap-4 mb-6`}>
      {/* 入場者数 */}
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 md:px-4 md:py-3">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Users className="text-blue-600 flex-shrink-0" size={18} />
          <span className="text-sm text-slate-600">入場者数:</span>
          <span className="text-base md:text-lg font-bold text-slate-800 ml-auto">{stats.totalCheckedIn}人</span>
        </div>
      </div>
      
      {/* 一般席 */}
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 md:px-4 md:py-3">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Ticket className="text-green-600 flex-shrink-0" size={18} />
          <span className="text-sm text-slate-600">一般席:</span>
          <span className="text-base md:text-lg font-bold text-slate-800 ml-auto">{stats.generalCheckedIn}人</span>
        </div>
      </div>
      
      {/* 指定席 */}
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 md:px-4 md:py-3">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Ticket className="text-purple-600 flex-shrink-0" size={18} />
          <span className="text-sm text-slate-600">指定席:</span>
          <span className="text-base md:text-lg font-bold text-slate-800 ml-auto">{stats.reservedCheckedIn}人</span>
        </div>
      </div>
      
      {/* VIP1席 */}
      {stats.vip1CheckedIn !== undefined && stats.vip1CheckedIn > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Ticket className="text-amber-600 flex-shrink-0" size={18} />
            <span className="text-sm text-slate-600">VIP1席:</span>
            <span className="text-base md:text-lg font-bold text-slate-800 ml-auto">{stats.vip1CheckedIn}人</span>
          </div>
        </div>
      )}
      
      {/* VIP2席 */}
      {stats.vip2CheckedIn !== undefined && stats.vip2CheckedIn > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Ticket className="text-rose-600 flex-shrink-0" size={18} />
            <span className="text-sm text-slate-600">VIP2席:</span>
            <span className="text-base md:text-lg font-bold text-slate-800 ml-auto">{stats.vip2CheckedIn}人</span>
          </div>
        </div>
      )}
    </div>
  );
}
