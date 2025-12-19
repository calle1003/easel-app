/**
 * 公演一覧コンポーネント
 */

'use client';

import { Pencil, Trash2, FileText, Calendar, Clock, MapPin } from 'lucide-react';

interface PerformanceSession {
  id: number;
  performanceId?: number;
  showNumber: number;
  performanceDate: string;
  performanceTime: string;
  doorsOpenTime: string | null;
  venueName: string;
  venueAddress?: string | null;
  venueAccess?: string | null;
  generalCapacity: number;
  reservedCapacity: number;
  vip1Capacity: number;
  vip2Capacity: number;
  generalSold?: number;
  reservedSold?: number;
  vip1Sold?: number;
  vip2Sold?: number;
  saleStatus?: string;
  saleStartAt?: string | null;
  saleEndAt?: string | null;
}

interface Performance {
  id: number;
  title: string;
  volume: string | null;
  isOnSale?: boolean;
  generalPrice: number;
  reservedPrice: number;
  vip1Price: number | null;
  vip2Price: number | null;
  vip1Note: string | null;
  vip2Note: string | null;
  description: string | null;
  flyerImages?: any;
  painters?: any;
  choreographers?: any;
  navigators?: any;
  guestDancers?: any;
  staff?: any;
  sessions: PerformanceSession[];
}

interface PerformanceListProps {
  performances: any[];
  loading: boolean;
  onEdit: (performance: any) => void;
  onEditDetails: (performance: any) => void;
  onDelete: (id: number) => void;
}

export function PerformanceList({
  performances,
  loading,
  onEdit,
  onEditDetails,
  onDelete,
}: PerformanceListProps) {
  const formatShowNumber = (num: number): string => {
    const labels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    return labels[num - 1] || `${num}th`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '-';
    if (typeof timeString === 'string' && timeString.includes('T')) {
      return timeString.split('T')[1].slice(0, 5);
    }
    return timeString;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ON_SALE':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">販売中</span>;
      case 'SOLD_OUT':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">完売</span>;
      case 'ENDED':
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">終了</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded">販売前</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto" />
      </div>
    );
  }

  if (performances.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <p className="text-slate-500">公演がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {performances.map((performance) => (
        <div key={performance.id} className="bg-white border border-slate-200 rounded-lg p-6">
          {/* ヘッダー */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-slate-800">{performance.title}</h2>
                {performance.volume && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                    {performance.volume}
                  </span>
                )}
                {performance.isOnSale && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded font-medium">
                    販売中
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>一般: ¥{performance.generalPrice.toLocaleString()}</span>
                <span>指定: ¥{performance.reservedPrice.toLocaleString()}</span>
                {performance.vip1Price && (
                  <span>VIP①: ¥{performance.vip1Price.toLocaleString()}</span>
                )}
                {performance.vip2Price && (
                  <span>VIP②: ¥{performance.vip2Price.toLocaleString()}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(performance)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                title="公演を編集"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => onEditDetails(performance)}
                className="p-2 text-green-600 hover:bg-green-50 rounded"
                title="詳細情報を編集"
              >
                <FileText size={18} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`${performance.title}を削除しますか？`)) {
                    onDelete(performance.id);
                  }
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="削除"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* セッション一覧 */}
          {performance.sessions && performance.sessions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-600 mb-3">公演日程</p>
              <div className="space-y-2">
                {performance.sessions.map((session: any) => {
                  const performanceDate = new Date(session.performanceDate);
                  const dateStr = `${performanceDate.getFullYear()}/${performanceDate.getMonth() + 1}/${performanceDate.getDate()}`;
                  const timeStr = session.performanceTime
                    ? typeof session.performanceTime === 'string'
                      ? session.performanceTime.includes('T')
                        ? session.performanceTime.split('T')[1].slice(0, 5)
                        : session.performanceTime
                      : '-'
                    : '-';

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded text-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-slate-700">
                          {session.showNumber}回目
                        </span>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Calendar size={14} />
                          {dateStr}
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock size={14} />
                          {timeStr}
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin size={14} />
                          {session.venueName}
                        </div>
                      </div>
                      <div className="text-slate-500 text-xs">
                        一般: {session.generalCapacity}席 / 指定: {session.reservedCapacity}席
                        {session.vip1Capacity > 0 && ` / VIP①: ${session.vip1Capacity}席`}
                        {session.vip2Capacity > 0 && ` / VIP②: ${session.vip2Capacity}席`}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                ※ セッションの編集は「公演を編集」から行えます
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
