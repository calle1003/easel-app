'use client';

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
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { useTicketPurchase } from '@/hooks/useTicketPurchase';
import { useExchangeCodeValidation } from '@/hooks/useExchangeCodeValidation';
import { CustomerInfoForm } from './components/CustomerInfoForm';
import { PriceSummary } from './components/PriceSummary';

export default function TicketPurchasePage() {
  const router = useRouter();

  // カスタムフック
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
    handleQuantityChange,
    setCustomerInfo,
    setAgreedToCancellationPolicy,
    setSelectedPerformance,
  } = useTicketPurchase();

  const {
    hasExchangeCode,
    exchangeCodes,
    codeValidations,
    validating,
    validCodesCount,
    isExchangeCodeValid,
    setHasExchangeCode,
    addCodeField,
    removeCodeField,
    handleCodeChange,
    getCodeValidation,
    isDuplicateCode,
  } = useExchangeCodeValidation();

  // バリデーション
  const isFormValid =
    selectedPerformance !== null &&
    totalTickets > 0 &&
    customerInfo.name.trim() !== '' &&
    customerInfo.email.trim() !== '' &&
    customerInfo.phone.trim() !== '' &&
    hasExchangeCode !== null &&
    isExchangeCodeValid &&
    agreedToCancellationPolicy;

  // ハンドラー
  const formatPerformanceLabel = (perf: typeof performances[0]) => {
    const date = formatDate(perf.performanceDate, 'short');
    const time = formatTime(perf.performanceTime);
    return `${date} ${time} - ${perf.title}`;
  };

  const handleCheckout = async () => {
    if (!isFormValid || !selectedPerformance) {
      alert('必須項目を入力してください');
      return;
    }

    const date = formatDate(selectedPerformance.performanceDate, 'short');
    const time = formatTime(selectedPerformance.performanceTime);
    const dateLabel = `${date} ${time} - ${selectedPerformance.title}`;

    const discountedGeneralCount = Math.min(validCodesCount, quantities.general);
    const discountAmount = discountedGeneralCount * selectedPerformance.generalPrice;
    const subtotal = totalAmount;
    const total = subtotal - discountAmount;

    const orderData = {
      performanceId: selectedPerformance.id,
      performanceTitle: selectedPerformance.title,
      date: selectedPerformance.performanceDate,
      dateLabel,
      generalQuantity: quantities.general,
      reservedQuantity: quantities.reserved,
      vip1Quantity: quantities.vip1,
      vip2Quantity: quantities.vip2,
      generalPrice: selectedPerformance.generalPrice,
      reservedPrice: selectedPerformance.reservedPrice,
      vip1Price: selectedPerformance.vip1Price || 0,
      vip2Price: selectedPerformance.vip2Price || 0,
      discountedGeneralCount,
      discountAmount,
      total,
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
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-slate-300 animate-spin mb-4" />
          <p className="text-slate-500">公演情報を読み込んでいます...</p>
        </div>
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

  if (performances.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <Ticket className="mx-auto mb-6 text-slate-200" size={64} strokeWidth={1} />
          <h2 className="text-2xl font-serif text-slate-700 mb-4">
            現在販売中のチケットはありません
          </h2>
          <p className="text-slate-500 mb-8">次回公演の情報をお待ちください</p>
          <Link href="/" className="btn-secondary">
            トップページへ戻る
          </Link>
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
                value={customerInfo.performanceId}
                onChange={(e) => {
                  const id = e.target.value;
                  setCustomerInfo({ ...customerInfo, performanceId: id });
                  if (id) {
                    const perf = performances.find((p) => p.id === parseInt(id));
                    if (perf) {
                      setSelectedPerformance(perf);
                    }
                  }
                }}
                className="w-full p-4 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
              >
                <option value="">公演日時を選択してください</option>
                {performances.map((perf) => {
                  const generalRemaining = perf.generalCapacity - perf.generalSold;
                  const reservedRemaining = perf.reservedCapacity - perf.reservedSold;
                  const soldOut = generalRemaining <= 0 && reservedRemaining <= 0;
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
                  <p className="text-sm text-slate-600">📍 {selectedPerformance.venueName}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    残席: 一般席 <span className="font-medium text-slate-700">{selectedPerformance.generalCapacity - selectedPerformance.generalSold}</span>枚 / 
                    指定席 <span className="font-medium text-slate-700">{selectedPerformance.reservedCapacity - selectedPerformance.reservedSold}</span>枚
                    {selectedPerformance.vip1Price && selectedPerformance.vip1Capacity - selectedPerformance.vip1Sold > 0 && (
                      <> / VIP①席 <span className="font-medium text-slate-700">{selectedPerformance.vip1Capacity - selectedPerformance.vip1Sold}</span>枚</>
                      )}
                    {selectedPerformance.vip2Price && selectedPerformance.vip2Capacity - selectedPerformance.vip2Sold > 0 && (
                      <> / VIP②席 <span className="font-medium text-slate-700">{selectedPerformance.vip2Capacity - selectedPerformance.vip2Sold}</span>枚</>
                      )}
                    </p>
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
                      const hasError = isDuplicate || (validation && (!validation.valid || validation.used));
                      const isValid = !isDuplicate && validation && validation.valid && !validation.used;
                      
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
                                  code.trim() === ''
                                    ? 'border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100'
                                    : isValid
                                    ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-100'
                                    : hasError
                                    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
                                      : 'border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100'
                                }`}
                              />
                              {code.trim() !== '' && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                  {isValid ? (
                                    <CheckCircle size={20} className="text-green-500" />
                                  ) : hasError ? (
                                    <AlertCircle size={20} className="text-red-500" />
                                  ) : null}
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
                          {code.trim() !== '' && (
                            <>
                          {isDuplicate && (
                                <p className="mt-2 text-sm text-red-500">
                                ✗ このコードは既に入力されています
                              </p>
                          )}
                          {!isDuplicate && validation && (
                                <p className={`mt-2 text-sm ${validation.valid && !validation.used ? 'text-green-600' : 'text-red-500'}`}>
                                {validation.valid && !validation.used ? '✓ ' : '✗ '}
                                  {validation.performerName && (
                                    <span className="font-medium">{validation.performerName}さまの引換券コード</span>
                              )}
                                  {validation.valid && !validation.used ? '（有効なコードです）' : validation.used ? '（このコードは既に使用されています）' : '（無効なコードです）'}
                                </p>
                              )}
                            </>
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
                    {validating && (
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
                      ¥{selectedPerformance?.generalPrice.toLocaleString() || '0'} / 枚
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('general', -1)}
                      disabled={quantities.general === 0 || !selectedPerformance}
                      className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={16} className="text-slate-500" />
                    </button>
                    <span className="w-8 text-center text-lg text-slate-700">
                      {quantities.general}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('general', 1)}
                      disabled={!selectedPerformance || quantities.general >= Math.min(selectedPerformance.generalCapacity - selectedPerformance.generalSold, 10)}
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
                      ¥{selectedPerformance?.reservedPrice.toLocaleString() || '0'} / 枚
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('reserved', -1)}
                      disabled={quantities.reserved === 0 || !selectedPerformance}
                      className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={16} className="text-slate-500" />
                    </button>
                    <span className="w-8 text-center text-lg text-slate-700">
                      {quantities.reserved}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange('reserved', 1)}
                      disabled={!selectedPerformance || quantities.reserved >= Math.min(selectedPerformance.reservedCapacity - selectedPerformance.reservedSold, 10)}
                      className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} className="text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* VIP①席 */}
                {selectedPerformance?.vip1Price && (
                  <div className="flex items-center justify-between p-5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <div>
                        <p className="text-slate-700 font-medium">VIP①席</p>
                      <p className="text-sm text-slate-400">
                        ¥{selectedPerformance.vip1Price.toLocaleString()} / 枚
                      </p>
                      {selectedPerformance.vip1Note && (
                        <p className="text-xs text-slate-500 mt-1">{selectedPerformance.vip1Note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('vip1', -1)}
                        disabled={quantities.vip1 === 0}
                        className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus size={16} className="text-slate-500" />
                      </button>
                      <span className="w-8 text-center text-lg text-slate-700">
                        {quantities.vip1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('vip1', 1)}
                        disabled={quantities.vip1 >= Math.min(selectedPerformance.vip1Capacity - selectedPerformance.vip1Sold, 10)}
                        className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} className="text-slate-500" />
                      </button>
                    </div>
                  </div>
                )}

                {/* VIP②席 */}
                {selectedPerformance?.vip2Price && (
                  <div className="flex items-center justify-between p-5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <div>
                        <p className="text-slate-700 font-medium">VIP②席</p>
                      <p className="text-sm text-slate-400">
                        ¥{selectedPerformance.vip2Price.toLocaleString()} / 枚
                      </p>
                      {selectedPerformance.vip2Note && (
                        <p className="text-xs text-slate-500 mt-1">{selectedPerformance.vip2Note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('vip2', -1)}
                        disabled={quantities.vip2 === 0}
                        className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus size={16} className="text-slate-500" />
                      </button>
                      <span className="w-8 text-center text-lg text-slate-700">
                        {quantities.vip2}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange('vip2', 1)}
                        disabled={quantities.vip2 >= Math.min(selectedPerformance.vip2Capacity - selectedPerformance.vip2Sold, 10)}
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
            <CustomerInfoForm
              data={customerInfo}
              onChange={setCustomerInfo}
            />

            {/* 合計金額 */}
            <PriceSummary
              performance={selectedPerformance}
              quantities={quantities}
              validCodesCount={validCodesCount}
            />

              {/* キャンセルポリシー */}
            <section>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <h4 className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  キャンセルポリシー
                </h4>
                <ul className="text-sm text-amber-800 space-y-1.5 mb-3">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>キャンセル時は決済手数料を差し引いた額をお戻しいたします</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>本番7日前以降はキャンセル不可となります</span>
                  </li>
                </ul>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToCancellationPolicy}
                    onChange={(e) => setAgreedToCancellationPolicy(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-amber-900">キャンセルポリシーに同意します</span>
                </label>
              </div>

              {/* アクションボタン */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!isFormValid}
                className={`btn-primary w-full justify-center ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
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
