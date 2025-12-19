# 🎨 コンポーネント分割リファクタリング計画

**作成日:** 2024年12月15日  
**目的:** 巨大なページファイルを小さく保守しやすいコンポーネントに分割

---

## 📊 現状分析

### 問題のあるファイル

| ファイル                                        | 行数    | 状態    | 優先度 |
| ----------------------------------------------- | ------- | ------- | ------ |
| `app/(public)/ticket/page.tsx`                  | 924行   | ❌ 緊急 | 🔴 P1  |
| `app/admin/(dashboard)/performers/page.tsx`     | 1,025行 | ❌ 緊急 | 🔴 P1  |
| `app/admin/(dashboard)/performances/page.tsx`   | 575行   | ⚠️ 改善 | 🟡 P2  |
| `app/admin/(dashboard)/exchange-codes/page.tsx` | 不明    | ⚠️ 確認 | 🟡 P2  |

### 現状の問題

1. **保守性の低下**
   - 1,000行超えのファイルは理解困難
   - バグの特定が困難
   - 変更時の影響範囲が不明確

2. **再利用性の欠如**
   - 同じUIパターンを複数箇所でコピペ
   - DRY原則違反

3. **テスト困難**
   - 単体テストが書けない
   - E2Eテストしか選択肢がない

4. **パフォーマンス**
   - 不要な再レンダリング
   - コード分割が効かない

---

## 🎯 リファクタリング計画

### Phase 1: チケット購入ページ (最優先)

#### Before: 924行の巨大ファイル

```
app/(public)/ticket/page.tsx (924行)
├─ useState × 18個
├─ useEffect × 5個
├─ useMemo × 3個
├─ ハンドラー関数 × 15個
└─ JSX 500行以上
```

#### After: 機能別に分割

```
app/(public)/ticket/
├─ page.tsx (150-200行) ← コンテナコンポーネント
│   ├─ 状態管理（useState, useEffect）
│   ├─ ビジネスロジック
│   └─ 子コンポーネントの組み合わせ
│
└─ components/
    ├─ PerformanceSelector.tsx (100行)
    │   └─ Props: { performances, selected, onChange }
    │
    ├─ ExchangeCodeInput.tsx (120行)
    │   ├─ Props: { codes, onChange, onValidate }
    │   └─ State: ローカルバリデーション
    │
    ├─ TicketQuantitySelector.tsx (150行)
    │   ├─ Props: { performance, quantities, onChange }
    │   ├─ Components:
    │   │   ├─ TicketCard (一般席用)
    │   │   ├─ TicketCard (指定席用)
    │   │   ├─ TicketCard (VIP①用)
    │   │   └─ TicketCard (VIP②用)
    │   └─ Logic: 在庫チェック・上限チェック
    │
    ├─ TicketCard.tsx (60行) ← 再利用
    │   └─ Props: { type, price, capacity, sold, quantity, onChange }
    │
    ├─ CustomerInfoForm.tsx (100行)
    │   ├─ Props: { data, onChange, errors }
    │   └─ Components:
    │       ├─ Input (名前)
    │       ├─ Input (メール)
    │       └─ Input (電話)
    │
    ├─ PriceSummary.tsx (80行)
    │   ├─ Props: { tickets, discounts, total }
    │   └─ UI: 料金明細表示
    │
    └─ RemainingSeats.tsx (40行)
        └─ Props: { performance }
```

#### 具体的な実装例

**1. TicketCard.tsx (再利用可能)**

```typescript
// app/(public)/ticket/components/TicketCard.tsx
'use client';

import { Plus, Minus } from 'lucide-react';

interface TicketCardProps {
  type: 'general' | 'reserved' | 'vip1' | 'vip2';
  label: string;
  price: number;
  capacity: number;
  sold: number;
  quantity: number;
  note?: string;
  onChange: (delta: number) => void;
  disabled?: boolean;
}

export function TicketCard({
  type,
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
    <div className="border border-slate-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-slate-800">{label}</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ¥{price.toLocaleString()}
          </p>
        </div>
        {isSoldOut && (
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded">
            完売
          </span>
        )}
      </div>

      {note && (
        <p className="text-sm text-slate-600 mb-3">{note}</p>
      )}

      <p className="text-sm text-slate-500 mb-4">
        残り{remaining}枚
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(-1)}
          disabled={!canDecrease || disabled}
          className="p-2 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus size={20} />
        </button>

        <span className="text-2xl font-medium w-12 text-center">
          {quantity}
        </span>

        <button
          onClick={() => onChange(1)}
          disabled={!canIncrease || disabled || isSoldOut}
          className="p-2 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
```

**2. TicketQuantitySelector.tsx (複数のTicketCardを組み合わせ)**

```typescript
// app/(public)/ticket/components/TicketQuantitySelector.tsx
'use client';

import { TicketCard } from './TicketCard';

interface Performance {
  generalPrice: number;
  reservedPrice: number;
  vip1Price: number | null;
  vip2Price: number | null;
  vip1Note: string | null;
  vip2Note: string | null;
  generalCapacity: number;
  generalSold: number;
  reservedCapacity: number;
  reservedSold: number;
  vip1Capacity: number;
  vip1Sold: number;
  vip2Capacity: number;
  vip2Sold: number;
}

interface Quantities {
  general: number;
  reserved: number;
  vip1: number;
  vip2: number;
}

interface TicketQuantitySelectorProps {
  performance: Performance;
  quantities: Quantities;
  onChange: (type: keyof Quantities, delta: number) => void;
  disabled?: boolean;
}

export function TicketQuantitySelector({
  performance,
  quantities,
  onChange,
  disabled = false,
}: TicketQuantitySelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        チケット枚数を選択
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TicketCard
          type="general"
          label="一般席"
          price={performance.generalPrice}
          capacity={performance.generalCapacity}
          sold={performance.generalSold}
          quantity={quantities.general}
          onChange={(delta) => onChange('general', delta)}
          disabled={disabled}
        />

        <TicketCard
          type="reserved"
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
            type="vip1"
            label="VIP①席"
            price={performance.vip1Price}
            capacity={performance.vip1Capacity}
            sold={performance.vip1Sold}
            quantity={quantities.vip1}
            note={performance.vip1Note || undefined}
            onChange={(delta) => onChange('vip1', delta)}
            disabled={disabled}
          />
        )}

        {performance.vip2Price && (
          <TicketCard
            type="vip2"
            label="VIP②席"
            price={performance.vip2Price}
            capacity={performance.vip2Capacity}
            sold={performance.vip2Sold}
            quantity={quantities.vip2}
            note={performance.vip2Note || undefined}
            onChange={(delta) => onChange('vip2', delta)}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
```

**3. リファクタリング後のpage.tsx (200行程度)**

```typescript
// app/(public)/ticket/page.tsx (リファクタリング後)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PerformanceSelector } from './components/PerformanceSelector';
import { ExchangeCodeInput } from './components/ExchangeCodeInput';
import { TicketQuantitySelector } from './components/TicketQuantitySelector';
import { CustomerInfoForm } from './components/CustomerInfoForm';
import { PriceSummary } from './components/PriceSummary';

export default function TicketPurchasePage() {
  // 状態管理（メインロジック）
  const [performances, setPerformances] = useState([]);
  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const [quantities, setQuantities] = useState({
    general: 0,
    reserved: 0,
    vip1: 0,
    vip2: 0,
  });
  const [exchangeCodes, setExchangeCodes] = useState(['']);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // データ取得
  useEffect(() => {
    fetchPerformances();
  }, []);

  // ハンドラー（ビジネスロジック）
  const handleQuantityChange = (type, delta) => {
    setQuantities(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta),
    }));
  };

  const handleCheckout = async () => {
    // チェックアウト処理
  };

  // UIの組み合わせ（シンプル）
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-serif mb-8">チケット購入</h1>

        <PerformanceSelector
          performances={performances}
          selected={selectedPerformance}
          onChange={setSelectedPerformance}
        />

        {selectedPerformance && (
          <>
            <ExchangeCodeInput
              codes={exchangeCodes}
              onChange={setExchangeCodes}
            />

            <TicketQuantitySelector
              performance={selectedPerformance}
              quantities={quantities}
              onChange={handleQuantityChange}
            />

            <CustomerInfoForm
              data={customerInfo}
              onChange={setCustomerInfo}
            />

            <PriceSummary
              performance={selectedPerformance}
              quantities={quantities}
              exchangeCodes={exchangeCodes}
            />

            <button onClick={handleCheckout}>
              購入手続きへ
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

---

### Phase 2: 出演者管理ページ

#### 分割するコンポーネント

```
app/admin/(dashboard)/performers/
├─ page.tsx (200行)
└─ components/
    ├─ PerformerList.tsx
    │   └─ テーブル表示 + ページネーション
    │
    ├─ PerformerListItem.tsx
    │   └─ テーブルの1行（再利用）
    │
    ├─ PerformerFilters.tsx
    │   └─ 検索・フィルター
    │
    ├─ ExchangeCodeList.tsx
    │   └─ 引換券コード一覧
    │
    └─ modals/ (既存のモーダルを改善)
```

---

## 📈 期待される効果

| 項目               | Before | After     | 改善率   |
| ------------------ | ------ | --------- | -------- |
| **ファイルサイズ** | 924行  | 150-200行 | **-75%** |
| **理解しやすさ**   | D      | A         | ⬆️       |
| **保守性**         | D      | A         | ⬆️       |
| **再利用性**       | なし   | 高い      | ⬆️       |
| **テスト容易性**   | 困難   | 簡単      | ⬆️       |
| **パフォーマンス** | C      | B+        | ⬆️       |

---

## ⏱️ 実装スケジュール

| Phase    | 対象               | 工数    | 優先度 |
| -------- | ------------------ | ------- | ------ |
| Phase 1  | チケット購入ページ | 1日     | 🔴 P1  |
| Phase 2  | 出演者管理ページ   | 1日     | 🔴 P1  |
| Phase 3  | 公演管理ページ     | 0.5日   | 🟡 P2  |
| Phase 4  | その他ページ       | 0.5日   | 🟡 P2  |
| **合計** |                    | **3日** |        |

---

## 🎯 ベストプラクティス

### 1. コンポーネント設計原則

- **単一責任の原則**: 1つのコンポーネントは1つの責任のみ
- **Props Down, Events Up**: データは上から、イベントは下から上へ
- **DRY (Don't Repeat Yourself)**: 同じUIは再利用コンポーネント化
- **100行ルール**: 1コンポーネント100行以内を目標

### 2. ディレクトリ構造

```
app/[route]/
├─ page.tsx (コンテナ)
├─ components/ (そのページ専用)
│   ├─ Feature1.tsx
│   └─ Feature2.tsx
└─ hooks/ (カスタムフック)
    └─ useFeature.ts

components/ (共通)
└─ shared/
    └─ Button.tsx
```

### 3. 型定義の共有

```
types/
├─ models.ts (データモデル)
├─ api.ts (API型)
└─ ui.ts (UI Props型)
```

---

## ✅ チェックリスト

実装時に確認すべき項目:

### コンポーネント分割

- [ ] 1ファイル200行以内
- [ ] Propsインターフェースを明確に定義
- [ ] 再利用可能性を考慮
- [ ] 単体テスト可能な粒度

### パフォーマンス

- [ ] `React.memo` で不要な再レンダリング防止
- [ ] `useCallback` でハンドラー最適化
- [ ] `useMemo` で計算結果キャッシュ

### 型安全性

- [ ] `any` 型を使用しない
- [ ] すべてのPropsに型定義
- [ ] オプショナルなPropsは `?` を使用

---

## 🚀 今後の方針

このリファクタリングを実施しますか？

1. **Yes**: 今すぐPhase 1を実装開始
2. **Later**: 優先度の高い機能実装後に実施
3. **Custom**: 特定のページのみ実施

ご希望をお聞かせください！
