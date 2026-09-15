import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { getTransactions, type Transaction } from '@/lib/api';

export default function ReviewQueuePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [riskTier, setRiskTier] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    async function fetchQueue() {
      setLoading(true);
      try {
        const res = await getTransactions({
          riskTier,
          status,
          search: debouncedSearch,
          page,
          limit: 10,
        });
        setTransactions(res.data);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      } catch (err) {
        console.error('Failed to fetch review queue:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchQueue();
  }, [riskTier, status, debouncedSearch, page]);

  function getTierBadge(tier: string, score: number) {
    if (tier === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-600/20 ring-inset">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
          HIGH ({score})
        </span>
      );
    }
    if (tier === 'MEDIUM') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-600/20 ring-inset">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          MED ({score})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        LOW ({score})
      </span>
    );
  }

  function getStatusBadge(st: string) {
    const styles: Record<string, string> = {
      PENDING: 'bg-amber-50 text-amber-800 ring-amber-600/20',
      APPROVED: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
      REJECTED: 'bg-rose-50 text-rose-800 ring-rose-600/20',
      ESCALATED: 'bg-purple-50 text-purple-800 ring-purple-600/20',
    };
    return (
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
          styles[st] || 'bg-slate-50 text-slate-700 ring-slate-600/20'
        }`}
      >
        {st}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analyst Review Queue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Prioritized review queue sorted by predicted fraud risk score. Click any row to inspect SHAP attributions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Origin or Destination Account (e.g. C1305486145)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Tier:</span>
          </div>
          <select
            value={riskTier}
            onChange={(e) => {
              setRiskTier(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-red-600 focus:outline-hidden"
          >
            <option value="ALL">All Tiers</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Status:</span>
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-red-600 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600">
              <tr>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Origin Account</th>
                <th className="px-5 py-3 font-medium">Destination Account</th>
                <th className="px-5 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    <span>Risk Score</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Loading queue transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No transactions matching criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{tx.type}</td>
                    <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{tx.nameOrig}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{tx.nameDest}</td>
                    <td className="px-5 py-3.5">{getTierBadge(tx.riskTier, tx.riskScore)}</td>
                    <td className="px-5 py-3.5">{getStatusBadge(tx.status)}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/transactions/${tx.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-red-700"
                      >
                        Inspect
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-900">{transactions.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalCount}</span> records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
