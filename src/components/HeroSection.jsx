import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const HeroSection = () => {
  return (
    <section className="pt-24 min-h-screen flex items-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                Fleet Management Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              Transform Your{' '}
              <span className="text-primary">Fleet</span>{' '}
              Operations
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl"
            >
              Streamline your vehicle management with real-time tracking, intelligent routing, 
              and comprehensive analytics designed for modern businesses.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Link
                to="/register"
                className="group enterprise-button px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-300"
              >
                Try for Free
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
              <button className="enterprise-button-secondary px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-300">
                Watch Demo
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-3 gap-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-gray-400">Active Fleets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-gray-400">Support</div>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Visual Cards */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="grid grid-cols-2 gap-6"
            >
              {/* Dashboard Preview Card */}
              <div className="enterprise-card p-6 hover:scale-105 transition-all duration-300 group">
                <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-4xl">📊</div>
                </div>
                <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                  Analytics Dashboard
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  Real-time insights and performance metrics
                </p>
              </div>

              {/* Fleet Tracking Card */}
              <div className="enterprise-card p-6 hover:scale-105 transition-all duration-300 group mt-8">
                <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-4xl">🗺️</div>
                </div>
                <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                  Live Tracking
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  Monitor your fleet in real-time
                </p>
              </div>

              {/* Mobile App Card */}
              <div className="enterprise-card p-6 hover:scale-105 transition-all duration-300 group -mt-4">
                <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-4xl">📱</div>
                </div>
                <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                  Mobile Ready
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  Access anywhere, anytime
                </p>
              </div>

              {/* AI Optimization Card */}
              <div className="enterprise-card p-6 hover:scale-105 transition-all duration-300 group">
                <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-4xl">🤖</div>
                </div>
                <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                  AI Optimization
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  Smart route planning and efficiency
                </p>
              </div>
            </motion.div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-float"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-float" style={{animationDelay: '2s'}}></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
