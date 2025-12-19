/**
 * 出演者フィルターコンポーネント
 */

'use client';

import { Filter, XCircle } from 'lucide-react';
import { Performance } from '../types';

interface PerformerFiltersProps {
  performances: Performance[];
  filterPerformanceIds: number[];
  performanceSearchText: string;
  showPerformanceDropdown: boolean;
  onPerformanceSearchChange: (text: string) => void;
  onPerformanceToggle: (id: number) => void;
  onPerformanceFilterClear: () => void;
  onSetShowPerformanceDropdown: (show: boolean) => void;
}

export function PerformerFilters({
  performances,
  filterPerformanceIds,
  performanceSearchText,
  showPerformanceDropdown,
  onPerformanceSearchChange,
  onPerformanceToggle,
  onPerformanceFilterClear,
  onSetShowPerformanceDropdown,
}: PerformerFiltersProps) {
  const selectedPerformances = performances.filter((p) =>
    filterPerformanceIds.includes(p.id)
  );

  // 公演フィルター用の検索結果
  const filteredPerformances = performances.filter(
    (p) =>
      p.title.toLowerCase().includes(performanceSearchText.toLowerCase()) ||
      (p.volume && p.volume.toLowerCase().includes(performanceSearchText.toLowerCase()))
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={18} className="text-slate-500" />
        <h3 className="text-sm font-medium text-slate-700">フィルター</h3>
      </div>

      {/* 公演フィルター（複数選択） */}
      <div className="relative filter-dropdown">
        <label className="block text-sm text-slate-600 mb-2">出演公演（複数選択可）</label>
        <div className="relative">
          <input
            type="text"
            placeholder="公演名で検索..."
            value={performanceSearchText}
            onChange={(e) => onPerformanceSearchChange(e.target.value)}
            onFocus={() => onSetShowPerformanceDropdown(true)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          />
          {selectedPerformances.length > 0 && (
            <button
              onClick={onPerformanceFilterClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>

        {showPerformanceDropdown && filteredPerformances.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredPerformances.map((performance) => (
              <label
                key={performance.id}
                className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filterPerformanceIds.includes(performance.id)}
                  onChange={() => onPerformanceToggle(performance.id)}
                  className="mr-2"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {performance.volume} - {performance.title}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        {selectedPerformances.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedPerformances.map((perf) => (
              <div
                key={perf.id}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded"
              >
                {perf.volume} - {perf.title}
                <button
                  onClick={() => onPerformanceToggle(perf.id)}
                  className="hover:text-blue-900"
                >
                  <XCircle size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {filterPerformanceIds.length > 0 && (
        <button
          onClick={onPerformanceFilterClear}
          className="mt-3 text-xs text-blue-600 hover:text-blue-500"
        >
          フィルターをクリア
        </button>
      )}
    </div>
  );
}
