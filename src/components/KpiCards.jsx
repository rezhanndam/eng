import { ArrowUpRight, ArrowDownRight, FolderOpen, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { KPI_DATA } from '../data';

const ICON_MAP = {
  blue: FolderOpen,
  emerald: CheckCircle2,
  violet: Clock,
  amber: AlertTriangle,
};

const COLOR_MAP = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
};

export default function KpiCards({ data = KPI_DATA }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {data.map((kpi) => {
        const Icon = ICON_MAP[kpi.color] || FolderOpen;
        const clr = COLOR_MAP[kpi.color] || COLOR_MAP.blue;
        const trendVal = Number.isFinite(kpi.trend) ? kpi.trend : 0;
        const isPositive = kpi.invert ? trendVal < 0 : trendVal > 0;

        return (
          <div
            key={kpi.title}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${clr.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${clr.text}`} />
              </div>
            </div>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-1">{kpi.title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{kpi.value}</p>
            <div className="flex items-center gap-1.5 text-[12px]">
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-medium ${
                  isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-900/40 dark:text-red-400'
                }`}
              >
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trendVal)}%
              </span>
              <span className="text-slate-400 dark:text-slate-500">{kpi.vs}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
