import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import ConfirmationModal from '../../components/ConfirmationModal';
import { supabase } from '../../utils/supabase';
import { businessSidebarItems } from '../../config/businessSidebarConfig';

const HireDriversPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // newest | rating | trips | experience

  useEffect(() => {
    fetchAvailableDrivers();
  }, []);

  const fetchAvailableDrivers = async () => {
    try {
      setLoading(true);
      
      // Fetch complete driver profiles from Supabase
      const { data: driverProfilesBase, error: dpError } = await supabase
        .from('driver_profiles')
        .select('id, user_id, license_number, full_name, city, state, rating, total_trips, experience_years, is_available_for_hire, profile_complete, created_at, profile_picture_url')
        .eq('profile_complete', true)
        .eq('is_available_for_hire', true)
        .order('created_at', { ascending: false });

      if (dpError) {
        throw dpError;
      }

      if (!driverProfilesBase || driverProfilesBase.length === 0) {
        setDrivers([]);
        setLoading(false);
        return;
      }

      // Fetch related user_profiles in one query using IN on user_id
      const userIds = driverProfilesBase.map(p => p.user_id).filter(Boolean);
      let userById = new Map();
      
      if (userIds.length > 0) {
        try {
          const { data: users, error: upError } = await supabase
            .from('user_profiles')
            .select('id, email, full_name, phone_number')
            .in('id', userIds);

          if (upError) {
            console.warn('Failed to fetch user_profiles, continuing without user data:', upError);
          } else {
            userById = new Map((users || []).map(u => [u.id, u]));
          }
        } catch (error) {
          console.warn('Error fetching user_profiles, continuing without user data:', error);
        }
      }
      const driverProfiles = driverProfilesBase.map(profile => ({
        ...profile,
        user_profiles: userById.get(profile.user_id) || null,
      }));

      // Transform data to match expected format
      const transformedDrivers = driverProfiles.map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        user_profiles: profile.user_profiles,
        license_number: profile.license_number,
        full_name: profile.full_name,
        city: profile.city,
        state: profile.state,
        rating: profile.rating || 0,
        total_trips: profile.total_trips || 0,
        experience_years: profile.experience_years || 0,
        is_available_for_hire: profile.is_available_for_hire,
        profile_complete: profile.profile_complete,
        created_at: profile.created_at,
        profile_picture_url: profile.profile_picture_url
      }));

      setDrivers(transformedDrivers);
      console.log(`📋 Found ${transformedDrivers.length} available drivers for hire`);
      
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      showToast('Error fetching available drivers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHireDriver = async () => {
    if (!selectedDriver) return;

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/drivers/hire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: user.id,
          driver_pool_id: selectedDriver.id
        }),
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Driver hired successfully!', 'success');
        setShowHireModal(false);
        setSelectedDriver(null);
        fetchAvailableDrivers(); // Refresh the list
      } else {
        showToast(`Failed to hire driver: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error hiring driver:', error);
      showToast('Error hiring driver', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openHireModal = (driver) => {
    setSelectedDriver(driver);
    setShowHireModal(true);
  };

  const getLevelFromExperience = (years) => {
    const y = Number(years || 0);
    if (y <= 0) return 'Intern';
    if (y <= 3) return 'Junior';
    if (y <= 7) return 'Middle';
    return 'Senior';
  };

  const sortedDrivers = useMemo(() => {
    let list = [...drivers];
    if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'trips') {
      list.sort((a, b) => (b.total_trips || 0) - (a.total_trips || 0));
    } else if (sortBy === 'experience') {
      list.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
    } else {
      list.sort((a, b) => (new Date(b.created_at || 0)) - (new Date(a.created_at || 0)) || (b.rating || 0) - (a.rating || 0));
    }
    return list;
  }, [drivers, sortBy]);


  return (
    <DashboardLayout title="Hire Drivers" sidebarItems={businessSidebarItems}>
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/dashboard/business" className="text-gray-400 hover:text-primary transition-colors">
                Dashboard
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-gray-400 md:ml-2">Hire Drivers</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Hire Drivers</h1>
        <p className="text-gray-400">Browse and hire from available drivers with complete profiles</p>
      </div>

      {/* Sort Controls */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <label className="text-gray-300 text-sm">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="enterprise-input"
          >
            <option value="newest">Newest</option>
            <option value="rating">Rating</option>
            <option value="trips">Trips</option>
            <option value="experience">Experience</option>
          </select>
          <span className="text-gray-400 text-sm">{drivers.length} drivers available</span>
        </div>
      </div>

      {/* Drivers Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400">Loading available drivers...</div>
        </div>
      ) : sortedDrivers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg">No Available Drivers</p>
            <p className="text-sm mt-2">No drivers are currently available for hire</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {sortedDrivers.map((driver) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardCard className="p-6 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {driver.profile_picture_url ? (
                        <img
                          src={driver.profile_picture_url}
                          alt={driver.user_profiles?.full_name || driver.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white uppercase text-lg font-semibold">
                          {(driver.user_profiles?.full_name || driver.full_name || '?').slice(0,2)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                          {driver.user_profiles?.full_name || driver.full_name || 'Unknown Driver'}
                        </h3>
                        <p className="text-gray-400 text-sm">{driver.city || '-'}, {driver.state || '-'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => openHireModal(driver)}
                      className="enterprise-button px-4 py-2 text-sm"
                    >
                      Hire
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-white/10 text-gray-200 text-xs px-2 py-1 rounded-full">Trips: {driver.total_trips || 0}</span>
                      <span className="bg-white/10 text-gray-200 text-xs px-2 py-1 rounded-full">Rating: {Number(driver.rating || 0).toFixed(1)}</span>
                    </div>

                    {driver.user_profiles?.phone_number && (
                      <div>
                        <span className="text-gray-400 block text-xs">Phone</span>
                        <span className="text-white">{driver.user_profiles.phone_number}</span>
                      </div>
                    )}
                  </div>
                </DashboardCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Hire Driver Modal */}
      <ConfirmationModal
        isOpen={showHireModal}
        onClose={() => setShowHireModal(false)}
        onConfirm={handleHireDriver}
        title="Hire Driver"
        message={
          <div className="text-left">
            <p className="mb-4">Are you sure you want to hire this driver?</p>
            {selectedDriver && (
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {selectedDriver.user_profiles?.full_name || selectedDriver.full_name}</div>
                <div><strong>Email:</strong> {selectedDriver.user_profiles?.email}</div>
                <div><strong>License:</strong> {selectedDriver.license_number}</div>
                <div><strong>Location:</strong> {selectedDriver.city}, {selectedDriver.state}</div>
                <div><strong>Rating:</strong> {selectedDriver.rating.toFixed(1)}/5.0</div>
                <div><strong>Experience:</strong> {selectedDriver.experience_years} years</div>
                <div><strong>Total Trips:</strong> {selectedDriver.total_trips}</div>
              </div>
            )}
          </div>
        }
        confirmText="Hire Driver"
        cancelText="Cancel"
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default HireDriversPage;
