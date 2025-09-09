import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import DashboardCard from '../../components/DashboardCard'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Route,
  CheckCircle,
  DollarSign,
  Star
} from 'lucide-react'

const DriverDashboard = () => {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)

  const { supabase, user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const sidebarItems = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'Overview',
      onClick: () => {}
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ), 
      label: 'My Trips', 
      onClick: () => {} 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 2m8-2l2 2m-2-2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9z" />
        </svg>
      ), 
      label: 'Schedule', 
      onClick: () => {} 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      label: 'Performance', 
      onClick: () => {} 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      label: 'Vehicle Status', 
      onClick: () => {} 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ), 
      label: 'Earnings', 
      onClick: () => {} 
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Profile',
      onClick: () => navigate('/profile/driver')
    },
  ]

  // Fetch profile data for overview
  const fetchProfile = useCallback(async () => {
    if (!user?.id || !supabase) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('profile_complete, full_name, license_number')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfileData(data);
        setProfileComplete(data.profile_complete || false);
      } else {
        // No profile exists yet, create one
        const { error: insertError } = await supabase
          .from('driver_profiles')
          .insert([{ user_id: user.id }]);

        if (insertError) {
          console.error('Error creating driver profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase, showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const renderOverviewSection = () => (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Today's Trips"
          value="5"
          subtitle="Scheduled for today"
          icon={<Route className="w-6 h-6" />}
          trend="neutral"
          trendValue="Same as yesterday"
        />
        <DashboardCard
          title="Completed"
          value="3"
          subtitle="Trips finished"
          icon={<CheckCircle className="w-6 h-6" />}
          trend="up"
          trendValue="+1"
        />
        <DashboardCard
          title="Earnings Today"
          value="$245"
          subtitle="Total earned"
          icon={<DollarSign className="w-6 h-6" />}
          trend="up"
          trendValue="+15%"
        />
        <DashboardCard
          title="Rating"
          value="4.9"
          subtitle="Customer rating"
          icon={<Star className="w-6 h-6" />}
          trend="up"
          trendValue="+0.1"
        />
      </div>

      {/* Current Trip Status */}
      <div className="mb-8">
        <DashboardCard title="Current Trip Status" className="bg-primary/10 border-primary/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-primary mb-2">Trip #1247</h4>
              <p className="text-sm text-gray-300">Pickup: Downtown Mall</p>
              <p className="text-sm text-gray-300">Destination: Airport Terminal 2</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">Customer</h4>
              <p className="text-sm text-gray-300">Sarah Johnson</p>
              <p className="text-sm text-gray-300">Phone: (555) 123-4567</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">Status</h4>
              <p className="text-sm text-green-400 font-semibold">En Route to Pickup</p>
              <p className="text-sm text-gray-300">ETA: 8 minutes</p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Trips */}
        <DashboardCard title="Upcoming Trips" className="col-span-1">
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">Trip #1248</h4>
                  <p className="text-sm text-gray-300">Business District → Hotel Plaza</p>
                  <p className="text-xs text-gray-500">2:30 PM - 3:15 PM</p>
                </div>
                <span className="text-primary font-semibold">$28</span>
              </div>
            </div>
            <div className="border-l-4 border-gray-600 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">Trip #1249</h4>
                  <p className="text-sm text-gray-300">Residential Area → Shopping Center</p>
                  <p className="text-xs text-gray-500">4:00 PM - 4:45 PM</p>
                </div>
                <span className="text-primary font-semibold">$22</span>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Recent Activity */}
        <DashboardCard title="Recent Activity" className="col-span-1">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Completed trip to Airport - $45</span>
              <span className="text-xs text-gray-500 ml-auto">1h ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">New trip request accepted</span>
              <span className="text-xs text-gray-500 ml-auto">2h ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Vehicle inspection reminder</span>
              <span className="text-xs text-gray-500 ml-auto">3h ago</span>
            </div>
          </div>
        </DashboardCard>
      </div>
    </>
  );

  // Profile completion section in overview
  const renderProfileCompletionSection = () => (
    !profileComplete && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="enterprise-card p-6 mb-8 border-l-4 border-yellow-500"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400">Complete Your Driver Profile</h3>
              <p className="text-gray-300">Fill in your driving license information to start receiving ride requests.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile/driver')}
            className="enterprise-button px-6 py-2 text-sm font-medium"
          >
            Complete Profile
          </button>
        </div>
      </motion.div>
    )
  );

  return (
    <DashboardLayout
      title="Driver Dashboard"
      sidebarItems={sidebarItems}
    >
      {renderProfileCompletionSection()}
      {renderOverviewSection()}
    </DashboardLayout>
  );
};

export default DriverDashboard;
