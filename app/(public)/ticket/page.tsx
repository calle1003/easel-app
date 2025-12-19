'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
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
    isFormValid,
    setSelectedPerformance,
    handleQuantityChange,
    setCustomerInfo,
    setAgreedToCancellationPolicy,
  } = useTicketPurchase();

  const {
    hasExchangeCode,
    exchangeCodes,
    codeValidations,
    validating,
    validCodesCount,
    setHasExchangeCode,
    addCodeField,
    removeCodeField,
    updateCode,
    validateCodes,
  } = useExchangeCodeValidation();

  const handleCheckout = async () => {
    if (!isFormValid || !selectedPerformance) {
      alert('必須項目を入力してください');
      return;
    }

    // sessionStorageに保存
    const orderData = {
      performanceId: selectedPerformance.id,
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

  const formatPerformanceLabel = (perf: typeof performances[0]) => {
    const date = formatDate(perf.performanceDate, 'short');
    const time = formatTime(perf.performanceTime);
    return `${date} ${time} - ${perf.title}`;
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
          <Ticket
            className="mx-auto mb-6 text-slate-200"
            size={64}
            strokeWidth={1}
          />
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
            <Link
              href="/"
              className="text-xs tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
            >
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
                value={selectedPerformance?.id || ''}
                onChange={(e) => {
                  const perf = performances.find(
                    (p) => p.id === parseInt(e.target.value)
                  );
                  if (perf) setSelectedPerformance(perf);
                }}
                className="w-full p-4 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
              >
                <option value="">公演日時を選択してください</option>
                {performances.map((perf) => {
                  const generalRemaining = perf.generalCapacity - perf.generalSold;
                  const reservedRemaining =
                    perf.reservedCapacity - perf.reservedSold;
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
                  <p className="text-sm text-slate-600">
                    📍 {selectedPerformance.venueName}
                  </p>
                  <div className="text-sm text-slate-500 mt-1">
                    <p>
                      残席: 一般席{' '}
                      <span className="font-medium text-slate-700">
                        {selectedPerformance.generalCapacity -
                          selectedPerformance.generalSold}
                      </span>
                      枚 / 指定席{' '}
                      <span className="font-medium text-slate-700">
                        {selectedPerformance.reservedCapacity -
                          selectedPerformance.reservedSold}
                      </span>
                      枚
                      {selectedPerformance.vip1Price &&
                        selectedPerformance.vip1Capacity -
                          selectedPerformance.vip1Sold >
                          0 && (
                          <>
                            {' '}
                            / VIP①席{' '}
                            <span className="font-medium text-slate-700">
                              {selectedPerformance.vip1Capacity -
                                selectedPerformance.vip1Sold}
                            </span>
                            枚
                          </>
                        )}
                      {selectedPerformance.vip2Price &&
                        selectedPerformance.vip2Capacity -
                          selectedPerformance.vip2Sold >
                          0 && (
                          <>
                            {' '}
                            / VIP②席{' '}
                            <span className="font-medium text-slate-700">
                              {selectedPerformance.vip2Capacity -
                                selectedPerformance.vip2Sold}
                            </span>
                            枚
                          </>
                        )}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* 引換券コード */}
            <section>
              <h2 className="text-xs tracking-wider text-slate-400 mb-4 uppercase">
                引換券コード（出演者から購入）
                <span className="text-red-400">*</span>
              </h2>
              <div className="space-y-6">
                <div className="flex gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="hasExchangeCode"
                      checked={hasExchangeCode === false}
                      onChange={() => setHasExchangeCode(false)}
                      className="w-4 h-4 text-slate-600"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-800">
                      持っていない
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="hasExchangeCode"
                      checked={hasExchangeCode === true}
                      onChange={() => setHasExchangeCode(true)}
                      className="w-4 h-4 text-slate-600"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-800">
                      持っている
                    </span>
                  </label>
                </div>

                {hasExchangeCode && (
                  <div className="space-y-4 p-6 bg-slate-50 rounded-lg">
                    <div className="space-y-3">
                      {exchangeCodes.map((code, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={code}
                            onChange={(e) => updateCode(index, e.target.value)}
                            placeholder="引換券コードを入力"
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                          />
                          {exchangeCodes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCodeField(index)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              aria-label="削除"
                            >
                              <X size={20} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {exchangeCodes.length < 10 && (
                      <button
                        type="button"
                        onClick={addCodeField}
                        className="text-sm text-slate-500 hover:text-slate-700 underline"
                      >
                        + コードを追加
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={validateCodes}
                      disabled={validating}
                      className="w-full py-2 px-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {validating ? '検証中...' : 'コードを検証'}
                    </button>

                    {codeValidations.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {codeValidations.map((validation, index) => (
                          <div
                            key={index}
                            className={`flex items-start gap-2 p-3 rounded-lg ${
                              validation.valid && !validation.used
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {validation.valid && !validation.used ? (
                              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            )}
                            <div className="text-sm flex-1">
                              <p className="font-medium">{validation.code}</p>
                              {validation.valid && !validation.used ? (
                                <p className="text-xs mt-1">
                                  有効なコードです
                                  {validation.performerName &&
                                    ` (${validation.performerName})`}
                                </p>
                              ) : validation.used ? (
                                <p className="text-xs mt-1">
                                  このコードは既に使用されています
                                </p>
                              ) : (
                                <p className="text-xs mt-1">無効なコードです</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* チケット枚数選択 */}
            {selectedPerformance && hasExchangeCode !== null && (
              <section>
                <TicketQuantitySelector
                  performance={selectedPerformance}
                  quantities={quantities}
                  onChange={handleQuantityChange}
                />
              </section>
            )}

            {/* 購入者情報 */}
            {totalTickets > 0 && (
              <>
                <section>
                  <CustomerInfoForm
                    data={customerInfo}
                    onChange={setCustomerInfo}
                  />
                </section>

                {/* 料金明細 */}
                <section>
                  <PriceSummary
                    performance={selectedPerformance!}
                    quantities={quantities}
                    discountAmount={validCodesCount * 500}
                  />
                </section>

                {/* キャンセルポリシー */}
                <section>
                  <div className="p-6 bg-slate-50 rounded-lg space-y-4">
                    <h3 className="text-sm font-medium text-slate-800">
                      キャンセルポリシー
                    </h3>
                    <div className="text-sm text-slate-600 space-y-2">
                      <p>チケット購入後のキャンセル・返金は原則として承っておりません。</p>
                      <p>
                        ただし、公演中止の場合は全額返金いたします。詳しくは
                        <Link
                          href="/ticket/cancel"
                          className="text-blue-600 hover:underline"
                        >
                          キャンセルポリシー
                        </Link>
                        をご確認ください。
                      </p>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToCancellationPolicy}
                        onChange={(e) =>
                          setAgreedToCancellationPolicy(e.target.checked)
                        }
                        className="mt-1"
                      />
                      <span className="text-sm text-slate-600">
                        キャンセルポリシーに同意します{' '}
                        <span className="text-red-500">*</span>
                      </span>
                    </label>
                  </div>
                </section>

                {/* 購入ボタン */}
                <div className="pt-6">
                  <button
                    onClick={handleCheckout}
                    disabled={!isFormValid}
                    className="w-full py-4 px-6 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                  >
                    購入手続きへ進む
                  </button>
                  {!isFormValid && (
                    <p className="mt-3 text-sm text-center text-slate-500">
                      ※必須項目を全て入力してください
                    </p>
                  )}
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
