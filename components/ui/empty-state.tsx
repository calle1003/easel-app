import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      {Icon && (
        <Icon
          className="mx-auto mb-6 text-slate-200"
          size={48}
          strokeWidth={1}
        />
      )}
      {title && (
        <h3 className="text-lg font-medium text-slate-700 mb-2">{title}</h3>
      )}
      <p className="text-slate-400 text-sm mb-6">{message}</p>
      {action && (
        <button onClick={action.onClick} className="btn-secondary">
          {action.label}
        </button>
      )}
    </div>
  );
}

