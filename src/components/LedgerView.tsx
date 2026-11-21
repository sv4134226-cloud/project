import { useMemo, useState } from 'react';
import { ArrowDownUp, Download, Search } from 'lucide-react';
import {
  isOriginalCohort,
  parseDateTimestamp,
  type FilterState,
  type FlagFilter,
  type UrbanMartRecord,
} from '../lib/analytics';
import { formatINR, formatNumber } from '../lib/format';

interface LedgerViewProps {
  records: UrbanMartRecord[];
  filters: FilterState;
  onChangeFilters: (next: FilterState) => void;
}

type SortKey = 'transactionId' | 'date' | 'quantity' | 'unitPrice' | 'revenue' | 'deliveryDays' | 'customerRating';

export function LedgerView({ records, filters, onChangeFilters }: LedgerViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('transactionId');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const sorted = useMemo(() => {
    const copy = [...records];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') {
        cmp = parseDateTimestamp(a.date) - parseDateTimestamp(b.date);
      } else if (sortKey === 'transactionId') {
        cmp = a.transactionId.localeCompare(b.transactionId);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [records, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'transactionId' || key === 'date');
    }
    setPage(1);
  };

  const handleExportCsv = () => {
    const header = [
      'Transaction_ID',
      'Customer_ID',
      'Date',
      'Quarter',
      'Product_Category',
      'Product_Name',
      'Quantity',
      'Unit_Price_(INR)',
      'Revenue_(INR)',
      'City',
      'Customer_Segment',
      'Delivery_Days',
      'Customer_Rating',
      'Return_Flag',
      'Repeat_Purchase',
      'Cohort',
    ];
    const escapeCsv = (val: string | number) => {
      const s = String(val);
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      header.join(','),
      ...sorted.map((r) =>
        [
          r.transactionId,
          r.customerId,
          r.date,
          r.quarter,
          r.productCategory,
          r.productName,
          r.quantity,
          r.unitPrice,
          r.revenue,
          r.city,
          r.customerSegment,
          r.deliveryDays,
          r.customerRating,
          r.returnFlag,
          r.repeatPurchase,
          isOriginalCohort(r) ? 'Original_330' : 'Synthetic_870',
        ]
          .map(escapeCsv)
          .join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `urbanmart_filtered_${sorted.length}_rows.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Transaction Data Ledger ({formatNumber(sorted.length)} matched records)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Complete line-item ledger extracted from the 106-page UrbanMart PDF dataset
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                onChangeFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
              placeholder="Search TXN, Customer, Product..."
              className="h-8 pl-8 pr-3 text-xs w-56 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            aria-label="Filter by Return Flag"
            value={filters.returnFlag}
            onChange={(e) => {
              onChangeFilters({ ...filters, returnFlag: e.target.value as FlagFilter });
              setPage(1);
            }}
            className="h-8 px-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
          >
            <option value="All">Return: All</option>
            <option value="Yes">Returned Only</option>
            <option value="No">Non-Returned</option>
          </select>

          <select
            aria-label="Filter by Repeat Purchase"
            value={filters.repeatPurchase}
            onChange={(e) => {
              onChangeFilters({ ...filters, repeatPurchase: e.target.value as FlagFilter });
              setPage(1);
            }}
            className="h-8 px-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
          >
            <option value="All">Repeat: All</option>
            <option value="Yes">Repeat: Yes</option>
            <option value="No">Repeat: No</option>
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={sorted.length === 0}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="py-2 px-2.5 text-left font-medium whitespace-nowrap">
                <button type="button" onClick={() => toggleSort('transactionId')} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                  TXN ID <ArrowDownUp className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2 px-2.5 text-left font-medium whitespace-nowrap">Customer</th>
              <th className="py-2 px-2.5 text-left font-medium whitespace-nowrap">
                <button type="button" onClick={() => toggleSort('date')} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                  Date <ArrowDownUp className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2 px-2.5 text-left font-medium">Category</th>
              <th className="py-2 px-2.5 text-left font-medium">Product</th>
              <th className="py-2 px-2.5 text-left font-medium">City</th>
              <th className="py-2 px-2.5 text-left font-medium">Segment</th>
              <th className="py-2 px-2.5 text-right font-medium whitespace-nowrap">
                <button type="button" onClick={() => toggleSort('quantity')} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                  Qty <ArrowDownUp className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2 px-2.5 text-right font-medium whitespace-nowrap">
                <button type="button" onClick={() => toggleSort('unitPrice')} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                  Unit Price <ArrowDownUp className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2 px-2.5 text-right font-medium whitespace-nowrap">
                <button type="button" onClick={() => toggleSort('revenue')} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                  Revenue <ArrowDownUp className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2 px-2.5 text-right font-medium whitespace-nowrap">
                <button type="button" onClick={() => toggleSort('deliveryDays')} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                  Days <ArrowDownUp className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2 px-2.5 text-right font-medium whitespace-nowrap">
                <button type="button" onClick={() => toggleSort('customerRating')} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                  Rating <ArrowDownUp className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2 px-2.5 text-center font-medium">Return</th>
              <th className="py-2 px-2.5 text-center font-medium">Repeat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  No transactions match your current filter criteria. Reset filters to inspect all 1,200 rows.
                </td>
              </tr>
            ) : (
              paged.map((r) => (
                <tr key={r.transactionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-2.5 font-mono-num font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {r.transactionId}
                  </td>
                  <td className="py-2 px-2.5 font-mono-num text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {r.customerId}
                  </td>
                  <td className="py-2 px-2.5 font-mono-num text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {r.date} <span className="text-slate-400">({r.quarter})</span>
                  </td>
                  <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {r.productCategory}
                  </td>
                  <td className="py-2 px-2.5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {r.productName}
                  </td>
                  <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {r.city}
                  </td>
                  <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {r.customerSegment}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {r.quantity}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {formatINR(r.unitPrice, 1)}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono-num font-medium text-slate-900 dark:text-slate-100">
                    {formatINR(r.revenue, 1)}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {r.deliveryDays.toFixed(1)}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {r.customerRating.toFixed(1)}
                  </td>
                  <td
                    className={`py-2 px-2.5 text-center font-mono-num font-medium ${
                      r.returnFlag === 'Yes'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {r.returnFlag}
                  </td>
                  <td
                    className={`py-2 px-2.5 text-center font-mono-num font-medium ${
                      r.repeatPurchase === 'Yes'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {r.repeatPurchase}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
        <span className="font-mono-num">
          Page {safePage} of {totalPages} • Showing {paged.length} of {formatNumber(sorted.length)} records
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage(1)}
            className="h-7 px-2.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            First
          </button>
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-7 px-2.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-7 px-2.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage(totalPages)}
            className="h-7 px-2.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
