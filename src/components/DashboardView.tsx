import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  AnalyticsSummary,
  DataValidationAudit,
  FilterState,
  MonthFilter,
  SegmentFilter,
} from '../lib/analytics';
import { formatCompactINR, formatINR, formatNumber, formatPct } from '../lib/format';

interface DashboardViewProps {
  analytics: AnalyticsSummary;
  audit: DataValidationAudit;
  filters: FilterState;
  onUpdateFilters: (next: FilterState) => void;
  onNavigateTab: (tab: 'overview' | 'segments' | 'logistics' | 'ai' | 'ledger') => void;
}

const SEGMENT_COLORS: Record<string, string> = {
  Premium: '#1D4ED8',
  'Mid-Tier': '#0EA5E9',
  Budget: '#64748B',
};

export function DashboardView({
  analytics,
  audit,
  filters,
  onUpdateFilters,
  onNavigateTab,
}: DashboardViewProps) {
  const {
    kpis,
    monthly,
    quarterly,
    categories,
    segments,
    cities,
    deliveryBuckets,
    deliveryRatingCorrelation,
    topProducts,
  } = analytics;

  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const handleFetchBrief = async () => {
    setBriefLoading(true);
    setBriefError(null);
    try {
      const res = await fetch('/api/analyze/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question:
            'Provide a concise 4-bullet executive dashboard briefing for Somya Verma covering: (1) top revenue driver & monthly momentum, (2) leading category & city, (3) customer segment & repeat behavior, and (4) delivery speed & return risk takeaway.',
          filters,
        }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok || !data.answer) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }
      setAiBrief(data.answer);
    } catch (err) {
      setBriefError(
        err instanceof Error ? err.message : 'Unable to generate AI dashboard brief.'
      );
    } finally {
      setBriefLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Monthly Revenue Trend + Customer Segment Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Monthly Revenue &amp; Order Trajectory (Jan–Sep 2024)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any month bar to cross-filter the dashboard • Q1–Q3 seasonal progression
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono-num text-slate-600 dark:text-slate-300">
              {quarterly.map((q) => (
                <button
                  key={q.quarter}
                  type="button"
                  onClick={() =>
                    onUpdateFilters({
                      ...filters,
                      quarter: filters.quarter === q.quarter ? 'All' : q.quarter,
                      month: 'All',
                    })
                  }
                  className={`px-2 py-0.5 border rounded cursor-pointer transition-colors ${
                    filters.quarter === q.quarter
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {q.quarter}: {formatCompactINR(q.revenue)}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
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
                  width={52}
                />
                <YAxis
                  yAxisId="ord"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0].payload as (typeof monthly)[number];
                    return (
                      <div className="bg-slate-900 text-slate-50 border border-slate-700 rounded px-3 py-2 text-xs space-y-1">
                        <div className="font-semibold">
                          {row.month} 2024 ({row.quarter})
                        </div>
                        <div className="font-mono-num">Revenue: {formatINR(row.revenue, 2)}</div>
                        <div className="font-mono-num">Orders: {formatNumber(row.orders)} • AOV: {formatINR(row.aov, 0)}</div>
                        <div className="font-mono-num">
                          MoM: {row.momGrowthPct === null ? 'Baseline' : `${row.momGrowthPct >= 0 ? '+' : ''}${row.momGrowthPct.toFixed(1)}%`}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  yAxisId="rev"
                  dataKey="revenue"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={36}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    const monthVal = (entry?.payload as { month?: string } | undefined)?.month;
                    if (typeof monthVal === 'string') {
                      const clicked = monthVal as MonthFilter;
                      onUpdateFilters({
                        ...filters,
                        month: filters.month === clicked ? 'All' : clicked,
                      });
                    }
                  }}
                >
                  {monthly.map((m) => (
                    <Cell
                      key={m.month}
                      fill={
                        filters.month === 'All' || filters.month === m.month
                          ? '#2563EB'
                          : '#94A3B8'
                      }
                      fillOpacity={filters.month === 'All' || filters.month === m.month ? 1 : 0.45}
                    />
                  ))}
                </Bar>
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

        {/* Segment Mix Donut */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Customer Segment Revenue Mix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click a segment slice or row to cross-filter
            </p>
          </div>

          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    if (entry && typeof entry.name === 'string') {
                      const seg = entry.name as SegmentFilter;
                      onUpdateFilters({
                        ...filters,
                        segment: filters.segment === seg ? 'All' : seg,
                      });
                    }
                  }}
                >
                  {segments.map((s) => (
                    <Cell
                      key={s.name}
                      fill={SEGMENT_COLORS[s.name] ?? '#475569'}
                      fillOpacity={filters.segment === 'All' || filters.segment === s.name ? 1 : 0.35}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0].payload as (typeof segments)[number];
                    return (
                      <div className="bg-slate-900 text-slate-50 border border-slate-700 rounded px-3 py-2 text-xs space-y-1">
                        <div className="font-semibold">{row.name}</div>
                        <div className="font-mono-num">Revenue: {formatINR(row.revenue, 0)} ({formatPct(row.revenueSharePct)})</div>
                        <div className="font-mono-num">AOV: {formatINR(row.aov, 0)} • Repeat: {formatPct(row.repeatRatePct)}</div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Gross
              </span>
              <span className="text-xs font-semibold font-mono-num text-slate-900 dark:text-slate-50">
                {formatCompactINR(kpis.totalRevenue)}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 text-xs">
            {segments.map((s) => {
              const active = filters.segment === s.name;
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() =>
                    onUpdateFilters({
                      ...filters,
                      segment: active ? 'All' : (s.name as SegmentFilter),
                    })
                  }
                  className={`w-full py-1.5 px-1.5 flex items-center justify-between text-left cursor-pointer transition-colors ${
                    active ? 'bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                    <span
                      className="w-2.5 h-2.5 rounded-[2px] inline-block shrink-0"
                      style={{ backgroundColor: SEGMENT_COLORS[s.name] ?? '#475569' }}
                    />
                    {s.name}
                  </span>
                  <span className="font-mono-num text-slate-600 dark:text-slate-400">
                    {formatCompactINR(s.revenue)} ({formatPct(s.revenueSharePct)})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Category Revenue + City Revenue + Delivery vs Rating/Return */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Category Revenue Share
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click bar to filter category
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('overview')}
              className="text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Details <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" strokeOpacity={0.65} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={98}
                  tick={{ fontSize: 11, fill: '#475569' }}
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
                        <div className="font-mono-num">{formatINR(row.revenue, 0)} ({formatPct(row.revenueSharePct)})</div>
                        <div className="font-mono-num">Rating: {row.avgRating.toFixed(2)} • Return: {formatPct(row.returnRatePct)}</div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="revenue"
                  radius={[0, 3, 3, 0]}
                  barSize={18}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    const nameVal = (entry?.payload as { name?: string } | undefined)?.name ?? entry?.name;
                    if (typeof nameVal === 'string') {
                      onUpdateFilters({
                        ...filters,
                        category: filters.category === nameVal ? 'All' : nameVal,
                      });
                    }
                  }}
                >
                  {categories.map((c) => (
                    <Cell
                      key={c.name}
                      fill={filters.category === 'All' || filters.category === c.name ? '#1D4ED8' : '#94A3B8'}
                      fillOpacity={filters.category === 'All' || filters.category === c.name ? 1 : 0.45}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City Performance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                City Revenue Distribution
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click bar to filter city
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('segments')}
              className="text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Scorecard <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cities} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" strokeOpacity={0.65} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={78}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0].payload as (typeof cities)[number];
                    return (
                      <div className="bg-slate-900 text-slate-50 border border-slate-700 rounded px-3 py-2 text-xs space-y-1">
                        <div className="font-semibold">{row.name}</div>
                        <div className="font-mono-num">{formatINR(row.revenue, 0)} ({formatNumber(row.orders)} orders)</div>
                        <div className="font-mono-num">Delivery: {row.avgDeliveryDays.toFixed(2)}d • Return: {formatPct(row.returnRatePct)}</div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="revenue"
                  radius={[0, 3, 3, 0]}
                  barSize={15}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    const nameVal = (entry?.payload as { name?: string } | undefined)?.name ?? entry?.name;
                    if (typeof nameVal === 'string') {
                      onUpdateFilters({
                        ...filters,
                        city: filters.city === nameVal ? 'All' : nameVal,
                      });
                    }
                  }}
                >
                  {cities.map((c) => (
                    <Cell
                      key={c.name}
                      fill={filters.city === 'All' || filters.city === c.name ? '#0EA5E9' : '#94A3B8'}
                      fillOpacity={filters.city === 'All' || filters.city === c.name ? 1 : 0.45}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Speed vs Rating & Returns */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Delivery Speed vs Rating &amp; Returns
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                r(Delivery, Rating) = {deliveryRatingCorrelation.toFixed(2)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('logistics')}
              className="text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Audit <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={deliveryBuckets} margin={{ top: 6, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.65} />
                <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
                <YAxis yAxisId="ret" tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rat" orientation="right" domain={[0, 5]} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0].payload as (typeof deliveryBuckets)[number];
                    return (
                      <div className="bg-slate-900 text-slate-50 border border-slate-700 rounded px-3 py-2 text-xs space-y-1">
                        <div className="font-semibold">{row.bucket}</div>
                        <div className="font-mono-num">Orders: {formatNumber(row.orders)}</div>
                        <div className="font-mono-num">Avg Rating: {row.avgRating.toFixed(2)} / 5.0</div>
                        <div className="font-mono-num">Return Rate: {formatPct(row.returnRatePct)}</div>
                      </div>
                    );
                  }}
                />
                <Bar yAxisId="ret" dataKey="returnRatePct" fill="#DC2626" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Line yAxisId="rat" type="monotone" dataKey="avgRating" stroke="#2563EB" strokeWidth={2} dot={{ r: 3, fill: '#2563EB' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Top SKUs + Validation Health + Live AI Executive Briefing */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Top 6 Revenue Products
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Highest-grossing SKUs in the active filter slice
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('ledger')}
              className="text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Open Ledger <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 text-left font-medium">Product</th>
                  <th className="py-2 text-left font-medium">Category</th>
                  <th className="py-2 text-right font-medium">Orders</th>
                  <th className="py-2 text-right font-medium">Revenue</th>
                  <th className="py-2 text-right font-medium">Return %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topProducts.slice(0, 6).map((p) => (
                  <tr key={`${p.category}-${p.productName}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 text-left font-medium text-slate-900 dark:text-slate-100">
                      {p.productName}
                    </td>
                    <td className="py-2 text-left text-slate-500 dark:text-slate-400">{p.category}</td>
                    <td className="py-2 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {formatNumber(p.orders)}
                    </td>
                    <td className="py-2 text-right font-mono-num font-medium text-slate-900 dark:text-slate-100">
                      {formatINR(p.revenue, 0)}
                    </td>
                    <td className="py-2 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {formatPct(p.returnRatePct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                AI Executive Dashboard Brief
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                On-demand Gemini 4 Hydrogen synthesis of the active dashboard slice
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFetchBrief}
                disabled={briefLoading}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded cursor-pointer disabled:opacity-50"
              >
                {briefLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {aiBrief ? 'Refresh Brief' : 'Summarize Dashboard'}
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('ai')}
                className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Full AI Copilot
              </button>
            </div>
          </div>

          {briefError && (
            <div className="flex items-start gap-2 p-2.5 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{briefError}</span>
            </div>
          )}

          {aiBrief ? (
            <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded p-3 max-h-44 overflow-y-auto">
              {aiBrief}
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded p-3 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Data Validation Verified ({formatNumber(audit.totalRecords)} records • {audit.missingValuesCount} missing • {audit.revenueFormulaMismatches} formula errors)
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Cross-filter any Month, Category, City, or Customer Segment chart above, then click <strong className="text-slate-800 dark:text-slate-200">Summarize Dashboard</strong> to generate a grounded executive narrative for Somya Verma&apos;s BI lab submission.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
