'use client';

import { TicketCard } from './TicketCard';
import { Performance, TicketQuantities } from '../types';

interface TicketQuantitySelectorProps {
  performance: Performance;
  quantities: TicketQuantities;
  onChange: (type: keyof TicketQuantities, delta: number) => void;
  disabled?: boolean;
}

export function TicketQuantitySelector({
  performance,
  quantities,
  onChange,
  disabled = false,
}: TicketQuantitySelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          チケット枚数を選択
        </h2>
        <p className="text-sm text-slate-500">
          ※お一人様10枚まで購入可能です
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TicketCard
          label="一般席"
          price={performance.generalPrice}
          capacity={performance.generalCapacity}
          sold={performance.generalSold}
          quantity={quantities.general}
          onChange={(delta) => onChange('general', delta)}
          disabled={disabled}
        />

        <TicketCard
          label="指定席"
          price={performance.reservedPrice}
          capacity={performance.reservedCapacity}
          sold={performance.reservedSold}
          quantity={quantities.reserved}
          onChange={(delta) => onChange('reserved', delta)}
          disabled={disabled}
        />

        {performance.vip1Price && (
          <TicketCard
            label="VIP①席"
            price={performance.vip1Price}
            capacity={performance.vip1Capacity}
            sold={performance.vip1Sold}
            quantity={quantities.vip1}
            note={performance.vip1Note}
            onChange={(delta) => onChange('vip1', delta)}
            disabled={disabled}
          />
        )}

        {performance.vip2Price && (
          <TicketCard
            label="VIP②席"
            price={performance.vip2Price}
            capacity={performance.vip2Capacity}
            sold={performance.vip2Sold}
            quantity={quantities.vip2}
            note={performance.vip2Note}
            onChange={(delta) => onChange('vip2', delta)}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}

