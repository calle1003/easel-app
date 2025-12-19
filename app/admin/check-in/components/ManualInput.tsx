/**
 * 手動入力コンポーネント
 */

'use client';

import { Keyboard } from 'lucide-react';

interface ManualInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  disabled: boolean;
}

export function ManualInput({ value, onChange, onSubmit, disabled }: ManualInputProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Keyboard className="text-slate-600" size={24} />
        <h3 className="text-lg font-bold text-slate-800">手動入力</h3>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-600 mb-2">チケットコード</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="チケットコードを入力..."
            className="w-full p-3 border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-500"
            disabled={disabled}
          />
        </div>

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          確認
        </button>
      </form>

      <p className="text-xs text-slate-500 mt-4 text-center">
        QRコードがスキャンできない場合、手動でコードを入力してください
      </p>
    </div>
  );
}
