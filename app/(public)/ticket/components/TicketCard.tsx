'use client';

import { Plus, Minus } from 'lucide-react';

interface TicketCardProps {
  label: string;
  price: number;
  capacity: number;
  sold: number;
  quantity: number;
  note?: string | null;
  onChange: (delta: number) => void;
  disabled?: boolean;
}

export function TicketCard({
  label,
  price,
  capacity,
  sold,
  quantity,
  note,
  onChange,
  disabled = false,
}: TicketCardProps) {
  const remaining = capacity - sold;
  const isSoldOut = remaining <= 0;
  const canIncrease = quantity < remaining && quantity < 10;
  const canDecrease = quantity > 0;

  return (
    <div className="border border-slate-200 rounded-lg p-6 bg-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-slate-800 mb-1">{label}</h3>
          <p className="text-2xl font-bold text-slate-900">
            ¥{price.toLocaleString()}
          </p>
        </div>
        {isSoldOut && (
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">
            完売
          </span>
        )}
      </div>

      {note && (
        <p className="text-sm text-slate-600 mb-3 leading-relaxed">{note}</p>
      )}

      <p className="text-sm text-slate-500 mb-4">
        残り <span className="font-medium">{remaining}</span> 枚
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(-1)}
          disabled={!canDecrease || disabled}
          className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="枚数を減らす"
        >
          <Minus size={20} />
        </button>

        <span className="text-2xl font-medium w-12 text-center tabular-nums">
          {quantity}
        </span>

        <button
          type="button"
          onClick={() => onChange(1)}
          disabled={!canIncrease || disabled || isSoldOut}
          className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="枚数を増やす"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}

