import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ReviewQueuePage = lazy(() => import('@/pages/review-queue/ReviewQueuePage'));
const TransactionDetailPage = lazy(
  () => import('@/pages/transaction-detail/TransactionDetailPage'),
);
const SandboxPage = lazy(() => import('@/pages/sandbox/SandboxPage'));
const InsightsPage = lazy(() => import('@/pages/insights/InsightsPage'));

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="review-queue" element={<ReviewQueuePage />} />
            <Route path="transactions/:id" element={<TransactionDetailPage />} />
            <Route path="sandbox" element={<SandboxPage />} />
            <Route path="insights" element={<InsightsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
