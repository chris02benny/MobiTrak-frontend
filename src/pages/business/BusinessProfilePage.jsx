import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import { motion } from 'framer-motion';

const BusinessProfilePage = () => {
  const [companyName, setCompanyName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [businessType, setBusinessType] = useState('');
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
        .from('business_profiles')
        .select('company_name, business_address, contact_phone, business_type, profile_complete')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCompanyName(data.company_name || '');
        setBusinessAddress(data.business_address || '');
        setContactPhone(data.contact_phone || '');
        setBusinessType(data.business_type || '');
        setProfileComplete(data.profile_complete || false);
      } else {
        // No profile exists yet, create one
        const { error: insertError } = await supabase
          .from('business_profiles')
          .insert([{ user_id: user.id }]);

        if (insertError) {
          console.error('Error creating business profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
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
        .from('business_profiles')
        .update({
          company_name: companyName,
          business_address: businessAddress,
          contact_phone: contactPhone,
          business_type: businessType
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update profile completion status
      const isComplete = companyName && businessAddress && contactPhone && businessType;
      if (isComplete) {
        await supabase
          .from('business_profiles')
          .update({ profile_complete: true })
          .eq('user_id', user.id);
      }

      showToast('Business profile updated successfully!', 'success');
      navigate('/dashboard/business');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sidebar items for business dashboard
  const sidebarItems = [
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      label: 'Dashboard', 
      onClick: () => navigate('/dashboard/business')
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: 'Business Profile',
      onClick: () => {} // Current page
    },
  ];

  return (
    <DashboardLayout title="Business Profile" sidebarItems={sidebarItems}>
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
                <h3 className="text-lg font-semibold text-yellow-400">Complete Your Business Profile</h3>
                <p className="text-gray-300">Please fill in all required information to start managing your fleet and drivers.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Form */}
        <div className="enterprise-card p-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">Business Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <label htmlFor="companyName" className="block text-gray-300 text-sm font-bold mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  className="enterprise-input w-full"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your company name"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Legal business name</p>
              </div>

              {/* Contact Phone */}
              <div>
                <label htmlFor="contactPhone" className="block text-gray-300 text-sm font-bold mb-2">
                  Business Phone *
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  className="enterprise-input w-full"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Enter business phone number"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Primary business contact number</p>
              </div>
            </div>

            {/* Business Address */}
            <div>
              <label htmlFor="businessAddress" className="block text-gray-300 text-sm font-bold mb-2">
                Business Address *
              </label>
              <input
                type="text"
                id="businessAddress"
                className="enterprise-input w-full"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Enter complete business address"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Primary business location</p>
            </div>

            {/* Business Type */}
            <div>
              <label htmlFor="businessType" className="block text-gray-300 text-sm font-bold mb-2">
                Business Type *
              </label>
              <select
                id="businessType"
                className="enterprise-input w-full"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                required
              >
                <option value="">Select business type</option>
                <option value="transportation">Transportation Company</option>
                <option value="logistics">Logistics & Delivery</option>
                <option value="rideshare">Ride Share Service</option>
                <option value="taxi">Taxi Service</option>
                <option value="courier">Courier Service</option>
                <option value="other">Other</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Type of transportation business</p>
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
                  'Update Business Profile'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/dashboard/business')}
                className="enterprise-button-secondary flex-1 py-3"
                disabled={loading}
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BusinessProfilePage;
