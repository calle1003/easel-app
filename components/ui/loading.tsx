import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-slate-300`} />
      {message && <p className="mt-6 text-slate-400 text-sm">{message}</p>}
    </div>
  );
}

