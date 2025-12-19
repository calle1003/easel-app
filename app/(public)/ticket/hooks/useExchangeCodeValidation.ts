'use client';

import { useState } from 'react';
import { CodeValidationResult } from '../types';

export function useExchangeCodeValidation() {
  const [hasExchangeCode, setHasExchangeCode] = useState<boolean | null>(null);
  const [exchangeCodes, setExchangeCodes] = useState<string[]>(['']);
  const [codeValidations, setCodeValidations] = useState<
    CodeValidationResult[]
  >([]);
  const [validating, setValidating] = useState(false);

  const addCodeField = () => {
    if (exchangeCodes.length < 10) {
      setExchangeCodes([...exchangeCodes, '']);
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
    const nonEmptyCodes = exchangeCodes.filter((code) => code.trim() !== '');
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

      const results: CodeValidationResult[] = await response.json();
      setCodeValidations(results);
    } catch (error) {
      console.error('Failed to validate codes:', error);
      alert('引換券コードの検証中にエラーが発生しました');
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
    setExchangeCodes,
    addCodeField,
    removeCodeField,
    updateCode,
    validateCodes,
  };
}

