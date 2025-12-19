/**
 * ニュース追加・編集モーダル
 */

'use client';

import { Modal } from '@/components/ui/modal';
import { NewsFormData } from '../types';

interface NewsModalProps {
  isOpen: boolean;
  editingId: number | null;
  formData: NewsFormData;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onFormDataChange: (data: NewsFormData) => void;
}

export function NewsModal({
  isOpen,
  editingId,
  formData,
  onClose,
  onSubmit,
  onFormDataChange,
}: NewsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'ニュースを編集' : 'ニュースを追加'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            placeholder="ニュースのタイトル"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">カテゴリ</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => onFormDataChange({ ...formData, category: e.target.value })}
            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            placeholder="例: お知らせ, イベント"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">
            内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => onFormDataChange({ ...formData, content: e.target.value })}
            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            placeholder="ニュースの内容"
            rows={6}
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 transition-colors"
          >
            {editingId ? '更新' : '追加'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
