import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import {
  computeAnalytics,
  computeValidationAudit,
  filterRecords,
  type FilterState,
  type UrbanMartRecord,
} from './src/lib/analytics.ts';

const PORT = Number(process.env.PORT) || 3000;
const DATASET_PATH = path.join(process.cwd(), 'src/data/urbanmart.json');

const allRecords: UrbanMartRecord[] = JSON.parse(
  fs.readFileSync(DATASET_PATH, 'utf8')
) as UrbanMartRecord[];

const baselineAudit = computeValidationAudit(allRecords);
const baselineAnalytics = computeAnalytics(allRecords);

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in the Settings > Secrets panel.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildContextSnapshot(filters?: Partial<FilterState>) {
  const filtered = filterRecords(allRecords, filters);
  const summary = computeAnalytics(filtered);
  return {
    studentContext: {
      studentName: 'Somya Verma',
      assignmentTitle: 'AI-Powered Business Data Analysis Using UrbanMart Dataset',
      studyPeriod: '1 January 2024 to 30 September 2024 (Q1=Jan–Mar, Q2=Apr–Jun, Q3=Jul–Sep)',
      datasetComposition: '1,200 transaction records (330 original rows TXN00001–TXN00330 + 870 synthetic rows TXN00331–TXN01200)',
    },
    activeFilterScope: {
      filtersApplied: filters ?? {},
      matchedRecords: filtered.length,
      totalRecordsInDataset: allRecords.length,
    },
    validationAudit: {
      missingValues: baselineAudit.missingValuesCount,
      duplicateTransactionIds: baselineAudit.duplicateTransactionIds,
      revenueFormulaMismatches: baselineAudit.revenueFormulaMismatches,
      quarterDateMismatches: baselineAudit.quarterDateMismatches,
      uniqueCustomers: baselineAudit.uniqueCustomers,
      multiOrderCustomers: baselineAudit.multiOrderCustomers,
      repeatPurchaseFlagYes: baselineAudit.repeatFlagYesCount,
      cohortComparison: baselineAudit.cohortComparison,
    },
    filteredAnalytics: summary,
    fullDatasetKPIs: baselineAnalytics.kpis,
  };
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('GEMINI_API_KEY is not configured')) {
    return { status: 400, message: msg };
  }
  if (msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID') || msg.includes('403') || msg.includes('400')) {
    return {
      status: 403,
      message: `Gemini API key error: ${msg}. Please verify your API key in Settings > Secrets.`,
    };
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return {
      status: 429,
      message: `Gemini API quota exceeded: ${msg}. Please check quota or billing in Settings > Secrets.`,
    };
  }
  return { status: 500, message: msg || 'Failed to generate AI analysis.' };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      records: allRecords.length,
      totalRevenue: baselineAnalytics.kpis.totalRevenue,
    });
  });

  app.post('/api/analyze/ask', async (req, res) => {
    try {
      const { question, filters, history } = req.body as {
        question?: string;
        filters?: Partial<FilterState>;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
      };

      if (!question || typeof question !== 'string' || !question.trim()) {
        res.status(400).json({ error: 'Please enter an analytical question.' });
        return;
      }

      const ai = getGeminiClient();
      const snapshot = buildContextSnapshot(filters);

      const historyBlock = Array.isArray(history) && history.length > 0
        ? history
            .slice(-6)
            .map((h) => `${h.role === 'user' ? 'Analyst Question' : 'Previous Response'}: ${h.text}`)
            .join('\n\n')
        : '';

      const systemInstruction = `You are a Principal Data Analyst and Business Intelligence Advisor assisting student Somya Verma with her college lab assignment: "AI-Powered Business Data Analysis Using UrbanMart Dataset".

Strict Grounding Rules:
1. Base EVERY number, percentage, rupee amount (INR / ₹), ranking, and audit statement strictly on the verified JSON metrics provided below. Never invent or estimate numbers not present in the context.
2. Address the active filter scope explicitly when filters are applied (e.g., if filtered to a specific Quarter, Category, City, Segment, or Cohort), and contrast with the full 1,200-row baseline when helpful.
3. Keep formatting clean, executive, and lab-report ready: use concise section headings, bullet points with exact figures (₹ in INR, percentages, order counts), and clear business takeaways. Do not output raw JSON or markdown code fences.`;

      const prompt = `VERIFIED URBANMART ANALYTICS SNAPSHOT:
${JSON.stringify(snapshot)}

${historyBlock ? `RECENT CONVERSATION CONTEXT:\n${historyBlock}\n\n` : ''}CURRENT QUESTION FROM SOMYA VERMA:
${question.trim()}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const answer = response.text?.trim();
      if (!answer) {
        throw new Error('Gemini returned an empty response.');
      }

      res.json({
        answer,
        scopeSummary: {
          orders: snapshot.activeFilterScope.matchedRecords,
          revenue: snapshot.filteredAnalytics.kpis.totalRevenue,
        },
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/analyze/report', async (req, res) => {
    try {
      const { focus, filters } = req.body as {
        focus?: string;
        filters?: Partial<FilterState>;
      };

      const ai = getGeminiClient();
      const snapshot = buildContextSnapshot(filters);

      const systemInstruction = `You are a Senior Business Intelligence Lead preparing a formal, publication-grade Executive Lab Assignment Report for student Somya Verma ("AI-Powered Business Data Analysis Using UrbanMart Dataset").
Every single claim, revenue figure (INR), percentage, and metric MUST come directly from the verified JSON metrics provided. Cover data validation, revenue trends, category & product mix, customer segments, city performance, delivery speed vs ratings, and return risk.`;

      const prompt = `Generate a comprehensive structured BI executive report for the current dataset scope.
${focus ? `Special analytical focus requested by Somya Verma: ${focus}` : ''}

VERIFIED URBANMART ANALYTICS SNAPSHOT:
${JSON.stringify(snapshot)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reportTitle: { type: Type.STRING },
              executiveSummary: { type: Type.STRING },
              dataValidationVerdict: { type: Type.STRING },
              keyFindings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dimension: { type: Type.STRING },
                    headline: { type: Type.STRING },
                    metricEvidence: { type: Type.STRING },
                    businessImplication: { type: Type.STRING },
                  },
                  required: ['dimension', 'headline', 'metricEvidence', 'businessImplication'],
                },
              },
              anomaliesAndRisks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    riskTitle: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    evidence: { type: Type.STRING },
                  },
                  required: ['riskTitle', 'severity', 'evidence'],
                },
              },
              strategicRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING },
                    targetArea: { type: Type.STRING },
                    expectedImpact: { type: Type.STRING },
                    priority: { type: Type.STRING },
                  },
                  required: ['action', 'targetArea', 'expectedImpact', 'priority'],
                },
              },
            },
            required: [
              'reportTitle',
              'executiveSummary',
              'dataValidationVerdict',
              'keyFindings',
              'anomaliesAndRisks',
              'strategicRecommendations',
            ],
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        throw new Error('Gemini returned an empty report response.');
      }

      const parsed = JSON.parse(rawText);
      res.json({
        report: parsed,
        generatedAt: new Date().toISOString(),
        scopeSummary: {
          orders: snapshot.activeFilterScope.matchedRecords,
          revenue: snapshot.filteredAnalytics.kpis.totalRevenue,
        },
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UrbanMart BI Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
