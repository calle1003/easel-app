'use client';

import { Modal } from '@/components/ui/modal';

// セッションフォームのデータ型定義（エクスポート）
export interface SessionFormData {
  showNumber: string;
  performanceDate: string;
  performanceTime: string;
  doorsOpenTime: string;
  venueName: string;
  venueAddress: string;
  venueAccess: string;
  generalCapacity: number;
  reservedCapacity: number;
  vip1Capacity: number;
  vip2Capacity: number;
}

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSessionId: number | null;
  sessionFormData: SessionFormData;
  setSessionFormData: (data: SessionFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SessionModal({
  isOpen,
  onClose,
  editingSessionId,
  sessionFormData,
  setSessionFormData,
  onSubmit,
}: SessionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSessionId ? 'セッションを編集' : 'セッション追加'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">公演回数</label>
          <input
            type="text"
            inputMode="numeric"
            value={sessionFormData.showNumber || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setSessionFormData({ ...sessionFormData, showNumber: value === '' ? '' : value });
            }}
            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            placeholder="1"
            required
          />
          <p className="text-xs text-slate-500 mt-1">例: 1 → 1st</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">公演日</label>
            <input
              type="date"
              value={sessionFormData.performanceDate}
              onChange={(e) => setSessionFormData({ ...sessionFormData, performanceDate: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">開演時間</label>
            <input
              type="time"
              value={sessionFormData.performanceTime}
              onChange={(e) => setSessionFormData({ ...sessionFormData, performanceTime: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">会場名</label>
          <input
            type="text"
            value={sessionFormData.venueName}
            onChange={(e) => setSessionFormData({ ...sessionFormData, venueName: e.target.value })}
            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            placeholder="渋谷CLUB QUATTRO"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">一般席数</label>
            <input
              type="text"
              inputMode="numeric"
              value={sessionFormData.generalCapacity || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setSessionFormData({ ...sessionFormData, generalCapacity: value === '' ? 0 : parseInt(value, 10) });
              }}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">指定席数</label>
            <input
              type="text"
              inputMode="numeric"
              value={sessionFormData.reservedCapacity || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setSessionFormData({ ...sessionFormData, reservedCapacity: value === '' ? 0 : parseInt(value, 10) });
              }}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              required
            />
          </div>
        </div>
        
        {/* VIP席数 */}
        <div className="border-t border-slate-200 pt-4 mt-2">
          <h3 className="text-sm font-medium text-slate-700 mb-3">VIP席在庫（オプション）</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">VIP①席数</label>
              <input
                type="text"
                inputMode="numeric"
                value={sessionFormData.vip1Capacity || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setSessionFormData({ ...sessionFormData, vip1Capacity: value === '' ? 0 : parseInt(value, 10) });
                }}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">VIP②席数</label>
              <input
                type="text"
                inputMode="numeric"
                value={sessionFormData.vip2Capacity || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setSessionFormData({ ...sessionFormData, vip2Capacity: value === '' ? 0 : parseInt(value, 10) });
                }}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                placeholder="0"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            {editingSessionId ? '更新' : '追加'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
