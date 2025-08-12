import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { redirectToDashboard } from '../utils/navigation'
import ConfirmationModal from '../components/ConfirmationModal'

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const { user, userRole, signOut, forceSignOut } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  // Note: Auto-redirect is now handled in App.jsx to prevent flash of landing page

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  const handleSignOutClick = () => {
    setShowSignOutModal(true)
    setIsMenuOpen(false)
  }

  const handleSignOutConfirm = async () => {
    setSigningOut(true)
    console.log('Landing page signout initiated...')

    try {
      // Await signout completion
      const { error } = await signOut()

      if (error) {
        console.error('SignOut failed:', error)
        showToast('Error signing out. Please try again.', 'error')
      } else {
        console.log('SignOut successful from landing page')
        showToast('Successfully signed out', 'success')
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

  const handleDashboardClick = () => {
    if (user && userRole) {
      redirectToDashboard(userRole, navigate)
    }
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-bgBlack text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full glass-navbar z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
            >
              <span className="text-2xl font-bold text-primary">mobiTrak</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('home')}
                className="text-white hover:text-primary transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-white hover:text-primary transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-white hover:text-primary transition-colors"
              >
                Contact
              </button>

              {user ? (
                // Logged in user navigation
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300 text-sm">
                    Welcome, {user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={handleDashboardClick}
                    className="glass-button"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleSignOutClick}
                    className="glass-button-secondary"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                // Guest navigation
                <Link
                  to="/login"
                  className="glass-button"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-primary"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden glass-card mt-2 p-4"
            >
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection('home')}
                  className="text-white hover:text-primary transition-colors text-left"
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-white hover:text-primary transition-colors text-left"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="text-white hover:text-primary transition-colors text-left"
                >
                  Contact
                </button>

                {user ? (
                  // Logged in user mobile navigation
                  <>
                    <div className="border-t border-gray-600 pt-4">
                      <p className="text-gray-300 text-sm mb-3">
                        Welcome, {user.email?.split('@')[0]}
                      </p>
                      <button
                        onClick={handleDashboardClick}
                        className="w-full glass-button text-center mb-2"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={handleSignOutClick}
                        className="w-full glass-button-secondary text-center"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  // Guest mobile navigation
                  <Link
                    to="/login"
                    className="glass-button text-center"
                  >
                    Login
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </nav>



      {/* Hero Section */}
      <section id="home" className="pt-16 min-h-screen flex items-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center glass-hero p-12">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="text-white">mobi</span>
              <span className="text-primary">Trak</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              Advanced Vehicle Fleet Management and Tracking Platform
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto"
            >
              Streamline your fleet operations with real-time tracking, intelligent routing, 
              and comprehensive management tools designed for businesses, drivers, and customers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/register"
                className="glass-button px-8 py-4 text-lg font-semibold"
              >
                Get Started
              </Link>
              <button
                onClick={() => scrollToSection('about')}
                className="glass-button-secondary px-8 py-4 text-lg font-semibold"
              >
                Learn More
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose mobiTrak?</h2>
            <p className="text-xl text-gray-300">Comprehensive fleet management for every stakeholder</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Business Dashboard",
                description: "Complete fleet overview, trip analytics, and maintenance scheduling",
                icon: "🏢"
              },
              {
                title: "Driver Portal",
                description: "Trip assignments, route optimization, and performance tracking",
                icon: "🚗"
              },
              {
                title: "Customer Access",
                description: "Real-time booking, trip history, and vehicle information",
                icon: "👥"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="glass-card p-8 hover:bg-white/15 transition-all duration-300 group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-4 text-primary group-hover:text-white transition-colors duration-300">{feature.title}</h3>
                <p className="text-gray-300 group-hover:text-white transition-colors duration-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-8">About mobiTrak</h2>
            <div className="max-w-4xl mx-auto glass-card p-8">
              <p className="text-lg text-gray-300 mb-6">
                mobiTrak is a cutting-edge vehicle fleet management platform designed to revolutionize
                how businesses manage their transportation operations. Our comprehensive solution provides
                real-time insights, streamlined operations, and enhanced communication between all stakeholders.
              </p>
              <p className="text-lg text-gray-300">
                Whether you're a business owner managing a large fleet, a driver looking for efficient
                route management, or a customer seeking transparent service tracking, mobiTrak delivers
                the tools you need for success.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-transparent to-primary/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold mb-8">Get in Touch</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Ready to transform your fleet management? Contact us today to learn more about 
              how mobiTrak can optimize your operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
              <div className="text-center glass-card p-6">
                <h3 className="text-xl font-semibold text-primary mb-2">Email</h3>
                <p className="text-gray-300">contact@mobitrak.com</p>
              </div>
              <div className="text-center glass-card p-6">
                <h3 className="text-xl font-semibold text-primary mb-2">Phone</h3>
                <p className="text-gray-300">+1 (555) 123-4567</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-navbar py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-4">mobiTrak</div>
            <p className="text-gray-400 mb-4">© 2024 mobiTrak. All rights reserved.</p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSignOutModal}
        onClose={handleSignOutCancel}
        onConfirm={handleSignOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out? You'll be redirected to the home page."
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmButtonClass="bg-red-500 hover:bg-red-600 text-white"
        loading={signingOut}
      />
    </div>
  )
}

export default LandingPage
