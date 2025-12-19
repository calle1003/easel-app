import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorMessage({
  title = 'エラーが発生しました',
  message,
  retry,
}: ErrorMessageProps) {
  return (
    <div className="text-center py-20">
      <AlertCircle
        className="mx-auto mb-6 text-red-200"
        size={48}
        strokeWidth={1.5}
      />
      <h3 className="text-lg font-medium text-slate-700 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm mb-6">{message}</p>
      {retry && (
        <button onClick={retry} className="btn-secondary">
          再試行
        </button>
      )}
    </div>
  );
}

