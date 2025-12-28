'use client';

import { Performance, TicketQuantities } from '../types';

interface PriceSummaryProps {
  performance: Performance | null;
  quantities: TicketQuantities;
  validCodesCount: number;
}

export function PriceSummary({
  performance,
  quantities,
  validCodesCount,
}: PriceSummaryProps) {
  if (!performance) return null;

  const totalAmount =
    quantities.general * performance.generalPrice +
    quantities.reserved * performance.reservedPrice +
    quantities.vip1 * (performance.vip1Price || 0) +
    quantities.vip2 * (performance.vip2Price || 0);

  const discountAmount = Math.min(validCodesCount, quantities.general) * performance.generalPrice;
  const total = totalAmount - discountAmount;

  return (
    <section className="pt-8 border-t border-slate-100">
      <div className="space-y-4 mb-10">
        {quantities.general > 0 && (
          <div className="flex items-center justify-between text-slate-500">
            <span>一般席 × {quantities.general}</span>
            <span>
              ¥{(quantities.general * performance.generalPrice).toLocaleString()}
            </span>
          </div>
        )}
        {quantities.reserved > 0 && (
          <div className="flex items-center justify-between text-slate-500">
            <span>指定席 × {quantities.reserved}</span>
            <span>
              ¥
              {(quantities.reserved * performance.reservedPrice).toLocaleString()}
            </span>
          </div>
        )}
        {quantities.vip1 > 0 && (
          <div className="flex items-center justify-between text-slate-500">
            <span>VIP①席 × {quantities.vip1}</span>
            <span>
              ¥
              {(
                quantities.vip1 * (performance.vip1Price || 0)
              ).toLocaleString()}
            </span>
          </div>
        )}
        {quantities.vip2 > 0 && (
          <div className="flex items-center justify-between text-slate-500">
            <span>VIP②席 × {quantities.vip2}</span>
            <span>
              ¥
              {(
                quantities.vip2 * (performance.vip2Price || 0)
              ).toLocaleString()}
            </span>
          </div>
        )}
        {validCodesCount > 0 && (
          <div className="flex items-center justify-between text-green-600">
            <span>
              🎫 引換券割引（
              {Math.min(validCodesCount, quantities.general)}枚分）
            </span>
            <span>-¥{discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-slate-700 font-medium">合計</span>
          <span className="font-serif text-3xl text-slate-800">
            ¥{total.toLocaleString()}
          </span>
        </div>
      </div>
    </section>
  );
}

