import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { DashboardLayout } from './DashboardLayout'
import { ProtectedRoute } from '@/features/auth/lib/authGuard'
import { AuthPage } from '@/pages/auth/ui/AuthPage'
import { NotFoundPage } from '@/pages/not-found/ui/NotFoundPage'

// Lazy-loaded pages
import { lazy, Suspense } from 'react'
import { Spinner } from '@/shared/ui/Spinner'

const DashboardPage = lazy(() =>
  import('@/pages/dashboard/ui/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const WorkersPage = lazy(() =>
  import('@/pages/workers/ui/WorkersPage').then((m) => ({ default: m.WorkersPage }))
)
const WorkerDetailPage = lazy(() =>
  import('@/pages/workers/ui/WorkerDetailPage').then((m) => ({ default: m.WorkerDetailPage }))
)
const WorkerCreatePage = lazy(() =>
  import('@/pages/workers/ui/WorkerCreatePage').then((m) => ({ default: m.WorkerCreatePage }))
)
const WorkerEditPage = lazy(() =>
  import('@/pages/workers/ui/WorkerEditPage').then((m) => ({ default: m.WorkerEditPage }))
)
const DepartmentsPage = lazy(() =>
  import('@/pages/departments/ui/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage }))
)
const SettingsPage = lazy(() =>
  import('@/pages/settings/ui/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
const ExpenseRequestsPage = lazy(() =>
  import('@/pages/expense-requests/ui/ExpenseRequestsPage').then((m) => ({
    default: m.ExpenseRequestsPage,
  }))
)
const ExpenseRequestCreatePage = lazy(() =>
  import('@/pages/expense-requests/ui/ExpenseRequestCreatePage').then((m) => ({
    default: m.ExpenseRequestCreatePage,
  }))
)

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [{ index: true, element: <AuthPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/dashboard',
            element: <Lazy><DashboardPage /></Lazy>,
          },
          {
            path: '/workers',
            element: <Lazy><WorkersPage /></Lazy>,
          },
          {
            path: '/workers/new',
            element: <Lazy><WorkerCreatePage /></Lazy>,
          },
          {
            path: '/workers/:id',
            element: <Lazy><WorkerDetailPage /></Lazy>,
          },
          {
            path: '/workers/:id/edit',
            element: <Lazy><WorkerEditPage /></Lazy>,
          },
          {
            path: '/departments',
            element: <Lazy><DepartmentsPage /></Lazy>,
          },
          {
            path: '/settings',
            element: <Lazy><SettingsPage /></Lazy>,
          },
          {
            path: '/expense-requests',
            element: <Lazy><ExpenseRequestsPage /></Lazy>,
          },
          {
            path: '/expense-requests/new',
            element: <Lazy><ExpenseRequestCreatePage /></Lazy>,
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
