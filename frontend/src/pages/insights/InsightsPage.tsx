import { Award, BarChart3, Layers, Sparkles, AlertTriangle } from 'lucide-react';

// All content on this page is static - it describes facts about how the
// model was trained, which don't change per request, unlike Dashboard/Stats
// which reflect live transaction data.

const MODEL_COMPARISON = [
  {
    name: 'Logistic Regression (baseline)',
    imbalanceHandling: 'None (deliberately)',
    recall: 0.61,
    precision: 0.91,
    prAuc: 0.786,
    isFinal: false,
  },
  {
    name: 'XGBoost',
    imbalanceHandling: 'scale_pos_weight (36.53)',
    recall: 0.999,
    precision: 0.998,
    prAuc: 0.999,
    isFinal: true,
  },
];

const ENGINEERED_FEATURES = [
  {
    num: 1,
    name: 'errorBalanceOrig',
    formula: 'oldBalanceOrg - amount - newBalanceOrg',
    description:
      "Balance discrepancy flag. See the limitation note below on why this signal's direction is counterintuitive.",
  },
  {
    num: 2,
    name: 'errorBalanceDest',
    formula: 'oldBalanceDest + amount - newBalanceDest',
    description: 'Same idea applied to the destination account.',
  },
  {
    num: 3,
    name: 'origDrainedToZero',
    formula: 'newBalanceOrg == 0 and oldBalanceOrg > 0',
    description: 'Classic account-draining pattern - present in 97.55% of fraud cases in EDA.',
  },
  {
    num: 4,
    name: 'logAmount',
    formula: 'log1p(amount)',
    description: 'Corrects the heavy right-skew in transaction amounts found in EDA.',
  },
  {
    num: 5,
    name: 'amountToBalanceRatio',
    formula: 'amount / (oldBalanceOrg + 1)',
    description: 'How much of an account was moved in one transaction.',
  },
  {
    num: 6,
    name: 'hourSin & hourCos',
    formula: 'sin/cos(2π × (step % 24) / 24)',
    description: 'Cyclical hour-of-day encoding, so hour 23 and hour 0 are treated as adjacent.',
  },
  {
    num: 7,
    name: 'type_* (one-hot)',
    formula: 'One-hot encoding of transaction type',
    description: 'Only 5 categories; fraud concentrates in TRANSFER and CASH_OUT specifically.',
  },
  {
    num: 8,
    name: 'origFrequency & destFrequency',
    formula: 'Frequency-encoded nameOrig / nameDest',
    description:
      'Too high-cardinality to one-hot; how often an account appears is informative on its own.',
  },
];

export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Award className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Model Insights & Evaluation
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          How the fraud detection model was built, evaluated, and its known limitations.
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50/60 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
          <AlertTriangle className="h-4 w-4" />
          Known Limitation: Likely Simulation Artifact
        </div>
        <p className="text-xs leading-relaxed text-slate-700">
          The model's near-perfect benchmark performance (PR-AUC 0.999) is very likely inflated by a
          known artifact of how the PaySim dataset simulates fraud. Independent analyses have found
          that a single rule - the transaction amount exactly equaling the account's full balance -
          correctly identifies ~97.8% of fraud in this dataset, because PaySim's fraud-injection
          logic drains accounts with suspiciously exact arithmetic that legitimate transactions
          don't replicate as consistently.
        </p>
        <p className="text-xs leading-relaxed text-slate-700">
          This means the model likely learned a property of the <em>simulator</em>, not necessarily
          a pattern that generalises to real transaction data. Manual testing with hand-constructed
          edge cases supports this: a large ($50,000) transfer that did <strong>not</strong> drain
          the account was correctly scored low risk, confirming the model responds to the draining
          pattern specifically - but this should still be treated as an upper-bound result specific
          to this dataset, not a real-world performance claim.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-900">Model Comparison</h2>
          <p className="text-xs text-slate-500">
            Both models evaluated on the identical, stratified test set. PR-AUC is the primary
            metric, not accuracy - see below for why.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">Model</th>
                <th className="px-6 py-3 font-medium">Imbalance Handling</th>
                <th className="px-6 py-3 font-medium">Fraud Recall</th>
                <th className="px-6 py-3 font-medium">Fraud Precision</th>
                <th className="px-6 py-3 font-medium">PR-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODEL_COMPARISON.map((m) => (
                <tr
                  key={m.name}
                  className={m.isFinal ? 'bg-red-50/40 font-medium' : 'hover:bg-slate-50/50'}
                >
                  <td className="flex items-center gap-2 px-6 py-3.5">
                    {m.isFinal && (
                      <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        FINAL
                      </span>
                    )}
                    <span className="font-semibold text-slate-900">{m.name}</span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-700">{m.imbalanceHandling}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-700">{m.recall.toFixed(3)}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-700">{m.precision.toFixed(3)}</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-rose-600">
                    {m.prAuc.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
            <BarChart3 className="h-4 w-4" />
            Why Accuracy is Misleading
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            Fraud is 0.129% of transactions in this dataset. A model predicting "never fraud" scores
            99.87% accuracy while catching zero fraud - confirmed directly by our own baseline,
            which hit 99% accuracy but only 61% fraud recall.{' '}
            <span className="font-semibold text-slate-900">PR-AUC (Precision-Recall AUC)</span>{' '}
            evaluates minority-class performance without being inflated by overwhelming true
            negatives.
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-700">
            <Layers className="h-4 w-4" />
            Class Imbalance Handling
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-900">scale_pos_weight</span> (36.53) was used
            rather than resampling techniques like SMOTE, so the model trains on the real data
            distribution while being penalised proportionally for missing fraud, without generating
            synthetic data points.
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <Sparkles className="h-4 w-4" />
            Why SHAP, Not Raw Importance
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            Raw gain/gini feature importance is purely global and can't explain one specific
            prediction. <span className="font-semibold text-slate-900">SHAP's TreeExplainer</span>{' '}
            gives exact, fast per-transaction attributions - a real reason XGBoost was chosen over
            alternatives that would need slower, approximate explanation methods.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-semibold text-slate-900">Feature Engineering Pipeline</h2>
          <p className="text-xs text-slate-500">
            Implemented once in <span className="font-mono text-slate-700">preprocessing.py</span>,
            shared between training and the live API to prevent training/serving skew.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ENGINEERED_FEATURES.map((f) => (
            <div
              key={f.num}
              className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{f.name}</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  #{f.num}
                </span>
              </div>
              <p className="rounded border border-slate-200/60 bg-white p-1.5 font-mono text-[11px] text-purple-700">
                {f.formula}
              </p>
              <p className="text-[11px] text-slate-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
