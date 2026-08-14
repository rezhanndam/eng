import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data available',
  description = 'There is nothing here yet.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="text-[13px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 flex items-center gap-2 h-9 px-4 text-[13px] font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 cursor-pointer active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
