import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { PageActionProvider } from './context/PageActionContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users/Users'
import AdminUserDetail from './pages/admin/Users/UserDetail'
import AdminPayments from './pages/admin/finance/Payments'
import AdminSalary from './pages/admin/finance/Salary'
import AdminFinanceHistory from './pages/admin/finance/FinanceHistory'
import AdminProjects from './pages/admin/tasks/Projects'
import AdminTasks from './pages/admin/tasks/Tasks'
import AdminMeetings from './pages/admin/tasks/Meetings'
import AdminApplications from './pages/admin/applications/Applications'
import AdminApplicationDetail from './pages/admin/applications/ApplicationDetail'
import AdminPositions from './pages/admin/applications/Positions/'
import AdminRegions from './pages/admin/applications/Regions'
import PlaceholderPage from './pages/PlaceholderPage'
import { ToastProvider } from './Toast/ToastProvider'
import ByTasks from './pages/admin/Reports/ByTasks'
import CostInquiries from './pages/admin/Reports/CostInquiries'
import Employee from './pages/admin/Reports/Employee'
import Project from './pages/admin/Reports/Project'
import Salary from './pages/admin/Reports/Salary'
import TrashPage from './pages/admin/Trash/Trash'
import ProfilePage from './pages/admin/Profile/Profile'

const PH = (title) => <PlaceholderPage title={title} />

// Umumiy sahifalar — barcha rollarda ishlatiladi
const commonRoutes = (prefix) => [
  <Route key="payments" path="payments" element={<AdminPayments />} />,
  <Route key="finance" path="finance" element={<AdminSalary />} />,
  <Route key="finance-hist" path="finance/history" element={<AdminFinanceHistory />} />,
  <Route key="projects" path="projects" element={<AdminProjects />} />,
  <Route key="tasks" path="tasks" element={<AdminTasks />} />,
  <Route key="meetings" path="meetings" element={<AdminMeetings />} />,
  <Route key="trash" path="trash" element={<TrashPage />} />,
  <Route key="profile" path="profile" element={<ProfilePage />} />,
  <Route key="rep-employee" path="reports/employee" element={<Employee />} />,
  <Route key="rep-project" path="reports/project" element={<Project />} />,
  <Route key="rep-cost" path="reports/cost_inquiries" element={<CostInquiries />} />,
  <Route key="rep-salary" path="reports/salary" element={<Salary />} />,
  <Route key="rep-tasks" path="reports/by_tasks" element={<ByTasks />} />,
  <Route key="applications" path="applications" element={<AdminApplications />} />,
  <Route key="app-detail" path="applications/detail/:id" element={<AdminApplicationDetail />} />,
  <Route key="app-positions" path="applications/positions" element={<AdminPositions />} />,
  <Route key="app-regions" path="applications/regions" element={<AdminRegions />} />,
  <Route key="users" path="users" element={<AdminUsers />} />,
  <Route key="user-detail" path="users/detail/:id" element={<AdminUserDetail />} />,
]

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <PageActionProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* ── ADMIN ── */}
              <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                {commonRoutes('admin')}
              </Route>

              {/* ── MANAGER ── */}
              <Route path="/manager" element={<ProtectedRoute allowedRole="manager"><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                {commonRoutes('manager')}
              </Route>

              {/* ── EMPLOYEE ── */}
              <Route path="/employee" element={<ProtectedRoute allowedRole="employee"><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                {commonRoutes('employee')}
              </Route>

              {/* ── AUDITOR ── */}
              <Route path="/auditor" element={<ProtectedRoute allowedRole="auditor"><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                {commonRoutes('auditor')}
              </Route>

              {/* ── ACCOUNTANT ── */}
              <Route path="/accountant" element={<ProtectedRoute allowedRole="accountant"><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                {commonRoutes('accountant')}
              </Route>

              {/* ── Eski URL lar uchun redirect ── */}
              <Route path="/menager/*" element={<Navigate to="/manager/dashboard" replace />} />
              <Route path="/xodim/*" element={<Navigate to="/employee/dashboard" replace />} />
              <Route path="/hisobchi/*" element={<Navigate to="/accountant/dashboard" replace />} />
              <Route path="/nazoratchi/*" element={<Navigate to="/auditor/dashboard" replace />} />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </PageActionProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  )
}

export default App
