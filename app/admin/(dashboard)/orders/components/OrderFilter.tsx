/**
 * 注文フィルターコンポーネント（tickets/orders共通）
 */

'use client';

interface OrderFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function OrderFilter({ value, onChange, options }: OrderFilterProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
      <label className="block text-sm text-slate-600 mb-2">ステータスでフィルター</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
