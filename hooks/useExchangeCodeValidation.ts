'use client';

import { useState, useEffect, useMemo } from 'react';
import { CodeValidationResult } from '../app/(public)/ticket/types';

export function useExchangeCodeValidation() {
  const [hasExchangeCode, setHasExchangeCode] = useState<boolean | null>(null);
  const [exchangeCodes, setExchangeCodes] = useState<string[]>(['']);
  const [codeValidations, setCodeValidations] = useState<
    CodeValidationResult[]
  >([]);
  const [validating, setValidating] = useState(false);

  // sessionStorageから復元
  useEffect(() => {
    const savedData = sessionStorage.getItem('orderData');
    if (savedData) {
      try {
        const orderData = JSON.parse(savedData);
        setHasExchangeCode(orderData.hasExchangeCode);
        setExchangeCodes(
          orderData.exchangeCodes.length > 0 ? orderData.exchangeCodes : ['']
        );
      } catch (error) {
        console.error('Failed to restore exchange code data:', error);
    }
    }
  }, []);

  // リアルタイムバリデーション
  useEffect(() => {
    if (hasExchangeCode && exchangeCodes.some((code) => code.trim() !== '')) {
      const timer = setTimeout(async () => {
        const nonEmptyCodes = exchangeCodes.filter(
          (code) => code.trim() !== ''
        );
    if (nonEmptyCodes.length === 0) {
      setCodeValidations([]);
      return;
    }

    setValidating(true);
    try {
      const response = await fetch('/api/exchange-codes/validate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: nonEmptyCodes }),
      });

      if (!response.ok) throw new Error('コードの検証に失敗しました');

          const data = await response.json();
          // APIは { results: [...] } という形式で返す
          const results = data.results || data;
          // 配列であることを確認
          if (Array.isArray(results)) {
      setCodeValidations(results);
          } else {
            console.error('Invalid validation response:', data);
            setCodeValidations([]);
          }
    } catch (error) {
      console.error('Failed to validate codes:', error);
          setCodeValidations([]);
    } finally {
      setValidating(false);
    }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCodeValidations([]);
    }
  }, [exchangeCodes, hasExchangeCode]);

  const addCodeField = () => {
    if (exchangeCodes.length < 10) {
      setExchangeCodes([...exchangeCodes, '']);
    }
  };

  const removeCodeField = (index: number) => {
    if (exchangeCodes.length > 1) {
      setExchangeCodes(exchangeCodes.filter((_, i) => i !== index));
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const newCodes = [...exchangeCodes];
    newCodes[index] = value.toUpperCase();
    setExchangeCodes(newCodes);
  };

  // 重複コードチェック
  const isDuplicateCode = (code: string, currentIndex: number): boolean => {
    if (!code.trim()) return false;
    const normalizedCode = code.toUpperCase().trim();
    return exchangeCodes.some(
      (c, idx) =>
        idx !== currentIndex &&
        c.trim() !== '' &&
        c.toUpperCase().trim() === normalizedCode
    );
  };

  const getCodeValidation = (
    code: string
  ): CodeValidationResult | undefined => {
    if (!Array.isArray(codeValidations)) return undefined;
    return codeValidations.find(
      (v) => v.code.toUpperCase() === code.toUpperCase()
    );
  };

  const validCodesCount = useMemo(() => {
    if (!Array.isArray(codeValidations)) return 0;
    return codeValidations.filter((v) => v.valid && !v.used).length;
  }, [codeValidations]);

  const isExchangeCodeValid = useMemo(() => {
    if (!Array.isArray(codeValidations)) return false;
    
    // 重複コードがある場合は無効
    const nonEmptyCodes = exchangeCodes.filter((code) => code.trim() !== '');
    const uniqueCodes = new Set(
      nonEmptyCodes.map((code) => code.toUpperCase().trim())
    );
    const hasDuplicates = nonEmptyCodes.length !== uniqueCodes.size;
    
    if (hasDuplicates) return false;
    
    return (
      hasExchangeCode === false ||
      (hasExchangeCode === true &&
        exchangeCodes.some((code) => code.trim() !== '') &&
        codeValidations.length > 0 &&
        codeValidations.every((v) => v.valid && !v.used))
    );
  }, [hasExchangeCode, exchangeCodes, codeValidations]);

  return {
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
  };
}

