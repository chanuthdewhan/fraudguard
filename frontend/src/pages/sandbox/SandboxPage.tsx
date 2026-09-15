import { useEffect, useState } from 'react';
import {
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { simulateScenario, type SimulationResponse } from '@/lib/api';

const DEFAULT_ORIGINAL = {
  step: 1,
  type: 'PAYMENT',
  amount: 25.0,
  nameOrig: 'C1231006815',
  oldbalanceOrg: 5000.0,
  newbalanceOrig: 4975.0,
  nameDest: 'M1979787155',
  oldbalanceDest: 0.0,
  newbalanceDest: 0.0,
};

export default function SandboxPage() {
  const [original] = useState(DEFAULT_ORIGINAL);
  const [modified, setModified] = useState({ ...DEFAULT_ORIGINAL });
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto drain origin balance helper
  const [autoDrain, setAutoDrain] = useState(false);

  useEffect(() => {
    let active = true;
    async function runSim() {
      setLoading(true);
      try {
        const res = await simulateScenario(original, modified);
        if (active) setResult(res);
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    const timer = setTimeout(runSim, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [original, modified]);

  function handleAmountChange(val: number) {
    setModified((prev) => {
      const next = { ...prev, amount: val };
      if (autoDrain) {
        next.oldbalanceOrg = val;
        next.newbalanceOrig = 0.0;
      } else {
        next.newbalanceOrig = Math.max(0, prev.oldbalanceOrg - val);
      }
      return next;
    });
  }

  function handleTypeChange(newType: 'PAYMENT' | 'TRANSFER' | 'CASH_OUT' | 'CASH_IN' | 'DEBIT') {
    setModified((prev) => ({
      ...prev,
      type: newType,
      nameDest: newType === 'PAYMENT' ? 'M1979787155' : 'C553264065',
    }));
  }

  function toggleAutoDrain(drain: boolean) {
    setAutoDrain(drain);
    if (drain) {
      setModified((prev) => ({
        ...prev,
        oldbalanceOrg: prev.amount,
        newbalanceOrig: 0.0,
      }));
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">What-If Risk Sandbox</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Adjust transaction parameters interactively to observe real-time score shifts and TreeSHAP attribution adjustments.
        </p>
      </div>

      {/* Grid: Form Controls & Live Score Comparison */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Controls Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">Adjust Transaction Parameters</h2>
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Quick Scenarios
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setAutoDrain(false);
                  setModified({ ...DEFAULT_ORIGINAL });
                }}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Reset Baseline (Payment $25)
              </button>
              <button
                onClick={() => {
                  setAutoDrain(true);
                  setModified({
                    step: 1,
                    type: 'TRANSFER',
                    amount: 50000.0,
                    nameOrig: 'C1231006815',
                    oldbalanceOrg: 50000.0,
                    newbalanceOrig: 0.0,
                    nameDest: 'C553264065',
                    oldbalanceDest: 0.0,
                    newbalanceDest: 0.0,
                  });
                }}
                className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                Classic Drain Attack ($50,000 Transfer)
              </button>
              <button
                onClick={() => {
                  setAutoDrain(false);
                  setModified({
                    step: 1,
                    type: 'CASH_OUT',
                    amount: 250000.0,
                    nameOrig: 'C1231006815',
                    oldbalanceOrg: 300000.0,
                    newbalanceOrig: 50000.0,
                    nameDest: 'C553264065',
                    oldbalanceDest: 0.0,
                    newbalanceDest: 250000.0,
                  });
                }}
                className="rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100"
              >
                High Value Cash Out ($250k)
              </button>
            </div>
          </div>

          {/* Type Selector */}
          <div>
            <label className="text-xs font-medium text-slate-700">Transaction Type</label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {['PAYMENT', 'TRANSFER', 'CASH_OUT', 'CASH_IN', 'DEBIT'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`rounded-lg py-2 text-center text-xs font-bold transition-all ${
                    modified.type === t
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Slider */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Transaction Amount</span>
              <span className="font-mono font-bold text-slate-900">
                ${modified.amount.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="500000"
              step="100"
              value={modified.amount}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value))}
              className="mt-2 w-full accent-red-600 cursor-pointer"
            />
          </div>

          {/* Drain Origin to Zero toggle */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Drain Origin Account to Exactly $0
                </p>
                <p className="text-[11px] text-slate-500">
                  Sets initial balance equal to amount so remainder is $0 (classic fraud signal).
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoDrain}
                onChange={(e) => toggleAutoDrain(e.target.checked)}
                className="h-4 w-4 rounded accent-red-600"
              />
            </label>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Origin Balance Before</label>
              <input
                type="number"
                value={modified.oldbalanceOrg}
                onChange={(e) =>
                  setModified((prev) => ({
                    ...prev,
                    oldbalanceOrg: parseFloat(e.target.value) || 0,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Origin Balance After</label>
              <input
                type="number"
                value={modified.newbalanceOrig}
                onChange={(e) =>
                  setModified((prev) => ({
                    ...prev,
                    newbalanceOrig: parseFloat(e.target.value) || 0,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Live Comparison Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-semibold text-slate-900">Live Risk Delta Simulation</h2>
              {loading && <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />}
            </div>

            {/* Score Delta Display */}
            <div className="mt-6 grid grid-cols-3 items-center gap-4 text-center rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Baseline Score</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">
                  {result?.original_score ?? 0}
                </p>
                <span className="text-[10px] font-semibold text-slate-500">
                  {result?.original_tier}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <ArrowRight className="h-5 w-5 text-slate-400" />
                <span
                  className={`mt-1 text-xs font-bold ${
                    (result?.score_delta ?? 0) > 0
                      ? 'text-rose-600'
                      : (result?.score_delta ?? 0) < 0
                      ? 'text-emerald-600'
                      : 'text-slate-500'
                  }`}
                >
                  {(result?.score_delta ?? 0) > 0
                    ? `+${result?.score_delta}`
                    : result?.score_delta}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-500">Simulated Score</p>
                <p
                  className={`mt-1 text-3xl font-black ${
                    result?.modified_tier === 'HIGH'
                      ? 'text-rose-600'
                      : result?.modified_tier === 'MEDIUM'
                      ? 'text-amber-500'
                      : 'text-emerald-600'
                  }`}
                >
                  {result?.modified_score ?? 0}
                </p>
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    result?.modified_tier === 'HIGH'
                      ? 'bg-rose-100 text-rose-800'
                      : result?.modified_tier === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {result?.modified_tier} TIER
                </span>
              </div>
            </div>

            {/* Top SHAP Drivers in Simulated Scenario */}
            <div className="mt-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Top Active Risk Drivers In This Scenario
              </h3>

              <div className="space-y-2">
                {result?.modified_explanation?.top_risk_factors?.slice(0, 4).map((f) => (
                  <div
                    key={f.feature}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-xs"
                  >
                    <span className="font-mono font-medium text-slate-800">
                      {f.feature}
                      <span className="ml-2 font-normal text-slate-400">({f.feature_value})</span>
                    </span>
                    <span className="font-mono font-bold text-rose-600">
                      +{f.shap_value.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-purple-50 p-3 text-xs text-purple-900">
            💡 Changing type to <span className="font-semibold">TRANSFER</span> and draining the balance to 0 activates high-impact SHAP weights on <span className="font-mono font-bold">isZeroBalanceOrig</span> and <span className="font-mono font-bold">errorBalanceOrig</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
