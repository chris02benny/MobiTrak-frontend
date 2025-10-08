import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { 
  UserIcon, 
  StarIcon, 
  ClockIcon, 
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const HireDrivers = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hiring, setHiring] = useState(null);

  useEffect(() => {
    fetchAvailableDrivers();
  }, []);

  const fetchAvailableDrivers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('driver_profiles')
        .select(`
          user_id,
          full_name,
          phone_number,
          years_of_experience,
          rating,
          license_type,
          specializations,
          city,
          state
        `)
        .eq('is_available_for_hire', true)
        .eq('profile_complete', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHireDriver = async (driverId) => {
    try {
      setHiring(driverId);
      
      const response = await fetch('/api/business/hire-driver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          driver_id: driverId
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      // Remove driver from available list
      setDrivers(prev => prev.filter(driver => driver.user_id !== driverId));
      
      alert('Driver hired successfully!');
    } catch (err) {
      console.error('Error hiring driver:', err);
      alert(`Error hiring driver: ${err.message}`);
    } finally {
      setHiring(null);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarIcon key="half" className="h-4 w-4 text-yellow-400 fill-current opacity-50" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Hire Drivers
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Find and hire qualified drivers for your fleet
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading drivers
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drivers List */}
        {drivers.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No drivers available</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are currently no drivers available for hire.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {drivers.map((driver) => (
              <div key={driver.user_id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {driver.full_name}
                      </h3>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {renderStars(driver.rating || 0)}
                        </div>
                        <span className="ml-2 text-sm text-gray-500">
                          {driver.rating ? driver.rating.toFixed(1) : 'No rating'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <PhoneIcon className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                      <span>{driver.phone_number}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPinIcon className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                      <span>{driver.city}, {driver.state}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                      <span>{driver.years_of_experience} years experience</span>
                    </div>
                  </div>

                  {driver.license_type && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {driver.license_type}
                      </span>
                    </div>
                  )}

                  {driver.specializations && driver.specializations.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {driver.specializations.map((specialization, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {specialization}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      onClick={() => handleHireDriver(driver.user_id)}
                      disabled={hiring === driver.user_id}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {hiring === driver.user_id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Hiring...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Hire Driver
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <UserIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Driver Hiring Process
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>All drivers are verified and have completed their profiles</li>
                  <li>Drivers are rated based on customer feedback</li>
                  <li>You can assign hired drivers to specific vehicles</li>
                  <li>Track driver performance and manage assignments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HireDrivers;
