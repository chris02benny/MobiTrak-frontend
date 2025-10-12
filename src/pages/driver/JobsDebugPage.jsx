import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';

const JobsDebugPage = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      runDebugTests();
    }
  }, [user]);

  const runDebugTests = async () => {
    setLoading(true);
    const info = {};

    try {
      // Test 1: Check user info
      info.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      // Test 2: Check driver profile
      const { data: driverProfile, error: driverError } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      info.driverProfile = {
        data: driverProfile,
        error: driverError
      };

      if (driverProfile) {
        // Test 3: Check job offers directly
        const { data: jobOffers, error: jobOffersError } = await supabase
          .from('job_offers')
          .select('*')
          .eq('driver_id', driverProfile.id);

        info.jobOffers = {
          data: jobOffers,
          error: jobOffersError
        };

        // Test 4: Check business profiles
        if (jobOffers && jobOffers.length > 0) {
          const businessIds = jobOffers.map(offer => offer.business_id);
          const { data: businessProfiles, error: businessError } = await supabase
            .from('business_profiles')
            .select('*')
            .in('id', businessIds);

          info.businessProfiles = {
            data: businessProfiles,
            error: businessError
          };
        }
      }

      // Test 5: Check RLS policies
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_table_policies', { table_name: 'job_offers' })
        .catch(() => ({ data: null, error: 'RPC not available' }));

      info.policies = {
        data: policies,
        error: policiesError
      };

    } catch (error) {
      info.error = error.message;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Jobs Debug Page</h1>
        
        {loading ? (
          <div className="text-white">Loading debug info...</div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">User Information</h2>
              <pre className="text-green-400 text-sm overflow-auto">
                {JSON.stringify(debugInfo.user, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Driver Profile</h2>
              <pre className="text-green-400 text-sm overflow-auto">
                {JSON.stringify(debugInfo.driverProfile, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Job Offers</h2>
              <pre className="text-green-400 text-sm overflow-auto">
                {JSON.stringify(debugInfo.jobOffers, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Business Profiles</h2>
              <pre className="text-green-400 text-sm overflow-auto">
                {JSON.stringify(debugInfo.businessProfiles, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Policies</h2>
              <pre className="text-green-400 text-sm overflow-auto">
                {JSON.stringify(debugInfo.policies, null, 2)}
              </pre>
            </div>

            {debugInfo.error && (
              <div className="bg-red-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Error</h2>
                <pre className="text-red-400 text-sm overflow-auto">
                  {debugInfo.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsDebugPage;



