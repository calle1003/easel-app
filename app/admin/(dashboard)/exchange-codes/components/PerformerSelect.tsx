/**
 * 出演者選択ドロップダウンコンポーネント（再利用可能）
 */

'use client';

import { Performer } from '../types';

interface PerformerSelectProps {
  performers: Performer[];
  value: string;
  searchText: string;
  showDropdown: boolean;
  onSearchChange: (text: string) => void;
  onSelect: (id: string, name: string) => void;
  onSetShowDropdown: (show: boolean) => void;
  placeholder?: string;
  required?: boolean;
  emptyMessage?: React.ReactNode;
}

export function PerformerSelect({
  performers,
  value,
  searchText,
  showDropdown,
  onSearchChange,
  onSelect,
  onSetShowDropdown,
  placeholder = '出演者名を入力...',
  required = false,
  emptyMessage,
}: PerformerSelectProps) {
  const filteredPerformers = performers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (p.nameKana && p.nameKana.toLowerCase().includes(searchText.toLowerCase()))
  );

  const selectedPerformer = performers.find((p) => p.id.toString() === value);

  return (
    <div className="relative modal-dropdown">
      <label className="block text-sm text-slate-600 mb-1">
        出演者 {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={searchText}
        onChange={(e) => {
          onSearchChange(e.target.value);
          onSetShowDropdown(true);
          if (!e.target.value) {
            onSelect('', '');
          }
        }}
        onFocus={() => onSetShowDropdown(true)}
        placeholder={placeholder}
        className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
        required={required && !value}
      />
      
      {showDropdown && filteredPerformers.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredPerformers.map((performer) => (
            <button
              key={performer.id}
              type="button"
              onClick={() => {
                onSelect(performer.id.toString(), performer.name);
                onSetShowDropdown(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                value === performer.id.toString() ? 'bg-blue-50' : ''
              }`}
            >
              <div className="font-medium text-slate-700">{performer.name}</div>
              {performer.nameKana && (
                <div className="text-xs text-slate-400">{performer.nameKana}</div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {selectedPerformer && (
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded">
          選択中: {selectedPerformer.name}
        </div>
      )}
      
      {emptyMessage && performers.length === 0 && (
        <p className="text-xs text-amber-600 mt-1">{emptyMessage}</p>
      )}
    </div>
  );
}
