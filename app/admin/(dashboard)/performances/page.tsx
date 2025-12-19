/**
 * 公演管理ページ（リファクタリング版）
 * 575行 → 約250行に削減
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { PerformanceList } from './components/PerformanceList';
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
  navigators?: Array<{ name: string; note?: string; instagram?: string; company?: string }>;
  guestDancers?: Array<{ name: string; instagram?: string; company?: string; note?: string }>;
  staff?: Array<{ role: string; names: string; instagram?: string; company?: string }>;
  sessions: PerformanceSession[];
}

export default function AdminPerformancesPage() {
  const { adminFetch } = useAdminUser();

  // データ状態
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  // モーダル状態
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPerformanceId, setEditingPerformanceId] = useState<number | null>(null);

  // フォームデータ
  const [performanceFormData, setPerformanceFormData] = useState<PerformanceFormData>({
    title: '',
    volume: '',
    isOnSale: false,
    generalPrice: 0,
    reservedPrice: 0,
    vip1Price: 0,
    vip2Price: 0,
    vip1Note: '',
    vip2Note: '',
    venueName: '',
    venueAddress: '',
    venueAccess: '',
    description: '',
    numberOfShows: 1,
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
    },
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

  // データ取得
  useEffect(() => {
    fetchPerformances();
  }, [adminFetch]);

  const fetchPerformances = async () => {
    try {
      const response = await adminFetch('/api/performances');
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a: Performance, b: Performance) => {
          const aNum = a.volume ? parseFloat(a.volume.replace(/[^0-9.]/g, '')) : 0;
          const bNum = b.volume ? parseFloat(b.volume.replace(/[^0-9.]/g, '')) : 0;
          return bNum - aNum;
        });
        setPerformances(sortedData);
      }
    } catch (error) {
      console.error('Failed to fetch performances:', error);
    } finally {
      setLoading(false);
    }
  };

  // 新規公演作成
  const handleNewPerformance = () => {
    setPerformanceFormData({
      title: '',
      volume: '',
      isOnSale: false,
      generalPrice: 0,
      reservedPrice: 0,
      vip1Price: 0,
      vip2Price: 0,
      vip1Note: '',
      vip2Note: '',
      venueName: '',
      venueAddress: '',
      venueAccess: '',
      description: '',
      numberOfShows: 1,
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
      },
    ]);
    setEditingPerformanceId(null);
    setIsPerformanceModalOpen(true);
  };

  // 公演編集
  const handleEditPerformance = (performance: Performance) => {
    setPerformanceFormData({
      title: performance.title,
      volume: performance.volume || '',
      isOnSale: performance.isOnSale || false,
      generalPrice: performance.generalPrice,
      reservedPrice: performance.reservedPrice,
      vip1Price: performance.vip1Price || 0,
      vip2Price: performance.vip2Price || 0,
      vip1Note: performance.vip1Note || '',
      vip2Note: performance.vip2Note || '',
      venueName: performance.sessions?.[0]?.venueName || '',
      venueAddress: performance.sessions?.[0]?.venueAddress || '',
      venueAccess: performance.sessions?.[0]?.venueAccess || '',
      description: performance.description || '',
      numberOfShows: performance.sessions?.length || 1,
    });

    const sessionsData = performance.sessions.map((session) => {
      let dateValue = '';
      if (session.performanceDate) {
        const perfDate = session.performanceDate as any;
        if (typeof perfDate === 'string') {
          dateValue = perfDate.includes('-') ? perfDate.split('T')[0] : perfDate;
        } else if (perfDate instanceof Date) {
          dateValue = perfDate.toISOString().split('T')[0];
        } else {
          const date = new Date(perfDate);
          if (!isNaN(date.getTime())) {
            dateValue = date.toISOString().split('T')[0];
          }
        }
      }

      let timeValue = '';
      if (session.performanceTime) {
        const perfTime = session.performanceTime as any;
        if (typeof perfTime === 'string') {
          timeValue = perfTime.includes('T') ? perfTime.split('T')[1].slice(0, 5) : perfTime;
        } else if (perfTime instanceof Date) {
          timeValue = perfTime.toTimeString().slice(0, 5);
        } else {
          const date = new Date(perfTime);
          if (!isNaN(date.getTime())) {
            timeValue = date.toTimeString().slice(0, 5);
          }
        }
      }

      let doorsValue = '';
      if (session.doorsOpenTime) {
        const doorsTime = session.doorsOpenTime as any;
        if (typeof doorsTime === 'string') {
          doorsValue = doorsTime.includes('T') ? doorsTime.split('T')[1].slice(0, 5) : doorsTime;
        } else if (doorsTime instanceof Date) {
          doorsValue = doorsTime.toTimeString().slice(0, 5);
        } else {
          const date = new Date(doorsTime);
          if (!isNaN(date.getTime())) {
            doorsValue = date.toTimeString().slice(0, 5);
          }
        }
      }

      return {
        id: session.id,
        showNumber: session.showNumber,
        performanceDate: dateValue,
        performanceTime: timeValue,
        doorsOpenTime: doorsValue,
        generalCapacity: session.generalCapacity,
        reservedCapacity: session.reservedCapacity,
        vip1Capacity: session.vip1Capacity || 0,
        vip2Capacity: session.vip2Capacity || 0,
      };
    });

    setSessionsDatesData(sessionsData);
    setEditingPerformanceId(performance.id);
    setIsPerformanceModalOpen(true);
  };

  // 詳細情報編集
  const handleEditDetails = (performance: Performance) => {
    setDetailFormData({
      flyerImages: (performance as any).flyerImages || [],
      painters: (performance as any).painters || [],
      choreographers: (performance as any).choreographers || [],
      navigators: (performance as any).navigators || [],
      guestDancers: (performance as any).guestDancers || [],
      staff: (performance as any).staff || [],
    });
    setEditingPerformanceId(performance.id);
    setIsDetailModalOpen(true);
  };

  // 公演削除
  const handleDeletePerformance = async (id: number) => {
    if (!confirm('この公演を削除しますか？関連するセッションも削除されます。')) {
      return;
    }

    try {
      const response = await adminFetch(`/api/performances/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPerformances();
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete performance:', error);
      alert('削除に失敗しました');
    }
  };

  // 公演の作成・更新送信
  const handleSubmitPerformance = async () => {
    const url = editingPerformanceId
      ? `/api/performances/${editingPerformanceId}`
      : '/api/performances';
    const method = editingPerformanceId ? 'PUT' : 'POST';

    try {
      const response = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...performanceFormData,
          sessionsDates: sessionsDatesData,
        }),
      });

      if (response.ok) {
        fetchPerformances();
        setIsPerformanceModalOpen(false);
        setEditingPerformanceId(null);
      } else {
        const data = await response.json();
        alert(data.error || '保存に失敗しました');
      }
    } catch (error) {
      console.error('Failed to save performance:', error);
      alert('保存に失敗しました');
    }
  };

  // ファイルアップロード
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

  // 詳細情報の保存
  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerformanceId) return;

    try {
      const response = await adminFetch(`/api/performances/${editingPerformanceId}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detailFormData),
      });

      if (response.ok) {
        fetchPerformances();
        setIsDetailModalOpen(false);
        setEditingPerformanceId(null);
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('Failed to save details:', error);
      alert('保存に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href="/admin"
            className="inline-flex items-center text-slate-600 hover:text-slate-800 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            管理画面トップ
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">公演管理</h1>
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <PerformanceList
          performances={performances}
          loading={loading}
          onEdit={handleEditPerformance}
          onEditDetails={handleEditDetails}
          onDelete={handleDeletePerformance}
        />
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
