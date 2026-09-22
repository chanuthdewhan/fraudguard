import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Layers, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { useStats } from '@/hooks/useStats';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RiskTier } from '@/types';

function riskBadgeVariant(tier: RiskTier): 'destructive' | 'secondary' | 'outline' {
  if (tier === 'high') return 'destructive';
  if (tier === 'medium') return 'secondary';
  return 'outline';
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: highRiskTx, isLoading: txLoading } = useTransactions('high');

  const total = stats?.totalTransactions ?? 0;
  const breakdown = stats?.riskTierBreakdown ?? { low: 0, medium: 0, high: 0 };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fraud Risk Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Real-time transaction risk scoring powered by XGBoost and SHAP explainability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/sandbox"
            className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            What-If Sandbox
          </Link>
          <Link
            to="/review-queue"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium"
          >
            Review Queue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Total Scored
            </p>
            <p className="mt-2 text-3xl font-bold">{statsLoading ? '—' : total}</p>
            <p className="text-muted-foreground mt-1 text-xs">Transactions evaluated</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Flagged (Medium + High)
            </p>
            <p className="text-destructive mt-2 text-3xl font-bold">
              {statsLoading ? '—' : stats?.flaggedCount}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">Requires analyst attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Fraud Rate
            </p>
            <p className="mt-2 text-3xl font-bold">
              {statsLoading ? '—' : `${(stats!.fraudRate * 100).toFixed(1)}%`}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">Across evaluated transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Risk Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['high', 'medium', 'low'] as const).map((tier) => {
              const count = breakdown[tier];
              const pct = total > 0 ? (count / total) * 100 : 0;
              const color =
                tier === 'high'
                  ? 'bg-destructive'
                  : tier === 'medium'
                    ? 'bg-amber-500'
                    : 'bg-green-600';
              return (
                <div key={tier}>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="capitalize">{tier} risk</span>
                    <span>{count} txs</span>
                  </div>
                  <div className="bg-muted mt-1.5 h-2.5 w-full rounded-full">
                    <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              Model Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Algorithm</span>
              <span className="font-semibold">XGBoost</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Explainability</span>
              <span className="font-semibold">SHAP (TreeExplainer)</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Imbalance Handling</span>
              <span className="font-semibold">scale_pos_weight</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Precision</span>
              <span className="font-semibold">
                {statsLoading ? '—' : stats?.modelMetrics.precision.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Recall</span>
              <span className="font-semibold">
                {statsLoading ? '—' : stats?.modelMetrics.recall.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PR-AUC</span>
              <span className="font-semibold">
                {statsLoading ? '—' : stats?.modelMetrics.prAuc.toFixed(2)}
              </span>
            </div>

            <div className="bg-muted text-muted-foreground mt-3 flex items-start gap-1.5 rounded-md p-2 text-[11px]">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                These metrics are placeholders until the ML service exposes its own live evaluation
                output.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="text-destructive h-4 w-4" />
              High Risk Highlights
            </CardTitle>
          </div>
          <Link to="/review-queue" className="text-primary text-xs font-medium hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {txLoading && <p className="text-muted-foreground text-sm">Loading...</p>}

          {!txLoading && (highRiskTx?.length ?? 0) === 0 && (
            <p className="text-muted-foreground text-sm">No high risk transactions found.</p>
          )}

          <div className="space-y-2">
            {highRiskTx?.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{tx.type}</span>
                  <span className="text-muted-foreground font-mono">
                    ${tx.amount.toLocaleString()}
                  </span>
                  <Badge variant={riskBadgeVariant(tx.prediction.riskTier)}>
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {(tx.prediction.riskScore * 100).toFixed(0)}
                  </Badge>
                </div>
                <Link to={`/transactions/${tx.id}`} className="text-primary hover:underline">
                  Inspect →
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
