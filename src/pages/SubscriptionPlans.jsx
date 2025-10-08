import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      // Mock plans data - in real app, this would come from API
      const mockPlans = [
        {
          id: 'free',
          name: 'Free Plan',
          price: 0,
          currency: 'INR',
          interval: 'month',
          features: [
            'Up to 5 vehicles',
            'Basic fleet management',
            'Email support',
            'Standard reporting'
          ],
          vehicle_limit: 5,
          cabin_monitoring: false
        },
        {
          id: 'pro',
          name: 'Pro Plan',
          price: 2999,
          currency: 'INR',
          interval: 'month',
          features: [
            'Unlimited vehicles',
            'Advanced fleet management',
            'Live cabin monitoring',
            'Priority support',
            'Advanced analytics',
            'Custom reporting'
          ],
          vehicle_limit: null,
          cabin_monitoring: true
        }
      ];
      setPlans(mockPlans);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err.message);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const { data: subscription, error } = await supabase
        .from('user_profiles')
        .select('subscription_type, vehicle_limit, cabin_monitoring_enabled')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCurrentSubscription(subscription);
    } catch (err) {
      console.error('Error fetching current subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (planId) => {
    if (planId === currentSubscription?.subscription_type) {
      return; // Already on this plan
    }

    try {
      setProcessing(true);
      setError(null);

      if (planId === 'free') {
        // Downgrade to free plan
        const { error } = await supabase
          .from('user_profiles')
          .update({
            subscription_type: 'free',
            vehicle_limit: 5,
            cabin_monitoring_enabled: false
          })
          .eq('id', user.id);

        if (error) throw error;

        setCurrentSubscription({
          subscription_type: 'free',
          vehicle_limit: 5,
          cabin_monitoring_enabled: false
        });

        alert('Successfully downgraded to Free plan!');
      } else {
        // Create payment order for pro plan
        const response = await fetch('/api/subscriptions/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`
          },
          body: JSON.stringify({
            plan_id: planId,
            interval: 'month'
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        // Initialize Razorpay
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: result.data.amount,
          currency: result.data.currency,
          name: 'mobiTrak',
          description: `${result.data.plan_id} Plan Subscription`,
          order_id: result.data.order_id,
          handler: async function (response) {
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/subscriptions/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.access_token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan_id: planId,
                  interval: 'month'
                })
              });

              const verifyResult = await verifyResponse.json();

              if (verifyResult.success) {
                setCurrentSubscription(verifyResult.data);
                alert('Subscription activated successfully!');
              } else {
                throw new Error(verifyResult.message);
              }
            } catch (err) {
              console.error('Payment verification error:', err);
              setError(err.message);
            }
          },
          prefill: {
            name: user.user_metadata?.full_name || '',
            email: user.email,
            contact: user.user_metadata?.phone || ''
          },
          theme: {
            color: '#3B82F6'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error('Error processing subscription:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Select the perfect plan for your fleet management needs
          </p>
        </div>

        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-2">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.subscription_type === plan.id;
            const isPopular = plan.id === 'pro';

            return (
              <div
                key={plan.id}
                className={`relative border rounded-2xl shadow-sm divide-y divide-gray-200 ${
                  isPopular ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">
                    {plan.name}
                  </h2>
                  <p className="mt-4 text-sm text-gray-500">
                    {plan.id === 'free' 
                      ? 'Perfect for small fleets getting started'
                      : 'Advanced features for growing businesses'
                    }
                  </p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ₹{plan.price}
                    </span>
                    <span className="text-base font-medium text-gray-500">
                      /{plan.interval}
                    </span>
                  </p>
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={processing || isCurrentPlan}
                    className={`mt-8 block w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isCurrentPlan
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isPopular
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isPopular ? 'focus:ring-blue-500' : 'focus:ring-gray-500'
                    }`}
                  >
                    {processing
                      ? 'Processing...'
                      : isCurrentPlan
                      ? 'Current Plan'
                      : plan.id === 'free'
                      ? 'Downgrade to Free'
                      : 'Upgrade to Pro'
                    }
                  </button>
                </div>

                <div className="pt-6 pb-8 px-6">
                  <h3 className="text-sm font-medium text-gray-900">
                    What's included
                  </h3>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex space-x-3">
                        <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Need help choosing? Contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
