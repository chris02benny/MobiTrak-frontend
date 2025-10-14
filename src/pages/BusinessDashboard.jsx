import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { businessSidebarItems } from '../config/businessSidebarConfig';
import DashboardCard from '../components/DashboardCard';
import { 
  CarIcon, 
  UserGroupIcon, 
  CurrencyRupeeIcon, 
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

const BusinessDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get business profile
      const { data: businessProfile, error: profileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Get dashboard data from view
      const { data: dashboard, error: dashboardError } = await supabase
        .from('business_dashboard_view')
        .select('*')
        .eq('business_id', user.id)
        .maybeSingle();

      if (dashboardError) {
        console.warn('Dashboard view error:', dashboardError);
        // Don't throw error, just use empty stats
      }

      setDashboardData({
        profile: businessProfile,
        stats: dashboard || {
          total_vehicles: 0,
          available_vehicles: 0,
          vehicles_in_use: 0,
          total_drivers: 0,
          available_drivers: 0,
          hired_drivers: 0,
          total_rentals: 0,
          active_rentals: 0,
          completed_rentals: 0,
          total_revenue: 0,
          monthly_revenue: 0
        }
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Vehicles',
      value: dashboardData?.stats?.total_vehicles || 0,
      icon: CarIcon,
      color: 'blue',
      link: '/business/vehicles'
    },
    {
      title: 'Available Vehicles',
      value: dashboardData?.stats?.available_vehicles || 0,
      icon: EyeIcon,
      color: 'green',
      link: '/business/vehicles'
    },
    {
      title: 'Hired Drivers',
      value: dashboardData?.stats?.hired_drivers || 0,
      icon: UserGroupIcon,
      color: 'purple',
      link: '/business/drivers'
    },
    {
      title: 'Total Rentals',
      value: dashboardData?.stats?.total_rentals || 0,
      icon: ChartBarIcon,
      color: 'orange',
      link: '/business/rentals'
    },
    {
      title: 'Active Rentals',
      value: dashboardData?.stats?.active_rentals || 0,
      icon: CurrencyRupeeIcon,
      color: 'emerald',
      link: '/business/rentals'
    },
    {
      title: 'Business Rating',
      value: dashboardData?.stats?.business_rating ? 
        `${dashboardData.stats.business_rating.toFixed(1)}/5` : 'No ratings',
      icon: ChartBarIcon,
      color: 'yellow',
      link: '/business/reviews'
    }
  ];

  const quickActions = [
    {
      title: 'Add Vehicle',
      description: 'Add a new vehicle to your fleet',
      icon: PlusIcon,
      color: 'blue',
      link: '/business/vehicles'
    },
    {
      title: 'Hire Driver',
      description: 'Find and hire available drivers',
      icon: UserPlusIcon,
      color: 'green',
      link: '/business/drivers/hire'
    },
    {
      title: 'View Rentals',
      description: 'Manage rental requests',
      icon: EyeIcon,
      color: 'purple',
      link: '/business/rentals'
    },
    {
      title: 'Subscription',
      description: 'Manage your subscription plan',
      icon: ChartBarIcon,
      color: 'orange',
      link: '/business/subscription'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout sidebarItems={businessSidebarItems}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout sidebarItems={businessSidebarItems}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading dashboard
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  
  return (
    <DashboardLayout sidebarItems={businessSidebarItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Business Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {dashboardData?.profile?.business_name || user.email}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => window.location.href = '/business/vehicles'}
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Vehicle
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {statsCards.map((card, index) => (
            <DashboardCard
              key={index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              link={card.link}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => window.location.href = action.link}
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div>
                    <span className={`rounded-lg inline-flex p-3 bg-${action.color}-50 text-${action.color}-700 ring-4 ring-white`}>
                      <action.icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {action.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                  <span
                    className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                    aria-hidden="true"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="flow-root">
              <ul className="-mb-8">
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <CarIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Dashboard loaded successfully
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          Just now
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BusinessDashboard;
