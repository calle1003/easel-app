/**
 * チェックインページ（リファクタリング版）
 * 849行 → 約400行に削減（カメラロジックは複雑なので残す）
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Keyboard } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';
import { CheckInStats } from './components/CheckInStats';
import { QRScanner } from './components/QRScanner';
import { ManualInput } from './components/ManualInput';
import { CheckInResult } from './components/CheckInResult';
import { TicketInfo, Stats, ScanStatus } from './types';

export default function AdminCheckInPage() {
  const { adminFetch } = useAdminUser();
  const router = useRouter();
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stats, setStats] = useState<Stats>({
    totalCheckedIn: 0,
    generalCheckedIn: 0,
    reservedCheckedIn: 0,
  });
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scannedCodes, setScannedCodes] = useState<Set<string>>(new Set());

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const scanControlsRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const scanStatusRef = useRef<ScanStatus>('idle');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');

  // scanStatusとscanStatusRefを同期的に更新するヘルパー
  const updateScanStatus = (status: ScanStatus) => {
    setScanStatus(status);
    scanStatusRef.current = status;
  };

  // 統計情報を取得
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // カメラ初期化
  useEffect(() => {
    if (!isManualMode) {
      startCamera();
    } else {
      void stopCamera();
    }
    return () => {
      void stopCamera();
    };
  }, [isManualMode]);

  // ページを離れるときにカメラを停止
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await stopCamera();
      } else if (!isManualMode && scanStatus === 'idle') {
        startCamera();
      }
    };

    const handleBeforeUnload = async () => {
      await stopCamera();
    };

    const handlePopState = async () => {
      await stopCamera();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange as any);
    window.addEventListener('beforeunload', handleBeforeUnload as any);
    window.addEventListener('pagehide', handleBeforeUnload as any);
    window.addEventListener('popstate', handlePopState as any);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange as any);
      window.removeEventListener('beforeunload', handleBeforeUnload as any);
      window.removeEventListener('pagehide', handleBeforeUnload as any);
      window.removeEventListener('popstate', handlePopState as any);
    };
  }, [scanStatus, isManualMode]);

  const fetchStats = async () => {
    try {
      const response = await adminFetch('/api/tickets/stats/today');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const startCamera = async () => {
    try {
      await stopCamera();

      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;

      if (!videoRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      mediaStreamRef.current = stream;
      videoRef.current.srcObject = stream;

      const controls = await codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result) => {
          // idle状態かつスキャン中でない場合のみ処理
          if (result && !isScanningRef.current && scanStatusRef.current === 'idle') {
            isScanningRef.current = true;
            scanStatusRef.current = 'scanning';
            const code = result.getText();
            await stopCamera();
            await handleScan(code);
          }
        }
      );

      scanControlsRef.current = controls;
      setIsCameraReady(true);
      setCameraError('');
    } catch (error: any) {
      let errorMsg = 'カメラの起動に失敗しました';
      
      if (error?.name === 'NotAllowedError') {
        errorMsg = 'カメラへのアクセスが拒否されました。ブラウザの設定でカメラを許可してください';
      } else if (error?.name === 'NotFoundError') {
        errorMsg = 'カメラが見つかりませんでした';
      } else if (error?.name === 'NotReadableError') {
        errorMsg = 'カメラは他のアプリで使用中です';
      }
      
      setCameraError(`${errorMsg}。下の「手動入力へ」ボタンでコードを入力できます。`);
      setIsCameraReady(false);
    }
  };

  const stopCamera = async () => {
    try {
      setIsCameraReady(false);
      isScanningRef.current = false;
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      
      if (scanControlsRef.current) {
        try {
          scanControlsRef.current.stop();
        } catch (e) {
          // Ignore
        }
        scanControlsRef.current = null;
      }
      
      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }
        videoRef.current.srcObject = null;
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
      
      document.querySelectorAll('video').forEach((video) => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
          video.src = '';
          video.load();
        }
      });
      
      if (codeReaderRef.current) {
        codeReaderRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };

  const handleScan = async (ticketCode: string) => {
    if (scanStatus === 'scanning' || scanStatus === 'verified') {
      isScanningRef.current = false;
      return;
    }

    // すでにスキャン済みのコードはスキップ
    if (scannedCodes.has(ticketCode)) {
      updateScanStatus('error');
      setErrorMessage('このチケットは既にスキャン済みです');
      playErrorSound();
      vibrate([200, 100, 200]);
      isScanningRef.current = false;
      
      // エラー後、3秒待ってカメラ再起動
      setTimeout(() => {
        if (!isManualMode) {
          handleReset();
        }
      }, 3000);
      return;
    }

    await stopCamera();

    updateScanStatus('scanning');
    setTicketInfo(null);
    setErrorMessage('');

    try {
      const verifyResponse = await adminFetch('/api/tickets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode }),
      });

      if (!verifyResponse.ok) {
        throw new Error('検証に失敗しました');
      }

      const verifyData = await verifyResponse.json();

      if (!verifyData.valid) {
        updateScanStatus('error');
        setErrorMessage(verifyData.error || '無効なチケットです');
        setTicketInfo(verifyData.ticket || null);
        playErrorSound();
        vibrate([200, 100, 200]);
        
        if (verifyData.error && verifyData.error.includes('使用済み')) {
          updateScanStatus('already-used');
        }
        
        // スキャン済みコードに追加
        setScannedCodes(prev => new Set(prev).add(ticketCode));
        isScanningRef.current = false;
        
        // エラー後、3秒待ってカメラ再起動
        setTimeout(() => {
          if (!isManualMode) {
            handleReset();
          }
        }, 3000);
        return;
      }

      // 検証成功 - チケット情報を表示（管理者の判断を待つ）
      updateScanStatus('verified');
      setTicketInfo(verifyData.ticket);
      playSuccessSound();
      vibrate([100]);
      
      // スキャン済みコードに追加
      setScannedCodes(prev => new Set(prev).add(ticketCode));
      isScanningRef.current = false;
    } catch (error: any) {
      updateScanStatus('error');
      setErrorMessage(error.message || 'エラーが発生しました');
      playErrorSound();
      vibrate([200, 100, 200]);
      isScanningRef.current = false;
      
      // エラー後、3秒待ってカメラ再起動
      setTimeout(() => {
        if (!isManualMode) {
          handleReset();
        }
      }, 3000);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    await handleScan(manualInput.trim());
    setManualInput('');
  };

  const handleCheckIn = async () => {
    if (!ticketInfo) return;

    try {
      const checkInResponse = await adminFetch('/api/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: ticketInfo.ticketCode }),
      });

      if (!checkInResponse.ok) {
        throw new Error('チェックインに失敗しました');
      }

      const checkInData = await checkInResponse.json();

      if (checkInData.success) {
        updateScanStatus('success');
        playSuccessSound();
        vibrate([100]);
        fetchStats();
        
        // 3秒後に自動的にリセットしてカメラを再起動
        setTimeout(() => {
          handleReset();
        }, 3000);
      }
    } catch (error: any) {
      updateScanStatus('error');
      setErrorMessage(error.message || 'チェックインに失敗しました');
      playErrorSound();
      vibrate([200, 100, 200]);
      
      // エラー後、3秒待ってカメラ再起動
      setTimeout(() => {
        if (!isManualMode) {
          handleReset();
        }
      }, 3000);
    }
  };

  const handleReject = async () => {
    updateScanStatus('idle');
    setTicketInfo(null);
    setErrorMessage('入場を拒否しました');
    playErrorSound();
    vibrate([200]);
    isScanningRef.current = false;
    
    // カメラを完全に停止してから再起動
    if (!isManualMode) {
      await stopCamera();
      setTimeout(() => startCamera(), 500);
    }
  };

  const handleReset = async () => {
    updateScanStatus('idle');
    setTicketInfo(null);
    setErrorMessage('');
    isScanningRef.current = false;
    
    // カメラを完全に停止してから再起動
    if (!isManualMode) {
      await stopCamera();
      setTimeout(() => startCamera(), 500);
    }
  };

  const playSuccessSound = () => {
    const audio = new Audio('/sounds/success.mp3');
    audio.play().catch(() => {});
  };

  const playErrorSound = () => {
    const audio = new Audio('/sounds/error.mp3');
    audio.play().catch(() => {});
  };

  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/admin"
            onClick={async (e) => {
              e.preventDefault();
              await stopCamera();
              router.push('/admin');
            }}
            className="inline-flex items-center text-slate-600 hover:text-slate-800 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            管理画面トップ
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">チケットチェックイン</h1>
        </div>

        {/* 統計情報 */}
        <CheckInStats stats={stats} />

        {/* モード切替 */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIsManualMode(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
              !isManualMode
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Camera size={20} />
            QRスキャン
          </button>
          <button
            onClick={() => setIsManualMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
              isManualMode
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Keyboard size={20} />
            手動入力
          </button>
        </div>

        {/* スキャナー or 手動入力 */}
        {!isManualMode ? (
          <QRScanner
            ref={videoRef}
            scanStatus={scanStatus}
            isCameraReady={isCameraReady}
            cameraError={cameraError}
            onReset={handleReset}
          />
        ) : (
          <ManualInput
            value={manualInput}
            onChange={setManualInput}
            onSubmit={handleManualSubmit}
            disabled={scanStatus === 'scanning'}
          />
        )}

        {/* 結果表示 */}
        <div className="mt-6">
          <CheckInResult
            scanStatus={scanStatus}
            ticketInfo={ticketInfo}
            errorMessage={errorMessage}
            onCheckIn={handleCheckIn}
            onReject={handleReject}
          />
        </div>
      </div>
    </div>
  );
}
