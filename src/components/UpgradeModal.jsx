import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const UpgradeModal = ({ 
  isOpen, 
  onClose, 
  currentCount, 
  vehicleLimit,
  loading = false 
}) => {
  const navigate = useNavigate()

  const handleUpgrade = () => {
    onClose()
    navigate('/business/subscription')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="glass-card max-w-md w-full p-8 rounded-2xl border border-gray-600/50 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Vehicle Limit Reached</h3>
              <p className="text-gray-400">
                You've reached your vehicle limit of {vehicleLimit} vehicles. 
                Upgrade to Pro to add unlimited vehicles.
              </p>
            </div>

            {/* Current Status */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Current Plan</span>
                <span className="text-primary font-semibold">Free</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Vehicles Used</span>
                <span className="text-white font-semibold">{currentCount}/{vehicleLimit}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((currentCount / vehicleLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Pro Plan Benefits */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Pro Plan Benefits</h4>
              <ul className="space-y-2">
                {[
                  'Unlimited vehicles',
                  'Live cabin monitoring',
                  'Advanced analytics',
                  'Priority support',
                  'Custom integrations'
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-300 text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-r from-primary/10 to-yellow-400/10 rounded-xl p-4 mb-6 border border-primary/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">₹6,999</div>
                <div className="text-sm text-gray-400">per month</div>
                <div className="text-xs text-gray-500 mt-1">Cancel anytime</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 glass-button py-3 px-4 rounded-xl font-semibold text-gray-300 hover:text-white transition-colors"
              >
                Maybe Later
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpgrade}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary to-yellow-400 text-black font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                    />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Upgrade to Pro'
                )}
              </motion.button>
            </div>

            {/* Security Note */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                🔒 Secure payment processing • Cancel anytime
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default UpgradeModal
