/**
 * 一括コード生成モーダル
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/modal';
import { PerformerSelect } from '../components/PerformerSelect';
import { PerformanceSessionSelector } from '../components/PerformanceSessionSelector';
import { Performer, Performance, BatchGenerateData } from '../types';

interface BatchGenerateModalProps {
  isOpen: boolean;
  performers: Performer[];
  performances: Performance[];
  batchData: BatchGenerateData;
  generatingBatch: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onBatchDataChange: (data: BatchGenerateData) => void;
}

export function BatchGenerateModal({
  isOpen,
  performers,
  performances,
  batchData,
  generatingBatch,
  onClose,
  onSubmit,
  onBatchDataChange,
}: BatchGenerateModalProps) {
  const [performerSearch, setPerformerSearch] = useState('');
  const [showPerformerDropdown, setShowPerformerDropdown] = useState(false);

  // 公演選択のトグル
  const handlePerformanceToggle = (performanceId: number) => {
    const isSelected = batchData.performanceIds.includes(performanceId);
    
    if (isSelected) {
      // 選択解除: その公演のセッションを削除
      const perf = performances.find((p) => p.id === performanceId);
      const newCodesPerSession = { ...batchData.codesPerSession };
      if (perf?.sessions) {
        perf.sessions.forEach((session) => {
          delete newCodesPerSession[session.id];
        });
      }
      
      onBatchDataChange({
        ...batchData,
        performanceIds: batchData.performanceIds.filter((id) => id !== performanceId),
        codesPerSession: newCodesPerSession,
      });
    } else {
      // 選択追加
      onBatchDataChange({
        ...batchData,
        performanceIds: [...batchData.performanceIds, performanceId],
      });
    }
  };

  // セッションごとのコード数変更
  const handleSessionCodeCountChange = (sessionId: number, count: number) => {
    onBatchDataChange({
      ...batchData,
      codesPerSession: {
        ...batchData.codesPerSession,
        [sessionId]: Math.max(0, count),
      },
    });
  };

  const handleReset = () => {
    setPerformerSearch('');
    setShowPerformerDropdown(false);
  };

  const totalCodesCount = Object.values(batchData.codesPerSession).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        handleReset();
      }}
      title="コードを一括生成"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* 出演者選択 */}
        <PerformerSelect
          performers={performers}
          value={batchData.performerId}
          searchText={performerSearch}
          showDropdown={showPerformerDropdown}
          onSearchChange={setPerformerSearch}
          onSelect={(id, name) => {
            onBatchDataChange({ ...batchData, performerId: id });
            setPerformerSearch(name);
          }}
          onSetShowDropdown={setShowPerformerDropdown}
          required
          emptyMessage={
            <span>
              ※ 先に
              <Link href="/admin/performers" className="underline">
                出演者を登録
              </Link>
              してください
            </span>
          }
        />

        {/* 公演・セッション選択 */}
        <PerformanceSessionSelector
          performances={performances}
          selectedPerformanceIds={batchData.performanceIds}
          codesPerSession={batchData.codesPerSession}
          onPerformanceToggle={handlePerformanceToggle}
          onSessionCodeCountChange={handleSessionCodeCountChange}
          mode="batch"
        />

        {/* ボタン */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              handleReset();
            }}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={
              !batchData.performerId ||
              batchData.performanceIds.length === 0 ||
              totalCodesCount === 0 ||
              generatingBatch
            }
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {generatingBatch ? '生成中...' : `生成 (${totalCodesCount}枚)`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
