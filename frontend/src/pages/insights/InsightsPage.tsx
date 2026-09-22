import { useEffect, useState } from 'react';
import {
  Sparkles,
  Award,
  BarChart3,
  Layers,
} from 'lucide-react';
import { getModelInfo, type ModelInfoData, type ModelBenchmark } from '@/lib/api';

export default function InsightsPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInfo() {
      try {
        const data = await getModelInfo();
        setModelInfo(data);
      } catch (err) {
        console.error('Failed to load model info:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInfo();
  }, []);

  const benchmarks = modelInfo?.benchmarks || [];

  const engineeredFeatures = [
    {
      num: 1,
      name: 'errorBalanceOrig',
      formula: 'oldbalanceOrg - amount - newbalanceOrig',
      description:
        'Accounting discrepancy flag. When balance does not equal old minus amount, high fraud probability indicator.',
    },
    {
      num: 2,
      name: 'isZeroBalanceOrig',
      formula: 'newbalanceOrig == 0.0',
      description:
        'Binary draining flag. Captures attacks that completely drain victim accounts.',
    },
    {
      num: 3,
      name: 'log_amount',
      formula: 'log1p(amount)',
      description:
        'Handles extreme right-skewed heavy tail distribution of transaction values.',
    },
    {
      num: 4,
      name: 'errorBalanceDest',
      formula: 'oldbalanceDest + amount - newbalanceDest',
      description:
        'Destination discrepancy flag. Flags when receiving account does not reflect full transferred sum.',
    },
    {
      num: 5,
      name: 'drain_ratio',
      formula: 'amount / (oldbalanceOrg + 1)',
      description:
        'Fraction of origin balance drained in a single transaction. Extreme values indicate takeover.',
    },
    {
      num: 6,
      name: 'step_sin & step_cos',
      formula: 'sin/cos(2 * pi * (step % 24) / 24)',
      description:
        'Cyclical 24-hour periodic encoding capturing anomalous nocturnal attack patterns.',
    },
    {
      num: 7,
      name: 'nameOrig_freq & nameDest_freq',
      formula: 'Frequency / total transaction ratio',
      description:
        'High-cardinality entity encoding. Distinguishes high-volume accounts from single-use burner accounts.',
    },
    {
      num: 8,
      name: 'orig_tx_count & orig_avg_amount',
      formula: 'Historical expanding window aggregations',
      description:
        'Behavioral baseline. Compares current transaction amount against historical user average.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Award className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Model Insights & Evaluation Benchmark
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Model performance comparison across class imbalance strategies, PR-AUC evaluation, and TreeSHAP attribution theory.
        </p>
      </div>

      {/* Model Benchmark Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Candidate Model Comparison Matrix
          </h2>
          <p className="text-xs text-slate-500">
            Benchmarked against test partition with PR-AUC as the primary optimization metric.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">Model Candidate</th>
                <th className="px-6 py-3 font-medium">Imbalance Handling</th>
                <th className="px-6 py-3 font-medium">PR-AUC (Primary)</th>
                <th className="px-6 py-3 font-medium">ROC-AUC</th>
                <th className="px-6 py-3 font-medium">F1 Score (Fraud)</th>
                <th className="px-6 py-3 font-medium">Precision</th>
                <th className="px-6 py-3 font-medium">Recall</th>
                <th className="px-6 py-3 font-medium">Confusion Matrix [TN, FP / FN, TP]</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Loading benchmark metrics...
                  </td>
                </tr>
              ) : (
                benchmarks.map((bm: ModelBenchmark, idx: number) => {
                  const isSelected = bm.model_name === 'XGBoost';
                  return (
                    <tr
                      key={idx}
                      className={isSelected ? 'bg-red-50/40 font-medium' : 'hover:bg-slate-50/50'}
                    >
                      <td className="px-6 py-3.5 flex items-center gap-2">
                        {isSelected && (
                          <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            FINAL
                          </span>
                        )}
                        <span className="font-semibold text-slate-900">{bm.model_name}</span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">{bm.imbalance_strategy}</td>
                      <td className="px-6 py-3.5 font-mono font-bold text-rose-600">
                        {bm.pr_auc?.toFixed(4)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-700">
                        {bm.roc_auc?.toFixed(4)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-700">{bm.f1?.toFixed(4)}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-700">
                        {bm.precision?.toFixed(4)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-700">
                        {bm.recall?.toFixed(4)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-500">
                        [{bm.confusion_matrix?.[0]?.[0]}, {bm.confusion_matrix?.[0]?.[1]} /{' '}
                        {bm.confusion_matrix?.[1]?.[0]}, {bm.confusion_matrix?.[1]?.[1]}]
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Viva Defense Guide Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
            <BarChart3 className="h-4 w-4" />
            Why Accuracy is Misleading
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            In PaySim, only ~0.13% of transactions are fraud. A trivial dummy model predicting 100% legitimate achieves 99.87% accuracy while catching zero fraud. <span className="font-semibold text-slate-900">PR-AUC (Precision-Recall AUC)</span> evaluates minority class performance without being inflated by overwhelming true negatives.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
            <Layers className="h-4 w-4" />
            Class Imbalance Handling
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            We evaluated both <span className="font-semibold text-slate-900">class_weight='balanced'</span> and <span className="font-semibold text-slate-900">SMOTE (Synthetic Minority Over-sampling Technique)</span>. XGBoost paired with scale_pos_weight optimizes loss penalization directly without generating synthetic artifacts in high-cardinality space.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
            <Sparkles className="h-4 w-4" />
            TreeSHAP vs Raw Importance
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Raw Gini/gain feature importance is purely global and suffers from attribution bias. <span className="font-semibold text-slate-900">TreeSHAP</span> satisfies efficiency, symmetry, and monotonicity axioms, providing exact local log-odds attributions for each specific transaction.
          </p>
        </div>
      </div>

      {/* 8 Feature Engineering Techniques Grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Implemented Feature Engineering Pipeline (8 Techniques)
          </h2>
          <p className="text-xs text-slate-500">
            Domain-specific transforms implemented in <span className="font-mono text-slate-700">preprocessing.py</span>.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {engineeredFeatures.map((f) => (
            <div
              key={f.num}
              className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{f.name}</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  #{f.num}
                </span>
              </div>
              <p className="font-mono text-[11px] text-purple-700 bg-white p-1.5 rounded border border-slate-200/60">
                {f.formula}
              </p>
              <p className="text-slate-600 text-[11px]">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
