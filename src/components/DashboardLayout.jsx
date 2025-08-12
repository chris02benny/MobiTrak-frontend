import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import ConfirmationModal from './ConfirmationModal'

const DashboardLayout = ({ children, title, sidebarItems = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const { user, userRole, signOut, forceSignOut } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleSignOutClick = () => {
    setShowSignOutModal(true)
  }

  const handleSignOutConfirm = async () => {
    setSigningOut(true)
    console.log('Dashboard signout initiated...')

    try {
      // Await signout completion before navigation
      const { error } = await signOut()

      if (error) {
        console.error('SignOut failed:', error)
        showToast('Error signing out. Please try again.', 'error')
      } else {
        console.log('SignOut successful, navigating to home...')
        showToast('Successfully signed out', 'success')

        // Navigate immediately after successful signout
        navigate('/')
      }

    } catch (error) {
      console.error('SignOut catch error:', error)
      showToast('Error signing out. Please try again.', 'error')
    } finally {
      setSigningOut(false)
      setShowSignOutModal(false)
    }
  }

  const handleSignOutCancel = () => {
    setShowSignOutModal(false)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="min-h-screen bg-bgBlack text-white flex relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className="w-64 glass-sidebar flex flex-col relative z-10"
          >
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
              <h1 className="text-2xl font-bold text-primary">mobiTrak</h1>
              <p className="text-sm text-gray-400 capitalize">{userRole} Dashboard</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {sidebarItems.map((item, index) => (
                  <li key={index}>
                    <button
                      onClick={item.onClick}
                      className="w-full flex items-center px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                    >
                      <span className="mr-3 text-xl group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-gray-400 capitalize">{userRole}</p>
                </div>
              </div>
              <button
                onClick={handleSignOutClick}
                className="w-full glass-button-secondary text-sm"
              >
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Top Navbar */}
        <header className="glass-navbar px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="mr-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.5L6.5 7.5 10.5 11.5" />
                </svg>
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSignOutModal}
        onClose={handleSignOutCancel}
        onConfirm={handleSignOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out? You'll need to log in again to access your dashboard."
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmButtonClass="bg-red-500 hover:bg-red-600 text-white"
        loading={signingOut}
      />
    </div>
  )
}

export default DashboardLayout
