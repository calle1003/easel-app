'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Plus, User, Filter, XCircle, Upload } from 'lucide-react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { Modal } from '@/components/ui/modal';

interface PerformanceSession {
  id: number;
  showNumber: number;
  performanceDate: string;
  performanceTime: string;
  venueName: string;
}

interface Performance {
  id: number;
  title: string;
  volume: string | null;
  performanceDate: string;
  performanceTime: string;
  sessions?: PerformanceSession[];
}

interface Performer {
  id: number;
  name: string;
  nameKana: string | null;
  performances?: {
    performanceId: number;
    performance: Performance;
  }[];
  _count: {
    performances: number;
    exchangeCodes: number;
  };
}

export default function AdminPerformersPage() {
  const { adminFetch } = useAdminUser();
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterPerformanceIds, setFilterPerformanceIds] = useState<number[]>([]);
  const [performanceSearchText, setPerformanceSearchText] = useState<string>('');
  const [showPerformanceDropdown, setShowPerformanceDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameKana: '',
    performanceIds: [] as number[],
    codesPerSession: {} as Record<number, number>,
  });
  
  // CSV一括登録用の状態
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<{ name: string; nameKana: string }[]>([]);
  const [batchPerformanceIds, setBatchPerformanceIds] = useState<number[]>([]);
  const [codesPerSession, setCodesPerSession] = useState<Record<number, number>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPerformers();
    fetchPerformances();
  }, [adminFetch]);

  // ドロップダウンを閉じるためのクリックハンドラー
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown')) {
        setShowPerformanceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPerformers = async () => {
    try {
      const response = await adminFetch('/api/performers');
      if (response.ok) {
        const data = await response.json();
        setPerformers(data);
      }
    } catch (error) {
      console.error('Failed to fetch performers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformances = async () => {
    try {
      const response = await adminFetch('/api/performances');
      if (response.ok) {
        const data = await response.json();
        setPerformances(data);
      }
    } catch (error) {
      console.error('Failed to fetch performances:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingId ? `/api/performers/${editingId}` : '/api/performers';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await adminFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchPerformers();
        resetForm();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to save performer:', error);
    }
  };

  const handleEdit = async (performer: Performer) => {
    setEditingId(performer.id);
    
    // 出演者の詳細情報を取得
    try {
      const response = await adminFetch(`/api/performers/${performer.id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name,
          nameKana: data.nameKana || '',
          performanceIds: data.performances?.map((p: any) => p.performanceId) || [],
          codesPerSession: {}, // 編集時は引換券コードは設定しない
        });
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch performer details:', error);
    }
  };

  const handleNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この出演者を削除しますか？')) return;

    try {
      const response = await adminFetch(`/api/performers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchPerformers();
      } else {
        const data = await response.json();
        alert(data.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete performer:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', nameKana: '', performanceIds: [], codesPerSession: {} });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const togglePerformance = (performanceId: number) => {
    setFormData((prev) => {
      const isSelected = prev.performanceIds.includes(performanceId);
      
      // 公演を外す場合、その公演のセッションのコード数設定もクリア
      if (isSelected) {
        const perf = performances.find((p) => p.id === performanceId);
        const newCodesPerSession = { ...prev.codesPerSession };
        if (perf?.sessions) {
          perf.sessions.forEach((session) => {
            delete newCodesPerSession[session.id];
          });
        }
        
        return {
          ...prev,
          performanceIds: prev.performanceIds.filter((id) => id !== performanceId),
          codesPerSession: newCodesPerSession,
        };
      }
      
      return {
        ...prev,
        performanceIds: [...prev.performanceIds, performanceId],
      };
    });
  };

  // 検索用にフィルタリングされた公演リスト
  const filteredPerformanceOptions = useMemo(() => {
    if (!performanceSearchText) return performances;
    const searchLower = performanceSearchText.toLowerCase();
    return performances.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.volume?.toLowerCase().includes(searchLower)
    );
  }, [performances, performanceSearchText]);

  // フィルタリング処理（複数選択対応）
  const filteredPerformers = useMemo(() => {
    if (filterPerformanceIds.length === 0) return performers;

    return performers.filter((performer) =>
      performer.performances?.some((pp) => 
        filterPerformanceIds.includes(pp.performanceId) || 
        filterPerformanceIds.includes(pp.performance?.id)
      )
    );
  }, [performers, filterPerformanceIds]);

  const handleTogglePerformance = (performanceId: number) => {
    setFilterPerformanceIds((prev) => {
      if (prev.includes(performanceId)) {
        return prev.filter((id) => id !== performanceId);
      } else {
        return [...prev, performanceId];
      }
    });
  };

  const handleRemovePerformance = (performanceId: number) => {
    setFilterPerformanceIds((prev) => prev.filter((id) => id !== performanceId));
  };

  const clearPerformanceFilter = () => {
    setFilterPerformanceIds([]);
    setPerformanceSearchText('');
  };

  const getPerformanceLabel = (performanceId: number) => {
    const performance = performances.find((p) => p.id === performanceId);
    if (!performance) return '';
    return `${performance.title}${performance.volume ? ` (${performance.volume})` : ''} - ${new Date(performance.performanceDate).toLocaleDateString('ja-JP')}`;
  };

  // CSVファイル読み込み
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      
      // ヘッダー行をスキップ
      const dataLines = lines.slice(1);
      
      const parsedData = dataLines.map((line) => {
        const [name, nameKana] = line.split(',').map((s) => s.trim());
        return { name, nameKana: nameKana || '' };
      }).filter((item) => item.name); // 名前が空でない行のみ

      setCsvData(parsedData);
    };

    reader.readAsText(file);
  };

  // CSV一括登録
  const handleBatchUpload = async () => {
    if (csvData.length === 0) {
      alert('CSVデータがありません');
      return;
    }

    setUploading(true);

    try {
      const response = await adminFetch('/api/performers/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          performers: csvData,
          performanceIds: batchPerformanceIds,
          codesPerSession,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${result.count}件の出演者と${result.totalCodes}件の引換券コードを登録しました`);
        fetchPerformers();
        resetBatchModal();
        setIsBatchModalOpen(false);
      } else {
        const data = await response.json();
        alert(data.error || '一括登録に失敗しました');
      }
    } catch (error) {
      console.error('Failed to batch upload performers:', error);
      alert('一括登録に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const resetBatchModal = () => {
    setCsvFile(null);
    setCsvData([]);
    setBatchPerformanceIds([]);
    setCodesPerSession({});
  };

  // 単一登録：選択された公演のセッション一覧を取得
  const getSingleSelectedSessions = useMemo(() => {
    const sessions: Array<PerformanceSession & { performanceTitle: string; performanceVolume: string | null }> = [];
    formData.performanceIds.forEach((perfId) => {
      const perf = performances.find((p) => p.id === perfId);
      if (perf?.sessions) {
        perf.sessions.forEach((session) => {
          sessions.push({
            ...session,
            performanceTitle: perf.title,
            performanceVolume: perf.volume,
          });
        });
      }
    });
    return sessions.sort((a, b) => {
      const dateA = new Date(a.performanceDate).getTime();
      const dateB = new Date(b.performanceDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.showNumber - b.showNumber;
    });
  }, [formData.performanceIds, performances]);

  // 単一登録：セッションごとのコード数を設定
  const handleSetSingleCodesForSession = (sessionId: number, count: number) => {
    setFormData((prev) => ({
      ...prev,
      codesPerSession: {
        ...prev.codesPerSession,
        [sessionId]: Math.max(0, count),
      },
    }));
  };

  // 単一登録：合計コード数を計算
  const singleTotalCodesCount = useMemo(() => {
    return Object.values(formData.codesPerSession).reduce((sum, count) => sum + count, 0);
  }, [formData.codesPerSession]);

  // CSV一括登録：選択された公演のセッション一覧を取得
  const getSelectedSessions = useMemo(() => {
    const sessions: Array<PerformanceSession & { performanceTitle: string; performanceVolume: string | null }> = [];
    batchPerformanceIds.forEach((perfId) => {
      const perf = performances.find((p) => p.id === perfId);
      if (perf?.sessions) {
        perf.sessions.forEach((session) => {
          sessions.push({
            ...session,
            performanceTitle: perf.title,
            performanceVolume: perf.volume,
          });
        });
      }
    });
    return sessions.sort((a, b) => {
      const dateA = new Date(a.performanceDate).getTime();
      const dateB = new Date(b.performanceDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.showNumber - b.showNumber;
    });
  }, [batchPerformanceIds, performances]);

  // セッションごとのコード数を設定
  const handleSetCodesForSession = (sessionId: number, count: number) => {
    setCodesPerSession((prev) => ({
      ...prev,
      [sessionId]: Math.max(0, count),
    }));
  };

  // 合計コード数を計算
  const totalCodesCount = useMemo(() => {
    return Object.values(codesPerSession).reduce((sum, count) => sum + count, 0) * csvData.length;
  }, [codesPerSession, csvData]);

  const handleToggleBatchPerformance = (performanceId: number) => {
    setBatchPerformanceIds((prev) => {
      if (prev.includes(performanceId)) {
        // 公演を外す場合、その公演のセッションのコード数設定もクリア
        const perf = performances.find((p) => p.id === performanceId);
        if (perf?.sessions) {
          setCodesPerSession((prevCodes) => {
            const newCodes = { ...prevCodes };
            perf.sessions?.forEach((session) => {
              delete newCodes[session.id];
            });
            return newCodes;
          });
        }
        return prev.filter((id) => id !== performanceId);
      } else {
        return [...prev, performanceId];
      }
    });
  };

  const handleRemoveBatchPerformance = (performanceId: number) => {
    // 公演を外す場合、その公演のセッションのコード数設定もクリア
    const perf = performances.find((p) => p.id === performanceId);
    if (perf?.sessions) {
      setCodesPerSession((prevCodes) => {
        const newCodes = { ...prevCodes };
        perf.sessions?.forEach((session) => {
          delete newCodes[session.id];
        });
        return newCodes;
      });
    }
    setBatchPerformanceIds((prev) => prev.filter((id) => id !== performanceId));
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
              <h1 className="text-xl font-medium text-slate-800">出演者管理</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleNew}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                <Plus size={18} />
                新規出演者登録
              </button>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
              >
                <Upload size={18} />
                CSV一括登録
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-slate-500" />
            <h3 className="text-sm font-medium text-slate-700">フィルター</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 公演フィルター（複数選択） */}
            <div className="relative filter-dropdown">
              <label className="block text-xs text-slate-500 mb-1">公演（複数選択可）</label>
              <input
                type="text"
                value={performanceSearchText}
                onChange={(e) => {
                  setPerformanceSearchText(e.target.value);
                  setShowPerformanceDropdown(true);
                }}
                onFocus={() => setShowPerformanceDropdown(true)}
                placeholder="公演名を入力..."
                className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              />
              {showPerformanceDropdown && filteredPerformanceOptions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredPerformanceOptions.map((performance) => (
                    <label
                      key={performance.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filterPerformanceIds.includes(performance.id)}
                        onChange={() => handleTogglePerformance(performance.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-700">
                          {performance.title} {performance.volume && `(${performance.volume})`}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(performance.performanceDate).toLocaleDateString('ja-JP')} {typeof performance.performanceTime === 'string' && performance.performanceTime.includes('T') ? performance.performanceTime.split('T')[1].slice(0, 5) : performance.performanceTime}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {/* 選択された公演の表示 */}
              {filterPerformanceIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {filterPerformanceIds.map((performanceId) => (
                    <div
                      key={performanceId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                    >
                      <span>{getPerformanceLabel(performanceId).split(' - ')[0]}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePerformance(performanceId)}
                        className="hover:text-blue-900 transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {filterPerformanceIds.length > 0 && (
            <button
              onClick={clearPerformanceFilter}
              className="mt-3 text-xs text-blue-600 hover:text-blue-500"
            >
              フィルターをクリア
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-800">出演者一覧</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center text-slate-400">読み込み中...</div>
          ) : filteredPerformers.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              {performers.length === 0 ? '出演者がいません' : 'フィルター条件に一致する出演者がいません'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">名前</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">ふりがな</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">公演数</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">引換券数</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-6 py-3">アクション</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPerformers.map((performer) => (
                    <tr key={performer.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                            <User size={20} className="text-slate-400" />
                          </div>
                          <span className="font-medium text-slate-700">{performer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {performer.nameKana || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {performer._count.performances}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {performer._count.exchangeCodes}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(performer)}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(performer.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* 単一登録モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? '出演者を編集' : '新規出演者登録'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">名前 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              placeholder="山田太郎"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">ふりがな</label>
            <input
              type="text"
              value={formData.nameKana}
              onChange={(e) => setFormData({ ...formData, nameKana: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              placeholder="やまだたろう"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">
              出演公演（複数選択可） <span className="text-red-500">*</span>
            </label>
            <div className="border border-slate-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
              {performances.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">公演がありません</p>
              ) : (
                performances.map((performance) => (
                  <label
                    key={performance.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.performanceIds.includes(performance.id)}
                      onChange={() => togglePerformance(performance.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700">
                        {performance.title}
                        {performance.volume && (
                          <span className="ml-2 text-xs text-slate-500">({performance.volume})</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(performance.performanceDate).toLocaleDateString('ja-JP')} {typeof performance.performanceTime === 'string' && performance.performanceTime.includes('T') ? performance.performanceTime.split('T')[1].slice(0, 5) : performance.performanceTime}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {formData.performanceIds.length === 0 && (
              <p className="text-xs text-red-500 mt-1">少なくとも1つの公演を選択してください</p>
            )}
          </div>

          {/* 編集時の注意 */}
          {editingId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                ℹ️ 編集モードでは引換券コードの設定はできません。引換券コードは出演者管理画面から個別に追加してください。
              </p>
            </div>
          )}

          {/* 引換券コード数設定（セッションごと） - 新規登録時のみ */}
          {!editingId && formData.performanceIds.length === 0 && (
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600 text-center">
                出演公演を選択すると、引換券コード数の設定が表示されます
              </p>
            </div>
          )}

          {!editingId && formData.performanceIds.length > 0 && getSingleSelectedSessions.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                選択した公演にセッション情報がありません
              </p>
            </div>
          )}

          {!editingId && getSingleSelectedSessions.length > 0 && (
            <div>
              <label className="block text-sm text-slate-600 mb-2">
                引換券コード数設定 <span className="text-red-500">*</span>
              </label>
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                {getSingleSelectedSessions.map((session) => {
                  const showNumber = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][session.showNumber - 1] || `${session.showNumber}th`;
                  const date = new Date(session.performanceDate);
                  const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
                  
                  return (
                    <div key={session.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700">
                          {session.performanceTitle}
                          {session.performanceVolume && (
                            <span className="ml-2 text-xs text-slate-500">({session.performanceVolume})</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {showNumber} - {dateStr} - {session.venueName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.codesPerSession[session.id] || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            const num = value === '' ? 0 : Math.min(parseInt(value, 10), 50);
                            handleSetSingleCodesForSession(session.id, num);
                          }}
                          className="w-20 p-2 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                          placeholder="0"
                        />
                        <span className="text-xs text-slate-500 whitespace-nowrap">枚</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {singleTotalCodesCount > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">合計:</span> <span className="font-bold text-lg">{singleTotalCodesCount}枚</span>の引換券コードが生成されます
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                各公演日時ごとに、割り当てる引換券コード数を設定してください
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={formData.performanceIds.length === 0 || (!editingId && singleTotalCodesCount === 0)}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {editingId ? '更新' : '登録'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV一括登録モーダル */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          resetBatchModal();
        }}
        title="CSV一括登録"
        size="lg"
      >
        <div className="space-y-4">
          {/* CSV形式の説明 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">CSVファイルの形式</h3>
            <pre className="text-xs text-slate-600 font-mono bg-white p-2 rounded border border-slate-200">
{`名前,かな
山田太郎,やまだたろう
佐藤花子,さとうはなこ
鈴木一郎,すずきいちろう`}
            </pre>
            <p className="text-xs text-slate-500 mt-2">※ 1行目はヘッダー行として読み飛ばされます</p>
          </div>

          {/* ファイル選択 */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">CSVファイル *</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            />
          </div>

          {/* プレビュー */}
          {csvData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">
                プレビュー（{csvData.length}件）
              </h3>
              <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium">名前</th>
                      <th className="text-left px-3 py-2 text-xs text-slate-500 font-medium">かな</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {csvData.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2 text-slate-500">{item.nameKana || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 公演選択 */}
          <div>
            <label className="block text-sm text-slate-600 mb-2">
              出演公演（複数選択可） <span className="text-red-500">*</span>
            </label>
            <div className="border border-slate-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
              {performances.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">公演がありません</p>
              ) : (
                performances.map((performance) => (
                  <label
                    key={performance.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={batchPerformanceIds.includes(performance.id)}
                      onChange={() => handleToggleBatchPerformance(performance.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700">
                        {performance.title}
                        {performance.volume && (
                          <span className="ml-2 text-xs text-slate-500">({performance.volume})</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(performance.performanceDate).toLocaleDateString('ja-JP')} {typeof performance.performanceTime === 'string' && performance.performanceTime.includes('T') ? performance.performanceTime.split('T')[1].slice(0, 5) : performance.performanceTime}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {/* 選択された公演の表示 */}
            {batchPerformanceIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {batchPerformanceIds.map((performanceId) => (
                  <div
                    key={performanceId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                  >
                    <span>{getPerformanceLabel(performanceId).split(' - ')[0]}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBatchPerformance(performanceId)}
                      className="hover:text-blue-900 transition-colors"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 引換券コード数設定（セッションごと） */}
          {batchPerformanceIds.length === 0 && (
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600 text-center">
                出演公演を選択すると、引換券コード数の設定が表示されます
              </p>
            </div>
          )}

          {batchPerformanceIds.length > 0 && getSelectedSessions.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                選択した公演にセッション情報がありません
              </p>
            </div>
          )}

          {getSelectedSessions.length > 0 && (
            <div>
              <label className="block text-sm text-slate-600 mb-2">
                引換券コード数設定 <span className="text-red-500">*</span>
              </label>
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                {getSelectedSessions.map((session) => {
                  const showNumber = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][session.showNumber - 1] || `${session.showNumber}th`;
                  const date = new Date(session.performanceDate);
                  const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
                  
                  return (
                    <div key={session.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700">
                          {session.performanceTitle}
                          {session.performanceVolume && (
                            <span className="ml-2 text-xs text-slate-500">({session.performanceVolume})</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {showNumber} - {dateStr} - {session.venueName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={codesPerSession[session.id] || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            const num = value === '' ? 0 : Math.min(parseInt(value, 10), 50);
                            handleSetCodesForSession(session.id, num);
                          }}
                          className="w-20 p-2 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                          placeholder="0"
                        />
                        <span className="text-xs text-slate-500 whitespace-nowrap">枚/人</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalCodesCount > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">合計:</span> {csvData.length}人 × {Object.values(codesPerSession).reduce((sum, count) => sum + count, 0)}枚 = <span className="font-bold text-lg">{totalCodesCount}枚</span>の引換券コードが生成されます
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                各公演日時ごとに、出演者1人あたりに割り当てる引換券コード数を設定してください
              </p>
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsBatchModalOpen(false);
                resetBatchModal();
              }}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleBatchUpload}
              disabled={uploading || csvData.length === 0 || batchPerformanceIds.length === 0 || totalCodesCount === 0}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '登録中...' : `${csvData.length}件を一括登録`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
