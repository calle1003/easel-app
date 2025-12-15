'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Plus, Calendar, Clock, MapPin, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { Modal } from '@/components/ui/modal';

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
  generalSold: number;
  reservedSold: number;
  saleStatus: string;
  saleStartAt: string | null;
  saleEndAt: string | null;
}

interface Performance {
  id: number;
  title: string;
  volume: string | null;
  year?: number | null;
  isOnSale?: boolean;
  generalPrice: number;
  reservedPrice: number;
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
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPerformanceId, setEditingPerformanceId] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<number | null>(null);
  const [editingDetailPerformanceId, setEditingDetailPerformanceId] = useState<number | null>(null);
  
  const [performanceFormData, setPerformanceFormData] = useState({
    title: '',
    volume: '',
    year: new Date().getFullYear(),
    isOnSale: false,
    numberOfShows: 1,
    venueName: '',
    venueAddress: '',
    venueAccess: '',
    generalPrice: 4500,
    reservedPrice: 5500,
    description: '',
  });

  const [sessionsDatesData, setSessionsDatesData] = useState<Array<{
    showNumber: number;
    performanceDate: string;
    performanceTime: string;
    doorsOpenTime: string;
  }>>([
    { showNumber: 1, performanceDate: '', performanceTime: '', doorsOpenTime: '' }
  ]);

  const [detailFormData, setDetailFormData] = useState({
    flyerImages: [] as Array<{ url: string; name: string }>,
    painters: [] as Array<{ name: string; instagram?: string }>,
    choreographers: [] as Array<{ name: string; instagram?: string; company?: string }>,
    navigators: [] as Array<{ name: string; instagram?: string; company?: string }>,
    guestDancers: [] as Array<{ name: string; instagram?: string; company?: string }>,
    staff: [] as Array<{ role: string; name: string; instagram?: string; company?: string }>,
  });

  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

  const [sessionFormData, setSessionFormData] = useState({
    showNumber: '',
    performanceDate: '',
    performanceTime: '',
    doorsOpenTime: '',
    venueName: '',
    venueAddress: '',
    venueAccess: '',
    generalCapacity: 100,
    reservedCapacity: 30,
  });

  useEffect(() => {
    fetchPerformances();
  }, [adminFetch]);

  // 公演回数が変更されたらセッション日時フォームを更新
  useEffect(() => {
    const newSessionsData = [];
    for (let i = 1; i <= performanceFormData.numberOfShows; i++) {
      const existing = sessionsDatesData[i - 1];
      newSessionsData.push({
        showNumber: i,
        performanceDate: existing?.performanceDate || '',
        performanceTime: existing?.performanceTime || '',
        doorsOpenTime: existing?.doorsOpenTime || '',
      });
    }
    setSessionsDatesData(newSessionsData);
  }, [performanceFormData.numberOfShows]);

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
      year: new Date().getFullYear(),
      isOnSale: false,
      numberOfShows: 1,
      venueName: '',
      venueAddress: '',
      venueAccess: '',
      generalPrice: 4500,
      reservedPrice: 5500,
      description: '',
    });
    setSessionsDatesData([
      { showNumber: 1, performanceDate: '', performanceTime: '', doorsOpenTime: '' }
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
      year: (perf as any).year || new Date().getFullYear(),
      isOnSale: (perf as any).isOnSale || false,
      numberOfShows: perf.sessions.length, // 既存のセッション数を表示
      venueName: firstSession?.venueName || '',
      venueAddress: firstSession?.venueAddress || '',
      venueAccess: firstSession?.venueAccess || '',
      generalPrice: perf.generalPrice,
      reservedPrice: perf.reservedPrice,
      description: perf.description || '',
    });
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

  const handleNewSession = (performanceId: number) => {
    setSelectedPerformanceId(performanceId);
    setEditingSessionId(null);
    const performance = performances.find(p => p.id === performanceId);
    const nextShowNumber = performance ? Math.max(...performance.sessions.map(s => s.showNumber), 0) + 1 : 1;
    
    setSessionFormData({
      showNumber: String(nextShowNumber),
      performanceDate: '',
      performanceTime: '',
      doorsOpenTime: '',
      venueName: '',
      venueAddress: '',
      venueAccess: '',
      generalCapacity: 100,
      reservedCapacity: 30,
    });
    setIsSessionModalOpen(true);
  };

  const handleEditSession = (performanceId: number, session: PerformanceSession) => {
    setSelectedPerformanceId(performanceId);
    setEditingSessionId(session.id);
    
    let timeValue = '';
    if (typeof session.performanceTime === 'string') {
      if (session.performanceTime.includes('T')) {
        timeValue = session.performanceTime.split('T')[1].slice(0, 5);
      } else {
        timeValue = session.performanceTime.slice(0, 5);
      }
    }

    setSessionFormData({
      showNumber: String(session.showNumber),
      performanceDate: session.performanceDate,
      performanceTime: timeValue,
      doorsOpenTime: session.doorsOpenTime || '',
      venueName: session.venueName,
      venueAddress: session.venueAddress || '',
      venueAccess: session.venueAccess || '',
      generalCapacity: session.generalCapacity,
      reservedCapacity: session.reservedCapacity,
    });
    setIsSessionModalOpen(true);
  };

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerformanceId) return;

    const url = editingSessionId
      ? `/api/performances/${selectedPerformanceId}/sessions/${editingSessionId}`
      : `/api/performances/${selectedPerformanceId}/sessions`;
    const method = editingSessionId ? 'PUT' : 'POST';

    try {
      const response = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sessionFormData,
          showNumber: parseInt(sessionFormData.showNumber, 10),
        }),
      });

      if (response.ok) {
        fetchPerformances();
        setIsSessionModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
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

  const handleDeleteSession = async (performanceId: number, sessionId: number) => {
    if (!confirm('このセッションを削除しますか？')) return;

    try {
      const response = await adminFetch(`/api/performances/${performanceId}/sessions/${sessionId}`, { method: 'DELETE' });
      if (response.ok) {
        fetchPerformances();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
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
                    <button
                      onClick={() => handleNewSession(perf.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Plus size={14} />
                      セッション追加
                    </button>
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
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditSession(perf.id, session)}
                              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteSession(perf.id, session.id)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Performance Modal */}
      <Modal
        isOpen={isPerformanceModalOpen}
        onClose={() => setIsPerformanceModalOpen(false)}
        title={editingPerformanceId ? '公演を編集' : '新規公演作成'}
        size="lg"
      >
        <form onSubmit={handleSubmitPerformance} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">タイトル</label>
            <input
              type="text"
              value={performanceFormData.title}
              onChange={(e) => setPerformanceFormData({ ...performanceFormData, title: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              placeholder="easel live vol.2"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">ボリューム</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-500 pointer-events-none">vol</span>
                <input
                  type="text"
                  value={performanceFormData.volume}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setPerformanceFormData({ ...performanceFormData, volume: value });
                  }}
                  className="w-full p-3 pl-12 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  placeholder="2"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">例: 2 → vol2</p>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">公演回数</label>
              <input
                type="number"
                min="1"
                max="20"
                value={performanceFormData.numberOfShows}
                onChange={(e) => setPerformanceFormData({ ...performanceFormData, numberOfShows: parseInt(e.target.value, 10) || 1 })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                placeholder="1"
                required
                disabled={!!editingPerformanceId}
              />
              <p className="text-xs text-slate-500 mt-1">
                {editingPerformanceId ? '※編集時は変更不可' : '何回開催するか'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">年度</label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={performanceFormData.year}
                onChange={(e) => setPerformanceFormData({ ...performanceFormData, year: parseInt(e.target.value, 10) })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                placeholder="2025"
                required
              />
              <p className="text-xs text-slate-500 mt-1">アーカイブページで表示される年度</p>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">販売状態</label>
              <div className="flex items-center h-12">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={performanceFormData.isOnSale}
                    onChange={(e) => setPerformanceFormData({ ...performanceFormData, isOnSale: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">NOW ON SALE</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1">チェックでアーカイブページに「NOW ON SALE」表示</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">一般席料金</label>
              <input
                type="number"
                value={performanceFormData.generalPrice}
                onChange={(e) => setPerformanceFormData({ ...performanceFormData, generalPrice: parseInt(e.target.value, 10) })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">指定席料金</label>
              <input
                type="number"
                value={performanceFormData.reservedPrice}
                onChange={(e) => setPerformanceFormData({ ...performanceFormData, reservedPrice: parseInt(e.target.value, 10) })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">会場名</label>
            <input
              type="text"
              value={performanceFormData.venueName}
              onChange={(e) => setPerformanceFormData({ ...performanceFormData, venueName: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              placeholder="渋谷CLUB QUATTRO"
              required={!editingPerformanceId}
            />
            {!editingPerformanceId && (
              <p className="text-xs text-slate-500 mt-1">全セッションに適用されます（個別に変更可能）</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">会場住所</label>
            <input
              type="text"
              value={performanceFormData.venueAddress}
              onChange={(e) => setPerformanceFormData({ ...performanceFormData, venueAddress: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              placeholder="東京都渋谷区○○..."
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">会場アクセス</label>
            <input
              type="text"
              value={performanceFormData.venueAccess}
              onChange={(e) => setPerformanceFormData({ ...performanceFormData, venueAccess: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              placeholder="JR渋谷駅より徒歩5分"
            />
          </div>

          {/* セッション日時フォーム */}
          {!editingPerformanceId && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-medium text-slate-700 mb-4">各セッションの日時</h3>
              <div className="space-y-4">
                {sessionsDatesData.map((session, index) => (
                  <div key={session.showNumber} className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-600 mb-3">
                      {session.showNumber}回目 ({index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`})
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">公演日</label>
                        <input
                          type="date"
                          value={session.performanceDate}
                          onChange={(e) => {
                            const newData = [...sessionsDatesData];
                            newData[index].performanceDate = e.target.value;
                            setSessionsDatesData(newData);
                          }}
                          className="w-full p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">開演時刻</label>
                        <input
                          type="time"
                          value={session.performanceTime}
                          onChange={(e) => {
                            const newData = [...sessionsDatesData];
                            newData[index].performanceTime = e.target.value;
                            setSessionsDatesData(newData);
                          }}
                          className="w-full p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">開場時刻</label>
                        <input
                          type="time"
                          value={session.doorsOpenTime}
                          onChange={(e) => {
                            const newData = [...sessionsDatesData];
                            newData[index].doorsOpenTime = e.target.value;
                            setSessionsDatesData(newData);
                          }}
                          className="w-full p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-600 mb-1">説明</label>
            <textarea
              value={performanceFormData.description}
              onChange={(e) => setPerformanceFormData({ ...performanceFormData, description: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              rows={4}
              placeholder="公演の説明..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsPerformanceModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              {editingPerformanceId ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Session Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title={editingSessionId ? 'セッションを編集' : 'セッション追加'}
        size="lg"
      >
        <form onSubmit={handleSubmitSession} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">公演回数</label>
            <input
              type="number"
              min="1"
              value={sessionFormData.showNumber}
              onChange={(e) => setSessionFormData({ ...sessionFormData, showNumber: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              placeholder="1"
              required
            />
            <p className="text-xs text-slate-500 mt-1">例: 1 → 1st</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">公演日</label>
              <input
                type="date"
                value={sessionFormData.performanceDate}
                onChange={(e) => setSessionFormData({ ...sessionFormData, performanceDate: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">開演時間</label>
              <input
                type="time"
                value={sessionFormData.performanceTime}
                onChange={(e) => setSessionFormData({ ...sessionFormData, performanceTime: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">会場名</label>
            <input
              type="text"
              value={sessionFormData.venueName}
              onChange={(e) => setSessionFormData({ ...sessionFormData, venueName: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              placeholder="渋谷CLUB QUATTRO"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">一般席数</label>
              <input
                type="number"
                value={sessionFormData.generalCapacity}
                onChange={(e) => setSessionFormData({ ...sessionFormData, generalCapacity: parseInt(e.target.value, 10) })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">指定席数</label>
              <input
                type="number"
                value={sessionFormData.reservedCapacity}
                onChange={(e) => setSessionFormData({ ...sessionFormData, reservedCapacity: parseInt(e.target.value, 10) })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsSessionModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              {editingSessionId ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Information Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="詳細情報編集"
        size="2xl"
      >
        <form onSubmit={handleSubmitDetails} className="space-y-6">
          {/* フライヤー画像 */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">フライヤー画像</h3>
            <div className="space-y-3">
              {detailFormData.flyerImages.map((image, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex gap-3">
                    {/* プレビュー */}
                    <div className="flex-shrink-0">
                      {image.url ? (
                        <div className="relative w-24 h-24 rounded border border-slate-200 overflow-hidden bg-slate-50">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                          <ImageIcon size={32} className="text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* 入力フィールド */}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        {/* ファイル選択ボタン */}
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, index)}
                            className="hidden"
                            disabled={uploadingImageIndex === index}
                          />
                          <div className={`flex items-center gap-2 px-3 py-2 text-sm border rounded ${
                            uploadingImageIndex === index
                              ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}>
                            <Upload size={16} />
                            {uploadingImageIndex === index ? 'アップロード中...' : 'ファイル選択'}
                          </div>
                        </label>

                        {/* URL入力 */}
                        <input
                          type="text"
                          placeholder="または画像URL"
                          value={image.url}
                          onChange={(e) => {
                            const newImages = [...detailFormData.flyerImages];
                            newImages[index].url = e.target.value;
                            setDetailFormData({ ...detailFormData, flyerImages: newImages });
                          }}
                          className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                        />
                      </div>

                      <div className="flex gap-2">
                        {/* 名前入力 */}
                        <input
                          type="text"
                          placeholder="画像名（例: 井口舞子）"
                          value={image.name}
                          onChange={(e) => {
                            const newImages = [...detailFormData.flyerImages];
                            newImages[index].name = e.target.value;
                            setDetailFormData({ ...detailFormData, flyerImages: newImages });
                          }}
                          className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                        />

                        {/* 削除ボタン */}
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = detailFormData.flyerImages.filter((_, i) => i !== index);
                            setDetailFormData({ ...detailFormData, flyerImages: newImages });
                          }}
                          className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  setDetailFormData({
                    ...detailFormData,
                    flyerImages: [...detailFormData.flyerImages, { url: '', name: '' }]
                  });
                }}
                className="w-full px-4 py-3 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 flex items-center justify-center gap-2 border border-dashed border-slate-300"
              >
                <Plus size={16} />
                画像を追加
              </button>

              <p className="text-xs text-slate-500 mt-2">
                ※ 画像ファイルをアップロード（JPEG, PNG, GIF, WebP / 最大15MB）、またはURLを直接入力できます
              </p>
            </div>
          </div>

          {/* 画家 */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Painter</h3>
            <div className="space-y-2">
              {detailFormData.painters.map((painter, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="名前"
                    value={painter.name}
                    onChange={(e) => {
                      const newPainters = [...detailFormData.painters];
                      newPainters[index].name = e.target.value;
                      setDetailFormData({ ...detailFormData, painters: newPainters });
                    }}
                    className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Instagram"
                    value={painter.instagram || ''}
                    onChange={(e) => {
                      const newPainters = [...detailFormData.painters];
                      newPainters[index].instagram = e.target.value;
                      setDetailFormData({ ...detailFormData, painters: newPainters });
                    }}
                    className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newPainters = detailFormData.painters.filter((_, i) => i !== index);
                      setDetailFormData({ ...detailFormData, painters: newPainters });
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setDetailFormData({
                    ...detailFormData,
                    painters: [...detailFormData.painters, { name: '', instagram: '' }]
                  });
                }}
                className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
              >
                + Painter追加
              </button>
            </div>
          </div>

          {/* 振付師 */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Choreographer</h3>
            <div className="space-y-2">
              {detailFormData.choreographers.map((choreo, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="名前"
                    value={choreo.name}
                    onChange={(e) => {
                      const newChoreos = [...detailFormData.choreographers];
                      newChoreos[index].name = e.target.value;
                      setDetailFormData({ ...detailFormData, choreographers: newChoreos });
                    }}
                    className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="所属"
                    value={choreo.company || ''}
                    onChange={(e) => {
                      const newChoreos = [...detailFormData.choreographers];
                      newChoreos[index].company = e.target.value;
                      setDetailFormData({ ...detailFormData, choreographers: newChoreos });
                    }}
                    className="w-32 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Instagram"
                    value={choreo.instagram || ''}
                    onChange={(e) => {
                      const newChoreos = [...detailFormData.choreographers];
                      newChoreos[index].instagram = e.target.value;
                      setDetailFormData({ ...detailFormData, choreographers: newChoreos });
                    }}
                    className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newChoreos = detailFormData.choreographers.filter((_, i) => i !== index);
                      setDetailFormData({ ...detailFormData, choreographers: newChoreos });
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setDetailFormData({
                    ...detailFormData,
                    choreographers: [...detailFormData.choreographers, { name: '', instagram: '', company: '' }]
                  });
                }}
                className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
              >
                + Choreographer追加
              </button>
            </div>
          </div>

          {/* Navigator */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Navigator</h3>
            <div className="space-y-2">
              {detailFormData.navigators.map((nav, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="名前"
                    value={nav.name}
                    onChange={(e) => {
                      const newNavs = [...detailFormData.navigators];
                      newNavs[index].name = e.target.value;
                      setDetailFormData({ ...detailFormData, navigators: newNavs });
                    }}
                    className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="所属"
                    value={nav.company || ''}
                    onChange={(e) => {
                      const newNavs = [...detailFormData.navigators];
                      newNavs[index].company = e.target.value;
                      setDetailFormData({ ...detailFormData, navigators: newNavs });
                    }}
                    className="w-32 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Instagram"
                    value={nav.instagram || ''}
                    onChange={(e) => {
                      const newNavs = [...detailFormData.navigators];
                      newNavs[index].instagram = e.target.value;
                      setDetailFormData({ ...detailFormData, navigators: newNavs });
                    }}
                    className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newNavs = detailFormData.navigators.filter((_, i) => i !== index);
                      setDetailFormData({ ...detailFormData, navigators: newNavs });
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setDetailFormData({
                    ...detailFormData,
                    navigators: [...detailFormData.navigators, { name: '', instagram: '', company: '' }]
                  });
                }}
                className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
              >
                + Navigator追加
              </button>
            </div>
          </div>

          {/* Guest Dancer */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Guest Dancer</h3>
            <div className="space-y-2">
              {detailFormData.guestDancers.map((guest, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="名前"
                    value={guest.name}
                    onChange={(e) => {
                      const newGuests = [...detailFormData.guestDancers];
                      newGuests[index].name = e.target.value;
                      setDetailFormData({ ...detailFormData, guestDancers: newGuests });
                    }}
                    className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="所属"
                    value={guest.company || ''}
                    onChange={(e) => {
                      const newGuests = [...detailFormData.guestDancers];
                      newGuests[index].company = e.target.value;
                      setDetailFormData({ ...detailFormData, guestDancers: newGuests });
                    }}
                    className="w-32 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Instagram"
                    value={guest.instagram || ''}
                    onChange={(e) => {
                      const newGuests = [...detailFormData.guestDancers];
                      newGuests[index].instagram = e.target.value;
                      setDetailFormData({ ...detailFormData, guestDancers: newGuests });
                    }}
                    className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newGuests = detailFormData.guestDancers.filter((_, i) => i !== index);
                      setDetailFormData({ ...detailFormData, guestDancers: newGuests });
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setDetailFormData({
                    ...detailFormData,
                    guestDancers: [...detailFormData.guestDancers, { name: '', instagram: '', company: '' }]
                  });
                }}
                className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
              >
                + Guest Dancer追加
              </button>
            </div>
          </div>

          {/* Staff */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Staff</h3>
            <div className="space-y-2">
              {detailFormData.staff.map((staff, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="役割（例: 企画・運営）"
                    value={staff.role}
                    onChange={(e) => {
                      const newStaff = [...detailFormData.staff];
                      newStaff[index].role = e.target.value;
                      setDetailFormData({ ...detailFormData, staff: newStaff });
                    }}
                    className="w-32 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="名前"
                    value={staff.name}
                    onChange={(e) => {
                      const newStaff = [...detailFormData.staff];
                      newStaff[index].name = e.target.value;
                      setDetailFormData({ ...detailFormData, staff: newStaff });
                    }}
                    className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="所属"
                    value={staff.company || ''}
                    onChange={(e) => {
                      const newStaff = [...detailFormData.staff];
                      newStaff[index].company = e.target.value;
                      setDetailFormData({ ...detailFormData, staff: newStaff });
                    }}
                    className="w-32 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Instagram"
                    value={staff.instagram || ''}
                    onChange={(e) => {
                      const newStaff = [...detailFormData.staff];
                      newStaff[index].instagram = e.target.value;
                      setDetailFormData({ ...detailFormData, staff: newStaff });
                    }}
                    className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newStaff = detailFormData.staff.filter((_, i) => i !== index);
                      setDetailFormData({ ...detailFormData, staff: newStaff });
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setDetailFormData({
                    ...detailFormData,
                    staff: [...detailFormData.staff, { role: '', name: '', instagram: '', company: '' }]
                  });
                }}
                className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
              >
                + Staff追加
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsDetailModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
