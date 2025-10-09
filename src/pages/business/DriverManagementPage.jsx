import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import ConfirmationModal from '../../components/ConfirmationModal';
import JobOfferModal from '../../components/JobOfferModal';
import { supabase } from '../../utils/supabase';
import { businessSidebarItems } from '../../config/businessSidebarConfig';

const DriverManagementPage = () => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('hired');
  const [hiredDrivers, setHiredDrivers] = useState([]);
  const [driverPool, setDriverPool] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [reviews, setReviews] = useState([]);

  // Sort for Driver Pool
  const [sortBy, setSortBy] = useState('newest'); // newest | rating | trips | experience

  useEffect(() => {
    fetchHiredDrivers();
    fetchDriverPool();
    fetchVehicles();
    fetchAssignments();
  }, []);

  const fetchHiredDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE}/drivers?business_id=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setHiredDrivers(data.data.filter(driver => driver.user_profiles?.profile_complete));
      } else {
        showToast(`Failed to fetch hired drivers: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching hired drivers:', error);
      showToast('Error fetching hired drivers', 'error');
    }
  };

  const fetchDriverPool = async () => {
    try {
      setLoading(true);
      
      // Get business profile ID
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (businessError || !businessProfile) {
        throw new Error('Business profile not found');
      }

      // Call the Edge Function to get hireable drivers
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-hireable-drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          business_id: businessProfile.id,
          limit: 50
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }

      const data = await response.json();
      
      if (data.success) {
        setDriverPool(data.drivers || []);
        console.log(`📋 Found ${data.drivers?.length || 0} drivers available for hire`);
      } else {
        throw new Error(data.error || 'Failed to fetch drivers');
      }
      
    } catch (error) {
      console.error('Error fetching driver pool:', error);
      showToast('Error fetching available drivers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_BASE}/vehicles?business_id=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setVehicles(data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`${API_BASE}/assignments?business_id=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setAssignments(data.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchDriverReviews = async (driverId) => {
    try {
      const response = await fetch(`${API_BASE}/drivers/${driverId}/reviews`);
      const data = await response.json();
      if (response.ok) {
        setReviews(data.data);
        setShowReviewsModal(true);
      } else {
        showToast(`Failed to fetch reviews: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showToast('Error fetching reviews', 'error');
    }
  };

  const handleHireDriver = async (offerData) => {
    if (!selectedDriver) return;

    setLoading(true);
    try {
      // Get business profile ID
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (businessError || !businessProfile) {
        throw new Error('Business profile not found');
      }

      // Call the Edge Function to create job offer
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/on-hire-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          business_id: businessProfile.id,
          driver_id: selectedDriver.id,
          vehicle_id: offerData.vehicle_id || null,
          message: offerData.message,
          offer_details: offerData.offer_details
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send job offer');
      }

      const data = await response.json();
      
      if (data.success) {
        showToast('Job offer sent successfully!', 'success');
        setShowHireModal(false);
        setSelectedDriver(null);
        fetchDriverPool(); // Refresh to remove hired driver from pool
      } else {
        throw new Error(data.error || 'Failed to send job offer');
      }
    } catch (error) {
      console.error('Error sending job offer:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const filteredAndSortedDrivers = useMemo(() => {
    let list = [...driverPool];
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
  }, [driverPool, sortBy]);

  const handleAssignDriver = async () => {
    if (!selectedDriver || !selectedVehicle) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: user.id,
          driver_id: selectedDriver.id,
          vehicle_id: selectedVehicle
        }),
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Driver assigned to vehicle successfully!', 'success');
        setShowAssignModal(false);
        setSelectedDriver(null);
        setSelectedVehicle('');
        fetchAssignments();
      } else {
        showToast(`Failed to assign driver: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      showToast('Error assigning driver', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignDriver = async (assignmentId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/assignments/${assignmentId}/unassign`, {
        method: 'PUT',
      });

      if (response.ok) {
        showToast('Driver unassigned successfully!', 'success');
        fetchAssignments();
      } else {
        const data = await response.json();
        showToast(`Failed to unassign driver: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error unassigning driver:', error);
      showToast('Error unassigning driver', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openHireModal = (driver) => {
    setSelectedDriver(driver);
    setShowHireModal(true);
  };

  const openAssignModal = (driver) => {
    setSelectedDriver(driver);
    setShowAssignModal(true);
  };

  const openReviewsModal = (driver) => {
    setSelectedDriver(driver);
    fetchDriverReviews(driver.id);
  };

  const getAvailableVehicles = () => {
    const assignedVehicleIds = assignments.map(assignment => assignment.vehicle_id);
    return vehicles.filter(vehicle => !assignedVehicleIds.includes(vehicle.id));
  };

  const getDriverAssignment = (driverId) => {
    return assignments.find(assignment => assignment.driver_id === driverId);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-lg ${i <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };


  return (
    <DashboardLayout title="Driver Management" sidebarItems={businessSidebarItems}>
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
                <span className="ml-1 text-gray-400 md:ml-2">Driver Management</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Driver Management</h1>
        <p className="text-gray-400">Hire drivers, manage assignments, and view performance</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-white/10 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('hired')}
            className={`px-6 py-3 rounded-md transition-all ${
              activeTab === 'hired'
                ? 'bg-primary text-black font-semibold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Hired Drivers ({hiredDrivers.length})
          </button>
          <button
            onClick={() => setActiveTab('pool')}
            className={`px-6 py-3 rounded-md transition-all ${
              activeTab === 'pool'
                ? 'bg-primary text-black font-semibold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Driver Pool ({driverPool.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-3 rounded-md transition-all ${
              activeTab === 'assignments'
                ? 'bg-primary text-black font-semibold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Assignments ({assignments.length})
          </button>
        </div>
      </div>

      {/* Hired Drivers Tab */}
      {activeTab === 'hired' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {hiredDrivers.map((driver) => {
              const assignment = getDriverAssignment(driver.id);
              return (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DashboardCard className="p-6 hover:bg-white/15 transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                          {driver.user_profiles?.full_name || driver.full_name || 'Unknown Driver'}
                        </h3>
                        <p className="text-gray-400 text-sm">{driver.user_profiles?.email}</p>
                        <p className="text-gray-400 text-sm">License: {driver.driver_profiles?.license_number}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openReviewsModal(driver)}
                          className="p-2 text-gray-400 hover:text-primary transition-colors"
                          title="View reviews"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openAssignModal(driver)}
                          className="p-2 text-gray-400 hover:text-primary transition-colors"
                          title="Assign to vehicle"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Address:</span>
                        <span className="text-white">{driver.driver_profiles?.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white">{driver.driver_profiles?.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rating:</span>
                        <div className="flex items-center space-x-1">
                          {renderStars(Math.round(driver.rating))}
                          <span className="text-white ml-1">({driver.rating.toFixed(1)})</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trips:</span>
                        <span className="text-white">{driver.total_trips}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hired:</span>
                        <span className="text-white">{new Date(driver.hire_date).toLocaleDateString()}</span>
                      </div>
                      {assignment && (
                        <div className="mt-4 p-3 bg-white/10 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-gray-400">Assigned to:</p>
                              <p className="text-white font-medium">
                                {assignment.vehicles?.make} {assignment.vehicles?.model}
                              </p>
                              <p className="text-xs text-gray-400">
                                {assignment.vehicles?.registration_number}
                              </p>
                            </div>
                            <button
                              onClick={() => handleUnassignDriver(assignment.id)}
                              className="p-2 text-red-400 hover:text-red-300 transition-colors"
                              title="Unassign"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DashboardCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Driver Pool Tab */}
      {activeTab === 'pool' && (
        <div>
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Available Drivers</h2>
                <p className="text-gray-400">Only drivers with complete profiles and uploaded license documents are shown here.</p>
              </div>
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
              </div>
            </div>
          </div>

          <div>
            <div>
              {filteredAndSortedDrivers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg">No Complete Driver Profiles Available</p>
                <p className="text-sm mt-2">Drivers need to complete their profiles with license documents to appear here.</p>
              </div>
            </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAndSortedDrivers.map((driver) => (
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
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white uppercase">
                        {(driver.user_profiles?.full_name || '?').slice(0,2)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                          {driver.user_profiles?.full_name || 'Unknown Driver'}
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
                      <span className="bg-white/10 text-gray-200 text-xs px-2 py-1 rounded-full">{getLevelFromExperience(driver.experience_years)}</span>
                      <span className="bg-white/10 text-gray-200 text-xs px-2 py-1 rounded-full">Trips: {driver.total_trips || 0}</span>
                      <span className="bg-white/10 text-gray-200 text-xs px-2 py-1 rounded-full">Rating: {Number(driver.rating || 0).toFixed(1)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-400 block text-xs">License</span>
                        <span className="text-white font-mono text-sm">{driver.license_number || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-xs">Email</span>
                        <span className="text-white text-sm break-all">{driver.user_profiles?.email || '-'}</span>
                      </div>
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
            </div>
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {assignments.map((assignment) => (
            <DashboardCard key={assignment.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {assignment.drivers?.user_profiles?.full_name || 'Unknown Driver'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      License: {assignment.drivers?.license_number}
                    </p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {assignment.vehicles?.make} {assignment.vehicles?.model}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {assignment.vehicles?.registration_number}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Assigned</p>
                    <p className="text-white">
                      {new Date(assignment.assigned_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnassignDriver(assignment.id)}
                    className="enterprise-button-secondary px-4 py-2 text-sm"
                  >
                    Unassign
                  </button>
                </div>
              </div>
            </DashboardCard>
          ))}
          {assignments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚗👨‍💼</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Assignments Yet</h3>
              <p className="text-gray-400 mb-6">Assign drivers to vehicles to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Empty States */}
      {activeTab === 'hired' && hiredDrivers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👨‍💼</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Hired Drivers Yet</h3>
          <p className="text-gray-400 mb-6">Hire drivers from the driver pool to get started</p>
          <button
            onClick={() => setActiveTab('pool')}
            className="enterprise-button px-6 py-3"
          >
            View Driver Pool
          </button>
        </div>
      )}

      {activeTab === 'pool' && driverPool.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Drivers Available</h3>
          <p className="text-gray-400 mb-6">No drivers are currently available in the pool</p>
        </div>
      )}

      {/* Job Offer Modal */}
      <JobOfferModal
        isOpen={showHireModal}
        onClose={() => {
          setShowHireModal(false);
          setSelectedDriver(null);
        }}
        driver={selectedDriver}
        vehicles={vehicles}
        onSubmit={handleHireDriver}
        loading={loading}
      />

      {/* Assign Driver Modal */}
      <ConfirmationModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onConfirm={handleAssignDriver}
        title="Assign Driver to Vehicle"
        message={
          <div className="space-y-4">
            <div>
              <p className="mb-2">Assign <strong>{selectedDriver?.user_profiles?.full_name}</strong> to a vehicle:</p>
            </div>
            <div>
              <label htmlFor="vehicle-select" className="block text-sm font-medium text-gray-300 mb-2">
                Select Vehicle
              </label>
              <select
                id="vehicle-select"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="enterprise-input w-full"
              >
                <option value="">Choose a vehicle</option>
                {getAvailableVehicles().map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} - {vehicle.registration_number}
                  </option>
                ))}
              </select>
            </div>
            {getAvailableVehicles().length === 0 && (
              <p className="text-yellow-400 text-sm">No available vehicles. All vehicles are already assigned.</p>
            )}
          </div>
        }
        confirmText="Assign Driver"
        cancelText="Cancel"
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
        loading={loading}
        disabled={!selectedVehicle}
      />

      {/* Reviews Modal */}
      <ConfirmationModal
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        onConfirm={() => setShowReviewsModal(false)}
        title={`Reviews for ${selectedDriver?.user_profiles?.full_name}`}
        message={
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="p-4 bg-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {renderStars(review.rating)}
                      <span className="text-white font-medium">{review.rating}/5</span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-300 text-sm">{review.comment}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    By: {review.user_profiles?.full_name || 'Anonymous'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No reviews yet</p>
            )}
          </div>
        }
        confirmText="Close"
        cancelText=""
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
        showCancel={false}
      />
    </DashboardLayout>
  );
};

export default DriverManagementPage;
