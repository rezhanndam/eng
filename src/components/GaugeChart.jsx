import { GAUGE_DATA } from '../data';
import { useTheme } from '../hooks/useTheme';

export default function GaugeChart({
  percentage = GAUGE_DATA.percentage,
  target = GAUGE_DATA.target,
  current = GAUGE_DATA.current,
  label = GAUGE_DATA.label,
}) {
  const { isDark } = useTheme();
  const totalSegments = 30;
  const validPercentage = Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : 0;
  const filledSegments = Math.round((validPercentage / 100) * totalSegments);
  const radius = 80;
  const cx = 100;
  const cy = 95;
  const emptyColor = isDark ? '#334155' : '#e2e8f0';

  const segments = [];
  for (let i = 0; i < totalSegments; i++) {
    const startAngle = 180 + (i * 180) / totalSegments;
    const endAngle = 180 + ((i + 0.7) * 180) / totalSegments;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const innerRadius = radius - 14;
    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);

    segments.push(
      <path
        key={i}
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`}
        fill={i < filledSegments ? (i < filledSegments * 0.6 ? '#3b82f6' : '#6366f1') : emptyColor}
        rx="2"
      />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm w-full h-full flex flex-col">
      <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 mb-2">{label}</h3>

      <div className="flex-1 flex flex-col items-center justify-center">
        <svg width="200" height="115" viewBox="0 0 200 115">
          {segments}
          <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-900 dark:fill-white text-[28px] font-bold">
            {percentage}%
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-400 text-[11px]">
            of target
          </text>
        </svg>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-slate-500 dark:text-slate-400">Current</span>
          <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{current}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] text-slate-500 dark:text-slate-400">Target</span>
          <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{target}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
