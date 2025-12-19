/**
 * 引換券コードのフィルターコンポーネント
 */

'use client';

import { Filter, XCircle } from 'lucide-react';
import { Performer, Performance } from '../types';

interface ExchangeCodeFiltersProps {
  performers: Performer[];
  performances: Performance[];
  filterPerformerId: string;
  filterPerformanceIds: number[];
  performerSearchText: string;
  performanceSearchText: string;
  showPerformerDropdown: boolean;
  showPerformanceDropdown: boolean;
  onPerformerSearchChange: (text: string) => void;
  onPerformanceSearchChange: (text: string) => void;
  onPerformerSelect: (id: string) => void;
  onPerformanceToggle: (id: number) => void;
  onPerformerFilterClear: () => void;
  onPerformanceFilterClear: () => void;
  onSetShowPerformerDropdown: (show: boolean) => void;
  onSetShowPerformanceDropdown: (show: boolean) => void;
}

export function ExchangeCodeFilters({
  performers,
  performances,
  filterPerformerId,
  filterPerformanceIds,
  performerSearchText,
  performanceSearchText,
  showPerformerDropdown,
  showPerformanceDropdown,
  onPerformerSearchChange,
  onPerformanceSearchChange,
  onPerformerSelect,
  onPerformanceToggle,
  onPerformerFilterClear,
  onPerformanceFilterClear,
  onSetShowPerformerDropdown,
  onSetShowPerformanceDropdown,
}: ExchangeCodeFiltersProps) {
  const selectedPerformer = performers.find((p) => p.id.toString() === filterPerformerId);
  const selectedPerformances = performances.filter((p) =>
    filterPerformanceIds.includes(p.id)
  );

  // 出演者フィルター用の検索結果
  const filteredPerformers = performers.filter(
    (p) =>
      p.name.toLowerCase().includes(performerSearchText.toLowerCase()) ||
      (p.nameKana && p.nameKana.toLowerCase().includes(performerSearchText.toLowerCase()))
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 出演者フィルター */}
        <div className="relative filter-dropdown">
          <label className="block text-sm text-slate-600 mb-2">出演者</label>
          <div className="relative">
            <input
              type="text"
              placeholder="出演者名で検索..."
              value={performerSearchText}
              onChange={(e) => onPerformerSearchChange(e.target.value)}
              onFocus={() => onSetShowPerformerDropdown(true)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            />
            {selectedPerformer && (
              <button
                onClick={onPerformerFilterClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>

          {showPerformerDropdown && filteredPerformers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredPerformers.map((performer) => (
                <div
                  key={performer.id}
                  onClick={() => {
                    onPerformerSelect(performer.id.toString());
                    onSetShowPerformerDropdown(false);
                  }}
                  className={`px-3 py-2 hover:bg-slate-50 cursor-pointer ${
                    filterPerformerId === performer.id.toString() ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-slate-800">{performer.name}</p>
                  {performer.nameKana && (
                    <p className="text-xs text-slate-500">{performer.nameKana}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedPerformer && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded">
              {selectedPerformer.name}
              <button
                onClick={onPerformerFilterClear}
                className="hover:text-blue-900"
              >
                <XCircle size={14} />
              </button>
            </div>
          )}
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
      </div>
    </div>
  );
}
