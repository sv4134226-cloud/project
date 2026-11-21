import { RotateCcw } from 'lucide-react';
import {
  DEFAULT_FILTERS,
  type CohortFilter,
  type FilterState,
  type MonthFilter,
  type QuarterFilter,
  type SegmentFilter,
} from '../lib/analytics';

interface FilterBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  categories: string[];
  cities: string[];
  matchedCount: number;
  totalCount: number;
}

const MONTHS: Array<{ value: MonthFilter; label: string }> = [
  { value: 'All', label: 'All Months' },
  { value: 'Jan', label: 'Jan 2024 (Q1)' },
  { value: 'Feb', label: 'Feb 2024 (Q1)' },
  { value: 'Mar', label: 'Mar 2024 (Q1)' },
  { value: 'Apr', label: 'Apr 2024 (Q2)' },
  { value: 'May', label: 'May 2024 (Q2)' },
  { value: 'Jun', label: 'Jun 2024 (Q2)' },
  { value: 'Jul', label: 'Jul 2024 (Q3)' },
  { value: 'Aug', label: 'Aug 2024 (Q3)' },
  { value: 'Sep', label: 'Sep 2024 (Q3)' },
];

export function FilterBar({
  filters,
  onChange,
  categories,
  cities,
  matchedCount,
  totalCount,
}: FilterBarProps) {
  const isModified =
    filters.quarter !== 'All' ||
    filters.month !== 'All' ||
    filters.category !== 'All' ||
    filters.city !== 'All' ||
    filters.segment !== 'All' ||
    filters.cohort !== 'All' ||
    filters.returnFlag !== 'All' ||
    filters.repeatPurchase !== 'All' ||
    filters.search !== '';

  const selectClass =
    'h-8 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500';

  return (
    <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-quarter" className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Quarter
          </label>
          <select
            id="filter-quarter"
            value={filters.quarter}
            onChange={(e) =>
              onChange({ ...filters, quarter: e.target.value as QuarterFilter, month: 'All' })
            }
            className={selectClass}
          >
            <option value="All">All (Q1–Q3)</option>
            <option value="Q1">Q1 (Jan–Mar)</option>
            <option value="Q2">Q2 (Apr–Jun)</option>
            <option value="Q3">Q3 (Jul–Sep)</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-month" className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Month
          </label>
          <select
            id="filter-month"
            value={filters.month}
            onChange={(e) =>
              onChange({ ...filters, month: e.target.value as MonthFilter })
            }
            className={selectClass}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-category" className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className={selectClass}
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-city" className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            City
          </label>
          <select
            id="filter-city"
            value={filters.city}
            onChange={(e) => onChange({ ...filters, city: e.target.value })}
            className={selectClass}
          >
            <option value="All">All 8 Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-segment" className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Segment
          </label>
          <select
            id="filter-segment"
            value={filters.segment}
            onChange={(e) => onChange({ ...filters, segment: e.target.value as SegmentFilter })}
            className={selectClass}
          >
            <option value="All">All Segments</option>
            <option value="Premium">Premium</option>
            <option value="Mid-Tier">Mid-Tier</option>
            <option value="Budget">Budget</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-cohort" className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Dataset Cohort
          </label>
          <select
            id="filter-cohort"
            value={filters.cohort}
            onChange={(e) => onChange({ ...filters, cohort: e.target.value as CohortFilter })}
            className={selectClass}
          >
            <option value="All">Combined (1,200)</option>
            <option value="Original_330">Original (330 rows)</option>
            <option value="Synthetic_870">Synthetic Expansion (870 rows)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-600 dark:text-slate-400 font-mono-num">
          {matchedCount.toLocaleString('en-IN')} / {totalCount.toLocaleString('en-IN')} rows
        </span>
        {isModified && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
