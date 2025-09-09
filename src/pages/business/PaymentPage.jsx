import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import DashboardLayout from '../../components/DashboardLayout'

const PaymentPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')

  const planType = location.state?.planType || 'pro'

  const handlePayment = async () => {
    setProcessing(true)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Call backend to upgrade subscription
      const response = await fetch('http://localhost:5000/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: user.id,
          payment_method: paymentMethod,
          transaction_id: `mock_txn_${Date.now()}`,
          plan_type: 'pro'
        }),
      })

      if (response.ok) {
        showToast('Payment successful! Welcome to Pro plan!', 'success')
        navigate('/business/subscription')
      } else {
        showToast('Payment failed. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Payment error:', error)
      showToast('Payment processing failed', 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-bgBlack text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Complete Your <span className="text-primary">Pro Subscription</span>
            </h1>
            <p className="text-gray-400">
              You're just one step away from unlocking unlimited vehicles and premium features
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card p-6 rounded-2xl"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white font-semibold">Pro Monthly</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Billing Cycle</span>
                  <span className="text-white">Monthly</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Features</span>
                  <span className="text-green-400">Unlimited</span>
                </div>
                <hr className="border-gray-600" />
                <div className="flex justify-between items-center text-lg">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-primary font-bold">₹6,999/month</span>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <h3 className="text-primary font-semibold mb-2">What you'll get:</h3>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>✓ Unlimited vehicle management</li>
                  <li>✓ Live cabin monitoring</li>
                  <li>✓ Advanced analytics & reporting</li>
                  <li>✓ Priority customer support</li>
                  <li>✓ Custom integrations</li>
                </ul>
              </div>
            </motion.div>

            {/* Payment Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-card p-6 rounded-2xl"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Payment Details</h2>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Payment Method
                </label>
                <div className="space-y-3">
                  {[
                    { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
                    { id: 'upi', label: 'UPI', icon: '📱' },
                    { id: 'netbanking', label: 'Net Banking', icon: '🏦' }
                  ].map((method) => (
                    <label key={method.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-primary bg-gray-700 border-gray-600 focus:ring-primary"
                      />
                      <span className="text-xl">{method.icon}</span>
                      <span className="text-gray-300">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mock Payment Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full glass-input p-3 rounded-xl bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full glass-input p-3 rounded-xl bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full glass-input p-3 rounded-xl bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full glass-input p-3 rounded-xl bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-primary to-yellow-400 text-black font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                      />
                      <span>Processing Payment...</span>
                    </div>
                  ) : (
                    `Pay ₹6,999 - Activate Pro Plan`
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/business/subscription')}
                  className="w-full glass-button py-3 px-6 rounded-xl font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  Back to Plans
                </motion.button>
              </div>

              {/* Security Note */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  🔒 Your payment information is secure and encrypted
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PaymentPage
