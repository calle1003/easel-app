'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { PerformanceModal, PerformanceFormData, SessionDateData } from './modals/PerformanceModal';
import { DetailModal, DetailFormData } from './modals/DetailModal';

interface PerformanceSession {
  id: number;
  performanceId: number;
  showNumber: number;
  performanceDate: string;
  performanceTime: string;
  doorsOpenTime: string | null;
  venueName: string;
  venueAddress: string | null;
  venueAccess: string | null;
  generalCapacity: number;
  reservedCapacity: number;
  vip1Capacity: number;
  vip2Capacity: number;
  generalSold: number;
  reservedSold: number;
  vip1Sold: number;
  vip2Sold: number;
  saleStatus: string;
  saleStartAt: string | null;
  saleEndAt: string | null;
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
  flyerImages?: Array<{ url: string; name: string }>;
  description: string | null;
  painters?: Array<{ name: string; instagram?: string }>;
  choreographers?: Array<{ name: string; instagram?: string; company?: string }>;
  navigators?: Array<{ name: string; note?: string }>;
  guestDancers?: Array<{ name: string; instagram?: string; company?: string; note?: string }>;
  staff?: Array<{ role: string; names: string }>;
  sessions: PerformanceSession[];
}

export default function AdminPerformancesPage() {
  const { adminFetch } = useAdminUser();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPerformanceId, setEditingPerformanceId] = useState<number | null>(null);
  const [editingDetailPerformanceId, setEditingDetailPerformanceId] = useState<number | null>(null);
  
  const [performanceFormData, setPerformanceFormData] = useState<PerformanceFormData>({
    title: '',
    volume: '',
    isOnSale: false,
    numberOfShows: 1,
    venueName: '',
    venueAddress: '',
    venueAccess: '',
    generalPrice: 4500,
    reservedPrice: 5500,
    vip1Price: 0,
    vip2Price: 0,
    vip1Note: '',
    vip2Note: '',
    description: '',
  });

  const [sessionsDatesData, setSessionsDatesData] = useState<SessionDateData[]>([
    { 
      showNumber: 1, 
      performanceDate: '', 
      performanceTime: '', 
      doorsOpenTime: '',
      generalCapacity: 100,
      reservedCapacity: 30,
      vip1Capacity: 0,
      vip2Capacity: 0,
    }
  ]);

  const [detailFormData, setDetailFormData] = useState<DetailFormData>({
    flyerImages: [],
    painters: [],
    choreographers: [],
    navigators: [],
    guestDancers: [],
    staff: [],
  });

  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPerformances();
  }, [adminFetch]);

  const fetchPerformances = async () => {
    try {
      const response = await adminFetch('/api/performances');
      if (response.ok) {
        const data = await response.json();
        setPerformances(data);
      }
    } catch (error) {
      console.error('Failed to fetch performances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPerformance = () => {
    setEditingPerformanceId(null);
    setPerformanceFormData({
      title: '',
      volume: '',
      isOnSale: false,
      numberOfShows: 1,
      venueName: '',
      venueAddress: '',
      venueAccess: '',
      generalPrice: 4500,
      reservedPrice: 5500,
      vip1Price: 0,
      vip2Price: 0,
      vip1Note: '',
      vip2Note: '',
      description: '',
    });
    setSessionsDatesData([
      { 
        showNumber: 1, 
        performanceDate: '', 
        performanceTime: '', 
        doorsOpenTime: '',
        generalCapacity: 100,
        reservedCapacity: 30,
        vip1Capacity: 0,
        vip2Capacity: 0,
      }
    ]);
    setIsPerformanceModalOpen(true);
  };

  const handleEditPerformance = (perf: Performance) => {
    setEditingPerformanceId(perf.id);
    const volumeNumber = perf.volume ? perf.volume.replace(/vol\.?/i, '') : '';
    // 最初のセッションから会場情報を取得（参考値として表示）
    const firstSession = perf.sessions[0];
    setPerformanceFormData({
      title: perf.title,
      volume: volumeNumber,
      isOnSale: (perf as any).isOnSale || false,
      numberOfShows: perf.sessions.length, // 既存のセッション数を表示
      venueName: firstSession?.venueName || '',
      venueAddress: firstSession?.venueAddress || '',
      venueAccess: firstSession?.venueAccess || '',
      generalPrice: perf.generalPrice,
      reservedPrice: perf.reservedPrice,
      vip1Price: perf.vip1Price || 0,
      vip2Price: perf.vip2Price || 0,
      vip1Note: perf.vip1Note || '',
      vip2Note: perf.vip2Note || '',
      description: perf.description || '',
    });
    
    // 既存セッションデータを読み込む
    setSessionsDatesData(
      perf.sessions.map(session => {
        // 時刻データの変換
        let timeValue = '';
        if (typeof session.performanceTime === 'string') {
          if (session.performanceTime.includes('T')) {
            timeValue = session.performanceTime.split('T')[1].slice(0, 5);
          } else {
            timeValue = session.performanceTime.slice(0, 5);
          }
        }
        
        let doorsValue = '';
        if (session.doorsOpenTime && typeof session.doorsOpenTime === 'string') {
          if (session.doorsOpenTime.includes('T')) {
            doorsValue = session.doorsOpenTime.split('T')[1].slice(0, 5);
          } else {
            doorsValue = session.doorsOpenTime.slice(0, 5);
          }
        }
        
        return {
          id: session.id,
          showNumber: session.showNumber,
          performanceDate: session.performanceDate,
          performanceTime: timeValue,
          doorsOpenTime: doorsValue,
          generalCapacity: session.generalCapacity,
          reservedCapacity: session.reservedCapacity,
          vip1Capacity: session.vip1Capacity || 0,
          vip2Capacity: session.vip2Capacity || 0,
        };
      })
    );
    
    setIsPerformanceModalOpen(true);
  };

  const handleSubmitPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPerformanceId
      ? `/api/performances/${editingPerformanceId}`
      : '/api/performances';
    const method = editingPerformanceId ? 'PUT' : 'POST';
    
    const volumeValue = performanceFormData.volume ? `vol${performanceFormData.volume}` : '';

    try {
      const response = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...performanceFormData,
          volume: volumeValue,
          numberOfShows: parseInt(String(performanceFormData.numberOfShows), 10),
          sessionsDates: sessionsDatesData, // セッション日時データを送信
        }),
      });

      if (response.ok) {
        fetchPerformances();
        setIsPerformanceModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to save performance:', error);
    }
  };


  const handleEditDetails = (perf: Performance) => {
    setEditingDetailPerformanceId(perf.id);
    
    // 既存の詳細データを読み込み
    setDetailFormData({
      flyerImages: (perf as any).flyerImages || [],
      painters: (perf as any).painters || [],
      choreographers: (perf as any).choreographers || [],
      navigators: (perf as any).navigators || [],
      guestDancers: (perf as any).guestDancers || [],
      staff: (perf as any).staff || [],
    });
    
    setIsDetailModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImageIndex(index);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newImages = [...detailFormData.flyerImages];
        newImages[index] = {
          url: data.url,
          name: newImages[index].name || file.name.replace(/\.[^/.]+$/, ''),
        };
        setDetailFormData({ ...detailFormData, flyerImages: newImages });
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'アップロードに失敗しました');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('アップロードに失敗しました');
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDetailPerformanceId) return;

    try {
      const response = await adminFetch(`/api/performances/${editingDetailPerformanceId}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detailFormData),
      });

      if (response.ok) {
        fetchPerformances();
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to save details:', error);
    }
  };

  const handleDeletePerformance = async (id: number) => {
    if (!confirm('この公演を削除しますか？関連するすべてのセッションも削除されます。')) return;

    try {
      const response = await adminFetch(`/api/performances/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchPerformances();
      }
    } catch (error) {
      console.error('Failed to delete performance:', error);
    }
  };


  const formatShowNumber = (num: number) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    if (typeof timeString === 'string' && timeString.includes('T')) {
      return timeString.split('T')[1].slice(0, 5);
    }
    return timeString;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ON_SALE':
        return <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded">販売中</span>;
      case 'NOT_ON_SALE':
        return <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded">未販売</span>;
      case 'SOLD_OUT':
        return <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">完売</span>;
      case 'ENDED':
        return <span className="text-xs px-2 py-1 bg-slate-200 text-slate-500 rounded">終了</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-slate-400 hover:text-slate-600">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-medium text-slate-800">公演管理</h1>
            </div>
            <button
              onClick={handleNewPerformance}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              <Plus size={18} />
              新規公演作成
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center text-slate-400">読み込み中...</div>
        ) : performances.length === 0 ? (
          <div className="text-center text-slate-400">公演がありません</div>
        ) : (
          <div className="space-y-6">
            {performances.map((perf) => (
              <div key={perf.id} className="bg-white rounded-lg border border-slate-200">
                {/* Performance Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-lg font-medium text-slate-800">
                        {perf.title}
                        {perf.volume && <span className="ml-2 text-slate-500">({perf.volume})</span>}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        一般: ¥{perf.generalPrice.toLocaleString()} / 指定: ¥{perf.reservedPrice.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditDetails(perf)}
                        className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                      >
                        詳細情報編集
                      </button>
                      <button
                        onClick={() => handleEditPerformance(perf)}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        title="基本情報編集"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePerformance(perf.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sessions */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-700">公演日程 ({perf.sessions.length})</h3>
                  </div>

                  {perf.sessions.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">セッションがありません</p>
                  ) : (
                    <div className="space-y-3">
                      {perf.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-600 rounded">
                                {formatShowNumber(session.showNumber)}
                              </span>
                              {getStatusBadge(session.saleStatus)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(session.performanceDate)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                {formatTime(session.performanceTime)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                {session.venueName}
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 mt-2">
                              一般: {session.generalSold}/{session.generalCapacity} 
                              <span className="mx-2">|</span>
                              指定: {session.reservedSold}/{session.reservedCapacity}
                              {session.vip1Capacity > 0 && (
                                <>
                                  <span className="mx-2">|</span>
                                  VIP①: {session.vip1Sold}/{session.vip1Capacity}
                                </>
                              )}
                              {session.vip2Capacity > 0 && (
                                <>
                                  <span className="mx-2">|</span>
                                  VIP②: {session.vip2Sold}/{session.vip2Capacity}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    ※ セッションの編集は「公演を編集」から行えます
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <PerformanceModal
        isOpen={isPerformanceModalOpen}
        onClose={() => setIsPerformanceModalOpen(false)}
        editingPerformanceId={editingPerformanceId}
        performanceFormData={performanceFormData}
        setPerformanceFormData={setPerformanceFormData}
        sessionsDatesData={sessionsDatesData}
        setSessionsDatesData={setSessionsDatesData}
        onSubmit={handleSubmitPerformance}
      />


      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        detailFormData={detailFormData}
        setDetailFormData={setDetailFormData}
        uploadingImageIndex={uploadingImageIndex}
        onFileUpload={handleFileUpload}
        onSubmit={handleSubmitDetails}
      />
    </div>
  );
}
