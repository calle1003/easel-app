'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Users,
  Ticket,
  ArrowLeft,
  Keyboard,
  RotateCcw
} from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { useAdminUser } from '@/components/admin/AdminAuthProvider';

interface TicketInfo {
  id: number;
  ticketCode: string;
  ticketType: 'GENERAL' | 'RESERVED';
  isExchanged: boolean;
  isUsed: boolean;
  usedAt: string | null;
  order?: {
    id: number;
    customerName: string;
    performanceLabel: string;
  };
}

interface Stats {
  totalCheckedIn: number;
  generalCheckedIn: number;
  reservedCheckedIn: number;
}

type ScanStatus = 'idle' | 'scanning' | 'verified' | 'success' | 'error' | 'already-used';

export default function AdminCheckInPage() {
  const { adminFetch } = useAdminUser();
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stats, setStats] = useState<Stats>({ totalCheckedIn: 0, generalCheckedIn: 0, reservedCheckedIn: 0 });
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string>('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

  // 統計情報を取得
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // 10秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  // カメラ初期化
  useEffect(() => {
    if (!isManualMode) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isManualMode]);

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
      if (!videoRef.current) {
        setCameraError('ビデオ要素が見つかりません');
        return;
      }

      setCameraError('');
      setIsCameraReady(false);

      console.log('Starting camera...');

      // navigator.mediaDevicesが利用可能かチェック
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('navigator.mediaDevices is not available');
        setCameraError('このブラウザではカメラ機能が利用できません。HTTPS接続が必要です。下の「手動入力へ」ボタンをタップしてチケットコードを手動で入力してください。');
        return;
      }

      // まずカメラ権限をリクエスト（背面カメラを明示的に要求）
      try {
        console.log('Requesting camera permission for back camera...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { exact: 'environment' } // 背面カメラを厳密に要求
          } 
        });
        console.log('Camera permission granted');
        // 権限確認後、ストリームを停止（後でQRCodeReaderが再度起動）
        stream.getTracks().forEach(track => track.stop());
      } catch (permError: any) {
        console.error('Permission error:', permError);
        // exactで失敗した場合、idealで再試行
        if (permError.name === 'OverconstrainedError' || permError.name === 'ConstraintNotSatisfiedError') {
          try {
            console.log('Retrying with ideal facingMode...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                facingMode: { ideal: 'environment' } // 背面カメラを優先（必須ではない）
              } 
            });
            stream.getTracks().forEach(track => track.stop());
          } catch (retryError: any) {
            console.error('Retry error:', retryError);
            if (retryError.name === 'NotAllowedError') {
              setCameraError('カメラへのアクセスが拒否されました。ブラウザの設定でカメラを許可してください。または「手動入力へ」をタップしてください。');
            } else {
              setCameraError(`カメラの許可エラー: ${retryError.message}。「手動入力へ」をタップしてチケットコードを入力してください。`);
            }
            return;
          }
        } else if (permError.name === 'NotAllowedError') {
          setCameraError('カメラへのアクセスが拒否されました。ブラウザの設定でカメラを許可してください。または「手動入力へ」をタップしてください。');
          return;
        } else if (permError.name === 'NotFoundError') {
          setCameraError('カメラが見つかりませんでした。「手動入力へ」をタップしてチケットコードを入力してください。');
          return;
        } else {
          setCameraError(`カメラの許可エラー: ${permError.message}。「手動入力へ」をタップしてチケットコードを入力してください。`);
          return;
        }
      }

      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;

      console.log('Requesting video input devices...');
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      
      console.log('Found devices:', videoInputDevices.length);
      videoInputDevices.forEach((device: any, index: number) => {
        console.log(`Device ${index}:`, device.label, device.deviceId);
      });
      
      if (videoInputDevices.length === 0) {
        setCameraError('カメラが見つかりません。デバイスにカメラが接続されているか確認してください。');
        return;
      }

      // 背面カメラを優先的に選択
      let backCamera = videoInputDevices.find((device: { label: string }) => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.includes('背面') ||
        device.label.includes('環境')
      );

      // 背面カメラが見つからない場合、フロントカメラではないものを選択
      if (!backCamera) {
        backCamera = videoInputDevices.find((device: { label: string }) => 
          !device.label.toLowerCase().includes('front') &&
          !device.label.includes('前面') &&
          !device.label.includes('フロント')
        );
      }

      // それでも見つからない場合は最後のデバイス（通常背面カメラ）
      if (!backCamera) {
        backCamera = videoInputDevices[videoInputDevices.length - 1];
      }

      console.log('Selected camera:', backCamera.label, backCamera.deviceId);

      await codeReader.decodeFromVideoDevice(
        backCamera.deviceId,
        videoRef.current,
        (result: any) => {
          if (result) {
            console.log('QR Code detected:', result.getText());
            const ticketCode = result.getText();
            handleScan(ticketCode);
          }
          // エラーは無視（継続的にスキャン）
        }
      );

      setIsCameraReady(true);
      console.log('Camera started successfully');

    } catch (error: any) {
      console.error('Camera error:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      let errorMsg = 'カメラの起動に失敗しました';
      
      if (error?.name === 'NotAllowedError') {
        errorMsg = 'カメラへのアクセスが拒否されました';
      } else if (error?.name === 'NotFoundError') {
        errorMsg = 'カメラが見つかりませんでした';
      } else if (error?.name === 'NotReadableError') {
        errorMsg = 'カメラは他のアプリで使用中です';
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      setCameraError(`${errorMsg}。ブラウザの設定でカメラへのアクセスを許可してください。`);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current = null;
    }
    // ビデオ要素のストリームを停止
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleScan = async (ticketCode: string) => {
    if (scanStatus === 'scanning' || scanStatus === 'verified') return; // 処理中または確認待ちは無視

    // カメラを停止（連続スキャン防止）
    stopCamera();

    setScanStatus('scanning');
    setTicketInfo(null);
    setErrorMessage('');

    try {
      // チケット検証のみ
      const verifyResponse = await adminFetch('/api/tickets/verify', {
        method: 'POST',
        body: JSON.stringify({ ticketCode }),
      });

      if (!verifyResponse.ok) {
        throw new Error('検証に失敗しました');
      }

      const verifyData = await verifyResponse.json();

      if (!verifyData.valid) {
        // 無効なチケット
        setScanStatus('error');
        setErrorMessage(verifyData.error || '無効なチケットです');
        setTicketInfo(verifyData.ticket || null);
        playErrorSound();
        vibrate([200, 100, 200]);
        
        // 既に使用済みの場合
        if (verifyData.error && verifyData.error.includes('使用済み')) {
          setScanStatus('already-used');
        }
        
        // 3秒後にカメラを再開
        setTimeout(() => {
          setScanStatus('idle');
          setTicketInfo(null);
          if (!isManualMode) {
            startCamera();
          }
        }, 3000);
        return;
      }

      // 有効なチケット - 確認待ち状態にする
      setScanStatus('verified');
      setTicketInfo(verifyData.ticket);
      vibrate([100]); // 短い振動で読み取り成功を通知

    } catch (error) {
      console.error('Verification error:', error);
      setScanStatus('error');
      setErrorMessage('エラーが発生しました');
      playErrorSound();
      vibrate([200, 100, 200]);
      
      // 3秒後にカメラを再開
      setTimeout(() => {
        setScanStatus('idle');
        if (!isManualMode) {
          startCamera();
        }
      }, 3000);
    }
  };

  // 入場を確定する
  const handleConfirmCheckIn = async () => {
    if (!ticketInfo) return;

    setScanStatus('scanning');

    try {
      const checkInResponse = await adminFetch('/api/tickets/check-in', {
        method: 'POST',
        body: JSON.stringify({ ticketCode: ticketInfo.ticketCode }),
      });

      if (!checkInResponse.ok) {
        throw new Error('入場処理に失敗しました');
      }

      const checkInData = await checkInResponse.json();

      if (!checkInData.success) {
        setScanStatus('error');
        setErrorMessage(checkInData.error || '入場処理に失敗しました');
        playErrorSound();
        vibrate([200, 100, 200]);
        setTimeout(() => {
          setScanStatus('idle');
          setTicketInfo(null);
          if (!isManualMode) {
            startCamera();
          }
        }, 3000);
        return;
      }

      // 成功
      setScanStatus('success');
      setTicketInfo(checkInData.ticket);
      playSuccessSound();
      vibrate([100]);
      fetchStats(); // 統計を更新

      // 3秒後にカメラを再開
      setTimeout(() => {
        setScanStatus('idle');
        setTicketInfo(null);
        if (!isManualMode) {
          startCamera();
        }
      }, 3000);

    } catch (error) {
      console.error('Check-in error:', error);
      setScanStatus('error');
      setErrorMessage('エラーが発生しました');
      playErrorSound();
      vibrate([200, 100, 200]);
      
      // 3秒後にカメラを再開
      setTimeout(() => {
        setScanStatus('idle');
        setTicketInfo(null);
        if (!isManualMode) {
          startCamera();
        }
      }, 3000);
    }
  };

  // キャンセルして再スキャン
  const handleCancelCheckIn = () => {
    setScanStatus('idle');
    setTicketInfo(null);
    setErrorMessage('');
    if (!isManualMode) {
      startCamera();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScan(manualInput.trim());
      setManualInput('');
    }
  };

  // 音声フィードバック
  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const playErrorSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 300;
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // 振動フィードバック
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const resetScan = () => {
    setScanStatus('idle');
    setTicketInfo(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft size={20} />
          <span className="text-sm">戻る</span>
        </Link>
        <h1 className="text-lg font-medium">入場チェック</h1>
        <button
          onClick={() => setIsManualMode(!isManualMode)}
          className="p-2 text-slate-300 hover:text-white"
        >
          {isManualMode ? <Camera size={20} /> : <Keyboard size={20} />}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-slate-400 mb-1">本日の入場</div>
            <div className="text-2xl font-bold text-green-400 flex items-center justify-center gap-1">
              <Users size={20} />
              {stats.totalCheckedIn}
            </div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">一般席</div>
            <div className="text-xl font-medium text-blue-400">{stats.generalCheckedIn}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">指定席</div>
            <div className="text-xl font-medium text-purple-400">{stats.reservedCheckedIn}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {!isManualMode ? (
          // Camera Mode
          <div className="flex-1 relative">
            {/* Camera Error Display */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                <div className="text-center p-8 max-w-md">
                  <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
                  <p className="text-lg font-medium mb-4">カメラエラー</p>
                  <p className="text-sm text-slate-300 mb-6">{cameraError}</p>
                  <button
                    onClick={() => {
                      setCameraError('');
                      startCamera();
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                  >
                    再試行
                  </button>
                  <button
                    onClick={() => setIsManualMode(true)}
                    className="ml-4 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
                  >
                    手動入力へ
                  </button>
                </div>
              </div>
            )}

            {/* Loading Display */}
            {!cameraError && !isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg">カメラを起動中...</p>
                </div>
              </div>
            )}

            {/* Camera View */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* QR Code Overlay */}
            {isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-white rounded-lg opacity-50"></div>
              </div>
            )}

            {/* Scan Overlay */}
            {scanStatus !== 'idle' && (
              <div className={`absolute inset-0 flex items-center justify-center ${
                scanStatus === 'verified' ? 'bg-slate-900/95' :
                scanStatus === 'success' ? 'bg-green-500/90' :
                scanStatus === 'already-used' ? 'bg-yellow-500/90' :
                scanStatus === 'error' ? 'bg-red-500/90' :
                'bg-blue-500/90'
              }`}>
                <div className="text-center p-6 max-w-md w-full mx-4">
                  {scanStatus === 'scanning' && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
                      <p className="text-xl font-medium">検証中...</p>
                    </div>
                  )}

                  {scanStatus === 'verified' && ticketInfo && (
                    <div className="flex flex-col items-center gap-6">
                      <Ticket size={64} strokeWidth={2} className="text-blue-400" />
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 w-full">
                        <p className="text-sm text-slate-300 mb-2">お客様情報</p>
                        <p className="text-2xl font-bold mb-3">{ticketInfo.order?.customerName}</p>
                        <p className="text-sm text-slate-300 mb-4">{ticketInfo.order?.performanceLabel}</p>
                        <div className="flex items-center justify-center gap-3">
                          <span className={`px-3 py-1 rounded font-medium text-sm ${
                            ticketInfo.ticketType === 'GENERAL'
                              ? 'bg-blue-500 text-white'
                              : 'bg-purple-500 text-white'
                          }`}>
                            {ticketInfo.ticketType === 'GENERAL' ? '一般席' : '指定席'}
                          </span>
                          {ticketInfo.isExchanged && (
                            <span className="px-3 py-1 rounded font-medium text-sm bg-amber-500 text-white">
                              引換券使用
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-4 w-full">
                        <button
                          onClick={handleCancelCheckIn}
                          className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-lg transition-colors active:scale-95"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={handleConfirmCheckIn}
                          className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={24} />
                          入場OK
                        </button>
                      </div>
                    </div>
                  )}

                  {scanStatus === 'success' && ticketInfo && (
                    <div className="flex flex-col items-center gap-4">
                      <CheckCircle size={64} strokeWidth={2} />
                      <p className="text-2xl font-bold">入場完了</p>
                      <div className="bg-white/20 rounded-lg p-4 mt-2">
                        <p className="text-lg font-medium">{ticketInfo.order?.customerName}</p>
                        <p className="text-sm mt-1">{ticketInfo.order?.performanceLabel}</p>
                        <p className="text-xs mt-2 opacity-80">
                          {ticketInfo.ticketType === 'GENERAL' ? '一般席' : '指定席'}
                          {ticketInfo.isExchanged && ' (引換券使用)'}
                        </p>
                      </div>
                    </div>
                  )}

                  {scanStatus === 'already-used' && (
                    <div className="flex flex-col items-center gap-4">
                      <AlertCircle size={64} strokeWidth={2} />
                      <p className="text-2xl font-bold">使用済み</p>
                      <p className="text-lg">{errorMessage}</p>
                      {ticketInfo && (
                        <div className="bg-white/20 rounded-lg p-4 mt-2">
                          <p className="text-sm">{ticketInfo.order?.customerName}</p>
                          <p className="text-xs mt-1 opacity-80">
                            {ticketInfo.usedAt && new Date(ticketInfo.usedAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {scanStatus === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                      <X size={64} strokeWidth={2} />
                      <p className="text-2xl font-bold">エラー</p>
                      <p className="text-lg">{errorMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            {scanStatus === 'idle' && isCameraReady && !cameraError && (
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <div className="inline-block bg-black/60 backdrop-blur-sm rounded-full px-6 py-3">
                  <p className="text-sm">QRコードを枠内に合わせてください</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Manual Input Mode
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
              <div className="bg-slate-800 rounded-lg p-6">
                <div className="text-center mb-6">
                  <Ticket size={48} className="mx-auto mb-4 text-slate-400" />
                  <h2 className="text-xl font-medium">手動入力</h2>
                  <p className="text-sm text-slate-400 mt-2">
                    チケットコードを入力してください
                  </p>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="チケットコード (UUID)"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!manualInput.trim() || scanStatus === 'scanning' || scanStatus === 'verified'}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium text-lg transition-colors"
                  >
                    {scanStatus === 'scanning' ? '検証中...' : 'チケット検証'}
                  </button>
                </form>

                {/* Result Display */}
                {scanStatus === 'verified' && ticketInfo && (
                  <div className="mt-6 p-6 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="text-center mb-4">
                      <Ticket size={48} className="mx-auto mb-3 text-blue-400" />
                      <p className="text-xl font-bold mb-2">{ticketInfo.order?.customerName}</p>
                      <p className="text-sm text-slate-300">{ticketInfo.order?.performanceLabel}</p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                          ticketInfo.ticketType === 'GENERAL'
                            ? 'bg-blue-500 text-white'
                            : 'bg-purple-500 text-white'
                        }`}>
                          {ticketInfo.ticketType === 'GENERAL' ? '一般席' : '指定席'}
                        </span>
                        {ticketInfo.isExchanged && (
                          <span className="px-3 py-1 rounded text-xs font-medium bg-amber-500 text-white">
                            引換券使用
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelCheckIn}
                        className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 rounded-lg font-medium transition-colors"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleConfirmCheckIn}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={20} />
                        入場OK
                      </button>
                    </div>
                  </div>
                )}

                {scanStatus !== 'idle' && scanStatus !== 'scanning' && scanStatus !== 'verified' && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    scanStatus === 'success' ? 'bg-green-500/20 border border-green-500' :
                    scanStatus === 'already-used' ? 'bg-yellow-500/20 border border-yellow-500' :
                    'bg-red-500/20 border border-red-500'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      {scanStatus === 'success' ? (
                        <CheckCircle size={24} className="text-green-400" />
                      ) : (
                        <AlertCircle size={24} className="text-red-400" />
                      )}
                      <p className="font-medium">
                        {scanStatus === 'success' ? '入場完了' :
                         scanStatus === 'already-used' ? '使用済み' :
                         'エラー'}
                      </p>
                    </div>
                    {errorMessage && (
                      <p className="text-sm text-slate-300">{errorMessage}</p>
                    )}
                    {ticketInfo && (
                      <div className="mt-3 pt-3 border-t border-slate-600">
                        <p className="text-sm">{ticketInfo.order?.customerName}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {ticketInfo.ticketType === 'GENERAL' ? '一般席' : '指定席'}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={resetScan}
                      className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} />
                      リセット
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
