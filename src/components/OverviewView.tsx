import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsSummary } from '../lib/analytics';
import { formatCompactINR, formatINR, formatNumber, formatPct } from '../lib/format';

interface OverviewViewProps {
  analytics: AnalyticsSummary;
  onSelectCategory: (category: string) => void;
  activeCategory: string;
}

export function OverviewView({ analytics, onSelectCategory, activeCategory }: OverviewViewProps) {
  const { monthly, quarterly, categories, topProducts, highReturnProducts } = analytics;

  return (
    <div className="space-y-4">
      {/* Row 1: Monthly Revenue + Quarterly Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Monthly Revenue & Order Volume (Jan–Sep 2024)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Revenue (INR bars) plotted against monthly order count (line) across Q1–Q3
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-[2px] inline-block" />
                Revenue (INR)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
                Orders
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthly} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.65} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="rev"
                  tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                />
                <YAxis
                  yAxisId="ord"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0].payload as (typeof monthly)[number];
                    return (
                      <div className="bg-slate-900 text-slate-50 border border-slate-700 rounded px-3 py-2 text-xs space-y-1 shadow-sm">
                        <div className="font-semibold">
                          {row.month} 2024 ({row.quarter})
                        </div>
                        <div className="font-mono-num">Revenue: {formatINR(row.revenue, 2)}</div>
                        <div className="font-mono-num">Orders: {formatNumber(row.orders)} ({formatNumber(row.units)} units)</div>
                        <div className="font-mono-num">AOV: {formatINR(row.aov, 0)}</div>
                        <div className="font-mono-num">
                          MoM Change: {row.momGrowthPct === null ? 'Baseline' : `${row.momGrowthPct > 0 ? '+' : ''}${row.momGrowthPct.toFixed(1)}%`}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar yAxisId="rev" dataKey="revenue" fill="#2563EB" radius={[3, 3, 0, 0]} maxBarSize={36} />
                <Line
                  yAxisId="ord"
                  type="monotone"
                  dataKey="orders"
                  stroke="#16A34A"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#16A34A' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Quarterly Performance Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Q1 (Jan–Mar), Q2 (Apr–Jun), Q3 (Jul–Sep) progression
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2 text-left font-medium">Quarter</th>
                    <th className="py-2 text-right font-medium">Orders</th>
                    <th className="py-2 text-right font-medium">Revenue</th>
                    <th className="py-2 text-right font-medium">QoQ</th>
                    <th className="py-2 text-right font-medium">Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {quarterly.map((q) => (
                    <tr key={q.quarter} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 text-left font-medium text-slate-900 dark:text-slate-100">
                        {q.quarter} <span className="text-slate-500 font-normal">({q.label})</span>
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatNumber(q.orders)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num font-medium text-slate-900 dark:text-slate-100">
                        {formatCompactINR(q.revenue)}
                      </td>
                      <td
                        className={`py-2.5 text-right font-mono-num ${
                          q.qoqGrowthPct === null
                            ? 'text-slate-400'
                            : q.qoqGrowthPct >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {q.qoqGrowthPct === null
                          ? '—'
                          : `${q.qoqGrowthPct >= 0 ? '+' : ''}${q.qoqGrowthPct.toFixed(1)}%`}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatPct(q.returnRatePct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Monthly Snapshot Ledger
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {monthly.map((m) => (
                <div
                  key={m.month}
                  className="border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{m.month}</span>
                    <span className="font-mono-num">{m.orders}</span>
                  </div>
                  <div className="text-xs font-semibold font-mono-num text-slate-900 dark:text-slate-100 mt-0.5">
                    {formatCompactINR(m.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Category Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Revenue by Product Category
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any category bar or table row to filter the entire workspace
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categories}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" strokeOpacity={0.65} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={106}
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0].payload as (typeof categories)[number];
                    return (
                      <div className="bg-slate-900 text-slate-50 border border-slate-700 rounded px-3 py-2 text-xs space-y-1">
                        <div className="font-semibold">{row.name}</div>
                        <div className="font-mono-num">Revenue: {formatINR(row.revenue, 2)} ({formatPct(row.revenueSharePct)})</div>
                        <div className="font-mono-num">Orders: {formatNumber(row.orders)} • Units: {formatNumber(row.units)}</div>
                        <div className="font-mono-num">Avg Rating: {row.avgRating.toFixed(2)} • Return: {formatPct(row.returnRatePct)}</div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#1D4ED8"
                  radius={[0, 3, 3, 0]}
                  barSize={22}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    if (entry && typeof entry.name === 'string') {
                      onSelectCategory(activeCategory === entry.name ? 'All' : entry.name);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Category Performance Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Revenue share, unit economics, customer satisfaction, and return exposure
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 text-left font-medium">Category</th>
                  <th className="py-2 text-right font-medium">Orders</th>
                  <th className="py-2 text-right font-medium">Units</th>
                  <th className="py-2 text-right font-medium">Revenue</th>
                  <th className="py-2 text-right font-medium">Share</th>
                  <th className="py-2 text-right font-medium">AOV</th>
                  <th className="py-2 text-right font-medium">Rating</th>
                  <th className="py-2 text-right font-medium">Return %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {categories.map((c) => {
                  const isSelected = activeCategory === c.name;
                  return (
                    <tr
                      key={c.name}
                      onClick={() => onSelectCategory(isSelected ? 'All' : c.name)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-2.5 text-left font-medium text-slate-900 dark:text-slate-100">
                        {c.name}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatNumber(c.orders)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatNumber(c.units)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num font-medium text-slate-900 dark:text-slate-100">
                        {formatINR(c.revenue, 0)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatPct(c.revenueSharePct)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatINR(c.aov, 0)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {c.avgRating.toFixed(2)}
                      </td>
                      <td
                        className={`py-2.5 text-right font-mono-num font-medium ${
                          c.returnRatePct >= 9.5
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {formatPct(c.returnRatePct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Top Revenue SKUs & Highest Return-Rate SKUs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Top Revenue SKUs
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Highest-grossing products in the active scope
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 text-left font-medium">Product</th>
                  <th className="py-2 text-left font-medium">Category</th>
                  <th className="py-2 text-right font-medium">Orders</th>
                  <th className="py-2 text-right font-medium">Units</th>
                  <th className="py-2 text-right font-medium">Revenue</th>
                  <th className="py-2 text-right font-medium">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topProducts.slice(0, 8).map((p) => (
                  <tr key={`${p.category}-${p.productName}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 text-left font-medium text-slate-900 dark:text-slate-100">
                      {p.productName}
                    </td>
                    <td className="py-2 text-left text-slate-500 dark:text-slate-400">{p.category}</td>
                    <td className="py-2 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {formatNumber(p.orders)}
                    </td>
                    <td className="py-2 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {formatNumber(p.units)}
                    </td>
                    <td className="py-2 text-right font-mono-num font-medium text-slate-900 dark:text-slate-100">
                      {formatINR(p.revenue, 0)}
                    </td>
                    <td className="py-2 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {p.avgRating.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Return Risk Watchlist (SKUs with ≥ 5 Orders)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Products exhibiting the highest return incidence within the active slice
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 text-left font-medium">Product</th>
                  <th className="py-2 text-left font-medium">Category</th>
                  <th className="py-2 text-right font-medium">Orders</th>
                  <th className="py-2 text-right font-medium">Revenue</th>
                  <th className="py-2 text-right font-medium">Rating</th>
                  <th className="py-2 text-right font-medium">Return %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {highReturnProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 dark:text-slate-400">
                      Not enough order volume (≥ 5 orders per SKU) under the current filter slice.
                    </td>
                  </tr>
                ) : (
                  highReturnProducts.map((p) => (
                    <tr key={`${p.category}-${p.productName}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 text-left font-medium text-slate-900 dark:text-slate-100">
                        {p.productName}
                      </td>
                      <td className="py-2 text-left text-slate-500 dark:text-slate-400">{p.category}</td>
                      <td className="py-2 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatNumber(p.orders)}
                      </td>
                      <td className="py-2 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatINR(p.revenue, 0)}
                      </td>
                      <td className="py-2 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {p.avgRating.toFixed(2)}
                      </td>
                      <td className="py-2 text-right font-mono-num font-semibold text-red-600 dark:text-red-400">
                        {formatPct(p.returnRatePct)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
