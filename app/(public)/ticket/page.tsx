'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Ticket, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  Minus,
  Loader2,
  User
} from 'lucide-react';

interface Performance {
  id: number;
  title: string;
  volume: string;
  performanceDate: string; // ISO string from API
  performanceTime: string; // ISO string from API
  doorsOpenTime: string | null; // ISO string from API
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

interface PerformanceSession {
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

interface CodeValidationResult {
  code: string;
  valid: boolean;
  used: boolean;
  performerName?: string;
  performanceSession?: PerformanceSession | null;
}

export default function TicketPurchasePage() {
  const router = useRouter();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 引換券コード
  const [hasExchangeCode, setHasExchangeCode] = useState<boolean | null>(null);
  const [exchangeCodes, setExchangeCodes] = useState<string[]>(['']);
  const [codeValidations, setCodeValidations] = useState<CodeValidationResult[]>([]);
  const [validatingCodes, setValidatingCodes] = useState(false);

  // チケット枚数
  const [generalQuantity, setGeneralQuantity] = useState(0);
  const [reservedQuantity, setReservedQuantity] = useState(0);
  const [vip1Quantity, setVip1Quantity] = useState(0);
  const [vip2Quantity, setVip2Quantity] = useState(0);

  // 顧客情報
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    performanceId: '',
  });

  // キャンセルポリシー同意
  const [agreedToCancellationPolicy, setAgreedToCancellationPolicy] = useState(false);

  // 確認画面から戻ってきた場合、sessionStorageから復元
  useEffect(() => {
    const savedData = sessionStorage.getItem('orderData');
    if (savedData) {
      try {
        const orderData = JSON.parse(savedData);
        setHasExchangeCode(orderData.hasExchangeCode);
        setExchangeCodes(orderData.exchangeCodes.length > 0 ? orderData.exchangeCodes : ['']);
        setGeneralQuantity(orderData.generalQuantity || 0);
        setReservedQuantity(orderData.reservedQuantity || 0);
        setVip1Quantity(orderData.vip1Quantity || 0);
        setVip2Quantity(orderData.vip2Quantity || 0);
        setFormData({
          name: orderData.name,
          email: orderData.email,
          phone: orderData.phone,
          performanceId: orderData.performanceId.toString(),
        });
        // キャンセルポリシー同意の復元（デフォルトはtrue）
        if (orderData.agreedToCancellationPolicy !== undefined) {
          setAgreedToCancellationPolicy(orderData.agreedToCancellationPolicy);
        }
      } catch (error) {
        console.error('Failed to restore order data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchPerformances = async () => {
      try {
        const response = await fetch('/api/performances/on-sale');
        if (!response.ok) {
          throw new Error('公演情報の取得に失敗しました');
        }
        const data = await response.json();
        setPerformances(data);
        
        // sessionStorageからの復元データがある場合はそれを使用
        const savedData = sessionStorage.getItem('orderData');
        if (savedData) {
          try {
            const orderData = JSON.parse(savedData);
            const savedPerf = data.find((p: Performance) => p.id === orderData.performanceId);
            if (savedPerf) {
              setSelectedPerformance(savedPerf);
            } else if (data.length > 0) {
              setSelectedPerformance(data[0]);
              setFormData((f) => ({ ...f, performanceId: data[0].id.toString() }));
            }
          } catch (error) {
            console.error('Failed to parse saved data:', error);
            if (data.length > 0) {
              setSelectedPerformance(data[0]);
              setFormData((f) => ({ ...f, performanceId: data[0].id.toString() }));
            }
          }
        } else if (data.length > 0) {
          setSelectedPerformance(data[0]);
          setFormData((f) => ({ ...f, performanceId: data[0].id.toString() }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '公演情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformances();
  }, []);

  const generalPrice = selectedPerformance?.generalPrice ?? 4500;
  const reservedPrice = selectedPerformance?.reservedPrice ?? 5500;
  const vip1Price = selectedPerformance?.vip1Price ?? 30000;
  const vip2Price = selectedPerformance?.vip2Price ?? 8500;
  const generalRemaining = selectedPerformance ? selectedPerformance.generalCapacity - selectedPerformance.generalSold : 0;
  const reservedRemaining = selectedPerformance ? selectedPerformance.reservedCapacity - selectedPerformance.reservedSold : 0;
  const vip1Remaining = selectedPerformance ? selectedPerformance.vip1Capacity - selectedPerformance.vip1Sold : 0;
  const vip2Remaining = selectedPerformance ? selectedPerformance.vip2Capacity - selectedPerformance.vip2Sold : 0;

  const validCodeCount = useMemo(
    () => codeValidations.filter((v) => v.valid && !v.used).length,
    [codeValidations]
  );

  const discountedGeneralCount = hasExchangeCode
    ? Math.min(validCodeCount, generalQuantity)
    : 0;

  const calculations = useMemo(() => {
    const generalTotal = (generalQuantity - discountedGeneralCount) * generalPrice;
    const reservedTotal = reservedQuantity * reservedPrice;
    const vip1Total = vip1Quantity * vip1Price;
    const vip2Total = vip2Quantity * vip2Price;
    const total = generalTotal + reservedTotal + vip1Total + vip2Total;
    const discountAmount = discountedGeneralCount * generalPrice;

    return { generalTotal, reservedTotal, vip1Total, vip2Total, total, discountAmount };
  }, [generalQuantity, reservedQuantity, vip1Quantity, vip2Quantity, discountedGeneralCount, generalPrice, reservedPrice, vip1Price, vip2Price]);

  const totalQuantity = generalQuantity + reservedQuantity + vip1Quantity + vip2Quantity;

  const hasDuplicateCodes = useMemo(() => {
    if (!hasExchangeCode) return false;
    const nonEmptyCodes = exchangeCodes.filter(c => c.trim() !== '').map(c => c.toLowerCase());
    return new Set(nonEmptyCodes).size !== nonEmptyCodes.length;
  }, [exchangeCodes, hasExchangeCode]);

  const isExchangeCodeValid =
    hasExchangeCode === false ||
    (hasExchangeCode === true &&
      exchangeCodes.length > 0 &&
      exchangeCodes.every((code) => code.trim() !== '') &&
      codeValidations.length > 0 &&
      codeValidations.every((v) => v.valid && !v.used) &&
      !hasDuplicateCodes);

  const isFormValid =
    formData.performanceId &&
    formData.name.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    hasExchangeCode !== null &&
    isExchangeCodeValid &&
    totalQuantity > 0 &&
    agreedToCancellationPolicy;

  const handlePerformanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setFormData((prev) => ({ ...prev, performanceId: id }));

    if (id) {
      const perf = performances.find((p) => p.id === parseInt(id));
      setSelectedPerformance(perf || null);
      setGeneralQuantity(0);
      setReservedQuantity(0);
    } else {
      setSelectedPerformance(null);
    }
  };

  const handleQuantityChange = (type: 'general' | 'reserved' | 'vip1' | 'vip2', delta: number) => {
    if (type === 'general') {
      const max = Math.min(generalRemaining, 10);
      setGeneralQuantity((prev) => Math.max(0, Math.min(max, prev + delta)));
    } else if (type === 'reserved') {
      const max = Math.min(reservedRemaining, 10);
      setReservedQuantity((prev) => Math.max(0, Math.min(max, prev + delta)));
    } else if (type === 'vip1') {
      const max = Math.min(vip1Remaining, 10);
      setVip1Quantity((prev) => Math.max(0, Math.min(max, prev + delta)));
    } else if (type === 'vip2') {
      const max = Math.min(vip2Remaining, 10);
      setVip2Quantity((prev) => Math.max(0, Math.min(max, prev + delta)));
    }
  };

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (/^0[789]0/.test(digits)) {
      if (digits.length <= 3) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      if (digits.length <= 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    }
    return value;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData((prev) => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    setExchangeCodes((prev) => {
      const newCodes = [...prev];
      newCodes[index] = value.toLowerCase();
      return newCodes;
    });
    setCodeValidations([]);
  };

  const addCodeField = () => {
    if (exchangeCodes.length < 10) {
      setExchangeCodes((prev) => [...prev, '']);
    }
  };

  const removeCodeField = (index: number) => {
    if (exchangeCodes.length > 1) {
      setExchangeCodes((prev) => prev.filter((_, i) => i !== index));
      setCodeValidations([]);
    }
  };

  const validateExchangeCodes = async () => {
    const nonEmptyCodes = exchangeCodes.filter((code) => code.trim() !== '');
    if (nonEmptyCodes.length === 0) {
      setCodeValidations([]);
      return;
    }

    setValidatingCodes(true);
    try {
      const response = await fetch('/api/exchange-codes/validate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: nonEmptyCodes }),
      });

      if (!response.ok) {
        throw new Error('バリデーションに失敗しました');
      }

      const data = await response.json();
      const results = data.results.map((r: any) => ({
        code: r.code,
        valid: r.valid,
        used: r.used,
        performerName: r.performerName,
        message: r.used ? 'このコードは既に使用済みです' : r.valid ? '有効なコードです' : '無効なコードです',
      }));
      setCodeValidations(results);
    } catch (err) {
      console.error('Code validation error:', err);
      alert('引換券コードの確認に失敗しました');
    } finally {
      setValidatingCodes(false);
    }
  };

  useEffect(() => {
    if (hasExchangeCode && exchangeCodes.some((code) => code.trim() !== '')) {
      const timer = setTimeout(validateExchangeCodes, 500);
      return () => clearTimeout(timer);
    }
  }, [exchangeCodes, hasExchangeCode]);

  const getCodeValidation = (code: string): CodeValidationResult | undefined => {
    return codeValidations.find((v) => v.code.toLowerCase() === code.toLowerCase());
  };

  const isDuplicateCode = (code: string, currentIndex: number): boolean => {
    if (!code.trim()) return false;
    return exchangeCodes.some(
      (c, index) => index !== currentIndex && c.trim().toLowerCase() === code.trim().toLowerCase()
    );
  };

  const formatPerformanceLabel = (perf: Performance): string => {
    const date = new Date(perf.performanceDate);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const time = new Date(perf.performanceTime).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${year}年${month}月${day}日（${weekday}） ${time}`;
  };

  const handleGoToConfirm = () => {
    if (!isFormValid || !selectedPerformance) return;

    const orderData = {
      performanceId: selectedPerformance.id,
      performanceTitle: selectedPerformance.title,
      date: selectedPerformance.performanceDate.split('T')[0], // Already a string
      dateLabel: formatPerformanceLabel(selectedPerformance),
      hasExchangeCode: hasExchangeCode!,
      exchangeCodes: hasExchangeCode ? exchangeCodes.filter((c) => c.trim() !== '') : [],
      generalQuantity,
      reservedQuantity,
      vip1Quantity,
      vip2Quantity,
      generalPrice,
      reservedPrice,
      vip1Price,
      vip2Price,
      discountedGeneralCount,
      discountAmount: calculations.discountAmount,
      total: calculations.total,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      agreedToCancellationPolicy,
    };

    // sessionStorageにデータを保存
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    router.push('/ticket/confirm');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <p className="text-slate-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-slate-500 hover:text-slate-700 underline"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="min-h-[300px] flex flex-col justify-center px-6 bg-warm-50">
        <div className="max-w-3xl mx-auto w-full">
          <nav className="mb-3">
            <Link href="/" className="text-xs tracking-wider text-slate-400 hover:text-slate-600 transition-colors">
              Home
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-xs tracking-wider text-slate-500">Ticket</span>
          </nav>
          <div className="text-center">
            <p className="section-subtitle mb-4">Ticket Purchase</p>
            <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.2em] text-slate-800">
              チケット購入
            </h1>
          </div>
        </div>
      </section>

      {/* Form */}
      <div className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <form className="space-y-14" onSubmit={(e) => e.preventDefault()}>

            {/* 公演日時選択 */}
            <section>
              <h2 className="text-xs tracking-wider text-slate-400 mb-4 uppercase flex items-center gap-2">
                <Ticket size={16} />
                公演日時 <span className="text-red-400">*</span>
              </h2>
              <select
                name="performanceId"
                value={formData.performanceId}
                onChange={handlePerformanceChange}
                className="w-full p-4 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
              >
                <option value="">公演日時を選択してください</option>
                {performances.map((perf) => {
                  const soldOut = (perf.generalCapacity - perf.generalSold) <= 0 && (perf.reservedCapacity - perf.reservedSold) <= 0;
                  return (
                    <option key={perf.id} value={perf.id} disabled={soldOut}>
                      {formatPerformanceLabel(perf)}
                      {soldOut && ' (SOLD OUT)'}
                    </option>
                  );
                })}
              </select>
              {selectedPerformance && (
                <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    📍 {selectedPerformance.venueName}
                  </p>
                  <div className="text-sm text-slate-500 mt-1">
                    <p>
                      残席: 一般席 <span className="font-medium text-slate-700">{generalRemaining}</span>枚 / 
                      指定席 <span className="font-medium text-slate-700">{reservedRemaining}</span>枚
                      {(selectedPerformance.vip1Price && vip1Remaining > 0) && (
                        <> / VIP①席 <span className="font-medium text-slate-700">{vip1Remaining}</span>枚</>
                      )}
                      {(selectedPerformance.vip2Price && vip2Remaining > 0) && (
                        <> / VIP②席 <span className="font-medium text-slate-700">{vip2Remaining}</span>枚</>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* 引換券コード */}
            <section>
              <h2 className="text-xs tracking-wider text-slate-400 mb-4 uppercase">
                引換券コード（出演者から購入）<span className="text-red-400">*</span>
              </h2>
              <div className="space-y-6">
                <div className="flex gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="hasExchangeCode"
                      checked={hasExchangeCode === false}
                      onChange={() => {
                        setHasExchangeCode(false);
                        setExchangeCodes(['']);
                        setCodeValidations([]);
                      }}
                      className="w-4 h-4 text-slate-600 border-slate-300 focus:ring-slate-500"
                    />
                    <span className="text-slate-700 group-hover:text-slate-900">引換券なし</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="hasExchangeCode"
                      checked={hasExchangeCode === true}
                      onChange={() => setHasExchangeCode(true)}
                      className="w-4 h-4 text-slate-600 border-slate-300 focus:ring-slate-500"
                    />
                    <span className="text-slate-700 group-hover:text-slate-900">引換券あり</span>
                  </label>
                </div>

                {hasExchangeCode && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                      出演者から受け取った引換券コードを入力してください。
                      <br />
                      <span className="text-green-600">※引換券1枚につき一般席1枚分が無料になります。</span>
                    </p>
                    {exchangeCodes.map((code, index) => {
                      const validation = getCodeValidation(code);
                      const isDuplicate = isDuplicateCode(code, index);
                      const hasError = (validation && (!validation.valid || validation.used)) || isDuplicate;
                      
                      return (
                        <div key={index}>
                          <div className="flex gap-3">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={code}
                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                placeholder={`引換券コード ${index + 1}`}
                                className={`w-full p-4 pr-12 border rounded-lg focus:outline-none transition-all ${
                                  hasError
                                    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
                                    : validation && validation.valid && !validation.used
                                      ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-100'
                                      : 'border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100'
                                }`}
                              />
                              {(validation || isDuplicate) && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                  {validation && validation.valid && !validation.used && !isDuplicate ? (
                                    <CheckCircle size={20} className="text-green-500" />
                                  ) : (
                                    <AlertCircle size={20} className="text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                            {exchangeCodes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCodeField(index)}
                                className="p-4 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
                              >
                                <X size={16} className="text-slate-400" />
                              </button>
                            )}
                          </div>
                          {isDuplicate && (
                            <div className="mt-2">
                              <p className="text-sm text-red-500">
                                ✗ このコードは既に入力されています
                              </p>
                            </div>
                          )}
                          {!isDuplicate && validation && (
                            <div className="mt-2 space-y-2">
                              <p className={`text-sm ${validation.valid && !validation.used ? 'text-green-600' : 'text-red-500'}`}>
                                {validation.valid && !validation.used ? '✓ ' : '✗ '}
                                {validation.used ? 'このコードは既に使用済みです' : validation.valid ? '有効なコードです' : '無効なコードです'}
                              </p>
                              {validation.performerName && validation.valid && !validation.used && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                  <User size={16} className="text-green-600" />
                                  <span className="text-sm text-green-700">
                                    出演者: <span className="font-semibold">{validation.performerName}</span>
                                  </span>
                                </div>
                              )}
                              {validation.performanceSession && validation.valid && !validation.used && (
                                <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="text-xs text-blue-600 mb-1">対象公演</div>
                                  <div className="text-sm text-blue-700">
                                    <span className="font-semibold">{validation.performanceSession.performance.title}</span>
                                    {' - '}
                                    <span className="font-medium">
                                      {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][validation.performanceSession.showNumber - 1] || `${validation.performanceSession.showNumber}th`}
                                    </span>
                                    {' '}
                                    <span className="text-xs">
                                      ({new Date(validation.performanceSession.performanceDate).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })})
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={addCodeField}
                      disabled={exchangeCodes.length >= 10}
                      className="inline-flex items-center gap-2 px-5 py-3 border border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50"
                    >
                      <Plus size={16} />
                      <span>コードを追加</span>
                    </button>
                    {validatingCodes && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Loader2 size={14} className="animate-spin" />
                        <span>コードを確認中...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* チケット枚数 */}
            <section>
              <h2 className="text-xs tracking-wider text-slate-400 mb-4 uppercase">
                枚数 <span className="text-red-400">*</span>
              </h2>
              <div className="space-y-4">
                {/* 一般席 */}
                <div className="flex items-center justify-between p-5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div>
                    <p className="text-slate-700 font-medium">一般席（自由席）</p>
                    <p className="text-sm text-slate-400">
                      ¥{generalPrice.toLocaleString()} / 枚
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('general', -1)}
                      disabled={generalQuantity === 0 || !selectedPerformance}
                      className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={16} className="text-slate-500" />
                    </button>
                    <span className="w-8 text-center text-lg text-slate-700">
                      {generalQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('general', 1)}
                      disabled={!selectedPerformance || generalQuantity >= Math.min(generalRemaining, 10)}
                      className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} className="text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* 指定席 */}
                <div className="flex items-center justify-between p-5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div>
                    <p className="text-slate-700 font-medium">指定席</p>
                    <p className="text-sm text-slate-400">
                      ¥{reservedPrice.toLocaleString()} / 枚
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('reserved', -1)}
                      disabled={reservedQuantity === 0 || !selectedPerformance}
                      className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={16} className="text-slate-500" />
                    </button>
                    <span className="w-8 text-center text-lg text-slate-700">
                      {reservedQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('reserved', 1)}
                      disabled={!selectedPerformance || reservedQuantity >= Math.min(reservedRemaining, 10)}
                      className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} className="text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* VIP① */}
                {selectedPerformance?.vip1Price && vip1Remaining > 0 && (
                  <div className="flex items-center justify-between p-5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-700 font-medium">VIP①席</p>
                        <span className="px-2 py-0.5 text-xs font-medium text-slate-600 bg-slate-100 rounded">特典付き</span>
                      </div>
                      <p className="text-sm text-slate-400">
                        ¥{vip1Price.toLocaleString()} / 枚
                      </p>
                      {selectedPerformance.vip1Note && (
                        <p className="text-xs text-slate-500 mt-1">
                          {selectedPerformance.vip1Note}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('vip1', -1)}
                        disabled={vip1Quantity === 0 || !selectedPerformance}
                        className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus size={16} className="text-slate-500" />
                      </button>
                      <span className="w-8 text-center text-lg text-slate-700">
                        {vip1Quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('vip1', 1)}
                        disabled={!selectedPerformance || vip1Quantity >= Math.min(vip1Remaining, 10)}
                        className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} className="text-slate-500" />
                      </button>
                    </div>
                  </div>
                )}

                {/* VIP② */}
                {selectedPerformance?.vip2Price && vip2Remaining > 0 && (
                  <div className="flex items-center justify-between p-5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-700 font-medium">VIP②席</p>
                        <span className="px-2 py-0.5 text-xs font-medium text-slate-600 bg-slate-100 rounded">特典付き</span>
                      </div>
                      <p className="text-sm text-slate-400">
                        ¥{vip2Price.toLocaleString()} / 枚
                      </p>
                      {selectedPerformance.vip2Note && (
                        <p className="text-xs text-slate-500 mt-1">
                          {selectedPerformance.vip2Note}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('vip2', -1)}
                        disabled={vip2Quantity === 0 || !selectedPerformance}
                        className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus size={16} className="text-slate-500" />
                      </button>
                      <span className="w-8 text-center text-lg text-slate-700">
                        {vip2Quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('vip2', 1)}
                        disabled={!selectedPerformance || vip2Quantity >= Math.min(vip2Remaining, 10)}
                        className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} className="text-slate-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* お客様情報 */}
            <section>
              <h2 className="text-xs tracking-wider text-slate-400 mb-4 uppercase">
                お客様情報 <span className="text-red-400">*</span>
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-slate-500 mb-2">
                    お名前 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="山田 太郎"
                    className="w-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-2">
                    メールアドレス <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    className="w-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                  />
                  <p className="mt-1 text-xs text-slate-400">※チケット情報をお送りします</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-2">
                    電話番号 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="090-1234-5678"
                    className="w-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                  />
                </div>
              </div>
            </section>

            {/* 合計金額 */}
            <section className="pt-8 border-t border-slate-100">
              <div className="space-y-4 mb-10">
                {generalQuantity > 0 && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>一般席 ¥{generalPrice.toLocaleString()} × {generalQuantity}枚</span>
                    <span>¥{(generalQuantity * generalPrice).toLocaleString()}</span>
                  </div>
                )}
                {reservedQuantity > 0 && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>指定席 ¥{reservedPrice.toLocaleString()} × {reservedQuantity}枚</span>
                    <span>¥{calculations.reservedTotal.toLocaleString()}</span>
                  </div>
                )}
                {vip1Quantity > 0 && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>VIP①席 ¥{vip1Price.toLocaleString()} × {vip1Quantity}枚</span>
                    <span>¥{calculations.vip1Total.toLocaleString()}</span>
                  </div>
                )}
                {vip2Quantity > 0 && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>VIP②席 ¥{vip2Price.toLocaleString()} × {vip2Quantity}枚</span>
                    <span>¥{calculations.vip2Total.toLocaleString()}</span>
                  </div>
                )}
                {calculations.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>🎫 引換券割引（{discountedGeneralCount}枚分）</span>
                    <span>-¥{calculations.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-slate-700 font-medium">合計</span>
                  <span className="font-serif text-3xl text-slate-800">
                    ¥{calculations.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* キャンセルポリシー */}
              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  キャンセルポリシー
                </h4>
                <ul className="text-sm text-amber-800 space-y-1.5 mb-3 ml-1">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>キャンセル時は決済手数料を差し引いた額をお戻しいたします</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>本番7日前以降はキャンセル不可となります</span>
                  </li>
                </ul>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToCancellationPolicy}
                    onChange={(e) => setAgreedToCancellationPolicy(e.target.checked)}
                    className="mt-1 w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-amber-900 select-none">
                    キャンセルポリシーに同意します
                  </span>
                </label>
              </div>

              {/* アクションボタン */}
              <button
                type="button"
                onClick={handleGoToConfirm}
                disabled={!isFormValid}
                className={`mt-8 btn-primary w-full justify-center ${
                  !isFormValid ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                確認画面へ進む
              </button>

              {!isFormValid && (
                <p className="text-center text-sm text-slate-400 mt-4">
                  すべての必須項目を入力してください
                </p>
              )}
            </section>
          </form>
        </div>
      </div>
    </div>
  );
}
