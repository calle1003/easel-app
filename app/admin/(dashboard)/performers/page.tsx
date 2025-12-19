/**
 * 出演者管理ページ（リファクタリング版）
 * 1,025行 → 約300行に削減
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Upload } from 'lucide-react';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { PerformerFilters } from './components/PerformerFilters';
import { PerformerTable } from './components/PerformerTable';
import { AddPerformerModal } from './modals/AddPerformerModal';
import { BatchUploadModal } from './modals/BatchUploadModal';
import {
  Performer,
  Performance,
  PerformerFormData,
  CsvPerformerData,
} from './types';

export default function AdminPerformersPage() {
  const { adminFetch } = useAdminUser();

  // データ状態
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  // モーダル状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // フィルター状態
  const [filterPerformanceIds, setFilterPerformanceIds] = useState<number[]>([]);
  const [performanceSearchText, setPerformanceSearchText] = useState<string>('');
  const [showPerformanceDropdown, setShowPerformanceDropdown] = useState(false);

  // フォームデータ
  const [formData, setFormData] = useState<PerformerFormData>({
    name: '',
    nameKana: '',
    performanceIds: [],
    codesPerSession: {},
  });

  // CSV一括登録用の状態
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvPerformerData[]>([]);
  const [batchPerformanceIds, setBatchPerformanceIds] = useState<number[]>([]);
  const [codesPerSession, setCodesPerSession] = useState<Record<number, number>>({});
  const [uploading, setUploading] = useState(false);

  // データ取得
  useEffect(() => {
    fetchPerformers();
    fetchPerformances();
  }, [adminFetch]);

  // ドロップダウンを閉じる
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

  // データ取得関数
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

  // 出演者の作成・更新
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingId ? `/api/performers/${editingId}` : '/api/performers';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchPerformers();
        resetModal();
        setIsModalOpen(false);
      } else {
        const data = await response.json();
        alert(data.error || '保存に失敗しました');
      }
    } catch (error) {
      console.error('Failed to save performer:', error);
      alert('保存に失敗しました');
    }
  };

  // 出演者の削除
  const handleDelete = async (id: number) => {
    try {
      const response = await adminFetch(`/api/performers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPerformers();
      } else {
        const data = await response.json();
        alert(data.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete performer:', error);
      alert('削除に失敗しました');
    }
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

      const dataLines = lines.slice(1); // ヘッダー行をスキップ

      const parsedData = dataLines
        .map((line) => {
          const [name, nameKana] = line.split(',').map((s) => s.trim());
          return { name, nameKana: nameKana || '' };
        })
        .filter((item) => item.name);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          performers: csvData,
          performanceIds: batchPerformanceIds,
          codesPerSession,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `${result.count}件の出演者と${result.totalCodes}件の引換券コードを登録しました`
        );
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

  // リセット関数
  const resetModal = () => {
    setFormData({
      name: '',
      nameKana: '',
      performanceIds: [],
      codesPerSession: {},
    });
    setEditingId(null);
  };

  const resetBatchModal = () => {
    setCsvFile(null);
    setCsvData([]);
    setBatchPerformanceIds([]);
    setCodesPerSession({});
  };

  // 編集モード開始
  const handleEdit = (performer: Performer) => {
    setFormData({
      name: performer.name,
      nameKana: performer.nameKana || '',
      performanceIds: performer.performances?.map((pp) => pp.performanceId) || [],
      codesPerSession: {},
    });
    setEditingId(performer.id);
    setIsModalOpen(true);
  };

  // フィルタリング処理
  const filteredPerformers = useMemo(() => {
    if (filterPerformanceIds.length === 0) return performers;

    return performers.filter((performer) =>
      performer.performances?.some(
        (pp) =>
          filterPerformanceIds.includes(pp.performanceId) ||
          filterPerformanceIds.includes(pp.performance?.id)
      )
    );
  }, [performers, filterPerformanceIds]);

  // フィルターハンドラー
  const handlePerformanceToggle = (id: number) => {
    setFilterPerformanceIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
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
            <h1 className="text-2xl font-bold text-slate-800">出演者管理</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
              >
                <Plus size={18} />
                出演者を登録
              </button>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
              >
                <Upload size={18} />
                CSV一括登録
              </button>
            </div>
          </div>
        </div>

        {/* フィルター */}
        <PerformerFilters
          performances={performances}
          filterPerformanceIds={filterPerformanceIds}
          performanceSearchText={performanceSearchText}
          showPerformanceDropdown={showPerformanceDropdown}
          onPerformanceSearchChange={setPerformanceSearchText}
          onPerformanceToggle={handlePerformanceToggle}
          onPerformanceFilterClear={handlePerformanceFilterClear}
          onSetShowPerformanceDropdown={setShowPerformanceDropdown}
        />

        {/* テーブル */}
        <PerformerTable
          performers={filteredPerformers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* モーダル */}
        <AddPerformerModal
          isOpen={isModalOpen}
          performances={performances}
          formData={formData}
          editingId={editingId}
          onClose={() => {
            setIsModalOpen(false);
            resetModal();
          }}
          onSubmit={handleSubmit}
          onFormDataChange={setFormData}
        />

        <BatchUploadModal
          isOpen={isBatchModalOpen}
          performances={performances}
          csvFile={csvFile}
          csvData={csvData}
          batchPerformanceIds={batchPerformanceIds}
          codesPerSession={codesPerSession}
          uploading={uploading}
          onClose={() => {
            setIsBatchModalOpen(false);
            resetBatchModal();
          }}
          onSubmit={handleBatchUpload}
          onFileChange={handleFileChange}
          onBatchPerformanceIdsChange={setBatchPerformanceIds}
          onCodesPerSessionChange={setCodesPerSession}
        />
      </div>
    </div>
  );
}
