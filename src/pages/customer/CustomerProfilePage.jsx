import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import { motion } from 'framer-motion';

const CustomerProfilePage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [workAddress, setWorkAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const { supabase, user, userRole } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('first_name, last_name, phone, home_address, work_address, profile_complete')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setPhone(data.phone || '');
        setHomeAddress(data.home_address || '');
        setWorkAddress(data.work_address || '');
        setProfileComplete(data.profile_complete || false);
      } else {
        // No profile exists yet, create one
        const { error: insertError } = await supabase
          .from('customer_profiles')
          .insert([{ user_id: user.id }]);

        if (insertError) {
          console.error('Error creating customer profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('customer_profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          home_address: homeAddress,
          work_address: workAddress
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update profile completion status
      const isComplete = firstName && lastName && phone && homeAddress;
      if (isComplete) {
        await supabase
          .from('customer_profiles')
          .update({ profile_complete: true })
          .eq('user_id', user.id);
      }

      showToast('Profile updated successfully!', 'success');
      navigate('/dashboard/customer');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sidebar items for customer dashboard
  const sidebarItems = [
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      label: 'Dashboard', 
      onClick: () => navigate('/dashboard/customer')
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Profile',
      onClick: () => {} // Current page
    },
  ];

  return (
    <DashboardLayout title="Customer Profile" sidebarItems={sidebarItems}>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="enterprise-card p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-black font-bold text-xl">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user?.email}</h1>
              <p className="text-gray-400 capitalize">{userRole} Account</p>
              <div className="flex items-center mt-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${profileComplete ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={`text-sm ${profileComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                  {profileComplete ? 'Profile Complete' : 'Profile Incomplete'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Completion Status */}
        {!profileComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="enterprise-card p-6 mb-8 border-l-4 border-yellow-500"
          >
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-yellow-400">Complete Your Profile</h3>
                <p className="text-gray-300">Please fill in your information for a better ride booking experience.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Form */}
        <div className="enterprise-card p-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">Personal Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-gray-300 text-sm font-bold mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="enterprise-input w-full"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-gray-300 text-sm font-bold mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="enterprise-input w-full"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-gray-300 text-sm font-bold mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                className="enterprise-input w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Contact number for ride coordination</p>
            </div>

            {/* Home Address */}
            <div>
              <label htmlFor="homeAddress" className="block text-gray-300 text-sm font-bold mb-2">
                Home Address *
              </label>
              <input
                type="text"
                id="homeAddress"
                className="enterprise-input w-full"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="Enter your home address"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Your primary residence address</p>
            </div>

            {/* Work Address */}
            <div>
              <label htmlFor="workAddress" className="block text-gray-300 text-sm font-bold mb-2">
                Work Address (Optional)
              </label>
              <input
                type="text"
                id="workAddress"
                className="enterprise-input w-full"
                value={workAddress}
                onChange={(e) => setWorkAddress(e.target.value)}
                placeholder="Enter your work address"
              />
              <p className="text-xs text-gray-500 mt-1">Your workplace address for quick booking</p>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                className="enterprise-button flex-1 py-3"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2"
                    />
                    Updating Profile...
                  </div>
                ) : (
                  'Update Profile'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/dashboard/customer')}
                className="enterprise-button-secondary flex-1 py-3"
                disabled={loading}
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>

        {/* Profile Tips */}
        <div className="enterprise-card p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4 text-white">Profile Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold">Quick Booking:</span> Save time with pre-filled addresses.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold">Better Service:</span> Drivers can contact you directly.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold">Personalized Experience:</span> Customized ride recommendations.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold">Safety:</span> Verified contact information for security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerProfilePage;
