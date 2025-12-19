/**
 * 公演とセッション選択コンポーネント
 * 公演を選択すると、その公演のセッション一覧が表示され、各セッションごとにコード数を設定可能
 */

'use client';

import { Performance, PerformanceSession } from '../types';

interface ExtendedSession extends PerformanceSession {
  performanceTitle: string;
  performanceVolume: string | null;
}

interface PerformanceSessionSelectorProps {
  performances: Performance[];
  selectedPerformanceIds: number[];
  codesPerSession: Record<number, number>;
  onPerformanceToggle: (id: number) => void;
  onSessionCodeCountChange: (sessionId: number, count: number) => void;
  mode: 'single' | 'batch'; // single: 単一コード追加, batch: 一括生成
}

export function PerformanceSessionSelector({
  performances,
  selectedPerformanceIds,
  codesPerSession,
  onPerformanceToggle,
  onSessionCodeCountChange,
  mode,
}: PerformanceSessionSelectorProps) {
  // 選択された公演のセッション一覧を取得
  const selectedSessions: ExtendedSession[] = [];
  selectedPerformanceIds.forEach((perfId) => {
    const perf = performances.find((p) => p.id === perfId);
    if (perf?.sessions) {
      perf.sessions.forEach((session) => {
        selectedSessions.push({
          ...session,
          performanceTitle: perf.title,
          performanceVolume: perf.volume,
        });
      });
    }
  });

  // セッションを日付順・回数順にソート
  selectedSessions.sort((a, b) => {
    const dateA = new Date(a.performanceDate).getTime();
    const dateB = new Date(b.performanceDate).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.showNumber - b.showNumber;
  });

  // 合計コード数を計算
  const totalCodes = Object.values(codesPerSession).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-4">
      {/* 公演選択 */}
      <div>
        <label className="block text-sm text-slate-600 mb-2">
          出演公演（複数選択可） <span className="text-red-500">*</span>
        </label>
        <div className="border border-slate-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
          {performances.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">公演がありません</p>
          ) : (
            performances.map((performance) => (
              <label
                key={performance.id}
                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPerformanceIds.includes(performance.id)}
                  onChange={() => onPerformanceToggle(performance.id)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700">
                    {performance.title}
                    {performance.volume && (
                      <span className="ml-2 text-xs text-slate-500">
                        ({performance.volume})
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      {/* セッション一覧とコード数設定 */}
      {selectedPerformanceIds.length === 0 && (
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
          <p className="text-sm text-slate-600 text-center">
            出演公演を選択すると、公演日時の選択が表示されます
          </p>
        </div>
      )}

      {selectedSessions.length > 0 && (
        <div>
          <label className="block text-sm text-slate-600 mb-2">
            {mode === 'single'
              ? '引換券コードの対象公演日時'
              : '引換券コードの対象公演日時（複数選択可）'}{' '}
            <span className="text-red-500">*</span>
          </label>

          {mode === 'single' ? (
            // 単一選択モード
            <select
              value={Object.keys(codesPerSession)[0] || ''}
              onChange={(e) => {
                const sessionId = parseInt(e.target.value);
                if (sessionId) {
                  onSessionCodeCountChange(sessionId, 1);
                } else {
                  // クリア
                  const currentSessionId = parseInt(Object.keys(codesPerSession)[0]);
                  if (currentSessionId) {
                    onSessionCodeCountChange(currentSessionId, 0);
                  }
                }
              }}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              required
            >
              <option value="">選択してください</option>
              {selectedSessions.map((session) => {
                const showNumber =
                  ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][
                    session.showNumber - 1
                  ] || `${session.showNumber}th`;
                const date = new Date(session.performanceDate);
                const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
                return (
                  <option key={session.id} value={session.id}>
                    {session.performanceTitle} - {showNumber} ({dateStr})
                  </option>
                );
              })}
            </select>
          ) : (
            // 複数選択モード（一括生成）
            <div className="border border-slate-200 rounded-lg p-3 space-y-3 max-h-80 overflow-y-auto">
              {selectedSessions.map((session) => {
                const showNumber =
                  ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][
                    session.showNumber - 1
                  ] || `${session.showNumber}th`;
                const date = new Date(session.performanceDate);
                const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {session.performanceTitle}
                      </p>
                      <p className="text-xs text-slate-500">
                        {showNumber} - {dateStr} - {session.venueName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={codesPerSession[session.id] || ''}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          const count = numericValue === '' ? 0 : parseInt(numericValue, 10);
                          onSessionCodeCountChange(session.id, count);
                        }}
                        className="w-20 p-2 border border-slate-300 rounded text-center"
                        placeholder="0"
                      />
                      <span className="text-sm text-slate-600">枚</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {mode === 'batch' && (
            <p className="text-xs text-slate-500 mt-2">
              各公演日時に割り当てるコード数を入力してください（合計:{' '}
              {Object.values(codesPerSession).reduce((sum, count) => sum + count, 0)}枚）
            </p>
          )}
        </div>
      )}
    </div>
  );
}
