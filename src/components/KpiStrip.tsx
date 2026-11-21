import type { AnalyticsSummary } from '../lib/analytics';
import { formatCompactINR, formatINR, formatNumber, formatPct } from '../lib/format';

interface KpiStripProps {
  analytics: AnalyticsSummary;
}

export function KpiStrip({ analytics }: KpiStripProps) {
  const { kpis } = analytics;
  const retentionPct = kpis.totalRevenue > 0 ? (kpis.retainedRevenue / kpis.totalRevenue) * 100 : 0;

  const items = [
    {
      label: 'Gross Revenue',
      value: formatCompactINR(kpis.totalRevenue),
      sub: `Exact ${formatINR(kpis.totalRevenue, 2)}`,
      tone: 'text-slate-900 dark:text-slate-50',
    },
    {
      label: 'Net Retained Revenue',
      value: formatCompactINR(kpis.retainedRevenue),
      sub: `${formatPct(retentionPct)} retained after returns`,
      tone: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'Transactions & Units',
      value: formatNumber(kpis.orderCount),
      sub: `${formatNumber(kpis.totalUnits)} units • ${formatNumber(kpis.uniqueCustomers)} customers`,
      tone: 'text-slate-900 dark:text-slate-50',
    },
    {
      label: 'Average Order Value',
      value: formatINR(kpis.aov, 0),
      sub: `Mean ticket across ${formatNumber(kpis.orderCount)} orders`,
      tone: 'text-slate-900 dark:text-slate-50',
    },
    {
      label: 'Delivery & Rating',
      value: `${kpis.avgRating.toFixed(2)} / 5.0`,
      sub: `${kpis.avgDeliveryDays.toFixed(2)} days avg fulfillment`,
      tone: 'text-blue-700 dark:text-blue-400',
    },
    {
      label: 'Returns & Repeat',
      value: formatPct(kpis.returnRatePct),
      sub: `${formatCompactINR(kpis.returnedRevenue)} returned • ${formatPct(kpis.repeatRatePct)} repeat`,
      tone: kpis.returnRatePct > 9 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400',
    },
  ];

  return (
    <section aria-label="Key performance metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-4 py-3.5"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {item.label}
          </p>
          <p className={`mt-1.5 text-xl font-semibold font-mono-num tracking-tight ${item.tone}`}>
            {item.value}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono-num truncate" title={item.sub}>
            {item.sub}
          </p>
        </div>
      ))}
    </section>
  );
}
