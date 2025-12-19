'use client';

import { Performance, TicketQuantities } from '../types';

interface PriceSummaryProps {
  performance: Performance;
  quantities: TicketQuantities;
  discountAmount?: number;
}

export function PriceSummary({
  performance,
  quantities,
  discountAmount = 0,
}: PriceSummaryProps) {
  const items = [
    {
      label: '一般席',
      quantity: quantities.general,
      price: performance.generalPrice,
    },
    {
      label: '指定席',
      quantity: quantities.reserved,
      price: performance.reservedPrice,
    },
    performance.vip1Price && {
      label: 'VIP①席',
      quantity: quantities.vip1,
      price: performance.vip1Price,
    },
    performance.vip2Price && {
      label: 'VIP②席',
      quantity: quantities.vip2,
      price: performance.vip2Price,
    },
  ].filter(Boolean) as Array<{ label: string; quantity: number; price: number }>;

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const total = subtotal - discountAmount;

  return (
    <div className="bg-slate-50 rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">料金明細</h2>

      <div className="space-y-2">
        {items.map(
          (item) =>
            item.quantity > 0 && (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {item.label} × {item.quantity}枚
                </span>
                <span className="font-medium text-slate-800">
                  ¥{(item.quantity * item.price).toLocaleString()}
                </span>
              </div>
            )
        )}
      </div>

      {discountAmount > 0 && (
        <>
          <div className="border-t border-slate-200 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">小計</span>
              <span className="font-medium text-slate-800">
                ¥{subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>割引</span>
              <span>-¥{discountAmount.toLocaleString()}</span>
            </div>
          </div>
        </>
      )}

      <div className="border-t border-slate-300 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-slate-800">合計</span>
          <span className="text-2xl font-bold text-slate-900">
            ¥{total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

