# 🎨 HP（公開サイト）リファクタリング計画

**作成日:** 2024年12月19日  
**目的:** 公開サイトのコード品質向上・保守性向上・パフォーマンス最適化

---

## 📊 現状分析

### 問題のあるファイル

| ファイル                           | 行数  | 状態    | 主な問題                           | 優先度 |
| ---------------------------------- | ----- | ------- | ---------------------------------- | ------ |
| `app/(public)/ticket/page.tsx`     | 924行 | ❌ 緊急 | 巨大ファイル、複雑な状態管理       | 🔴 P1  |
| `app/(public)/news/page.tsx`       | 114行 | ⚠️ 改善 | クライアントコンポーネント（不要） | 🟡 P2  |
| `app/(public)/page.tsx`            | 155行 | ⚠️ 改善 | 重複コード（formatDate）           | 🟡 P2  |
| `app/(public)/easel-live/page.tsx` | 111行 | ✅ 良好 | 軽微な改善のみ                     | 🟢 P3  |
| `app/(public)/contact/page.tsx`    | 131行 | ⚠️ 改善 | フォームロジックの分離             | 🟡 P2  |

### 現状の問題点

#### 1. **重複コード**

- `formatDate`関数が複数ファイルに存在
  - `app/(public)/page.tsx` (18-24行)
  - `app/(public)/news/page.tsx` (15-21行)

#### 2. **不適切なレンダリング戦略**

- `news/page.tsx`がクライアントコンポーネントでuseEffectを使用
- Server Componentに変換可能（SEO改善、パフォーマンス向上）

#### 3. **データフェッチロジックの散在**

- 各ページにデータ取得ロジックが直接記述
- 再利用性・テスト容易性が低い

#### 4. **巨大なファイル**

- `ticket/page.tsx`が924行
  - useState × 18個
  - useEffect × 5個以上
  - ハンドラー関数 × 15個以上
  - 保守困難

#### 5. **共通UIパターンの未抽出**

- ローディングスピナー
- エラーメッセージ
- 空状態表示
- ヒーローセクション

---

## 🎯 リファクタリング計画

### Phase 1: 共通ユーティリティの整理（最優先）

#### 1.1 日付フォーマット関数の統一

**Before:**

```typescript
// app/(public)/page.tsx
function formatDate(date: Date) {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// app/(public)/news/page.tsx
function formatDate(date: Date) {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
```

**After:**

```typescript
// lib/utils.ts
export function formatDate(
  date: Date | string,
  format: "long" | "short" = "long"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (format === "short") {
    return dateObj.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return dateObj.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(time: Date | string): string {
  const timeObj = typeof time === "string" ? new Date(time) : time;
  return timeObj.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(datetime: Date | string): string {
  return `${formatDate(datetime)} ${formatTime(datetime)}`;
}
```

**使用例:**

```typescript
// app/(public)/page.tsx
import { formatDate } from '@/lib/utils';

// ...
<time className="text-xs text-slate-400">
  {formatDate(item.publishedAt)}
</time>
```

---

### Phase 2: データアクセス層の作成

#### 2.1 ニュース関連のデータアクセス

**新規ファイル: `lib/data/news.ts`**

```typescript
// lib/data/news.ts
import { prisma } from "@/lib/prisma";
import { News } from "@prisma/client";

export interface NewsListOptions {
  take?: number;
  skip?: number;
  category?: string;
}

/**
 * ニュース一覧を取得
 */
export async function getNewsList(
  options: NewsListOptions = {}
): Promise<News[]> {
  const { take, skip, category } = options;

  try {
    const news = await prisma.news.findMany({
      where: category ? { category } : undefined,
      orderBy: { publishedAt: "desc" },
      take,
      skip,
    });
    return news;
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}

/**
 * 最新ニュースを取得（トップページ用）
 */
export async function getLatestNews(count: number = 3): Promise<News[]> {
  return getNewsList({ take: count });
}

/**
 * ニュース詳細を取得
 */
export async function getNewsById(id: number): Promise<News | null> {
  try {
    const news = await prisma.news.findUnique({
      where: { id },
    });
    return news;
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return null;
  }
}
```

#### 2.2 公演関連のデータアクセス

**新規ファイル: `lib/data/performances.ts`**

```typescript
// lib/data/performances.ts
import { prisma } from "@/lib/prisma";

export interface PerformanceWithSessions {
  id: number;
  title: string;
  volume: string;
  isOnSale: boolean;
  sessions: {
    performanceDate: Date;
  }[];
}

/**
 * 販売中の公演一覧を取得
 */
export async function getOnSalePerformances(): Promise<
  PerformanceWithSessions[]
> {
  try {
    const performances = await prisma.performance.findMany({
      where: { isOnSale: true },
      select: {
        id: true,
        title: true,
        volume: true,
        isOnSale: true,
        sessions: {
          select: {
            performanceDate: true,
          },
          orderBy: {
            performanceDate: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return performances;
  } catch (error) {
    console.error("Failed to fetch on-sale performances:", error);
    return [];
  }
}

/**
 * 全公演一覧を取得（アーカイブページ用）
 */
export async function getAllPerformances(): Promise<PerformanceWithSessions[]> {
  try {
    const performances = await prisma.performance.findMany({
      select: {
        id: true,
        title: true,
        volume: true,
        isOnSale: true,
        sessions: {
          select: {
            performanceDate: true,
          },
          orderBy: {
            performanceDate: "asc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return performances;
  } catch (error) {
    console.error("Failed to fetch performances:", error);
    return [];
  }
}
```

---

### Phase 3: 共通UIコンポーネントの作成

#### 3.1 ローディング・エラー・空状態コンポーネント

**新規ファイル: `components/ui/loading.tsx`**

```typescript
// components/ui/loading.tsx
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-slate-300`} />
      {message && (
        <p className="mt-6 text-slate-400 text-sm">{message}</p>
      )}
    </div>
  );
}
```

**新規ファイル: `components/ui/empty-state.tsx`**

```typescript
// components/ui/empty-state.tsx
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      {Icon && (
        <Icon className="mx-auto mb-6 text-slate-200" size={48} strokeWidth={1} />
      )}
      {title && (
        <h3 className="text-lg font-medium text-slate-700 mb-2">{title}</h3>
      )}
      <p className="text-slate-400 text-sm mb-6">{message}</p>
      {action && (
        <button onClick={action.onClick} className="btn-secondary">
          {action.label}
        </button>
      )}
    </div>
  );
}
```

**新規ファイル: `components/ui/error-message.tsx`**

```typescript
// components/ui/error-message.tsx
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorMessage({ title = 'エラーが発生しました', message, retry }: ErrorMessageProps) {
  return (
    <div className="text-center py-20">
      <AlertCircle className="mx-auto mb-6 text-red-200" size={48} strokeWidth={1.5} />
      <h3 className="text-lg font-medium text-slate-700 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm mb-6">{message}</p>
      {retry && (
        <button onClick={retry} className="btn-secondary">
          再試行
        </button>
      )}
    </div>
  );
}
```

#### 3.2 ヒーローセクションコンポーネント

**新規ファイル: `components/ui/hero-section.tsx`**

```typescript
// components/ui/hero-section.tsx
interface HeroSectionProps {
  subtitle?: string;
  title: string;
  description?: string;
}

export function HeroSection({ subtitle, title, description }: HeroSectionProps) {
  return (
    <section className="min-h-[300px] flex flex-col justify-center px-6 bg-warm-50">
      <div className="max-w-3xl mx-auto text-center">
        {subtitle && (
          <p className="section-subtitle mb-4">{subtitle}</p>
        )}
        <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.2em] text-slate-800">
          {title}
        </h1>
        {description && (
          <p className="mt-6 text-slate-600 leading-relaxed">{description}</p>
        )}
      </div>
    </section>
  );
}
```

#### 3.3 ニュースカードコンポーネント

**新規ファイル: `components/news/NewsCard.tsx`**

```typescript
// components/news/NewsCard.tsx
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface NewsCardProps {
  id: number;
  title: string;
  publishedAt: Date;
  category: string | null;
}

export function NewsCard({ id, title, publishedAt, category }: NewsCardProps) {
  return (
    <Link
      href={`/news/${id}`}
      className="group block py-6 hover:bg-white/50 transition-colors duration-300 -mx-4 px-4 rounded-lg"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <time className="text-xs text-slate-400">
              {formatDate(publishedAt)}
            </time>
            {category && (
              <span className="text-xs px-2 py-0.5 bg-slate-200/50 text-slate-500 rounded-full">
                {category}
              </span>
            )}
          </div>
          <h3 className="text-slate-700 group-hover:translate-x-1 transition-transform duration-300">
            {title}
          </h3>
        </div>
        <ChevronRight
          size={16}
          className="text-slate-300 group-hover:text-slate-400 transition-colors duration-300 flex-shrink-0"
        />
      </div>
    </Link>
  );
}
```

---

### Phase 4: ニュースページのサーバーコンポーネント化

#### Before: クライアントコンポーネント（114行）

```typescript
// app/(public)/news/page.tsx (現在)
"use client";

import { useEffect, useState } from "react";
// ... useEffectでfetch
```

#### After: サーバーコンポーネント（50行程度）

**リファクタリング後: `app/(public)/news/page.tsx`**

```typescript
// app/(public)/news/page.tsx (リファクタリング後)
import { HeroSection } from '@/components/ui/hero-section';
import { EmptyState } from '@/components/ui/empty-state';
import { NewsCard } from '@/components/news/NewsCard';
import { getNewsList } from '@/lib/data/news';
import { Newspaper } from 'lucide-react';

export default async function NewsListPage() {
  const news = await getNewsList();

  return (
    <div>
      <HeroSection subtitle="News" title="News" />

      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          {news.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              message="ニュースはまだありません"
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {news.map((item) => (
                <NewsCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  publishedAt={item.publishedAt}
                  category={item.category}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
```

**メリット:**

- ✅ 114行 → 約50行（-56%削減）
- ✅ Server Side Rendering（SEO改善）
- ✅ 初期ロード高速化
- ✅ クライアントJavaScript削減

---

### Phase 5: トップページのリファクタリング

#### Before: 155行

```typescript
// app/(public)/page.tsx (現在)
async function getLatestNews() {
  try {
    const news = await prisma.news.findMany({
      orderBy: { publishedAt: "desc" },
      take: 3,
    });
    return news;
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function HomePage() {
  const news = await getLatestNews();
  // ... 155行
}
```

#### After: 約100行

**リファクタリング後: `app/(public)/page.tsx`**

```typescript
// app/(public)/page.tsx (リファクタリング後)
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { getLatestNews } from '@/lib/data/news';
import { NewsCard } from '@/components/news/NewsCard';
import { EmptyState } from '@/components/ui/empty-state';

export default async function HomePage() {
  const news = await getLatestNews(3);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-warm-50">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-warm-100/50" />
        <div className="relative z-10 text-center px-6 py-32">
          <p className="section-subtitle mb-6">Theater Company</p>
          <img src="/easel_logo.png" alt="easel" className="h-32 md:h-44 w-auto mx-auto mb-8" />
          <Link href="/about" className="btn-secondary group">
            <span>ABOUT US</span>
            <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Latest Performance */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="section-subtitle mb-4">Latest</p>
          <h2 className="section-title mb-8">VOL.2</h2>
          <p className="text-slate-500 leading-relaxed mb-14">
            easelの新作公演情報をお届けします。<br />
            チケットのご予約を受付中です。
          </p>
          <Link href="/easel-live/vol2" className="btn-primary">
            詳細を見る
          </Link>
        </div>
      </section>

      {/* News Section */}
      <section className="py-28 px-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-14">
            <h2 className="section-title">News</h2>
            <Link
              href="/news"
              className="text-sm tracking-wider text-slate-400 hover:text-slate-700 transition-colors duration-300 flex items-center gap-2"
            >
              <span>VIEW ALL</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {news.length === 0 ? (
            <EmptyState message="最新のお知らせはありません" />
          ) : (
            <div className="divide-y divide-slate-200/50">
              {news.map((item) => (
                <NewsCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  publishedAt={item.publishedAt}
                  category={item.category}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Links Section */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/easel-live"
            className="group p-10 border border-slate-100 rounded-2xl hover:border-slate-200 hover:bg-slate-50/50 transition-all duration-300"
          >
            <h3 className="font-serif text-lg tracking-wider text-slate-700 mb-3 group-hover:translate-x-1 transition-transform duration-300">
              easel live
            </h3>
            <p className="text-sm text-slate-400">過去の公演アーカイブ</p>
          </Link>
          <Link
            href="/goods"
            className="group p-10 border border-slate-100 rounded-2xl hover:border-slate-200 hover:bg-slate-50/50 transition-all duration-300"
          >
            <h3 className="font-serif text-lg tracking-wider text-slate-700 mb-3 group-hover:translate-x-1 transition-transform duration-300">
              Goods
            </h3>
            <p className="text-sm text-slate-400">オフィシャルグッズ</p>
          </Link>
          <Link
            href="/contact"
            className="group p-10 border border-slate-100 rounded-2xl hover:border-slate-200 hover:bg-slate-50/50 transition-all duration-300"
          >
            <h3 className="font-serif text-lg tracking-wider text-slate-700 mb-3 group-hover:translate-x-1 transition-transform duration-300">
              Contact
            </h3>
            <p className="text-sm text-slate-400">お問い合わせ</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
```

**メリット:**

- ✅ 重複コード削除（formatDate）
- ✅ データ取得ロジック分離
- ✅ 共通コンポーネント活用

---

### Phase 6: チケット購入ページの大規模リファクタリング（最重要）

#### 現状: 924行の巨大ファイル

```
app/(public)/ticket/page.tsx (924行)
├─ useState × 18個
├─ useEffect × 5個以上
├─ useMemo × 3個
├─ ハンドラー関数 × 15個以上
└─ JSX 500行以上
```

#### リファクタリング後の構造

```
app/(public)/ticket/
├─ page.tsx (200行) ← メインコンテナ
├─ components/
│   ├─ PerformanceSelector.tsx (100行)
│   ├─ ExchangeCodeSection.tsx (150行)
│   ├─ TicketQuantitySelector.tsx (150行)
│   ├─ TicketCard.tsx (80行)
│   ├─ CustomerInfoForm.tsx (120行)
│   ├─ PriceSummary.tsx (100行)
│   └─ CancellationPolicyCheckbox.tsx (40行)
├─ hooks/
│   ├─ useTicketPurchase.ts (150行)
│   └─ useExchangeCodeValidation.ts (100行)
└─ types.ts (50行)
```

#### 6.1 型定義の分離

**新規ファイル: `app/(public)/ticket/types.ts`**

```typescript
// app/(public)/ticket/types.ts
export interface Performance {
  id: number;
  title: string;
  volume: string;
  performanceDate: string;
  performanceTime: string;
  doorsOpenTime: string | null;
  venueName: string;
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

export interface PerformanceSession {
  id: number;
  showNumber: number;
  performanceDate: string;
  performanceTime: string;
  venueName: string;
  performance: {
    id: number;
    title: string;
    volume: string;
  };
}

export interface CodeValidationResult {
  code: string;
  valid: boolean;
  used: boolean;
  performerName?: string;
  performanceSession?: PerformanceSession | null;
}

export interface TicketQuantities {
  general: number;
  reserved: number;
  vip1: number;
  vip2: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  performanceId: string;
}

export type TicketType = "general" | "reserved" | "vip1" | "vip2";
```

#### 6.2 カスタムフックの作成

**新規ファイル: `app/(public)/ticket/hooks/useTicketPurchase.ts`**

```typescript
// app/(public)/ticket/hooks/useTicketPurchase.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { Performance, TicketQuantities, CustomerInfo } from "../types";

export function useTicketPurchase() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [selectedPerformance, setSelectedPerformance] =
    useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantities, setQuantities] = useState<TicketQuantities>({
    general: 0,
    reserved: 0,
    vip1: 0,
    vip2: 0,
  });

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    performanceId: "",
  });

  const [agreedToCancellationPolicy, setAgreedToCancellationPolicy] =
    useState(false);

  // 公演データ取得
  useEffect(() => {
    fetchPerformances();
  }, []);

  const fetchPerformances = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/performances/on-sale");
      if (!response.ok) throw new Error("公演情報の取得に失敗しました");
      const data = await response.json();
      setPerformances(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期しないエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  // sessionStorageから復元
  useEffect(() => {
    const savedData = sessionStorage.getItem("orderData");
    if (savedData) {
      try {
        const orderData = JSON.parse(savedData);
        setQuantities({
          general: orderData.generalQuantity || 0,
          reserved: orderData.reservedQuantity || 0,
          vip1: orderData.vip1Quantity || 0,
          vip2: orderData.vip2Quantity || 0,
        });
        setCustomerInfo({
          name: orderData.name || "",
          email: orderData.email || "",
          phone: orderData.phone || "",
          performanceId: orderData.performanceId || "",
        });
        setAgreedToCancellationPolicy(
          orderData.agreedToCancellationPolicy || false
        );
      } catch (error) {
        console.error("Failed to restore order data:", error);
      }
    }
  }, []);

  // 合計枚数
  const totalTickets = useMemo(() => {
    return (
      quantities.general +
      quantities.reserved +
      quantities.vip1 +
      quantities.vip2
    );
  }, [quantities]);

  // 合計金額計算
  const totalAmount = useMemo(() => {
    if (!selectedPerformance) return 0;

    return (
      quantities.general * selectedPerformance.generalPrice +
      quantities.reserved * selectedPerformance.reservedPrice +
      quantities.vip1 * (selectedPerformance.vip1Price || 0) +
      quantities.vip2 * (selectedPerformance.vip2Price || 0)
    );
  }, [quantities, selectedPerformance]);

  // チケット枚数変更
  const handleQuantityChange = (
    type: keyof TicketQuantities,
    delta: number
  ) => {
    setQuantities((prev) => ({
      ...prev,
      [type]: Math.max(0, Math.min(10, prev[type] + delta)),
    }));
  };

  // バリデーション
  const isFormValid = useMemo(() => {
    return (
      selectedPerformance !== null &&
      totalTickets > 0 &&
      customerInfo.name.trim() !== "" &&
      customerInfo.email.trim() !== "" &&
      customerInfo.phone.trim() !== "" &&
      agreedToCancellationPolicy
    );
  }, [
    selectedPerformance,
    totalTickets,
    customerInfo,
    agreedToCancellationPolicy,
  ]);

  return {
    // State
    performances,
    selectedPerformance,
    loading,
    error,
    quantities,
    customerInfo,
    agreedToCancellationPolicy,

    // Computed
    totalTickets,
    totalAmount,
    isFormValid,

    // Actions
    setSelectedPerformance,
    handleQuantityChange,
    setCustomerInfo,
    setAgreedToCancellationPolicy,
    refetch: fetchPerformances,
  };
}
```

**新規ファイル: `app/(public)/ticket/hooks/useExchangeCodeValidation.ts`**

```typescript
// app/(public)/ticket/hooks/useExchangeCodeValidation.ts
"use client";

import { useState } from "react";
import { CodeValidationResult } from "../types";

export function useExchangeCodeValidation() {
  const [hasExchangeCode, setHasExchangeCode] = useState<boolean | null>(null);
  const [exchangeCodes, setExchangeCodes] = useState<string[]>([""]);
  const [codeValidations, setCodeValidations] = useState<
    CodeValidationResult[]
  >([]);
  const [validating, setValidating] = useState(false);

  const addCodeField = () => {
    if (exchangeCodes.length < 10) {
      setExchangeCodes([...exchangeCodes, ""]);
    }
  };

  const removeCodeField = (index: number) => {
    if (exchangeCodes.length > 1) {
      const newCodes = exchangeCodes.filter((_, i) => i !== index);
      setExchangeCodes(newCodes);
      const newValidations = codeValidations.filter((_, i) => i !== index);
      setCodeValidations(newValidations);
    }
  };

  const updateCode = (index: number, value: string) => {
    const newCodes = [...exchangeCodes];
    newCodes[index] = value;
    setExchangeCodes(newCodes);
  };

  const validateCodes = async () => {
    const nonEmptyCodes = exchangeCodes.filter((code) => code.trim() !== "");
    if (nonEmptyCodes.length === 0) {
      setCodeValidations([]);
      return;
    }

    setValidating(true);
    try {
      const response = await fetch("/api/exchange-codes/validate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: nonEmptyCodes }),
      });

      if (!response.ok) throw new Error("コードの検証に失敗しました");

      const results: CodeValidationResult[] = await response.json();
      setCodeValidations(results);
    } catch (error) {
      console.error("Failed to validate codes:", error);
      alert("引換券コードの検証中にエラーが発生しました");
    } finally {
      setValidating(false);
    }
  };

  const validCodesCount = codeValidations.filter(
    (v) => v.valid && !v.used
  ).length;
  const hasInvalidCodes = codeValidations.some((v) => !v.valid || v.used);

  return {
    hasExchangeCode,
    exchangeCodes,
    codeValidations,
    validating,
    validCodesCount,
    hasInvalidCodes,
    setHasExchangeCode,
    addCodeField,
    removeCodeField,
    updateCode,
    validateCodes,
  };
}
```

#### 6.3 コンポーネントの分割

**新規ファイル: `app/(public)/ticket/components/TicketCard.tsx`**

```typescript
// app/(public)/ticket/components/TicketCard.tsx
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
```

**新規ファイル: `app/(public)/ticket/components/TicketQuantitySelector.tsx`**

```typescript
// app/(public)/ticket/components/TicketQuantitySelector.tsx
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
```

**新規ファイル: `app/(public)/ticket/components/CustomerInfoForm.tsx`**

```typescript
// app/(public)/ticket/components/CustomerInfoForm.tsx
'use client';

import { CustomerInfo } from '../types';

interface CustomerInfoFormProps {
  data: CustomerInfo;
  onChange: (data: CustomerInfo) => void;
  disabled?: boolean;
}

export function CustomerInfoForm({ data, onChange, disabled = false }: CustomerInfoFormProps) {
  const handleChange = (field: keyof CustomerInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">
        購入者情報
      </h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={disabled}
            placeholder="山田 太郎"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={disabled}
            placeholder="example@email.com"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            チケット情報をこちらのメールアドレスに送信します
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
            電話番号 <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={disabled}
            placeholder="090-1234-5678"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
            required
          />
        </div>
      </div>
    </div>
  );
}
```

**新規ファイル: `app/(public)/ticket/components/PriceSummary.tsx`**

```typescript
// app/(public)/ticket/components/PriceSummary.tsx
'use client';

import { Performance, TicketQuantities } from '../types';

interface PriceSummaryProps {
  performance: Performance;
  quantities: TicketQuantities;
  discountAmount?: number;
}

export function PriceSummary({ performance, quantities, discountAmount = 0 }: PriceSummaryProps) {
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

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const total = subtotal - discountAmount;

  return (
    <div className="bg-slate-50 rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">
        料金明細
      </h2>

      <div className="space-y-2">
        {items.map((item) => (
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
        ))}
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
```

#### 6.4 リファクタリング後のメインページ

**リファクタリング後: `app/(public)/ticket/page.tsx`**

```typescript
// app/(public)/ticket/page.tsx (リファクタリング後: 約200行)
'use client';

import { useRouter } from 'next/navigation';
import { Ticket } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorMessage } from '@/components/ui/error-message';
import { TicketQuantitySelector } from './components/TicketQuantitySelector';
import { CustomerInfoForm } from './components/CustomerInfoForm';
import { PriceSummary } from './components/PriceSummary';
import { useTicketPurchase } from './hooks/useTicketPurchase';
import { useExchangeCodeValidation } from './hooks/useExchangeCodeValidation';

export default function TicketPurchasePage() {
  const router = useRouter();

  const {
    performances,
    selectedPerformance,
    loading,
    error,
    quantities,
    customerInfo,
    agreedToCancellationPolicy,
    totalTickets,
    totalAmount,
    isFormValid,
    setSelectedPerformance,
    handleQuantityChange,
    setCustomerInfo,
    setAgreedToCancellationPolicy,
    refetch,
  } = useTicketPurchase();

  const {
    hasExchangeCode,
    exchangeCodes,
    validCodesCount,
    setHasExchangeCode,
  } = useExchangeCodeValidation();

  const handleCheckout = async () => {
    if (!isFormValid) {
      alert('必須項目を入力してください');
      return;
    }

    // sessionStorageに保存
    const orderData = {
      performanceId: selectedPerformance!.id,
      generalQuantity: quantities.general,
      reservedQuantity: quantities.reserved,
      vip1Quantity: quantities.vip1,
      vip2Quantity: quantities.vip2,
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      hasExchangeCode,
      exchangeCodes: exchangeCodes.filter((c) => c.trim() !== ''),
      agreedToCancellationPolicy,
    };

    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    router.push('/ticket/confirm');
  };

  if (loading) {
    return <LoadingSpinner message="公演情報を読み込んでいます..." />;
  }

  if (error) {
    return <ErrorMessage message={error} retry={refetch} />;
  }

  if (performances.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <Ticket className="mx-auto mb-6 text-slate-200" size={64} strokeWidth={1} />
          <h2 className="text-2xl font-serif text-slate-700 mb-4">
            現在販売中のチケットはありません
          </h2>
          <p className="text-slate-500">
            次回公演の情報をお待ちください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-serif tracking-wider text-slate-800 mb-2">
            チケット購入
          </h1>
          <p className="text-slate-500">
            公演を選択してチケットをご購入ください
          </p>
        </div>

        <div className="space-y-12">
          {/* 公演選択 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              公演を選択
            </h2>
            <div className="space-y-3">
              {performances.map((perf) => (
                <button
                  key={perf.id}
                  onClick={() => setSelectedPerformance(perf)}
                  className={`w-full text-left p-6 border-2 rounded-lg transition-all ${
                    selectedPerformance?.id === perf.id
                      ? 'border-slate-800 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <h3 className="font-serif text-lg text-slate-800 mb-2">
                    {perf.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {new Date(perf.performanceDate).toLocaleDateString('ja-JP')} {' '}
                    {new Date(perf.performanceTime).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{perf.venueName}</p>
                </button>
              ))}
            </div>
          </section>

          {selectedPerformance && (
            <>
              {/* チケット枚数選択 */}
              <section>
                <TicketQuantitySelector
                  performance={selectedPerformance}
                  quantities={quantities}
                  onChange={handleQuantityChange}
                />
              </section>

              {totalTickets > 0 && (
                <>
                  {/* 購入者情報 */}
                  <section>
                    <CustomerInfoForm
                      data={customerInfo}
                      onChange={setCustomerInfo}
                    />
                  </section>

                  {/* 料金明細 */}
                  <section>
                    <PriceSummary
                      performance={selectedPerformance}
                      quantities={quantities}
                      discountAmount={validCodesCount * 500}
                    />
                  </section>

                  {/* キャンセルポリシー */}
                  <section>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToCancellationPolicy}
                        onChange={(e) => setAgreedToCancellationPolicy(e.target.checked)}
                        className="mt-1"
                      />
                      <span className="text-sm text-slate-600">
                        <a href="/ticket/cancel" className="text-blue-600 hover:underline">
                          キャンセルポリシー
                        </a>
                        に同意します
                      </span>
                    </label>
                  </section>

                  {/* 購入ボタン */}
                  <button
                    onClick={handleCheckout}
                    disabled={!isFormValid}
                    className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    購入手続きへ進む
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

**メリット:**

- ✅ 924行 → 約200行（-78%削減）
- ✅ コンポーネント再利用可能
- ✅ カスタムフックでロジック分離
- ✅ 単体テスト可能
- ✅ 保守性大幅向上

---

### Phase 7: その他のページの軽微な改善

#### 7.1 easel-liveページ

**リファクタリング後: `app/(public)/easel-live/page.tsx`**

```typescript
// app/(public)/easel-live/page.tsx (リファクタリング後)
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroSection } from '@/components/ui/hero-section';
import { getAllPerformances } from '@/lib/data/performances';

export default async function EaselLiveTopPage() {
  const performances = await getAllPerformances();

  return (
    <div>
      <HeroSection subtitle="Live" title="easel live" />

      {/* About easel live */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="section-title mb-14 text-center">easel liveとは</h2>
          <div className="text-center text-slate-600 leading-loose space-y-6">
            <p className="font-serif text-xl text-slate-700">
              『踊りだす絵画、響きあう感性』
            </p>
            <p>
              ダンス×絵画、表現の魅力を深めるひととき。
            </p>
            <p>
              第一線で活躍する現代アーティストとダンサーが共鳴し、<br />
              絵画から生まれるダンスパフォーマンスで彩る、<br />
              展覧会型ダンス公演。
            </p>
          </div>
        </div>
      </section>

      {/* Archive */}
      <section className="py-28 px-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title mb-14 text-center">Archive</h2>

          {performances.length > 0 ? (
            <div className="space-y-6">
              {performances.map((performance) => {
                const firstSessionDate = performance.sessions[0]?.performanceDate;
                const year = firstSessionDate ? new Date(firstSessionDate).getFullYear() : '----';

                return (
                  <Link
                    key={performance.id}
                    href={`/easel-live/${performance.volume?.replace('.', '')}`}
                    className="group block p-8 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs tracking-wider text-slate-400 mb-2">
                          {year}
                        </p>
                        <h3 className="font-serif text-2xl tracking-wider text-slate-700 mb-2">
                          {performance.volume ? `Vol.${performance.volume.replace('vol', '')}` : performance.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm transition-colors duration-300">
                        <span className={`tracking-wider font-medium ${
                          performance.isOnSale
                            ? 'text-green-600 group-hover:text-green-700'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}>
                          {performance.isOnSale ? 'NOW ON SALE' : 'ARCHIVE'}
                        </span>
                        <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p>Coming Soon</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
```

---

## 📈 期待される効果

### コード削減

| ファイル               | Before  | After | 削減率   |
| ---------------------- | ------- | ----- | -------- |
| `ticket/page.tsx`      | 924行   | 200行 | **-78%** |
| `news/page.tsx`        | 114行   | 50行  | **-56%** |
| `page.tsx`             | 155行   | 100行 | **-35%** |
| `easel-live/page.tsx`  | 111行   | 80行  | **-28%** |
| **合計（主要ページ）** | 1,304行 | 430行 | **-67%** |

### 新規追加ファイル

| カテゴリ                   | ファイル数 | 合計行数     |
| -------------------------- | ---------- | ------------ |
| データアクセス層           | 2          | ~200行       |
| 共通UIコンポーネント       | 4          | ~200行       |
| チケット購入コンポーネント | 5          | ~600行       |
| カスタムフック             | 2          | ~250行       |
| 型定義                     | 1          | ~50行        |
| **合計**                   | **14**     | **~1,300行** |

### 品質向上

| 項目               | Before | After |
| ------------------ | ------ | ----- |
| **保守性**         | D      | A     |
| **再利用性**       | なし   | 高い  |
| **テスト容易性**   | 困難   | 容易  |
| **パフォーマンス** | C      | A     |
| **SEO**            | C      | A     |
| **型安全性**       | B      | A     |

---

## ⏱️ 実装スケジュール

| Phase    | 内容                               | 工数      | 優先度 |
| -------- | ---------------------------------- | --------- | ------ |
| Phase 1  | 共通ユーティリティ整理             | 0.5日     | 🔴 P1  |
| Phase 2  | データアクセス層作成               | 0.5日     | 🔴 P1  |
| Phase 3  | 共通UIコンポーネント作成           | 1日       | 🔴 P1  |
| Phase 4  | ニュースページリファクタリング     | 0.5日     | 🟡 P2  |
| Phase 5  | トップページリファクタリング       | 0.5日     | 🟡 P2  |
| Phase 6  | チケット購入ページリファクタリング | 2日       | 🔴 P1  |
| Phase 7  | その他ページ改善                   | 0.5日     | 🟢 P3  |
| **合計** |                                    | **5.5日** |        |

---

## ✅ チェックリスト

### コード品質

- [ ] 1ファイル200行以内（メインページ）
- [ ] 重複コード削除
- [ ] DRY原則遵守
- [ ] 型安全性確保（`any`型なし）

### パフォーマンス

- [ ] Server Componentの活用
- [ ] クライアントJavaScript削減
- [ ] `React.memo`で最適化
- [ ] `useCallback`/`useMemo`適切に使用

### 保守性

- [ ] コンポーネント単一責任
- [ ] Props明確に定義
- [ ] カスタムフックでロジック分離
- [ ] データアクセス層統一

### SEO

- [ ] Server Side Rendering
- [ ] メタデータ最適化
- [ ] セマンティックHTML

---

## 🚀 実装開始

このリファクタリング計画に基づいて実装を開始しますか？

推奨実装順序:

1. **Phase 1-3** (共通部分): 2日
2. **Phase 6** (チケット購入): 2日
3. **Phase 4-5, 7** (その他): 1.5日

合計: **5.5日**で完了予定

ご確認ください！
