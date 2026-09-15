import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertOctagon,
  User,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  getTransactionById,
  updateTransactionStatus,
  type Transaction,
} from '@/lib/api';

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewStatus, setReviewStatus] = useState<string>('');
  const [analystNotes, setAnalystNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadTx() {
      if (!id) return;
      try {
        const data = await getTransactionById(id);
        setTx(data);
        setReviewStatus(data.status);
        setAnalystNotes(data.analystNotes || '');
      } catch (err) {
        console.error('Failed to load transaction:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTx();
  }, [id]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !reviewStatus) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      const updated = await updateTransactionStatus(
        id,
        reviewStatus as 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED',
        analystNotes,
      );
      setTx(updated);
      setSuccessMsg(`Status updated to ${reviewStatus} successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      alert(`Error updating status: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm font-medium text-slate-500">Loading transaction details...</div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-slate-900">Transaction Not Found</h2>
        <Link to="/review-queue" className="mt-4 inline-block text-sm text-red-600 hover:underline">
          Return to Review Queue
        </Link>
      </div>
    );
  }

  const explanation = tx.explanation;
  const topRisk = explanation?.top_risk_factors || [];
  const topMitigating = explanation?.top_mitigating_factors || [];

  return (
    <div className="space-y-8">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/review-queue"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Review Queue
        </Link>
        <span className="font-mono text-xs text-slate-400">ID: {tx.id}</span>
      </div>

      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-800">
                {tx.type}
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h1>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Evaluated on {new Date(tx.createdAt).toLocaleString()} (Simulation Step {tx.step})
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">Risk Score</p>
              <p
                className={`text-3xl font-black ${
                  tx.riskTier === 'HIGH'
                    ? 'text-rose-600'
                    : tx.riskTier === 'MEDIUM'
                    ? 'text-amber-500'
                    : 'text-emerald-600'
                }`}
              >
                {tx.riskScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </p>
            </div>
            <div
              className={`rounded-xl px-4 py-3 text-center ring-1 ring-inset ${
                tx.riskTier === 'HIGH'
                  ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
                  : tx.riskTier === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                  : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider">Assigned Tier</p>
              <p className="text-lg font-bold">{tx.riskTier}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Financial Entities & Review Action */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Origin & Destination Math */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900">Transaction Balance Math</h2>
            <p className="text-xs text-slate-500">
              Sanity check of balance changes before vs. after transaction.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Origin Account */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <User className="h-4 w-4 text-blue-600" />
                  Origin Account ({tx.nameOrig})
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Balance Before</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ${tx.oldbalanceOrg.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Deduction Amount</span>
                    <span className="font-mono font-semibold text-rose-600">
                      -${tx.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Balance After</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ${tx.newbalanceOrig.toLocaleString()}
                    </span>
                  </div>
                </div>

                {tx.newbalanceOrig === 0 && (
                  <div className="mt-3 rounded bg-rose-50 p-2 text-[11px] font-medium text-rose-700">
                    ⚠️ Account balance dropped to exactly $0 (draining flag).
                  </div>
                )}
              </div>

              {/* Destination Account */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <User className="h-4 w-4 text-purple-600" />
                  Destination Account ({tx.nameDest})
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Balance Before</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ${tx.oldbalanceDest.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Transferred In</span>
                    <span className="font-mono font-semibold text-emerald-600">
                      +${tx.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Balance After</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ${tx.newbalanceDest.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SHAP Waterfall Breakdown Visual */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  SHAP Explainability Waterfall
                </h2>
                <p className="text-xs text-slate-500">
                  Exact feature contributions pushing risk score up (towards fraud) or down.
                </p>
              </div>
              <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700">
                TreeSHAP Attribution
              </span>
            </div>

            <div className="mt-6 space-y-6">
              {/* Risk Increasing Factors */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                  <TrendingUp className="h-4 w-4" />
                  Top Risk-Increasing Features (+ Log-Odds)
                </div>
                <div className="mt-3 space-y-2.5">
                  {topRisk.map((factor) => {
                    const barWidth = Math.min(100, Math.max(10, Math.abs(factor.shap_value) * 15));
                    return (
                      <div key={factor.feature} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-mono font-medium text-slate-800">
                            {factor.feature}
                            <span className="ml-2 text-slate-400 font-normal">
                              (val: {String(factor.feature_value)})
                            </span>
                          </span>
                          <span className="font-mono font-bold text-rose-600">
                            +{factor.shap_value.toFixed(4)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-rose-500"
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  {topRisk.length === 0 && (
                    <p className="text-xs text-slate-400">No positive risk drivers detected.</p>
                  )}
                </div>
              </div>

              {/* Risk Mitigating Factors */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <TrendingDown className="h-4 w-4" />
                  Top Mitigating Features (- Log-Odds)
                </div>
                <div className="mt-3 space-y-2.5">
                  {topMitigating.map((factor) => {
                    const barWidth = Math.min(100, Math.max(10, Math.abs(factor.shap_value) * 15));
                    return (
                      <div key={factor.feature} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-mono font-medium text-slate-800">
                            {factor.feature}
                            <span className="ml-2 text-slate-400 font-normal">
                              (val: {String(factor.feature_value)})
                            </span>
                          </span>
                          <span className="font-mono font-bold text-emerald-600">
                            {factor.shap_value.toFixed(4)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analyst Decision Action Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">Analyst Review Action</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Record compliance decision and audit justification.
          </p>

          <form onSubmit={handleReviewSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Decision Outcome</label>
              <div className="mt-2 space-y-2">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="status"
                    value="APPROVED"
                    checked={reviewStatus === 'APPROVED'}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Approve Transaction</p>
                    <p className="text-[11px] text-slate-500">Cleared as verified legitimate</p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="status"
                    value="REJECTED"
                    checked={reviewStatus === 'REJECTED'}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <XCircle className="h-4 w-4 text-rose-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Reject & Block</p>
                    <p className="text-[11px] text-slate-500">Confirmed fraudulent behavior</p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="status"
                    value="ESCALATED"
                    checked={reviewStatus === 'ESCALATED'}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <AlertOctagon className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Escalate to Senior Fraud Team</p>
                    <p className="text-[11px] text-slate-500">Requires further customer contact</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Audit Justification / Notes</label>
              <textarea
                rows={4}
                value={analystNotes}
                onChange={(e) => setAnalystNotes(e.target.value)}
                placeholder="Document reasons for decision (e.g. verified origin account drain with customer)..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-red-600 focus:outline-hidden"
              />
            </div>

            {successMsg && (
              <div className="rounded-lg bg-emerald-50 p-2.5 text-xs font-medium text-emerald-700">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Saving Decision...' : 'Save Compliance Decision'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
