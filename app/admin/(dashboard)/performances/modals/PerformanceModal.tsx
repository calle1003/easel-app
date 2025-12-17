'use client';

import { Modal } from '@/components/ui/modal';

// 型定義を分離して管理しやすくします
export interface PerformanceFormData {
  title: string;
  volume: string;
  isOnSale: boolean;
  numberOfShows: number | ''; // 入力中の空文字を許容
  venueName: string;
  venueAddress: string;
  venueAccess: string;
  generalPrice: number;
  reservedPrice: number;
  vip1Price: number;
  vip2Price: number;
  vip1Note: string;
  vip2Note: string;
  description: string;
}

export interface SessionDateData {
  showNumber: number;
  performanceDate: string;
  performanceTime: string;
  doorsOpenTime: string;
}

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPerformanceId: number | null;
  performanceFormData: PerformanceFormData;
  setPerformanceFormData: (data: PerformanceFormData) => void;
  sessionsDatesData: SessionDateData[];
  setSessionsDatesData: (data: SessionDateData[]) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PerformanceModal({
  isOpen,
  onClose,
  editingPerformanceId,
  performanceFormData,
  setPerformanceFormData,
  sessionsDatesData,
  setSessionsDatesData,
  onSubmit,
}: PerformanceModalProps) {

  // 公演回数が変更された時に、セッションデータ配列も同期してリサイズするハンドラ
  const handleNumberOfShowsChange = (value: string) => {
    // 数値以外の文字を除去
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue === '') {
      setPerformanceFormData({ ...performanceFormData, numberOfShows: '' });
      return;
    }

    const num = parseInt(numericValue, 10);
    
    // 1〜20回の制限（バリデーション）
    if (num >= 1 && num <= 20) {
      setPerformanceFormData({ ...performanceFormData, numberOfShows: num });

      // 既存のセッション配列をコピー
      const newSessions = [...sessionsDatesData];

      if (num > newSessions.length) {
        // 増えた分を追加（初期値セット）
        for (let i = newSessions.length; i < num; i++) {
          newSessions.push({
            showNumber: i + 1,
            performanceDate: '',
            performanceTime: '',
            doorsOpenTime: '',
          });
        }
      } else if (num < newSessions.length) {
        // 減った分を削除
        newSessions.splice(num);
      }
      
      setSessionsDatesData(newSessions);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPerformanceId ? '公演を編集' : '新規公演作成'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 140px' }}>
          <div>
            <label className="block text-sm text-slate-600 mb-1">タイトル</label>
            <input
              type="text"
              value={performanceFormData.title}
              onChange={(e) => setPerformanceFormData({ ...performanceFormData, title: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              placeholder="easel live vol.2"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">ボリューム</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-500 pointer-events-none">vol</span>
              <input
                type="text"
                value={performanceFormData.volume}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setPerformanceFormData({ ...performanceFormData, volume: value });
                }}
                className="w-full p-3 pl-12 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                placeholder="2"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">公演回数</label>
            <input
              type="text"
              inputMode="numeric"
              value={performanceFormData.numberOfShows}
              onChange={(e) => handleNumberOfShowsChange(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              placeholder="1"
              required
              disabled={!!editingPerformanceId}
            />
            <p className="text-xs text-slate-500 mt-1">
              {editingPerformanceId ? '※編集時は変更不可' : '1〜20回'}
            </p>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">販売状態</label>
            <div className="flex items-center h-12">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={performanceFormData.isOnSale}
                  onChange={(e) => setPerformanceFormData({ ...performanceFormData, isOnSale: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">NOW ON SALE</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">アーカイブページに表示</p>
          </div>
        </div>

        {/* セッション日時フォーム */}
        {!editingPerformanceId && (
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">各セッションの日時</h3>
            <p className="text-xs text-slate-500 mb-4">※ 公演回数に応じて入力欄が表示されます</p>
            <div className="space-y-4">
              {sessionsDatesData.map((session, index) => (
                <div key={session.showNumber} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    {session.showNumber}回目 ({index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`})
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">公演日</label>
                      <input
                        type="date"
                        value={session.performanceDate}
                        onChange={(e) => {
                          const newData = [...sessionsDatesData];
                          newData[index].performanceDate = e.target.value;
                          setSessionsDatesData(newData);
                        }}
                        className="w-full p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">開演時刻</label>
                      <input
                        type="time"
                        value={session.performanceTime}
                        onChange={(e) => {
                          const newData = [...sessionsDatesData];
                          newData[index].performanceTime = e.target.value;
                          setSessionsDatesData(newData);
                        }}
                        className="w-full p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">開場時刻</label>
                      <input
                        type="time"
                        value={session.doorsOpenTime}
                        onChange={(e) => {
                          const newData = [...sessionsDatesData];
                          newData[index].doorsOpenTime = e.target.value;
                          setSessionsDatesData(newData);
                        }}
                        className="w-full p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 会場情報 */}
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">会場情報</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">会場名</label>
              <input
                type="text"
                value={performanceFormData.venueName}
                onChange={(e) => setPerformanceFormData({ ...performanceFormData, venueName: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                placeholder="埼玉会館"
                required={!editingPerformanceId}
              />
              {!editingPerformanceId && (
                <p className="text-xs text-slate-500 mt-1">全セッションに適用されます（個別に変更可能）</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">会場住所</label>
              <input
                type="text"
                value={performanceFormData.venueAddress}
                onChange={(e) => setPerformanceFormData({ ...performanceFormData, venueAddress: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                placeholder="東京都渋谷区○○..."
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">会場アクセス</label>
              <input
                type="text"
                value={performanceFormData.venueAccess}
                onChange={(e) => setPerformanceFormData({ ...performanceFormData, venueAccess: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                placeholder="JR渋谷駅より徒歩5分"
              />
            </div>
          </div>
        </div>
        
        {/* 料金設定 */}
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">料金設定</h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">一般席</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={performanceFormData.generalPrice || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setPerformanceFormData({ ...performanceFormData, generalPrice: value === '' ? 0 : parseInt(value, 10) });
                  }}
                  className="w-full p-3 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  required
                />
                <span className="absolute right-3 top-3 text-slate-500 pointer-events-none">円</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">指定席</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={performanceFormData.reservedPrice || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setPerformanceFormData({ ...performanceFormData, reservedPrice: value === '' ? 0 : parseInt(value, 10) });
                  }}
                  className="w-full p-3 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  required
                />
                <span className="absolute right-3 top-3 text-slate-500 pointer-events-none">円</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">VIP①席</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={performanceFormData.vip1Price || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setPerformanceFormData({ ...performanceFormData, vip1Price: value === '' ? 0 : parseInt(value, 10) });
                  }}
                  className="w-full p-3 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  placeholder="30000"
                />
                <span className="absolute right-3 top-3 text-slate-500 pointer-events-none">円</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">VIP②席</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={performanceFormData.vip2Price || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setPerformanceFormData({ ...performanceFormData, vip2Price: value === '' ? 0 : parseInt(value, 10) });
                  }}
                  className="w-full p-3 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  placeholder="50000"
                />
                <span className="absolute right-3 top-3 text-slate-500 pointer-events-none">円</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">※ VIP席は0円の場合、非表示になります</p>
        </div>
        
        {/* VIP席特典 */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">VIP席 特典・備考</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">VIP①席</label>
              <input
                type="text"
                value={performanceFormData.vip1Note}
                onChange={(e) => setPerformanceFormData({ ...performanceFormData, vip1Note: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                placeholder="オリジナルグッズ特典付き"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">VIP②席</label>
              <input
                type="text"
                value={performanceFormData.vip2Note}
                onChange={(e) => setPerformanceFormData({ ...performanceFormData, vip2Note: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                placeholder="グッズ割引券付き"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">その他</h3>
          <div>
            <label className="block text-sm text-slate-600 mb-1">説明</label>
            <textarea
              value={performanceFormData.description}
              onChange={(e) => setPerformanceFormData({ ...performanceFormData, description: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              rows={4}
              placeholder="公演の説明..."
            />
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
            {editingPerformanceId ? '更新' : '作成'}
          </button>
        </div>
      </form>
    </Modal>
  );
}