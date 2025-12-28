/**
 * QRコードスキャナー表示コンポーネント（UI のみ）
 */

'use client';

import { forwardRef } from 'react';
import { Camera, AlertCircle, RotateCcw } from 'lucide-react';
import { ScanStatus } from '../types';

interface QRScannerProps {
  scanStatus: ScanStatus;
  isCameraReady: boolean;
  cameraError: string;
  onReset: () => void;
}

export const QRScanner = forwardRef<HTMLVideoElement, QRScannerProps>(
  ({ scanStatus, isCameraReady, cameraError, onReset }, ref) => {

    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">QRコードスキャン</h2>
            </div>
            {scanStatus !== 'idle' && scanStatus !== 'scanning' && (
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                <RotateCcw size={18} />
                リセット
              </button>
            )}
          </div>
        </div>

        {/* カメラビュー */}
        <div className="relative bg-black w-full" style={{ minHeight: '400px', maxHeight: '600px' }}>
          <video
            ref={ref}
            className="w-full h-full object-cover"
            style={{ minHeight: '400px', maxHeight: '600px' }}
            autoPlay
            playsInline
            muted
          />

          {/* オーバーレイ */}
          {(!isCameraReady || cameraError || scanStatus === 'scanning') && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            {!isCameraReady && !cameraError && (
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                <p>カメラを起動中...</p>
              </div>
            )}

            {cameraError && (
              <div className="bg-red-500/90 px-6 py-4 rounded-lg text-white text-center max-w-md">
                <AlertCircle size={32} className="mx-auto mb-2" />
                <p className="text-sm">{cameraError}</p>
              </div>
            )}

            {isCameraReady && scanStatus === 'scanning' && (
              <div className="bg-blue-500/90 px-6 py-4 rounded-lg text-white">
                <div className="animate-pulse text-center">
                  <Camera size={32} className="mx-auto mb-2" />
                  <p className="text-sm">スキャン中...</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* スキャンフレーム */}
          {isCameraReady && scanStatus === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-4 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white" />
              </div>
            </div>
          )}
        </div>

        {/* 説明 */}
        <div className="p-6 bg-slate-50">
          <p className="text-sm text-slate-600 text-center">
            QRコードをカメラに向けてスキャンしてください
          </p>
        </div>
      </div>
    );
  }
);

QRScanner.displayName = 'QRScanner';
