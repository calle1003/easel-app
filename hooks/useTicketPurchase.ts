'use client';

import { useState, useEffect, useMemo } from 'react';
import { Performance, TicketQuantities, CustomerInfo } from '../types';

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
    name: '',
    email: '',
    phone: '',
    performanceId: '',
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
      const response = await fetch('/api/performances/on-sale');
      if (!response.ok) throw new Error('公演情報の取得に失敗しました');
      const data = await response.json();
      setPerformances(data);

      // sessionStorageからの復元データがある場合はそれを使用
      const savedData = sessionStorage.getItem('orderData');
      if (savedData) {
        try {
          const orderData = JSON.parse(savedData);
          const savedPerf = data.find(
            (p: Performance) => p.id === orderData.performanceId
          );
          if (savedPerf) {
            setSelectedPerformance(savedPerf);
          } else if (data.length > 0) {
            setSelectedPerformance(data[0]);
            setCustomerInfo((prev) => ({
              ...prev,
              performanceId: data[0].id.toString(),
            }));
          }
        } catch (error) {
          console.error('Failed to parse saved data:', error);
          if (data.length > 0) {
            setSelectedPerformance(data[0]);
            setCustomerInfo((prev) => ({
              ...prev,
              performanceId: data[0].id.toString(),
            }));
          }
        }
      } else if (data.length > 0) {
        setSelectedPerformance(data[0]);
        setCustomerInfo((prev) => ({
          ...prev,
          performanceId: data[0].id.toString(),
        }));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '予期しないエラーが発生しました'
      );
    } finally {
      setLoading(false);
    }
  };

  // sessionStorageから復元
  useEffect(() => {
    const savedData = sessionStorage.getItem('orderData');
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
          name: orderData.name || '',
          email: orderData.email || '',
          phone: orderData.phone || '',
          performanceId: orderData.performanceId?.toString() || '',
        });
        if (orderData.agreedToCancellationPolicy !== undefined) {
          setAgreedToCancellationPolicy(
            orderData.agreedToCancellationPolicy
          );
        }
      } catch (error) {
        console.error('Failed to restore order data:', error);
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

  // チケット枚数変更（残席制限を考慮）
  const handleQuantityChange = (
    type: keyof TicketQuantities,
    delta: number
  ) => {
    if (!selectedPerformance) return;

    const getMax = (type: keyof TicketQuantities) => {
      switch (type) {
        case 'general':
          return Math.min(
            selectedPerformance.generalCapacity - selectedPerformance.generalSold,
            10
          );
        case 'reserved':
          return Math.min(
            selectedPerformance.reservedCapacity -
              selectedPerformance.reservedSold,
            10
          );
        case 'vip1':
          return Math.min(
            selectedPerformance.vip1Capacity - selectedPerformance.vip1Sold,
            10
          );
        case 'vip2':
          return Math.min(
            selectedPerformance.vip2Capacity - selectedPerformance.vip2Sold,
            10
          );
      }
    };

    setQuantities((prev) => ({
      ...prev,
      [type]: Math.max(0, Math.min(getMax(type), prev[type] + delta)),
    }));
  };

  // 公演選択
  const handlePerformanceSelect = (performance: Performance) => {
    setSelectedPerformance(performance);
    setCustomerInfo((prev) => ({
      ...prev,
      performanceId: performance.id.toString(),
    }));
  };

  // バリデーション
  const isFormValid = useMemo(() => {
    return (
      selectedPerformance !== null &&
      totalTickets > 0 &&
      customerInfo.name.trim() !== '' &&
      customerInfo.email.trim() !== '' &&
      customerInfo.phone.trim() !== '' &&
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
    setSelectedPerformance: handlePerformanceSelect,
    handleQuantityChange,
    setCustomerInfo,
    setAgreedToCancellationPolicy,
    refetch: fetchPerformances,
  };
}

