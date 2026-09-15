import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { getStats, getTransactions, type DashboardStats, type Transaction } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFlagged, setRecentFlagged] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, txData] = await Promise.all([
          getStats(),
          getTransactions({ riskTier: 'HIGH', limit: 5 }),
        ]);
        setStats(statsData);
        setRecentFlagged(txData.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm font-medium text-slate-500">Loading risk metrics...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Scored',
      value: stats?.totalTransactions ?? 0,
      description: 'Transactions evaluated',
      icon: Layers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Flagged High Risk',
      value: stats?.flaggedCount ?? 0,
      description: 'Requires analyst attention',
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
    {
      title: 'Predicted Fraud Rate',
      value: `${stats?.fraudRate ?? 0}%`,
      description: 'Across evaluated stream',
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Pending Review Queue',
      value: stats?.pendingCount ?? 0,
      description: 'Awaiting human decision',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fraud Risk Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time transaction risk scoring powered by XGBoost & TreeSHAP explainability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/sandbox"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            What-If Sandbox
          </Link>
          <Link
            to="/review-queue"
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white shadow-xs hover:bg-red-700"
          >
            Review Queue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </p>
                <div className={`rounded-lg p-2 ${card.bgColor} ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-3xl font-bold tracking-tight text-slate-900">{card.value}</h3>
                <p className="mt-1 text-xs text-slate-500">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Risk Distribution & Model Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Risk Tier Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Risk Tier Distribution</h2>
              <p className="text-xs text-slate-500">Transaction categorization by model confidence</p>
            </div>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600"></span>
                  High Risk (Score ≥ 70)
                </span>
                <span>{stats?.riskDistribution.high ?? 0} txs</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-2.5 rounded-full bg-rose-600"
                  style={{
                    width: `${stats?.totalTransactions ? ((stats.riskDistribution.high / stats.totalTransactions) * 100) : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                  Medium Risk (30 ≤ Score &lt; 70)
                </span>
                <span>{stats?.riskDistribution.medium ?? 0} txs</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-2.5 rounded-full bg-amber-500"
                  style={{
                    width: `${stats?.totalTransactions ? ((stats.riskDistribution.medium / stats.totalTransactions) * 100) : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  Low Risk (Score &lt; 30)
                </span>
                <span>{stats?.riskDistribution.low ?? 0} txs</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-2.5 rounded-full bg-emerald-500"
                  style={{
                    width: `${stats?.totalTransactions ? ((stats.riskDistribution.low / stats.totalTransactions) * 100) : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-4 gap-4 border-t border-slate-100 pt-6 text-center">
            <div>
              <p className="text-xs text-slate-500">Pending</p>
              <p className="mt-1 text-lg font-bold text-amber-600">{stats?.statusDistribution.pending ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Approved</p>
              <p className="mt-1 text-lg font-bold text-emerald-600">{stats?.statusDistribution.approved ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Rejected</p>
              <p className="mt-1 text-lg font-bold text-rose-600">{stats?.statusDistribution.rejected ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Escalated</p>
              <p className="mt-1 text-lg font-bold text-purple-600">{stats?.statusDistribution.escalated ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Model Spec Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <h2 className="text-base font-semibold text-slate-900">Engine Blueprint</h2>
          </div>
          <div className="mt-4 space-y-3 text-xs text-slate-600">
            <div className="flex justify-between border-b border-slate-50 py-1.5">
              <span className="text-slate-500">Algorithm</span>
              <span className="font-semibold text-slate-900">XGBoost (3.4.1)</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1.5">
              <span className="text-slate-500">Explainability</span>
              <span className="font-semibold text-slate-900">TreeSHAP Local Attributions</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1.5">
              <span className="text-slate-500">Imbalance Strategy</span>
              <span className="font-semibold text-slate-900">SMOTE + Balanced Weighting</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1.5">
              <span className="text-slate-500">Target Feature</span>
              <span className="font-semibold text-slate-900">isFraud (Binary)</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 py-1.5">
              <span className="text-slate-500">Engineered Features</span>
              <span className="font-semibold text-slate-900">8 Domain Techniques</span>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">
            Explainability output provides exact log-odds impact per transaction to streamline compliance auditing.
          </div>
        </div>
      </div>

      {/* Flagged Transactions for Review */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">High Risk Queue Highlights</h2>
            <p className="text-xs text-slate-500">Transactions flagged with highest fraud probability</p>
          </div>
          <Link
            to="/review-queue"
            className="text-xs font-medium text-red-600 hover:text-red-700"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Origin Account</th>
                <th className="px-6 py-3 font-medium">Destination Account</th>
                <th className="px-6 py-3 font-medium">Risk Score</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentFlagged.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-semibold text-slate-900">{tx.type}</td>
                  <td className="px-6 py-3 font-medium text-slate-900">${tx.amount.toLocaleString()}</td>
                  <td className="px-6 py-3 font-mono text-slate-600">{tx.nameOrig}</td>
                  <td className="px-6 py-3 font-mono text-slate-600">{tx.nameDest}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-600/20 ring-inset">
                      {tx.riskScore} / 100
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      to={`/transactions/${tx.id}`}
                      className="font-medium text-red-600 hover:text-red-700"
                    >
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
              {recentFlagged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No high risk transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
