import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { PageActionProvider } from './context/PageActionContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminPayments from './pages/admin/Payments'
import AdminSalary from './pages/admin/Salary'
import AdminFinanceHistory from './pages/admin/FinanceHistory'
import MenagerDashboard from './pages/menager/Dashboard'
import XodimDashboard from './pages/xodim/Dashboard'
import PlaceholderPage from './pages/PlaceholderPage'

const PH = (title) => <PlaceholderPage title={title} />

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PageActionProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="roles" element={PH('Rollar')} />
              <Route path="projects" element={PH('Loyihalar')} />
              <Route path="projects/archive" element={PH('Arxiv')} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="finance" element={<AdminSalary />} />
              <Route path="finance/history" element={<AdminFinanceHistory />} />
              <Route path="reports" element={PH('Hisobotlar')} />
              <Route path="reports/staff" element={PH('Xodimlar hisoboti')} />
              <Route path="messages" element={PH('Xabarlar')} />
              <Route path="settings" element={PH('Sozlamalar')} />
            </Route>

            {/* Menager */}
            <Route path="/menager" element={<ProtectedRoute allowedRole="menager"><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<MenagerDashboard />} />
              <Route path="team" element={PH('Xodimlar')} />
              <Route path="tasks" element={PH('Vazifalar')} />
              <Route path="projects" element={PH('Loyihalar')} />
              <Route path="projects/archive" element={PH('Arxiv')} />
              <Route path="finance" element={PH('Byudjet')} />
              <Route path="calendar" element={PH('Kalendar')} />
              <Route path="messages" element={PH('Xabarlar')} />
              <Route path="settings" element={PH('Sozlamalar')} />
            </Route>

            {/* Xodim */}
            <Route path="/xodim" element={<ProtectedRoute allowedRole="xodim"><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<XodimDashboard />} />
              <Route path="tasks" element={PH('Joriy vazifalar')} />
              <Route path="tasks/done" element={PH('Bajarilgan vazifalar')} />
              <Route path="projects" element={PH('Loyihalar')} />
              <Route path="salary" element={PH('Maosh')} />
              <Route path="reports" element={PH('Faoliyat')} />
              <Route path="calendar" element={PH('Kalendar')} />
              <Route path="messages" element={PH('Xabarlar')} />
              <Route path="profile" element={PH('Profilim')} />
              <Route path="support" element={PH("Qo'llab-quvvatlash")} />
              <Route path="settings" element={PH('Sozlamalar')} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </PageActionProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
