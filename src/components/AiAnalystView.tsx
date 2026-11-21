import { useState } from 'react';
import { AlertCircle, Download, FileText, Loader2, Printer, Send, Sparkles } from 'lucide-react';
import type { AnalyticsSummary, FilterState } from '../lib/analytics';
import { formatCompactINR, formatNumber } from '../lib/format';

export interface StructuredBiReport {
  reportTitle: string;
  executiveSummary: string;
  dataValidationVerdict: string;
  keyFindings: Array<{
    dimension: string;
    headline: string;
    metricEvidence: string;
    businessImplication: string;
  }>;
  anomaliesAndRisks: Array<{
    riskTitle: string;
    severity: string;
    evidence: string;
  }>;
  strategicRecommendations: Array<{
    action: string;
    targetArea: string;
    expectedImpact: string;
    priority: string;
  }>;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface AiAnalystViewProps {
  filters: FilterState;
  analytics: AnalyticsSummary;
  report: StructuredBiReport | null;
  reportLoading: boolean;
  reportError: string | null;
  onGenerateReport: (focus?: string) => void;
}

const SUGGESTED_QUESTIONS = [
  'Summarize Q1–Q3 monthly revenue trajectory and explain what drove the September peak.',
  'Compare Premium, Mid-Tier, and Budget segments across AOV, repeat purchase rate, and returns.',
  'Does slower delivery reduce customer ratings or increase return rates? Cite exact evidence.',
  'Which cities and product categories represent the highest return risk and revenue leakage?',
  'Explain the data validation findings, including the Original 330 vs Synthetic 870 cohorts.',
];

function renderInlineBold(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function FormattedProse({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return <div key={i} className="h-1" />;
        if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
          const clean = line.replace(/^#{1,3}\s+/, '');
          return (
            <h4 key={i} className="pt-2 text-xs font-semibold text-slate-900 dark:text-slate-50">
              {clean}
            </h4>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-600 shrink-0" />
              <span>{renderInlineBold(line.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInlineBold(line)}</p>;
      })}
    </div>
  );
}

export function AiAnalystView({
  filters,
  analytics,
  report,
  reportLoading,
  reportError,
  onGenerateReport,
}: AiAnalystViewProps) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [focusInput, setFocusInput] = useState('');

  const submitQuestion = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || askLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(nextMessages);
    setQuestion('');
    setAskError(null);
    setAskLoading(true);

    try {
      const res = await fetch('/api/analyze/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          filters,
          history: messages,
        }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok || !data.answer) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }
      setMessages([...nextMessages, { role: 'model', text: data.answer }]);
    } catch (err) {
      setAskError(err instanceof Error ? err.message : 'Unable to reach AI analyst endpoint.');
    } finally {
      setAskLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const md = [
      `# ${report.reportTitle}`,
      `**Prepared For:** Somya Verma — College Lab Assignment ("AI-Powered Business Data Analysis Using UrbanMart Dataset")`,
      `**Active Scope:** ${formatNumber(analytics.kpis.orderCount)} transactions • ${formatCompactINR(analytics.kpis.totalRevenue)} gross revenue`,
      '',
      '## 1. Executive Summary',
      report.executiveSummary,
      '',
      '## 2. Data Validation & Quality Verdict',
      report.dataValidationVerdict,
      '',
      '## 3. Key Business Findings',
      ...report.keyFindings.map(
        (f, idx) =>
          `### ${idx + 1}. ${f.dimension}: ${f.headline}\n- **Metric Evidence:** ${f.metricEvidence}\n- **Business Implication:** ${f.businessImplication}`
      ),
      '',
      '## 4. Anomalies & Operational Risks',
      ...report.anomaliesAndRisks.map(
        (r) => `- **[${r.severity}] ${r.riskTitle}:** ${r.evidence}`
      ),
      '',
      '## 5. Strategic Recommendations',
      ...report.strategicRecommendations.map(
        (rec, idx) =>
          `${idx + 1}. **[${rec.priority} — ${rec.targetArea}] ${rec.action}** — Expected Impact: ${rec.expectedImpact}`
      ),
    ].join('\n\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'UrbanMart_BI_Lab_Report_Somya_Verma.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      {/* Left: Conversational Analyst */}
      <div className="no-print xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-col justify-between min-h-[540px]">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                UrbanMart AI Analyst
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grounded in {formatNumber(analytics.kpis.orderCount)} active rows ({formatCompactINR(analytics.kpis.totalRevenue)})
              </p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setAskError(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assignment Prompts
            </p>
            <div className="space-y-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={askLoading}
                  onClick={() => submitQuestion(q)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {messages.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`rounded p-3 border ${
                    m.role === 'user'
                      ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/60'
                  }`}
                >
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {m.role === 'user' ? 'Somya Verma' : 'BI Analyst Response'}
                  </div>
                  {m.role === 'user' ? (
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{m.text}</p>
                  ) : (
                    <FormattedProse text={m.text} />
                  )}
                </div>
              ))}
              {askLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  Analyzing active UrbanMart dataset metrics...
                </div>
              )}
            </div>
          )}

          {askError && (
            <div className="flex items-start gap-2 p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{askError}</span>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuestion(question);
          }}
          className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask any question about UrbanMart metrics..."
            className="flex-1 h-9 px-3 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            disabled={askLoading || !question.trim()}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-40 cursor-pointer transition-colors shrink-0"
          >
            {askLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Ask
          </button>
        </form>
      </div>

      {/* Right: Executive Lab Report Generator */}
      <div className="xl:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-4">
        <div className="no-print flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Executive BI Lab Report (Somya Verma)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synthesizes validated metrics, anomalies, and business recommendations for submission
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {report && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export .MD
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </>
            )}
          </div>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={focusInput}
            onChange={(e) => setFocusInput(e.target.value)}
            placeholder="Optional report focus (e.g., Q3 Electronics growth & Mumbai return mitigation)"
            className="flex-1 min-w-[220px] h-9 px-3 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
          <button
            type="button"
            disabled={reportLoading}
            onClick={() => onGenerateReport(focusInput)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded disabled:opacity-40 cursor-pointer transition-colors shrink-0"
          >
            {reportLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {report ? 'Regenerate Report' : 'Generate Executive Report'}
          </button>
        </div>

        {reportError && (
          <div className="flex items-start gap-2 p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{reportError}</span>
          </div>
        )}

        {reportLoading && !report && (
          <div className="space-y-3 py-6">
            <div className="h-5 w-2/3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-16 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-24 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        )}

        {!report && !reportLoading && !reportError && (
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-md p-8 text-center space-y-2">
            <FileText className="w-7 h-7 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Ready to Compile Lab Assignment Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Generate a structured executive summary, validation verdict, dimensional findings, risk register, and strategic roadmap tailored for Somya Verma&apos;s UrbanMart assignment.
            </p>
          </div>
        )}

        {report && (
          <div className="space-y-4 text-xs">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-mono-num uppercase tracking-wider text-blue-700 dark:text-blue-400 font-medium">
                Somya Verma • Business Intelligence Lab Report
              </div>
              <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">
                {report.reportTitle}
              </h3>
              <p className="mt-2 leading-relaxed text-slate-700 dark:text-slate-300">
                {report.executiveSummary}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Data Validation Verdict
              </div>
              <p className="mt-1 leading-relaxed text-slate-800 dark:text-slate-200">
                {report.dataValidationVerdict}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Dimensional Findings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {report.keyFindings.map((finding, i) => (
                  <div
                    key={i}
                    className="border border-slate-200 dark:border-slate-800 rounded p-3 space-y-1"
                  >
                    <div className="text-[11px] font-mono-num uppercase text-blue-700 dark:text-blue-400 font-medium">
                      {finding.dimension}
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {finding.headline}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-mono-num">
                      {finding.metricEvidence}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 pt-0.5">
                      {finding.businessImplication}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Anomalies &amp; Operational Risks
              </h4>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded">
                {report.anomaliesAndRisks.map((risk, i) => (
                  <div key={i} className="p-2.5 flex flex-wrap items-baseline justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {risk.riskTitle}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">{risk.evidence}</div>
                    </div>
                    <span className="font-mono-num text-[11px] font-medium px-1.5 py-0.5 border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded">
                      {risk.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Strategic Recommendations
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2 px-2.5 text-left font-medium">Priority</th>
                      <th className="py-2 px-2.5 text-left font-medium">Area</th>
                      <th className="py-2 px-2.5 text-left font-medium">Recommended Action</th>
                      <th className="py-2 px-2.5 text-left font-medium">Expected Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.strategicRecommendations.map((rec, i) => (
                      <tr key={i}>
                        <td className="py-2 px-2.5 font-mono-num font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                          {rec.priority}
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {rec.targetArea}
                        </td>
                        <td className="py-2 px-2.5 font-medium text-slate-900 dark:text-slate-100">
                          {rec.action}
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 dark:text-slate-400">
                          {rec.expectedImpact}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
