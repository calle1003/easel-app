'use client';

import { Plus, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

// 詳細情報フォームのデータ型定義（エクスポート）
export interface DetailFormData {
  flyerImages: Array<{ url: string; name: string }>;
  painters: Array<{ name: string; instagram?: string }>;
  choreographers: Array<{ name: string; instagram?: string; company?: string }>;
  navigators: Array<{ name: string; instagram?: string; company?: string }>;
  guestDancers: Array<{ name: string; instagram?: string; company?: string }>;
  staff: Array<{ role: string; name: string; instagram?: string; company?: string }>;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detailFormData: DetailFormData;
  setDetailFormData: (data: DetailFormData) => void;
  uploadingImageIndex: number | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function DetailModal({
  isOpen,
  onClose,
  detailFormData,
  setDetailFormData,
  uploadingImageIndex,
  onFileUpload,
  onSubmit,
}: DetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="詳細情報編集"
      size="2xl"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {/* フライヤー画像 */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">フライヤー画像</h3>
          <div className="space-y-3">
            {detailFormData.flyerImages.map((image, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-3">
                <div className="flex gap-3">
                  {/* プレビュー */}
                  <div className="flex-shrink-0">
                    {image.url ? (
                      <div className="relative w-24 h-24 rounded border border-slate-200 overflow-hidden bg-slate-50">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                        <ImageIcon size={32} className="text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* 入力フィールド */}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      {/* ファイル選択ボタン */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => onFileUpload(e, index)}
                          className="hidden"
                          disabled={uploadingImageIndex === index}
                        />
                        <div className={`flex items-center gap-2 px-3 py-2 text-sm border rounded ${
                          uploadingImageIndex === index
                            ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}>
                          <Upload size={16} />
                          {uploadingImageIndex === index ? 'アップロード中...' : 'ファイル選択'}
                        </div>
                      </label>

                      {/* URL入力 */}
                      <input
                        type="text"
                        placeholder="または画像URL"
                        value={image.url}
                        onChange={(e) => {
                          const newImages = [...detailFormData.flyerImages];
                          newImages[index].url = e.target.value;
                          setDetailFormData({ ...detailFormData, flyerImages: newImages });
                        }}
                        className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                      />
                    </div>

                    <div className="flex gap-2">
                      {/* 名前入力 */}
                      <input
                        type="text"
                        placeholder="画像名（例: 井口舞子）"
                        value={image.name}
                        onChange={(e) => {
                          const newImages = [...detailFormData.flyerImages];
                          newImages[index].name = e.target.value;
                          setDetailFormData({ ...detailFormData, flyerImages: newImages });
                        }}
                        className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                      />

                      {/* 削除ボタン */}
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = detailFormData.flyerImages.filter((_, i) => i !== index);
                          setDetailFormData({ ...detailFormData, flyerImages: newImages });
                        }}
                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => {
                setDetailFormData({
                  ...detailFormData,
                  flyerImages: [...detailFormData.flyerImages, { url: '', name: '' }]
                });
              }}
              className="w-full px-4 py-3 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 flex items-center justify-center gap-2 border border-dashed border-slate-300"
            >
              <Plus size={16} />
              画像を追加
            </button>

            <p className="text-xs text-slate-500 mt-2">
              ※ 画像ファイルをアップロード（JPEG, PNG, GIF, WebP / 最大15MB）、またはURLを直接入力できます
            </p>
          </div>
        </div>

        {/* 画家 */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Painter</h3>
          <div className="space-y-2">
            {detailFormData.painters.map((painter, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="名前"
                  value={painter.name}
                  onChange={(e) => {
                    const newPainters = [...detailFormData.painters];
                    newPainters[index].name = e.target.value;
                    setDetailFormData({ ...detailFormData, painters: newPainters });
                  }}
                  className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  placeholder="Instagram"
                  value={painter.instagram || ''}
                  onChange={(e) => {
                    const newPainters = [...detailFormData.painters];
                    newPainters[index].instagram = e.target.value;
                    setDetailFormData({ ...detailFormData, painters: newPainters });
                  }}
                  className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newPainters = detailFormData.painters.filter((_, i) => i !== index);
                    setDetailFormData({ ...detailFormData, painters: newPainters });
                  }}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setDetailFormData({
                  ...detailFormData,
                  painters: [...detailFormData.painters, { name: '', instagram: '' }]
                });
              }}
              className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
            >
              + Painter追加
            </button>
          </div>
        </div>

        {/* 振付師 */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Choreographer</h3>
          <div className="space-y-2">
            {detailFormData.choreographers.map((choreo, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="名前"
                  value={choreo.name}
                  onChange={(e) => {
                    const newChoreos = [...detailFormData.choreographers];
                    newChoreos[index].name = e.target.value;
                    setDetailFormData({ ...detailFormData, choreographers: newChoreos });
                  }}
                  className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  placeholder="所属"
                  value={choreo.company || ''}
                  onChange={(e) => {
                    const newChoreos = [...detailFormData.choreographers];
                    newChoreos[index].company = e.target.value;
                    setDetailFormData({ ...detailFormData, choreographers: newChoreos });
                  }}
                  className="w-32 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  placeholder="Instagram"
                  value={choreo.instagram || ''}
                  onChange={(e) => {
                    const newChoreos = [...detailFormData.choreographers];
                    newChoreos[index].instagram = e.target.value;
                    setDetailFormData({ ...detailFormData, choreographers: newChoreos });
                  }}
                  className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newChoreos = detailFormData.choreographers.filter((_, i) => i !== index);
                    setDetailFormData({ ...detailFormData, choreographers: newChoreos });
                  }}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setDetailFormData({
                  ...detailFormData,
                  choreographers: [...detailFormData.choreographers, { name: '', instagram: '', company: '' }]
                });
              }}
              className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
            >
              + Choreographer追加
            </button>
          </div>
        </div>

        {/* Navigator */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Navigator</h3>
          <div className="space-y-2">
            {detailFormData.navigators.map((nav, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="名前"
                  value={nav.name}
                  onChange={(e) => {
                    const newNavs = [...detailFormData.navigators];
                    newNavs[index].name = e.target.value;
                    setDetailFormData({ ...detailFormData, navigators: newNavs });
                  }}
                  className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  placeholder="所属"
                  value={nav.company || ''}
                  onChange={(e) => {
                    const newNavs = [...detailFormData.navigators];
                    newNavs[index].company = e.target.value;
                    setDetailFormData({ ...detailFormData, navigators: newNavs });
                  }}
                  className="w-32 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  placeholder="Instagram"
                  value={nav.instagram || ''}
                  onChange={(e) => {
                    const newNavs = [...detailFormData.navigators];
                    newNavs[index].instagram = e.target.value;
                    setDetailFormData({ ...detailFormData, navigators: newNavs });
                  }}
                  className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newNavs = detailFormData.navigators.filter((_, i) => i !== index);
                    setDetailFormData({ ...detailFormData, navigators: newNavs });
                  }}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setDetailFormData({
                  ...detailFormData,
                  navigators: [...detailFormData.navigators, { name: '', instagram: '', company: '' }]
                });
              }}
              className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
            >
              + Navigator追加
            </button>
          </div>
        </div>

        {/* Guest Dancer */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Guest Dancer</h3>
          <div className="space-y-2">
            {detailFormData.guestDancers.map((guest, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="名前"
                  value={guest.name}
                  onChange={(e) => {
                    const newGuests = [...detailFormData.guestDancers];
                    newGuests[index].name = e.target.value;
                    setDetailFormData({ ...detailFormData, guestDancers: newGuests });
                  }}
                  className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  placeholder="所属"
                  value={guest.company || ''}
                  onChange={(e) => {
                    const newGuests = [...detailFormData.guestDancers];
                    newGuests[index].company = e.target.value;
                    setDetailFormData({ ...detailFormData, guestDancers: newGuests });
                  }}
                  className="w-32 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  placeholder="Instagram"
                  value={guest.instagram || ''}
                  onChange={(e) => {
                    const newGuests = [...detailFormData.guestDancers];
                    newGuests[index].instagram = e.target.value;
                    setDetailFormData({ ...detailFormData, guestDancers: newGuests });
                  }}
                  className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newGuests = detailFormData.guestDancers.filter((_, i) => i !== index);
                    setDetailFormData({ ...detailFormData, guestDancers: newGuests });
                  }}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setDetailFormData({
                  ...detailFormData,
                  guestDancers: [...detailFormData.guestDancers, { name: '', instagram: '', company: '' }]
                });
              }}
              className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
            >
              + Guest Dancer追加
            </button>
          </div>
        </div>

        {/* Staff */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Staff</h3>
          <div className="space-y-2">
            {detailFormData.staff.map((staff, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="役割（例: 企画・運営）"
                  value={staff.role}
                  onChange={(e) => {
                    const newStaff = [...detailFormData.staff];
                    newStaff[index].role = e.target.value;
                    setDetailFormData({ ...detailFormData, staff: newStaff });
                  }}
                  className="w-32 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  placeholder="名前"
                  value={staff.name}
                  onChange={(e) => {
                    const newStaff = [...detailFormData.staff];
                    newStaff[index].name = e.target.value;
                    setDetailFormData({ ...detailFormData, staff: newStaff });
                  }}
                  className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  placeholder="所属"
                  value={staff.company || ''}
                  onChange={(e) => {
                    const newStaff = [...detailFormData.staff];
                    newStaff[index].company = e.target.value;
                    setDetailFormData({ ...detailFormData, staff: newStaff });
                  }}
                  className="w-32 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  placeholder="Instagram"
                  value={staff.instagram || ''}
                  onChange={(e) => {
                    const newStaff = [...detailFormData.staff];
                    newStaff[index].instagram = e.target.value;
                    setDetailFormData({ ...detailFormData, staff: newStaff });
                  }}
                  className="flex-1 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newStaff = detailFormData.staff.filter((_, i) => i !== index);
                    setDetailFormData({ ...detailFormData, staff: newStaff });
                  }}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setDetailFormData({
                  ...detailFormData,
                  staff: [...detailFormData.staff, { role: '', name: '', instagram: '', company: '' }]
                });
              }}
              className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
            >
              + Staff追加
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
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
            保存
          </button>
        </div>
      </form>
    </Modal>
  );
}
