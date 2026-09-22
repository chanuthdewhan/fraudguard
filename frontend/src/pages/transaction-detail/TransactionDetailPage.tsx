import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { useTransaction } from '@/hooks/useTransactions';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { RiskTier } from '@/types/';

function riskBadgeVariant(tier: RiskTier): 'destructive' | 'secondary' | 'outline' {
  if (tier === 'high') return 'destructive';
  if (tier === 'medium') return 'secondary';
  return 'outline';
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tx, isLoading, error } = useTransaction(id ?? '');

  if (isLoading) {
    return <p className="text-muted-foreground text-center">Loading transaction...</p>;
  }

  if (error || !tx) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold">Transaction not found</h2>
        <Link to="/review-queue" className="text-primary mt-4 inline-block text-sm hover:underline">
          Back to Review Queue
        </Link>
      </div>
    );
  }

  // SHAP contributions ranked by absolute impact - a feature pushing the
  // score down hard is just as worth showing as one pushing it up.
  const rankedFeatures = [...tx.prediction.explanation.topFeatures].sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value),
  );
  const maxAbsValue = Math.max(...rankedFeatures.map((f) => Math.abs(f.value)), 0.0001);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/review-queue"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Review Queue
        </Link>
        <span className="text-muted-foreground font-mono text-xs">ID: {tx.id}</span>
      </div>

      <Card>
        <CardContent className="flex flex-col justify-between gap-4 pt-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{tx.type}</Badge>
              <h1 className="text-2xl font-bold">
                ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h1>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Step {tx.step} · Evaluated {new Date(tx.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="text-right">
            <p className="text-muted-foreground text-xs">Risk Score</p>
            <p className="text-3xl font-bold">{(tx.prediction.riskScore * 100).toFixed(0)}</p>
            <Badge variant={riskBadgeVariant(tx.prediction.riskTier)} className="mt-1">
              {tx.prediction.riskTier} risk
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Origin Account ({tx.nameOrig})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Balance Before</span>
              <span className="font-mono">${tx.oldBalanceOrg.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-destructive font-mono">-${tx.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance After</span>
              <span className="font-mono">${tx.newBalanceOrg.toLocaleString()}</span>
            </div>
            {tx.newBalanceOrg === 0 && tx.oldBalanceOrg > 0 && (
              <p className="bg-destructive/10 text-destructive mt-2 rounded-md p-2 text-xs">
                Account drained to exactly $0 - a known fraud pattern.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Destination Account ({tx.nameDest})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Balance Before</span>
              <span className="font-mono">${tx.oldBalanceDest.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Amount Received</span>
              <span className="font-mono text-green-600">+${tx.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance After</span>
              <span className="font-mono">${tx.newBalanceDest.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SHAP Explanation</CardTitle>
          <p className="text-muted-foreground text-xs">
            Base value {tx.prediction.explanation.baseValue.toFixed(4)}, adjusted by each feature
            below to reach the final risk score.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {rankedFeatures.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No explanation available for this transaction.
            </p>
          )}

          {rankedFeatures.map((feature) => {
            const isPositive = feature.value > 0;
            const barWidth = (Math.abs(feature.value) / maxAbsValue) * 100;

            return (
              <div key={feature.feature} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-mono">
                    {isPositive ? (
                      <TrendingUp className="text-destructive h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-green-600" />
                    )}
                    {feature.feature}
                  </span>
                  <span
                    className={`font-mono font-semibold ${isPositive ? 'text-destructive' : 'text-green-600'}`}
                  >
                    {isPositive ? '+' : ''}
                    {feature.value.toFixed(4)}
                  </span>
                </div>
                <div className="bg-muted h-2 w-full rounded-full">
                  <div
                    className={`h-2 rounded-full ${isPositive ? 'bg-destructive' : 'bg-green-600'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
