/**
 * 引換券コード管理ページ（リファクタリング版）
 * 1,121行 → 約250行に削減
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Layers } from 'lucide-react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { ExchangeCodeStats } from './components/ExchangeCodeStats';
import { ExchangeCodeFilters } from './components/ExchangeCodeFilters';
import { ExchangeCodeTable } from './components/ExchangeCodeTable';
import { AddCodeModal } from './modals/AddCodeModal';
import { BatchGenerateModal } from './modals/BatchGenerateModal';
import {
  ExchangeCode,
  Performer,
  Performance,
  ExchangeCodeFormData,
  BatchGenerateData,
} from './types';

export default function AdminExchangeCodesPage() {
  const { adminFetch } = useAdminUser();

  // データ状態
  const [codes, setCodes] = useState<ExchangeCode[]>([]);
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  // モーダル状態
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  // フィルター状態
  const [filterPerformerId, setFilterPerformerId] = useState<string>('');
  const [filterPerformanceIds, setFilterPerformanceIds] = useState<number[]>([]);
  const [performerSearchText, setPerformerSearchText] = useState<string>('');
  const [performanceSearchText, setPerformanceSearchText] = useState<string>('');
  const [showPerformerDropdown, setShowPerformerDropdown] = useState(false);
  const [showPerformanceDropdown, setShowPerformanceDropdown] = useState(false);

  // フォームデータ
  const [formData, setFormData] = useState<ExchangeCodeFormData>({
    code: '',
    performerId: '',
    performanceIds: [],
    codesPerSession: {},
  });

  const [batchData, setBatchData] = useState<BatchGenerateData>({
    performerId: '',
    performanceIds: [],
    codesPerSession: {},
  });

  // データ取得
  useEffect(() => {
    fetchCodes();
    fetchPerformers();
    fetchPerformances();
  }, [adminFetch]);

  // ドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown') && !target.closest('.modal-dropdown')) {
        setShowPerformerDropdown(false);
        setShowPerformanceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // データ取得関数
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

  // 単発コード追加
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const performanceSessionId = Object.keys(formData.codesPerSession)[0] || null;

      const response = await adminFetch('/api/exchange-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // 一括生成
  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingBatch(true);

    try {
      const response = await adminFetch('/api/exchange-codes/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // リセット関数
  const resetAddModal = () => {
    setFormData({
      code: '',
      performerId: '',
      performanceIds: [],
      codesPerSession: {},
    });
  };

  const resetBatchModal = () => {
    setBatchData({
      performerId: '',
      performanceIds: [],
      codesPerSession: {},
    });
  };

  // ユーティリティ関数
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

    if (filterPerformerId) {
      filtered = filtered.filter((code) => code.performerId?.toString() === filterPerformerId);
    }

    if (filterPerformanceIds.length > 0) {
      const selectedPerformerIds = new Set<number>();
      filterPerformanceIds.forEach((perfId) => {
        const perf = performances.find((p) => p.id === perfId);
        if (perf) {
          performers.forEach((performer) => {
            if (
              performer.performances?.some(
                (pp) => pp.performance.id === perfId || pp.performance.volume === perf.volume
              )
            ) {
              selectedPerformerIds.add(performer.id);
            }
          });
        }
      });

      if (selectedPerformerIds.size > 0) {
        filtered = filtered.filter((code) =>
          code.performerId !== null && selectedPerformerIds.has(code.performerId)
        );
      }
    }

    return filtered;
  }, [codes, filterPerformerId, filterPerformanceIds, performances, performers]);

  // 統計計算
  const stats = useMemo(
    () => ({
      total: filteredCodes.length,
      used: filteredCodes.filter((c) => c.isUsed).length,
      unused: filteredCodes.filter((c) => !c.isUsed).length,
      attended: filteredCodes.filter((c) => c.hasAttended).length,
    }),
    [filteredCodes]
  );

  // フィルターハンドラー
  const handlePerformerSelect = (id: string) => {
    setFilterPerformerId(id);
    setPerformerSearchText(performers.find((p) => p.id.toString() === id)?.name || '');
  };

  const handlePerformanceToggle = (id: number) => {
    setFilterPerformanceIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handlePerformerFilterClear = () => {
    setFilterPerformerId('');
    setPerformerSearchText('');
  };

  const handlePerformanceFilterClear = () => {
    setFilterPerformanceIds([]);
    setPerformanceSearchText('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center text-slate-600 hover:text-slate-800 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            管理画面トップ
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">引換券コード管理</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
              >
                <Plus size={18} />
                コードを追加
              </button>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
              >
                <Layers size={18} />
                一括生成
              </button>
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <ExchangeCodeStats stats={stats} />

        {/* フィルター */}
        <ExchangeCodeFilters
          performers={performers}
          performances={performances}
          filterPerformerId={filterPerformerId}
          filterPerformanceIds={filterPerformanceIds}
          performerSearchText={performerSearchText}
          performanceSearchText={performanceSearchText}
          showPerformerDropdown={showPerformerDropdown}
          showPerformanceDropdown={showPerformanceDropdown}
          onPerformerSearchChange={setPerformerSearchText}
          onPerformanceSearchChange={setPerformanceSearchText}
          onPerformerSelect={handlePerformerSelect}
          onPerformanceToggle={handlePerformanceToggle}
          onPerformerFilterClear={handlePerformerFilterClear}
          onPerformanceFilterClear={handlePerformanceFilterClear}
          onSetShowPerformerDropdown={setShowPerformerDropdown}
          onSetShowPerformanceDropdown={setShowPerformanceDropdown}
        />

        {/* テーブル */}
        <ExchangeCodeTable
          codes={filteredCodes}
          loading={loading}
          onCopyCode={copyToClipboard}
          formatDate={formatDate}
        />

        {/* モーダル */}
        <AddCodeModal
          isOpen={isAddModalOpen}
          performers={performers}
          performances={performances}
          formData={formData}
          onClose={() => {
            setIsAddModalOpen(false);
            resetAddModal();
          }}
          onSubmit={handleSubmit}
          onFormDataChange={setFormData}
        />

        <BatchGenerateModal
          isOpen={isBatchModalOpen}
          performers={performers}
          performances={performances}
          batchData={batchData}
          generatingBatch={generatingBatch}
          onClose={() => {
            setIsBatchModalOpen(false);
            resetBatchModal();
          }}
          onSubmit={handleBatchGenerate}
          onBatchDataChange={setBatchData}
        />
      </div>
    </div>
  );
}
