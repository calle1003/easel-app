'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Check, X, Copy, Layers, Filter, XCircle } from 'lucide-react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { Modal } from '@/components/ui/modal';

interface PerformanceSession {
  id: number;
  showNumber: number;
  performanceDate: string;
  performanceTime: string;
  venueName: string;
  saleStatus: string;
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
    performance: Performance;
  }[];
}

interface ExchangeCode {
  id: number;
  code: string;
  performerId: number | null;
  performerName: string;
  performanceSessionId: number | null;
  performer: Performer | null;
  performanceSession?: PerformanceSession | null;
  isUsed: boolean;
  usedAt: string | null;
  orderId: number | null;
  createdAt: string;
  hasAttended: boolean;
  attendedAt: string | null;
}

export default function AdminExchangeCodesPage() {
  const { adminFetch } = useAdminUser();
  const [codes, setCodes] = useState<ExchangeCode[]>([]);
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [filterPerformerId, setFilterPerformerId] = useState<string>('');
  const [filterPerformanceIds, setFilterPerformanceIds] = useState<number[]>([]);
  const [performerSearchText, setPerformerSearchText] = useState<string>('');
  const [performanceSearchText, setPerformanceSearchText] = useState<string>('');
  const [showPerformerDropdown, setShowPerformerDropdown] = useState(false);
  const [showPerformanceDropdown, setShowPerformanceDropdown] = useState(false);
  
  // モーダル用の状態
  const [addModalPerformerSearch, setAddModalPerformerSearch] = useState<string>('');
  const [showAddModalPerformerDropdown, setShowAddModalPerformerDropdown] = useState(false);
  const [batchModalPerformerSearch, setBatchModalPerformerSearch] = useState<string>('');
  const [showBatchModalPerformerDropdown, setShowBatchModalPerformerDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    performerId: '',
    performanceIds: [] as number[],
    codesPerSession: {} as Record<number, number>,
  });
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [batchData, setBatchData] = useState({
    performerId: '',
    performanceIds: [] as number[],
    codesPerSession: {} as Record<number, number>,
  });

  useEffect(() => {
    fetchCodes();
    fetchPerformers();
    fetchPerformances();
  }, [adminFetch]);

  // ドロップダウンを閉じるためのクリックハンドラー
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown') && !target.closest('.modal-dropdown')) {
        setShowPerformerDropdown(false);
        setShowPerformanceDropdown(false);
        setShowAddModalPerformerDropdown(false);
        setShowBatchModalPerformerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await adminFetch('/api/exchange-codes');
      if (response.ok) {
        const data = await response.json();
        setCodes(data);
      }
    } catch (error) {
      console.error('Failed to fetch codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformers = async () => {
    try {
      const response = await adminFetch('/api/performers');
      if (response.ok) {
        const data = await response.json();
        setPerformers(data);
      }
    } catch (error) {
      console.error('Failed to fetch performers:', error);
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

    try {
      // codesPerSessionから最初のセッションIDを取得
      const performanceSessionId = Object.keys(formData.codesPerSession)[0] || null;
      
      const response = await adminFetch('/api/exchange-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code,
          performerId: formData.performerId,
          performanceSessionId,
        }),
      });

      if (response.ok) {
        fetchCodes();
        resetAddModal();
        setIsAddModalOpen(false);
      } else {
        const data = await response.json();
        alert(data.error || 'コードの追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to create code:', error);
      alert('コードの追加に失敗しました');
    }
  };

  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingBatch(true);

    try {
      const response = await adminFetch('/api/exchange-codes/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          performerId: batchData.performerId,
          codesPerSession: batchData.codesPerSession,
        }),
      });

      if (response.ok) {
        fetchCodes();
        resetBatchModal();
        setIsBatchModalOpen(false);
      } else {
        const data = await response.json();
        alert(data.error || '一括生成に失敗しました');
      }
    } catch (error) {
      console.error('Failed to generate batch:', error);
      alert('一括生成に失敗しました');
    } finally {
      setGeneratingBatch(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  // フィルタリング処理
  const filteredCodes = useMemo(() => {
    let filtered = codes;

    // 出演者フィルター
    if (filterPerformerId) {
      filtered = filtered.filter((code) => code.performerId?.toString() === filterPerformerId);
    }

    // 公演フィルター（複数選択対応）
    if (filterPerformanceIds.length > 0) {
      // 選択された公演に出演している出演者のIDを取得
      const performerIdsInPerformances = performers
        .filter((p) => 
          p.performances?.some((pp) => 
            filterPerformanceIds.includes(pp.performance.id)
          )
        )
        .map((p) => p.id);
      filtered = filtered.filter((code) => 
        code.performerId && performerIdsInPerformances.includes(code.performerId)
      );
    }

    return filtered;
  }, [codes, filterPerformerId, filterPerformanceIds, performers]);

  const unusedCodes = filteredCodes.filter((c) => !c.isUsed);
  const usedCodes = filteredCodes.filter((c) => c.isUsed);

  // 検索用にフィルタリングされた出演者リスト
  const filteredPerformerOptions = useMemo(() => {
    if (!performerSearchText) return performers;
    const searchLower = performerSearchText.toLowerCase();
    return performers.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.nameKana?.toLowerCase().includes(searchLower)
    );
  }, [performers, performerSearchText]);

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

  const handleSelectPerformer = (performerId: string, performerName: string) => {
    setFilterPerformerId(performerId);
    setPerformerSearchText(performerName);
    setShowPerformerDropdown(false);
  };

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

  const clearPerformerFilter = () => {
    setFilterPerformerId('');
    setPerformerSearchText('');
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

  // モーダル用の検索フィルター
  const filteredAddModalPerformers = useMemo(() => {
    if (!addModalPerformerSearch) return performers;
    const searchLower = addModalPerformerSearch.toLowerCase();
    return performers.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.nameKana?.toLowerCase().includes(searchLower)
    );
  }, [performers, addModalPerformerSearch]);

  const filteredBatchModalPerformers = useMemo(() => {
    if (!batchModalPerformerSearch) return performers;
    const searchLower = batchModalPerformerSearch.toLowerCase();
    return performers.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.nameKana?.toLowerCase().includes(searchLower)
    );
  }, [performers, batchModalPerformerSearch]);

  const handleSelectAddModalPerformer = (performerId: string, performerName: string) => {
    setFormData({ ...formData, performerId });
    setAddModalPerformerSearch(performerName);
    setShowAddModalPerformerDropdown(false);
  };

  const handleSelectBatchModalPerformer = (performerId: string, performerName: string) => {
    setBatchData({ ...batchData, performerId });
    setBatchModalPerformerSearch(performerName);
    setShowBatchModalPerformerDropdown(false);
  };

  const resetAddModal = () => {
    setFormData({ code: '', performerId: '', performanceIds: [], codesPerSession: {} });
    setAddModalPerformerSearch('');
    setShowAddModalPerformerDropdown(false);
  };

  const resetBatchModal = () => {
    setBatchData({ performerId: '', performanceIds: [], codesPerSession: {} });
    setBatchModalPerformerSearch('');
    setShowBatchModalPerformerDropdown(false);
  };

  // 単一追加：選択された公演のセッション一覧を取得
  const getAddModalSelectedSessions = useMemo(() => {
    const sessions: Array<PerformanceSession & { performanceTitle: string; performanceVolume: string | null }> = [];
    formData.performanceIds.forEach((perfId) => {
      const perf = performances.find((p: Performance) => p.id === perfId);
      if (perf?.sessions) {
        perf.sessions.forEach((session: PerformanceSession) => {
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

  // 単一追加：セッションごとのコード数を設定
  const handleSetAddModalCodesForSession = (sessionId: number, count: number) => {
    setFormData((prev) => ({
      ...prev,
      codesPerSession: {
        ...prev.codesPerSession,
        [sessionId]: Math.max(0, count),
      },
    }));
  };

  // 単一追加：合計コード数を計算
  const addModalTotalCodesCount = useMemo(() => {
    return Object.values(formData.codesPerSession).reduce((sum, count) => sum + count, 0);
  }, [formData.codesPerSession]);

  // 一括生成：選択された公演のセッション一覧を取得
  const getBatchModalSelectedSessions = useMemo(() => {
    const sessions: Array<PerformanceSession & { performanceTitle: string; performanceVolume: string | null }> = [];
    batchData.performanceIds.forEach((perfId) => {
      const perf = performances.find((p: Performance) => p.id === perfId);
      if (perf?.sessions) {
        perf.sessions.forEach((session: PerformanceSession) => {
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
  }, [batchData.performanceIds, performances]);

  // 一括生成：セッションごとのコード数を設定
  const handleSetBatchModalCodesForSession = (sessionId: number, count: number) => {
    setBatchData((prev) => ({
      ...prev,
      codesPerSession: {
        ...prev.codesPerSession,
        [sessionId]: Math.max(0, count),
      },
    }));
  };

  // 一括生成：合計コード数を計算
  const batchModalTotalCodesCount = useMemo(() => {
    return Object.values(batchData.codesPerSession).reduce((sum, count) => sum + count, 0);
  }, [batchData.codesPerSession]);

  // 公演選択のトグル（単一追加用）
  const toggleAddModalPerformance = (performanceId: number) => {
    setFormData((prev) => {
      const isSelected = prev.performanceIds.includes(performanceId);
      
      if (isSelected) {
        const perf = performances.find((p: Performance) => p.id === performanceId);
        const newCodesPerSession = { ...prev.codesPerSession };
        if (perf?.sessions) {
          perf.sessions.forEach((session: PerformanceSession) => {
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

  // 公演選択のトグル（一括生成用）
  const toggleBatchModalPerformance = (performanceId: number) => {
    setBatchData((prev) => {
      const isSelected = prev.performanceIds.includes(performanceId);
      
      if (isSelected) {
        const perf = performances.find((p: Performance) => p.id === performanceId);
        const newCodesPerSession = { ...prev.codesPerSession };
        if (perf?.sessions) {
          perf.sessions.forEach((session: PerformanceSession) => {
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
              <h1 className="text-xl font-medium text-slate-800">引換券コード管理</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                <Plus size={18} />
                コード追加
              </button>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
              >
                <Layers size={18} />
                一括生成
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-sm text-slate-500 mb-1">総コード数</div>
              <div className="text-2xl font-semibold text-slate-700">{filteredCodes.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-sm text-slate-500 mb-1">未引換</div>
              <div className="text-2xl font-semibold text-green-600">{unusedCodes.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-sm text-slate-500 mb-1">引換済み</div>
              <div className="text-2xl font-semibold text-rose-600">{usedCodes.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-sm text-slate-500 mb-1">来場済み</div>
              <div className="text-2xl font-semibold text-rose-600">
                {filteredCodes.filter((c) => c.hasAttended).length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={16} className="text-slate-500" />
                <h3 className="text-sm font-medium text-slate-700">フィルター</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 出演者フィルター */}
                <div className="relative filter-dropdown">
                  <label className="block text-xs text-slate-500 mb-1">出演者</label>
                  <input
                    type="text"
                    value={performerSearchText}
                    onChange={(e) => {
                      setPerformerSearchText(e.target.value);
                      setShowPerformerDropdown(true);
                      if (!e.target.value) {
                        setFilterPerformerId('');
                      }
                    }}
                    onFocus={() => setShowPerformerDropdown(true)}
                    placeholder="出演者名を入力..."
                    className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                  {showPerformerDropdown && filteredPerformerOptions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredPerformerOptions.map((performer) => (
                        <button
                          key={performer.id}
                          type="button"
                          onClick={() => handleSelectPerformer(performer.id.toString(), performer.name)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                        >
                          <div className="font-medium text-slate-700">{performer.name}</div>
                          {performer.nameKana && (
                            <div className="text-xs text-slate-400">{performer.nameKana}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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
              {(filterPerformerId || filterPerformanceIds.length > 0) && (
                <button
                  onClick={() => {
                    clearPerformerFilter();
                    clearPerformanceFilter();
                  }}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-500"
                >
                  フィルターをクリア
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-medium text-slate-800">コード一覧</h2>
              </div>
              {loading ? (
                <div className="p-6 text-center text-slate-400">読み込み中...</div>
              ) : filteredCodes.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  {codes.length === 0 ? 'コードがありません' : 'フィルター条件に一致するコードがありません'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">出演者</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">コード</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">公演日時</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">引換状態</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">引換日</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">来場状態</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">来場日</th>
                        <th className="text-left text-xs text-slate-500 font-medium px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCodes.map((code) => {
                        const session = code.performanceSession;
                        const showNumberLabel = session ? (['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][session.showNumber - 1] || `${session.showNumber}th`) : null;
                        return (
                        <tr key={code.id} className={code.isUsed ? 'bg-rose-50/30' : ''}>
                          <td className="px-6 py-3 font-medium text-sm text-slate-700">
                            {code.performer?.name || code.performerName || '-'}
                          </td>
                          <td className="px-6 py-3 font-mono text-sm text-slate-700">{code.code}</td>
                          <td className="px-6 py-3 text-sm text-slate-600">
                            {session ? (
                              <div>
                                <div className="font-medium">{showNumberLabel}</div>
                                <div className="text-xs text-slate-400">{formatDate(session.performanceDate)}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400">全公演</span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            {code.isUsed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-rose-50 text-rose-600">
                                <Check size={12} />
                                引換済み
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-50 text-green-600">
                                <Check size={12} />
                                未引換
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-500">{formatDate(code.usedAt)}</td>
                          <td className="px-6 py-3">
                            {code.hasAttended ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-rose-50 text-rose-600">
                                <Check size={12} />
                                来場済み
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-50 text-green-600">
                                <X size={12} />
                                未来場
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-500">{formatDate(code.attendedAt)}</td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => copyToClipboard(code.code)}
                              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                              title="コピー"
                            >
                              <Copy size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 単一コード追加モーダル */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetAddModal();
        }}
        title="コードを追加"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative modal-dropdown">
            <label className="block text-sm text-slate-600 mb-1">出演者 *</label>
            <input
              type="text"
              value={addModalPerformerSearch}
              onChange={(e) => {
                setAddModalPerformerSearch(e.target.value);
                setShowAddModalPerformerDropdown(true);
                if (!e.target.value) {
                  setFormData({ ...formData, performerId: '' });
                }
              }}
              onFocus={() => setShowAddModalPerformerDropdown(true)}
              placeholder="出演者名を入力..."
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              required={!formData.performerId}
            />
            {showAddModalPerformerDropdown && filteredAddModalPerformers.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredAddModalPerformers.map((performer) => (
                  <button
                    key={performer.id}
                    type="button"
                    onClick={() => handleSelectAddModalPerformer(performer.id.toString(), performer.name)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                  >
                    <div className="font-medium text-slate-700">{performer.name}</div>
                    {performer.nameKana && (
                      <div className="text-xs text-slate-400">{performer.nameKana}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {performers.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ※ 先に<Link href="/admin/performers" className="underline">出演者を登録</Link>してください
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">コード *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono"
              placeholder="vol2-abc12"
              required
            />
            <p className="text-xs text-slate-500 mt-1">形式: vol2-abc12 (英数字5桁・小文字)</p>
          </div>

          {/* 公演選択 */}
          <div>
            <label className="block text-sm text-slate-600 mb-2">
              出演公演 <span className="text-red-500">*</span>
            </label>
            <div className="border border-slate-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
              {performances.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">公演がありません</p>
              ) : (
                performances.map((performance: Performance) => (
                  <label
                    key={performance.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.performanceIds.includes(performance.id)}
                      onChange={() => toggleAddModalPerformance(performance.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700">
                        {performance.title}
                        {performance.volume && (
                          <span className="ml-2 text-xs text-slate-500">({performance.volume})</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* 公演日時選択 */}
          {formData.performanceIds.length === 0 && (
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600 text-center">
                出演公演を選択すると、公演日時の選択が表示されます
              </p>
            </div>
          )}

          {getAddModalSelectedSessions.length > 0 && (
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                公演日時 <span className="text-red-500">*</span>
              </label>
              <select
                value={Object.keys(formData.codesPerSession)[0] || ''}
                onChange={(e) => {
                  const sessionId = parseInt(e.target.value);
                  if (sessionId) {
                    setFormData({ ...formData, codesPerSession: { [sessionId]: 1 } });
                  } else {
                    setFormData({ ...formData, codesPerSession: {} });
                  }
                }}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                required
              >
                <option value="">選択してください</option>
                {getAddModalSelectedSessions.map((session) => {
                  const showNumber = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][session.showNumber - 1] || `${session.showNumber}th`;
                  const date = new Date(session.performanceDate);
                  const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
                  return (
                    <option key={session.id} value={session.id}>
                      {session.performanceTitle} - {showNumber} ({dateStr})
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-slate-500 mt-1">このコードを使用できる公演日時を選択してください</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                resetAddModal();
              }}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!formData.performerId || formData.performanceIds.length === 0 || addModalTotalCodesCount === 0}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              追加
            </button>
          </div>
        </form>
      </Modal>

      {/* 一括生成モーダル */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          resetBatchModal();
        }}
        title="コードを一括生成"
        size="xl"
      >
        <form onSubmit={handleBatchGenerate} className="space-y-4">
          <div className="relative modal-dropdown">
            <label className="block text-sm text-slate-600 mb-1">出演者 *</label>
            <input
              type="text"
              value={batchModalPerformerSearch}
              onChange={(e) => {
                setBatchModalPerformerSearch(e.target.value);
                setShowBatchModalPerformerDropdown(true);
                if (!e.target.value) {
                  setBatchData({ ...batchData, performerId: '' });
                }
              }}
              onFocus={() => setShowBatchModalPerformerDropdown(true)}
              placeholder="出演者名を入力..."
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              required={!batchData.performerId}
            />
            {showBatchModalPerformerDropdown && filteredBatchModalPerformers.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredBatchModalPerformers.map((performer) => (
                  <button
                    key={performer.id}
                    type="button"
                    onClick={() => handleSelectBatchModalPerformer(performer.id.toString(), performer.name)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                  >
                    <div className="font-medium text-slate-700">{performer.name}</div>
                    {performer.nameKana && (
                      <div className="text-xs text-slate-400">{performer.nameKana}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {performers.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ※ 先に<Link href="/admin/performers" className="underline">出演者を登録</Link>してください
              </p>
            )}
          </div>
          {/* 公演選択 */}
          <div>
            <label className="block text-sm text-slate-600 mb-2">
              出演公演（複数選択可） <span className="text-red-500">*</span>
            </label>
            <div className="border border-slate-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
              {performances.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">公演がありません</p>
              ) : (
                performances.map((performance: Performance) => (
                  <label
                    key={performance.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={batchData.performanceIds.includes(performance.id)}
                      onChange={() => toggleBatchModalPerformance(performance.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700">
                        {performance.title}
                        {performance.volume && (
                          <span className="ml-2 text-xs text-slate-500">({performance.volume})</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* 引換券コード数設定（セッションごと） */}
          {batchData.performanceIds.length === 0 && (
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600 text-center">
                出演公演を選択すると、引換券コード数の設定が表示されます
              </p>
            </div>
          )}

          {batchData.performanceIds.length > 0 && getBatchModalSelectedSessions.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                選択した公演にセッション情報がありません
              </p>
            </div>
          )}

          {getBatchModalSelectedSessions.length > 0 && (
            <div>
              <label className="block text-sm text-slate-600 mb-2">
                引換券コード数設定 <span className="text-red-500">*</span>
              </label>
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                {getBatchModalSelectedSessions.map((session) => {
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
                          type="number"
                          value={batchData.codesPerSession[session.id] || 0}
                          onChange={(e) => handleSetBatchModalCodesForSession(session.id, parseInt(e.target.value) || 0)}
                          min={0}
                          max={50}
                          className="w-20 p-2 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                          placeholder="0"
                        />
                        <span className="text-xs text-slate-500 whitespace-nowrap">枚</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {batchModalTotalCodesCount > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">合計:</span> <span className="font-bold text-lg">{batchModalTotalCodesCount}枚</span>の引換券コードが生成されます
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                各公演日時ごとに、生成する引換券コード数を設定してください
              </p>
            </div>
          )}

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
              type="submit"
              disabled={generatingBatch || !batchData.performerId || batchData.performanceIds.length === 0 || batchModalTotalCodesCount === 0}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingBatch ? '生成中...' : `${batchModalTotalCodesCount}枚生成`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
