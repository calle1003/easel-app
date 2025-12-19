import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日付を日本語形式でフォーマットする
 * @param date - Date オブジェクトまたは ISO 文字列
 * @param format - 'long' (例: 2024年12月19日) または 'short' (例: 2024/12/19)
 * @returns フォーマットされた日付文字列
 */
export function formatDate(
  date: Date | string,
  format: 'long' | 'short' = 'long'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === 'short') {
    return dateObj.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  return dateObj.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 時刻を日本語形式でフォーマットする
 * @param time - Date オブジェクトまたは ISO 文字列
 * @returns フォーマットされた時刻文字列 (例: 19:30)
 */
export function formatTime(time: Date | string): string {
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  return timeObj.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 日時を日本語形式でフォーマットする
 * @param datetime - Date オブジェクトまたは ISO 文字列
 * @returns フォーマットされた日時文字列 (例: 2024年12月19日 19:30)
 */
export function formatDateTime(datetime: Date | string): string {
  return `${formatDate(datetime)} ${formatTime(datetime)}`;
}
