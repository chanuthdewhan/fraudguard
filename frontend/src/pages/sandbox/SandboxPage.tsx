import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { useSimulate } from '@/hooks/useSimulate';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TransactionInput, TransactionType, RiskTier } from '@/types';

const DEFAULT_TRANSACTION: TransactionInput = {
  step: 1,
  type: 'PAYMENT',
  amount: 25,
  nameOrig: 'C1231006815',
  oldBalanceOrg: 5000,
  newBalanceOrg: 4975,
  nameDest: 'M1979787155',
  oldBalanceDest: 0,
  newBalanceDest: 0,
};

const TRANSACTION_TYPES: TransactionType[] = [
  'PAYMENT',
  'TRANSFER',
  'CASH_OUT',
  'CASH_IN',
  'DEBIT',
];

function riskBadgeVariant(tier: RiskTier): 'destructive' | 'secondary' | 'outline' {
  if (tier === 'high') return 'destructive';
  if (tier === 'medium') return 'secondary';
  return 'outline';
}

export default function SandboxPage() {
  const [modified, setModified] = useState<TransactionInput>({ ...DEFAULT_TRANSACTION });
  const [autoDrain, setAutoDrain] = useState(false);

  const baselineSim = useSimulate();
  const modifiedSim = useSimulate();

  // Baseline is scored once, against the fixed default transaction, so
  // there's a stable reference point to compare every change against.
  useEffect(() => {
    baselineSim.mutate(DEFAULT_TRANSACTION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced so dragging the amount slider doesn't fire a request on
  // every pixel of movement.
  useEffect(() => {
    const timer = setTimeout(() => modifiedSim.mutate(modified), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modified]);

  function handleAmountChange(amount: number) {
    setModified((prev) => ({
      ...prev,
      amount,
      newBalanceOrg: autoDrain ? 0 : Math.max(0, prev.oldBalanceOrg - amount),
      oldBalanceOrg: autoDrain ? amount : prev.oldBalanceOrg,
    }));
  }

  function handleTypeChange(type: TransactionType) {
    setModified((prev) => ({
      ...prev,
      type,
      nameDest: type === 'PAYMENT' ? 'M1979787155' : 'C553264065',
    }));
  }

  function toggleAutoDrain(drain: boolean) {
    setAutoDrain(drain);
    setModified((prev) =>
      drain ? { ...prev, oldBalanceOrg: prev.amount, newBalanceOrg: 0 } : prev,
    );
  }

  const baseline = baselineSim.data;
  const result = modifiedSim.data;
  const delta = baseline && result ? result.riskScore - baseline.riskScore : null;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold tracking-tight">What-If Risk Sandbox</h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Adjust transaction parameters and see how the model's risk score responds in real time.
          Nothing here is saved as a real transaction.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adjust Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-xs font-medium">Transaction Type</label>
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {TRANSACTION_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    className={`rounded-md py-2 text-[11px] font-semibold transition-colors ${
                      modified.type === t ? 'bg-slate-900 text-white' : 'border hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium">
                <span>Transaction Amount</span>
                <span className="font-mono">${modified.amount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100000}
                step={100}
                value={modified.amount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                className="mt-2 w-full accent-red-600"
              />
            </div>

            <label className="flex items-center justify-between rounded-md border p-3 text-xs">
              <div>
                <p className="font-semibold">Drain Origin Account to $0</p>
                <p className="text-muted-foreground">
                  Sets origin balance equal to amount - the classic account-draining pattern.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoDrain}
                onChange={(e) => toggleAutoDrain(e.target.checked)}
                className="accent-primary h-4 w-4"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Origin Balance Before</label>
                <input
                  type="number"
                  value={modified.oldBalanceOrg}
                  onChange={(e) =>
                    setModified((prev) => ({ ...prev, oldBalanceOrg: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-md border px-2 py-1.5 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Origin Balance After</label>
                <input
                  type="number"
                  value={modified.newBalanceOrg}
                  onChange={(e) =>
                    setModified((prev) => ({ ...prev, newBalanceOrg: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-md border px-2 py-1.5 font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Live Risk Comparison
              {modifiedSim.isPending && (
                <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted grid grid-cols-3 items-center gap-3 rounded-lg p-4 text-center">
              <div>
                <p className="text-muted-foreground text-[11px]">Baseline</p>
                <p className="text-xl font-bold">
                  {baseline ? (baseline.riskScore * 100).toFixed(0) : '—'}
                </p>
                {baseline && (
                  <Badge variant={riskBadgeVariant(baseline.riskTier)}>{baseline.riskTier}</Badge>
                )}
              </div>

              <div className="flex flex-col items-center">
                <ArrowRight className="text-muted-foreground h-4 w-4" />
                {delta !== null && (
                  <span
                    className={`mt-1 text-xs font-bold ${delta > 0 ? 'text-rose-600' : delta < 0 ? 'text-emerald-600' : 'text-slate-500'}`}
                  >
                    {delta > 0 ? '+' : ''}
                    {(delta * 100).toFixed(0)}
                  </span>
                )}
              </div>

              <div>
                <p className="text-muted-foreground text-[11px]">Simulated</p>
                <p className="text-2xl font-black">
                  {result ? (result.riskScore * 100).toFixed(0) : '—'}
                </p>
                {result && (
                  <Badge variant={riskBadgeVariant(result.riskTier)}>{result.riskTier}</Badge>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Top Risk Drivers in This Scenario
              </h3>
              <div className="mt-3 space-y-2">
                {result?.explanation.topFeatures.length === 0 && (
                  <p className="text-muted-foreground text-xs">No significant risk drivers.</p>
                )}
                {result?.explanation.topFeatures.map((f) => (
                  <div
                    key={f.feature}
                    className="flex items-center justify-between rounded-md border p-2 text-xs"
                  >
                    <span className="font-mono">{f.feature}</span>
                    <span
                      className={`font-mono font-semibold ${f.value > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                    >
                      {f.value > 0 ? '+' : ''}
                      {f.value.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
