import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userRole, loading, initializing } = useAuth()

  // Show loading during initialization or auth state changes
  if (initializing || loading) {
    return (
      <div className="min-h-screen bg-bgBlack flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to home if user doesn't have required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
