import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    terms: false
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [touched, setTouched] = useState({})
  
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Note: Auto-redirect is now handled in App.jsx to prevent flash of register page

  const roles = [
    {
      id: 'business',
      title: 'Business',
      description: 'Manage your fleet and operations',
      icon: '🏢'
    },
    {
      id: 'driver',
      title: 'Driver',
      description: 'Access trips and route management',
      icon: '🚗'
    },
    {
      id: 'customer',
      title: 'Customer',
      description: 'Book rides and track vehicles',
      icon: '👥'
    }
  ]

  // Validation patterns
  const validationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: {
      minLength: 8,
      hasUppercase: /[A-Z]/,
      hasLowercase: /[a-z]/,
      hasNumber: /\d/,
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
    }
  }

  // Validation function
  const validateField = (name, value) => {
    const errors = {}

    switch (name) {
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required'
        } else if (!validationPatterns.email.test(value)) {
          errors.email = 'Please enter a valid email address'
        }
        break

      case 'password':
        if (!value) {
          errors.password = 'Password is required'
        } else {
          const passwordErrors = []
          if (value.length < validationPatterns.password.minLength) {
            passwordErrors.push(`At least ${validationPatterns.password.minLength} characters`)
          }
          if (!validationPatterns.password.hasUppercase.test(value)) {
            passwordErrors.push('One uppercase letter')
          }
          if (!validationPatterns.password.hasLowercase.test(value)) {
            passwordErrors.push('One lowercase letter')
          }
          if (!validationPatterns.password.hasNumber.test(value)) {
            passwordErrors.push('One number')
          }
          if (!validationPatterns.password.hasSpecialChar.test(value)) {
            passwordErrors.push('One special character')
          }
          if (passwordErrors.length > 0) {
            errors.password = passwordErrors
          }
        }
        break

      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password'
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match'
        }
        break

      case 'terms':
        if (!value) {
          errors.terms = 'You must agree to the terms and conditions'
        }
        break

      default:
        break
    }

    return errors
  }

  // Real-time validation
  const validateForm = () => {
    const allErrors = {}
    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key, formData[key])
      Object.assign(allErrors, fieldErrors)
    })
    return allErrors
  }

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const currentErrors = validateForm()
    return Object.keys(currentErrors).length === 0 &&
           formData.email &&
           formData.password &&
           formData.confirmPassword &&
           formData.terms
  }, [formData])

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' }

    let score = 0
    const checks = [
      password.length >= 8,
      validationPatterns.password.hasUppercase.test(password),
      validationPatterns.password.hasLowercase.test(password),
      validationPatterns.password.hasNumber.test(password),
      validationPatterns.password.hasSpecialChar.test(password)
    ]

    score = checks.filter(Boolean).length

    if (score <= 2) return { score, label: 'Weak', color: 'text-red-400' }
    if (score <= 3) return { score, label: 'Fair', color: 'text-yellow-400' }
    if (score <= 4) return { score, label: 'Good', color: 'text-blue-400' }
    return { score, label: 'Strong', color: 'text-green-400' }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    setFormData({
      ...formData,
      [name]: newValue
    })

    // Mark field as touched
    setTouched({
      ...touched,
      [name]: true
    })

    // Real-time validation
    const fieldErrors = validateField(name, newValue)
    setErrors(prev => ({
      ...prev,
      ...fieldErrors,
      // Clear error if field is now valid
      ...(Object.keys(fieldErrors).length === 0 && { [name]: undefined })
    }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched({
      ...touched,
      [name]: true
    })

    // Validate on blur
    const fieldErrors = validateField(name, formData[name])
    setErrors(prev => ({
      ...prev,
      ...fieldErrors
    }))
  }

  const handleRoleSelect = (roleId) => {
    setFormData({
      ...formData,
      role: roleId
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched = {}
    Object.keys(formData).forEach(key => {
      allTouched[key] = true
    })
    setTouched(allTouched)

    // Validate entire form
    const formErrors = validateForm()
    setErrors(formErrors)

    // Check if form is valid
    if (Object.keys(formErrors).length > 0) {
      showToast('Please fix the errors below', 'error')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, formData.role)

      if (error) {
        showToast(error.message, 'error')
      } else {
        showToast('Registration successful! Please check your email to verify your account.', 'success')
        // Clear form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          role: 'customer',
          terms: false
        })
        setErrors({})
        setTouched({})
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (err) {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bgBlack text-white">
      <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"></div>
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>

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
            Create your account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-gray-400"
          >
            Join mobiTrak and start managing your fleet
          </motion.p>
        </div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="enterprise-form"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Select your role
              </label>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((role) => (
                  <motion.button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.role === role.id
                        ? 'border-primary bg-primary/20 text-white enterprise-card'
                        : 'enterprise-card border-white/20 text-gray-300 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{role.icon}</span>
                      <div>
                        <div className="font-semibold">{role.title}</div>
                        <div className="text-sm opacity-75">{role.description}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`enterprise-input w-full pr-10 ${
                    touched.email && errors.email
                      ? 'border-red-500 focus:border-red-500'
                      : touched.email && !errors.email && formData.email
                      ? 'border-green-500 focus:border-green-500'
                      : ''
                  }`}
                  placeholder="Enter your email"
                />
                {touched.email && formData.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {errors.email ? (
                      <X className="h-5 w-5 text-red-500" />
                    ) : (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              <AnimatePresence>
                {touched.email && errors.email && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-1 flex items-center text-red-400 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`enterprise-input w-full pr-20 ${
                    touched.password && errors.password
                      ? 'border-red-500 focus:border-red-500'
                      : touched.password && !errors.password && formData.password
                      ? 'border-green-500 focus:border-green-500'
                      : ''
                  }`}
                  placeholder="Create a password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  {touched.password && formData.password && (
                    <div className="pr-2">
                      {errors.password ? (
                        <X className="h-5 w-5 text-red-500" />
                      ) : (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pr-3 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Password strength:</span>
                    <span className={`text-sm font-medium ${getPasswordStrength(formData.password).color}`}>
                      {getPasswordStrength(formData.password).label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getPasswordStrength(formData.password).score <= 2 ? 'bg-red-500' :
                        getPasswordStrength(formData.password).score <= 3 ? 'bg-yellow-500' :
                        getPasswordStrength(formData.password).score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(getPasswordStrength(formData.password).score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              <AnimatePresence>
                {touched.password && errors.password && Array.isArray(errors.password) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 space-y-1"
                  >
                    <div className="text-sm text-gray-400 mb-1">Password must contain:</div>
                    {errors.password.map((requirement, index) => (
                      <div key={index} className="flex items-center text-red-400 text-sm">
                        <X className="h-3 w-3 mr-1" />
                        {requirement}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`enterprise-input w-full pr-20 ${
                    touched.confirmPassword && errors.confirmPassword
                      ? 'border-red-500 focus:border-red-500'
                      : touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword
                      ? 'border-green-500 focus:border-green-500'
                      : ''
                  }`}
                  placeholder="Confirm your password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  {touched.confirmPassword && formData.confirmPassword && (
                    <div className="pr-2">
                      {errors.confirmPassword ? (
                        <X className="h-5 w-5 text-red-500" />
                      ) : (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="pr-3 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {touched.confirmPassword && errors.confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-1 flex items-center text-red-400 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Terms */}
            <div>
              <div className="flex items-start">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  checked={formData.terms}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`h-4 w-4 mt-1 text-primary focus:ring-primary border-gray-600 rounded bg-bgBlack ${
                    touched.terms && errors.terms ? 'border-red-500' : ''
                  }`}
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
                  I agree to the{' '}
                  <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>
              <AnimatePresence>
                {touched.terms && errors.terms && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-1 flex items-center text-red-400 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.terms}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                loading || !isFormValid
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'enterprise-button hover:scale-105 active:scale-95'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
      </div>
    </div>
  )
}

export default RegisterPage
