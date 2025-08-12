import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'

// Import components (we'll create these)
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import BusinessDashboard from './pages/dashboards/BusinessDashboard'
import DriverDashboard from './pages/dashboards/DriverDashboard'
import CustomerDashboard from './pages/dashboards/CustomerDashboard'

// Import context providers
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import { redirectToDashboard } from './utils/navigation'
import { useNavigate } from 'react-router-dom'

// Loading component
const AppLoading = () => (
  <div className="min-h-screen bg-bgBlack flex items-center justify-center">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-primary text-xl font-bold"
      >
        mobiTrak
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-gray-400 mt-2"
      >
        Loading...
      </motion.p>
    </div>
  </div>
)

// Main App Routes Component
const AppRoutes = () => {
  const { user, userRole, loading, initializing } = useAuth()
  const navigate = useNavigate()

  // Auto-redirect authenticated users from public routes to dashboard
  // IMPORTANT: This must be called before any conditional returns to follow Rules of Hooks
  React.useEffect(() => {
    // Only redirect if not loading/initializing and user is authenticated
    if (!initializing && !loading && user && userRole) {
      const currentPath = window.location.pathname
      const publicPaths = ['/', '/login', '/register']

      if (publicPaths.includes(currentPath)) {
        console.log('Auto-redirecting authenticated user to dashboard:', userRole)
        redirectToDashboard(userRole, navigate)
      }
    }
  }, [user, userRole, navigate, initializing, loading])

  // Show loading screen during initialization
  if (initializing || loading) {
    return <AppLoading />
  }

  return (
    <div className="min-h-screen bg-bgBlack text-white">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard/business"
          element={
            <ProtectedRoute allowedRoles={['business']}>
              <BusinessDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/driver"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/customer"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
