import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CheckCircle2, Info } from 'lucide-react';
import type { AnalyticsSummary, DataValidationAudit } from '../lib/analytics';
import { formatCompactINR, formatINR, formatNumber, formatPct } from '../lib/format';

interface LogisticsAuditViewProps {
  analytics: AnalyticsSummary;
  audit: DataValidationAudit;
}

export function LogisticsAuditView({ analytics, audit }: LogisticsAuditViewProps) {
  const {
    deliveryBuckets,
    ratingDistribution,
    deliveryRatingCorrelation,
    deliveryReturnCorrelation,
  } = analytics;

  return (
    <div className="space-y-4">
      {/* Delivery Speed vs Rating & Returns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Delivery Speed vs Customer Rating & Return Rate
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Testing whether slower delivery drives lower ratings or elevated return rates
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono-num text-slate-600 dark:text-slate-300">
              <span>r(Delivery, Rating) = {deliveryRatingCorrelation.toFixed(2)}</span>
              <span>r(Delivery, Return) = {deliveryReturnCorrelation.toFixed(2)}</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={deliveryBuckets} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.65} />
                <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
                <YAxis
                  yAxisId="ret"
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="rat"
                  orientation="right"
                  domain={[0, 5]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0].payload as (typeof deliveryBuckets)[number];
                    return (
                      <div className="bg-slate-900 text-slate-50 border border-slate-700 rounded px-3 py-2 text-xs space-y-1">
                        <div className="font-semibold">{row.bucket}</div>
                        <div className="font-mono-num">Orders: {formatNumber(row.orders)} ({formatCompactINR(row.revenue)})</div>
                        <div className="font-mono-num">Avg Rating: {row.avgRating.toFixed(2)} / 5.0</div>
                        <div className="font-mono-num">Return Rate: {formatPct(row.returnRatePct)}</div>
                      </div>
                    );
                  }}
                />
                <Bar yAxisId="ret" dataKey="returnRatePct" name="Return Rate %" fill="#DC2626" radius={[3, 3, 0, 0]} maxBarSize={42} />
                <Line yAxisId="rat" type="monotone" dataKey="avgRating" name="Avg Rating" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Rating Distribution & Returns
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Order volume and return incidence across customer rating bands
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 text-left font-medium">Rating Band</th>
                  <th className="py-2 text-right font-medium">Orders</th>
                  <th className="py-2 text-right font-medium">Avg Delivery</th>
                  <th className="py-2 text-right font-medium">Return %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ratingDistribution.map((b) => (
                  <tr key={b.band} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 text-left font-medium font-mono-num text-slate-900 dark:text-slate-100">
                      {b.band} ★
                    </td>
                    <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {formatNumber(b.orders)}
                    </td>
                    <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {b.avgDeliveryDays.toFixed(2)}d
                    </td>
                    <td
                      className={`py-2.5 text-right font-mono-num font-medium ${
                        b.returnRatePct >= 15
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {formatPct(b.returnRatePct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Data Validation Audit (Full 1,200-record verification) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Automated Data Quality & Validation Audit (Full 1,200 Records)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct verification of dataset totals, missing values, primary key uniqueness, and formula integrity before analysis
            </p>
          </div>
          <span className="text-xs font-mono-num text-emerald-700 dark:text-emerald-400 font-medium">
            {formatNumber(audit.totalFieldsChecked)} fields audited • {audit.missingValuesCount} missing
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2 text-left font-medium">Audit Check</th>
                <th className="py-2 text-left font-medium">Dimension</th>
                <th className="py-2 text-left font-medium">Status</th>
                <th className="py-2 text-left font-medium">Observed Result</th>
                <th className="py-2 text-left font-medium">Analyst Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {audit.checks.map((chk) => (
                <tr key={chk.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 align-top">
                  <td className="py-2.5 pr-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {chk.label}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {chk.category}
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    {chk.status === 'PASS' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono-num font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono-num font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded">
                        <Info className="w-3 h-3" />
                        NOTE
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 font-mono-num text-slate-800 dark:text-slate-200">
                    {chk.observed}
                  </td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400 min-w-[260px]">
                    {chk.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Original 330 vs Synthetic 870 Comparison */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Original 330 Rows vs Synthetic 870 Expansion Benchmark
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Evaluates structural consistency between original records (TXN00001–TXN00330) and generated educational rows (TXN00331–TXN01200)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2 text-left font-medium">Dataset Cohort</th>
                <th className="py-2 text-right font-medium">Orders</th>
                <th className="py-2 text-right font-medium">Revenue</th>
                <th className="py-2 text-right font-medium">AOV</th>
                <th className="py-2 text-right font-medium">Avg Delivery</th>
                <th className="py-2 text-right font-medium">Avg Rating</th>
                <th className="py-2 text-right font-medium">Return %</th>
                <th className="py-2 text-right font-medium">Repeat %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {audit.cohortComparison.map((row) => (
                <tr key={row.cohort} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 text-left font-medium text-slate-900 dark:text-slate-100">
                    {row.cohort}
                  </td>
                  <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {formatNumber(row.orders)}
                  </td>
                  <td className="py-2.5 text-right font-mono-num font-medium text-slate-900 dark:text-slate-100">
                    {formatINR(row.revenue, 2)}
                  </td>
                  <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {formatINR(row.aov, 0)}
                  </td>
                  <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {row.avgDeliveryDays.toFixed(2)}d
                  </td>
                  <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {row.avgRating.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {formatPct(row.returnRatePct)}
                  </td>
                  <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {formatPct(row.repeatRatePct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
