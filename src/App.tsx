import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Assignments from './pages/Assignments'
import Withdrawals from './pages/Withdrawals'
import Support from './pages/Support'
import AdminDashboard from './pages/admin/AdminDashboard'
import AssignmentsManagement from './pages/admin/AssignmentsManagement'

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={user && profile ? <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Landing />} />
      <Route path="/login" element={user && profile ? <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />} />
      
      {/* User Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/assignments" element={
        <ProtectedRoute>
          <Assignments />
        </ProtectedRoute>
      } />
      
      <Route path="/withdrawals" element={
        <ProtectedRoute>
          <Withdrawals />
        </ProtectedRoute>
      } />
      
      <Route path="/support" element={
        <ProtectedRoute>
          <Support />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/assignments" element={
        <ProtectedRoute adminOnly>
          <AssignmentsManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/users" element={
        <ProtectedRoute adminOnly>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
            <p className="text-gray-600">User management is available in the main admin dashboard.</p>
          </div>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/submissions" element={
        <ProtectedRoute adminOnly>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Management</h2>
            <p className="text-gray-600">Submission management is available in the main admin dashboard.</p>
          </div>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/withdrawals" element={
        <ProtectedRoute adminOnly>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Withdrawal Management</h2>
            <p className="text-gray-600">Withdrawal management is available in the main admin dashboard.</p>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}