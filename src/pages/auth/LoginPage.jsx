import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import ConfirmationModal from '../../components/ConfirmationModal'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [resendEmail, setResendEmail] = useState('')

  const { signIn, signInWithGoogle, resendVerification } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Note: Auto-redirect is now handled in App.jsx to prevent flash of login page

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await signIn(email, password)

      if (error) {
        if (error.message === 'Email not confirmed') {
          setShowConfirmation(true)
          setResendEmail(email)
          showToast(error.message, 'error')
        } else {
          showToast(error.message, 'error')
        }
      }
      // Redirect will be handled by useEffect when user and userRole are set
    } catch (err) {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setLoading(true)
    try {
      const { error } = await resendVerification(resendEmail)
      if (error) {
        showToast(error.message, 'error')
      } else {
        showToast('Verification email sent! Please check your inbox.', 'success')
      }
    } catch (err) {
      showToast('Failed to resend verification email', 'error')
    } finally {
      setLoading(false)
      setShowConfirmation(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)

    try {
      const { error } = await signInWithGoogle()
      if (error) {
        showToast(error.message, 'error')
      }
    } catch (err) {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bgBlack text-white">
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleResendVerification}
        title="Email Not Verified"
        message="Your email address has not been verified. Please check your inbox or resend the verification email."
        confirmText="Resend Email"
        loading={loading}
      />
      <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-bold text-primary">
              mobiTrak
            </Link>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-3xl font-bold text-white"
            >
              Welcome back
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-gray-400"
            >
              Sign in to your account
            </motion.p>
          </div>

          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="enterprise-form"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="enterprise-input w-full"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="enterprise-input w-full"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-bgBlack"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full enterprise-button py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-darkGray text-gray-400">Or continue with</span>
                </div>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-6 w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Sign up link */}
            <p className="mt-6 text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Sign up
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage
