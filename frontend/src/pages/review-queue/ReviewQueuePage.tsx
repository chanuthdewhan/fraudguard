import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RiskTier } from '@/types/';

const TIER_OPTIONS: { value: RiskTier | 'all'; label: string }[] = [
  { value: 'all', label: 'All Tiers' },
  { value: 'high', label: 'High Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'low', label: 'Low Risk' },
];

// shadcn's Badge only ships default/secondary/destructive/outline variants -
// mapped here to the three risk tiers rather than inventing a fourth variant.
function riskBadgeVariant(tier: RiskTier): 'destructive' | 'secondary' | 'outline' {
  if (tier === 'high') return 'destructive';
  if (tier === 'medium') return 'secondary';
  return 'outline';
}

export default function ReviewQueuePage() {
  const [tierFilter, setTierFilter] = useState<RiskTier | 'all'>('all');
  const [search, setSearch] = useState('');

  const {
    data: transactions,
    isLoading,
    error,
  } = useTransactions(tierFilter === 'all' ? undefined : tierFilter);

  // Search filters client-side over the already-fetched page - the backend
  // doesn't support a search query yet, so this only searches what's
  // currently loaded, not the full transaction history.
  const filtered = useMemo(() => {
    if (!transactions) return [];
    const sorted = [...transactions].sort(
      (a, b) => b.prediction.riskScore - a.prediction.riskScore,
    );
    if (!search.trim()) return sorted;
    const query = search.toLowerCase();
    return sorted.filter(
      (tx) =>
        tx.nameOrig.toLowerCase().includes(query) || tx.nameDest.toLowerCase().includes(query),
    );
  }, [transactions, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analyst Review Queue</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Transactions sorted by risk score. Click any row to inspect the SHAP explanation.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by account (e.g. C1305486145)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-input bg-background focus:ring-ring w-full rounded-md border py-2 pr-3 pl-9 text-sm outline-none focus:ring-2"
          />
        </div>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as RiskTier | 'all')}
          className="border-input bg-background focus:ring-ring rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
        >
          {TIER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Origin Account</TableHead>
              <TableHead>Destination Account</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  Loading transactions...
                </TableCell>
              </TableRow>
            )}

            {error && (
              <TableRow>
                <TableCell colSpan={7} className="text-destructive text-center">
                  Failed to load transactions.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  No transactions matching your filters.
                </TableCell>
              </TableRow>
            )}

            {filtered.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">{tx.type}</TableCell>
                <TableCell className="font-mono">
                  ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono">{tx.nameOrig}</TableCell>
                <TableCell className="text-muted-foreground font-mono">{tx.nameDest}</TableCell>
                <TableCell>
                  <Badge variant={riskBadgeVariant(tx.prediction.riskTier)}>
                    {tx.prediction.riskTier} ({(tx.prediction.riskScore * 100).toFixed(0)})
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    to={`/transactions/${tx.id}`}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Inspect →
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
