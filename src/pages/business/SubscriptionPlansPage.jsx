import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { Shield } from 'lucide-react'

const SubscriptionPlansPage = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [subscriptionData, setSubscriptionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    fetchSubscriptionData()
  }, [user])

  const fetchSubscriptionData = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`http://localhost:5000/subscription/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData(data)
      } else {
        showToast('Failed to fetch subscription data', 'error')
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
      showToast('Error loading subscription information', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = (planType) => {
    if (planType === 'free') {
      // Handle free plan selection - could be a downgrade
      handleFreePlanSelection()
    } else {
      // Handle Pro plan selection - upgrade directly
      handleProPlanSelection()
    }
  }

  const handleFreePlanSelection = async () => {
    setUpgrading(true)
    try {
      const response = await fetch('http://localhost:5000/subscription/downgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: user.id
        }),
      })

      if (response.ok) {
        showToast('Successfully switched to Free plan', 'success')
        await fetchSubscriptionData() // Refresh data
      } else {
        showToast('Failed to update subscription', 'error')
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
      showToast('Error updating subscription', 'error')
    } finally {
      setUpgrading(false)
    }
  }

  const handleProPlanSelection = async () => {
    setUpgrading(true)
    try {
      const response = await fetch('http://localhost:5000/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: user.id,
          plan_type: 'pro'
        }),
      })

      if (response.ok) {
        showToast('Successfully upgraded to Pro plan!', 'success')
        await fetchSubscriptionData() // Refresh data
      } else {
        showToast('Failed to upgrade subscription', 'error')
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      showToast('Error upgrading subscription', 'error')
    } finally {
      setUpgrading(false)
    }
  }

  const PlanCard = ({
    title,
    price,
    period,
    features,
    isCurrentPlan,
    isPro,
    onUpgrade,
    planType
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass-card p-8 rounded-2xl border-2 relative overflow-hidden ${
        isPro 
          ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5' 
          : 'border-gray-600 bg-gray-800/50'
      }`}
    >
      {isPro && (
        <div className="absolute top-4 right-4 bg-primary text-black px-3 py-1 rounded-full text-sm font-semibold">
          Most Popular
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold text-primary">₹{price}</span>
          {period && <span className="text-gray-400 ml-2">/{period}</span>}
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center space-x-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              feature.included ? 'bg-green-500' : 'bg-gray-600'
            }`}>
              {feature.included ? (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-500'}`}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        {isCurrentPlan ? (
          <div className="w-full bg-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-xl text-center">
            Current Plan
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onUpgrade(planType)}
            disabled={upgrading}
            className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isPro
                ? 'bg-gradient-to-r from-primary to-yellow-400 text-black hover:shadow-lg'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {upgrading ? 'Processing...' : isPro ? 'Upgrade to Pro' : 'Switch to Free'}
          </motion.button>
        )}
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
          />
        </div>
      </DashboardLayout>
    )
  }

  const freeFeatures = [
    { text: 'Up to 5 vehicles', included: true },
    { text: 'Basic fleet management', included: true },
    { text: 'Vehicle tracking', included: true },
    { text: 'Basic reporting', included: true },
    { text: 'Live cabin monitoring', included: false },
    { text: 'Advanced analytics', included: false },
    { text: 'Unlimited vehicles', included: false },
    { text: 'Priority support', included: false },
    { text: 'Custom integrations', included: false }
  ]

  const proFeatures = [
    { text: 'Unlimited vehicles', included: true },
    { text: 'Advanced fleet management', included: true },
    { text: 'Vehicle tracking', included: true },
    { text: 'Real-time vehicle tracking', included: true },
    { text: 'Live cabin monitoring', included: true },
    { text: 'Advanced reporting & analytics', included: true },
    { text: 'IoT integration support', included: true },
    { text: 'Priority customer support', included: true },
    { text: 'Custom integrations', included: true }
  ]

  const currentPlan = subscriptionData?.subscription_type || 'free'

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-bgBlack text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your <span className="text-primary">Subscription Plan</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Select the perfect plan for your business needs. Upgrade or downgrade anytime.
            </p>
          </motion.div>

          {/* Current Status */}
          {subscriptionData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card p-6 rounded-xl mb-8 max-w-2xl mx-auto"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Current Subscription Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-400 text-sm">Current Plan</p>
                  <p className="text-primary font-semibold capitalize">{currentPlan}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Vehicles Used</p>
                  <p className="text-white font-semibold">
                    {subscriptionData.current_count}/{subscriptionData.vehicle_limit || 'Unlimited'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Cabin Monitoring</p>
                  <p className={`font-semibold ${subscriptionData.cabin_monitoring_enabled ? 'text-green-400' : 'text-red-400'}`}>
                    {subscriptionData.cabin_monitoring_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <PlanCard
              title="Free Plan"
              price="0"
              period=""
              features={freeFeatures}
              isCurrentPlan={currentPlan === 'free'}
              isPro={false}
              onUpgrade={handleUpgrade}
              planType="free"
            />

            <PlanCard
              title="Pro Plan"
              price="6,999"
              period="month"
              features={proFeatures}
              isCurrentPlan={currentPlan === 'pro'}
              isPro={true}
              onUpgrade={handleUpgrade}
              planType="pro"
            />
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-12"
          >
            <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Secure payment processing • Cancel anytime • 24/7 support
            </p>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SubscriptionPlansPage
