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
import AdminDistricts from './pages/admin/applications/Districts'
import MenagerDashboard from './pages/menager/Dashboard'
import XodimDashboard from './pages/xodim/Dashboard'
import PlaceholderPage from './pages/PlaceholderPage'
import { ToastProvider } from './Toast/ToastProvider'

const PH = (title) => <PlaceholderPage title={title} />

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <PageActionProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* ── Admin ── */}
              <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/detail/:id" element={<AdminUserDetail />} />
                <Route path="roles" element={PH('Rollar')} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="projects/archive" element={PH('Arxiv')} />
                <Route path="tasks" element={<AdminTasks />} />
                <Route path="meetings" element={<AdminMeetings />} />
                {/* Moliya — 3 sahifa */}
                <Route path="payments" element={<AdminPayments />} />
                <Route path="finance" element={<AdminSalary />} />
                <Route path="finance/history" element={<AdminFinanceHistory />} />
                <Route path="reports" element={PH('Hisobotlar')} />
                <Route path="reports/staff" element={PH('Xodimlar hisoboti')} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="applications/detail/:id" element={<AdminApplicationDetail />} />
                <Route path="applications/positions" element={<AdminPositions />} />
                <Route path="applications/regions" element={<AdminRegions />} />
                <Route path="applications/districts" element={<AdminDistricts />} />
                <Route path="messages" element={PH('Xabarlar')} />
                <Route path="settings" element={PH('Sozlamalar')} />
              </Route>

              {/* ── Menager ── */}
              <Route path="/menager" element={<ProtectedRoute allowedRole="menager"><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<MenagerDashboard />} />
                <Route path="team" element={PH('Xodimlar')} />
                <Route path="tasks" element={PH('Vazifalar')} />
                <Route path="projects" element={PH('Loyihalar')} />
                <Route path="projects/archive" element={PH('Arxiv')} />
                {/* Moliya — 3 sahifa */}
                <Route path="payments" element={<AdminPayments />} />
                <Route path="finance" element={<AdminSalary />} />
                <Route path="finance/history" element={<AdminFinanceHistory />} />
                <Route path="calendar" element={PH('Kalendar')} />
                <Route path="messages" element={PH('Xabarlar')} />
                <Route path="settings" element={PH('Sozlamalar')} />
              </Route>

              {/* ── Xodim ── */}
              <Route path="/xodim" element={<ProtectedRoute allowedRole="xodim"><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<XodimDashboard />} />
                <Route path="tasks" element={PH('Joriy vazifalar')} />
                <Route path="tasks/done" element={PH('Bajarilgan vazifalar')} />
                <Route path="projects" element={PH('Loyihalar')} />
                {/* Moliya — 3 sahifa */}
                <Route path="payments" element={<AdminPayments />} />
                <Route path="finance" element={<AdminSalary />} />
                <Route path="finance/history" element={<AdminFinanceHistory />} />
                <Route path="reports" element={PH('Faoliyat')} />
                <Route path="calendar" element={PH('Kalendar')} />
                <Route path="messages" element={PH('Xabarlar')} />
                <Route path="profile" element={PH('Profilim')} />
                <Route path="support" element={PH("Qo'llab-quvvatlash")} />
                <Route path="settings" element={PH('Sozlamalar')} />
              </Route>

              {/* ── Hisobchi ── */}
              <Route path="/hisobchi" element={<ProtectedRoute allowedRole="hisobchi"><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<AdminPayments />} />
                {/* Moliya — 3 sahifa */}
                <Route path="payments" element={<AdminPayments />} />
                <Route path="finance" element={<AdminSalary />} />
                <Route path="finance/history" element={<AdminFinanceHistory />} />
                <Route path="settings" element={PH('Sozlamalar')} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </PageActionProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  )
}

export default App
