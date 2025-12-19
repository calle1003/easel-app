/**
 * 出演者テーブルコンポーネント
 */

'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Performer } from '../types';

interface PerformerTableProps {
  performers: Performer[];
  loading: boolean;
  onEdit: (performer: Performer) => void;
  onDelete: (id: number) => void;
}

export function PerformerTable({
  performers,
  loading,
  onEdit,
  onDelete,
}: PerformerTableProps) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto" />
      </div>
    );
  }

  if (performers.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <p className="text-slate-500">出演者がいません</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">名前</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                ふりがな
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">出演公演</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                引換券コード数
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {performers.map((performer) => (
              <tr key={performer.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">{performer.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600">
                    {performer.nameKana || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {performer.performances && performer.performances.length > 0 ? (
                      performer.performances.map((pp) => (
                        <span
                          key={pp.performanceId}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {pp.performance.volume || pp.performance.title}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">未設定</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-medium text-slate-800">
                    {performer._count.exchangeCodes}枚
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(performer)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="編集"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `${performer.name}を削除しますか？\n※ 引換券コードが紐づいている場合は削除できません`
                          )
                        ) {
                          onDelete(performer.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
