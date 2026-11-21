import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  Database,
  LayoutDashboard,
  MapPin,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import rawDataset from './data/urbanmart.json';
import {
  computeAnalytics,
  computeValidationAudit,
  DEFAULT_FILTERS,
  filterRecords,
  type FilterState,
  type UrbanMartRecord,
} from './lib/analytics';
import { KpiStrip } from './components/KpiStrip';
import { FilterBar } from './components/FilterBar';
import { DashboardView } from './components/DashboardView';
import { OverviewView } from './components/OverviewView';
import { SegmentsCitiesView } from './components/SegmentsCitiesView';
import { LogisticsAuditView } from './components/LogisticsAuditView';
import { AiAnalystView, type StructuredBiReport } from './components/AiAnalystView';
import { LedgerView } from './components/LedgerView';

type TabId = 'dashboard' | 'overview' | 'segments' | 'logistics' | 'ai' | 'ledger';

const NAV_ITEMS: Array<{ id: TabId; label: string; icon: typeof BarChart3 }> = [
  { id: 'dashboard', label: 'BI Dashboard', icon: LayoutDashboard },
  { id: 'overview', label: 'Revenue & SKUs', icon: BarChart3 },
  { id: 'segments', label: 'Segments & Cities', icon: MapPin },
  { id: 'logistics', label: 'Logistics & Audit', icon: ShieldCheck },
  { id: 'ai', label: 'AI Business Analyst', icon: Bot },
  { id: 'ledger', label: 'Transaction Ledger', icon: Database },
];

const allRecords = rawDataset as UrbanMartRecord[];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [report, setReport] = useState<StructuredBiReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  const categories = useMemo(
    () => Array.from(new Set(allRecords.map((r) => r.productCategory))).sort(),
    []
  );
  const cities = useMemo(
    () => Array.from(new Set(allRecords.map((r) => r.city))).sort(),
    []
  );

  const filteredRecords = useMemo(
    () => filterRecords(allRecords, filters),
    [filters]
  );

  const analytics = useMemo(
    () => computeAnalytics(filteredRecords),
    [filteredRecords]
  );

  const validationAudit = useMemo(
    () => computeValidationAudit(allRecords),
    []
  );

  const handleGenerateReport = async (focus?: string) => {
    setActiveTab('ai');
    setReportLoading(true);
    setReportError(null);
    try {
      const res = await fetch('/api/analyze/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focus: focus?.trim() || undefined,
          filters,
        }),
      });
      const data = (await res.json()) as {
        report?: StructuredBiReport;
        error?: string;
      };
      if (!res.ok || !data.report) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }
      setReport(data.report);
    } catch (err) {
      setReportError(
        err instanceof Error ? err.message : 'Failed to generate AI executive report.'
      );
    } finally {
      setReportLoading(false);
    }
  };

  const currentNavLabel =
    NAV_ITEMS.find((item) => item.id === activeTab)?.label ?? 'Executive Overview';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/50 z-30 lg:hidden"
        />
      )}

      {/* Left Workspace Sidebar */}
      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 whitespace-nowrap">
              <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
                UrbanMart BI
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-3 space-y-1" aria-label="Workspace Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1 text-xs">
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            Somya Verma
          </div>
          <div className="text-slate-500 dark:text-slate-400 leading-snug">
            College BI Lab Assignment
          </div>
          <div className="text-[11px] font-mono-num text-slate-500 dark:text-slate-400">
            01 Jan – 30 Sep 2024 • 1,200 rows
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract */}
        <header className="no-print h-14 px-4 lg:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded"
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
                UrbanMart Dataset
              </span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <h1 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                {currentNavLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Toggle color theme"
              className="h-8 w-8 inline-flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleGenerateReport()}
              disabled={reportLoading}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{reportLoading ? 'Generating...' : 'Generate AI Report'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto space-y-4">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            categories={categories}
            cities={cities}
            matchedCount={filteredRecords.length}
            totalCount={allRecords.length}
          />

          <KpiStrip analytics={analytics} />

          {activeTab === 'dashboard' && (
            <DashboardView
              analytics={analytics}
              audit={validationAudit}
              filters={filters}
              onUpdateFilters={setFilters}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewView
              analytics={analytics}
              activeCategory={filters.category}
              onSelectCategory={(cat) => setFilters({ ...filters, category: cat })}
            />
          )}

          {activeTab === 'segments' && (
            <SegmentsCitiesView
              analytics={analytics}
              activeSegment={filters.segment}
              activeCity={filters.city}
              onSelectSegment={(seg) => setFilters({ ...filters, segment: seg })}
              onSelectCity={(city) => setFilters({ ...filters, city })}
            />
          )}

          {activeTab === 'logistics' && (
            <LogisticsAuditView analytics={analytics} audit={validationAudit} />
          )}

          {activeTab === 'ai' && (
            <AiAnalystView
              filters={filters}
              analytics={analytics}
              report={report}
              reportLoading={reportLoading}
              reportError={reportError}
              onGenerateReport={handleGenerateReport}
            />
          )}

          {activeTab === 'ledger' && (
            <LedgerView
              records={filteredRecords}
              filters={filters}
              onChangeFilters={setFilters}
            />
          )}
        </main>
      </div>
    </div>
  );
}
