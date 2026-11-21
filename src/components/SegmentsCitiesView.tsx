import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsSummary, SegmentFilter } from '../lib/analytics';
import { formatCompactINR, formatINR, formatNumber, formatPct } from '../lib/format';

interface SegmentsCitiesViewProps {
  analytics: AnalyticsSummary;
  activeSegment: SegmentFilter;
  activeCity: string;
  onSelectSegment: (segment: SegmentFilter) => void;
  onSelectCity: (city: string) => void;
}

export function SegmentsCitiesView({
  analytics,
  activeSegment,
  activeCity,
  onSelectSegment,
  onSelectCity,
}: SegmentsCitiesViewProps) {
  const { segments, cities } = analytics;

  return (
    <div className="space-y-4">
      {/* Customer Segments */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Customer Segment Performance (Premium, Mid-Tier, Budget)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any segment row to filter the dashboard to that customer tier
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 text-left font-medium">Segment</th>
                  <th className="py-2 text-right font-medium">Orders</th>
                  <th className="py-2 text-right font-medium">Revenue</th>
                  <th className="py-2 text-right font-medium">Share</th>
                  <th className="py-2 text-right font-medium">AOV</th>
                  <th className="py-2 text-right font-medium">Repeat %</th>
                  <th className="py-2 text-right font-medium">Return %</th>
                  <th className="py-2 text-right font-medium">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {segments.map((s) => {
                  const isSelected = activeSegment === s.name;
                  return (
                    <tr
                      key={s.name}
                      onClick={() =>
                        onSelectSegment(
                          isSelected ? 'All' : (s.name as SegmentFilter)
                        )
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                        {s.name}
                      </td>
                      <td className="py-3 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatNumber(s.orders)}
                      </td>
                      <td className="py-3 text-right font-mono-num font-medium text-slate-900 dark:text-slate-100">
                        {formatINR(s.revenue, 0)}
                      </td>
                      <td className="py-3 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatPct(s.revenueSharePct)}
                      </td>
                      <td className="py-3 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatINR(s.aov, 0)}
                      </td>
                      <td className="py-3 text-right font-mono-num text-emerald-700 dark:text-emerald-400 font-medium">
                        {formatPct(s.repeatRatePct)}
                      </td>
                      <td className="py-3 text-right font-mono-num text-amber-700 dark:text-amber-400">
                        {formatPct(s.returnRatePct)}
                      </td>
                      <td className="py-3 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {s.avgRating.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Segment Repeat vs Return Behavior (%)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparing loyalty (Repeat_Purchase) against churn friction (Return_Flag)
            </p>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segments} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.65} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
                <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0].payload as (typeof segments)[number];
                    return (
                      <div className="bg-slate-900 text-slate-50 border border-slate-700 rounded px-3 py-2 text-xs space-y-1">
                        <div className="font-semibold">{row.name}</div>
                        <div className="font-mono-num">Repeat Purchase: {formatPct(row.repeatRatePct)}</div>
                        <div className="font-mono-num">Return Rate: {formatPct(row.returnRatePct)}</div>
                        <div className="font-mono-num">AOV: {formatINR(row.aov, 0)}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="repeatRatePct" name="Repeat %" fill="#16A34A" radius={[3, 3, 0, 0]} maxBarSize={32} />
                <Bar dataKey="returnRatePct" name="Return %" fill="#DC2626" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* City Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Revenue Across 8 Metro Cities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total order value ranked by city contribution
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cities} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
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
                  width={84}
                  tick={{ fontSize: 12, fill: '#475569' }}
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
                        <div className="font-mono-num">Revenue: {formatINR(row.revenue, 2)}</div>
                        <div className="font-mono-num">Orders: {formatNumber(row.orders)} • AOV: {formatINR(row.aov, 0)}</div>
                        <div className="font-mono-num">Delivery: {row.avgDeliveryDays.toFixed(2)}d • Rating: {row.avgRating.toFixed(2)}</div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#2563EB"
                  radius={[0, 3, 3, 0]}
                  barSize={20}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    if (entry && typeof entry.name === 'string') {
                      onSelectCity(activeCity === entry.name ? 'All' : entry.name);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              City Performance & Logistics Scorecard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click a city row to isolate regional revenue, delivery speed, and return behavior
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 text-left font-medium">City</th>
                  <th className="py-2 text-right font-medium">Orders</th>
                  <th className="py-2 text-right font-medium">Revenue</th>
                  <th className="py-2 text-right font-medium">Share</th>
                  <th className="py-2 text-right font-medium">AOV</th>
                  <th className="py-2 text-right font-medium">Delivery</th>
                  <th className="py-2 text-right font-medium">Rating</th>
                  <th className="py-2 text-right font-medium">Return %</th>
                  <th className="py-2 text-right font-medium">Repeat %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cities.map((c) => {
                  const isSelected = activeCity === c.name;
                  return (
                    <tr
                      key={c.name}
                      onClick={() => onSelectCity(isSelected ? 'All' : c.name)}
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
                      <td className="py-2.5 text-right font-mono-num font-medium text-slate-900 dark:text-slate-100">
                        {formatCompactINR(c.revenue)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatPct(c.revenueSharePct)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {formatINR(c.aov, 0)}
                      </td>
                      <td className="py-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                        {c.avgDeliveryDays.toFixed(2)}d
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
                      <td className="py-2.5 text-right font-mono-num text-emerald-700 dark:text-emerald-400">
                        {formatPct(c.repeatRatePct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
