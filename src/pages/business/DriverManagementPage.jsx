import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('available');
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [hiredDrivers, setHiredDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [hireRequests, setHireRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [hireRequestFilter, setHireRequestFilter] = useState('all');

  useEffect(() => {
    fetchAvailableDrivers();
    fetchHiredDrivers();
    fetchVehicles();
    fetchHireRequests();
    
    // If accessed via old job-offers route, switch to hire-requests tab
    if (location.pathname === '/business/job-offers') {
      setActiveTab('hire-requests');
    }
  }, [location.pathname]);

  const fetchAvailableDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE}/business/available-drivers`, {
        headers: {
          'x-user-id': user.id,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAvailableDrivers(data.drivers || []);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend server not running, using mock data for development');
        setAvailableDrivers([]);
      } else {
        showToast('Error fetching available drivers', 'error');
      }
    }
  };

  const fetchHiredDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE}/business/hired-drivers`, {
        headers: {
          'x-user-id': user.id,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHiredDrivers(data.drivers || []);
    } catch (error) {
      console.error('Error fetching hired drivers:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend server not running, using mock data for development');
        setHiredDrivers([]);
      } else {
        showToast('Error fetching hired drivers', 'error');
      }
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_BASE}/vehicles?business_id=${user.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (response.ok) {
        setVehicles(data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend server not running, using mock data for development');
        setVehicles([]);
      }
    }
  };

  const fetchHireRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/business/hire-requests`, {
        headers: {
          'x-user-id': user.id,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHireRequests(data.hireRequests || []);
    } catch (error) {
      console.error('Error fetching hire requests:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend server not running, using mock data for development');
        setHireRequests([]);
      } else {
        showToast('Error fetching hire requests', 'error');
      }
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
      const response = await fetch(`${API_BASE}/business/hire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          driver_id: selectedDriver.id,
          vehicle_id: offerData.vehicle_id || null,
          message: offerData.message,
          offer_details: offerData.offer_details
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send hire request');
      }

      const data = await response.json();
      
      showToast('Hire request sent successfully!', 'success');
      setShowHireModal(false);
      setSelectedDriver(null);
      fetchHireRequests(); // Refresh hire requests list
      fetchAvailableDrivers(); // Refresh available drivers list
    } catch (error) {
      console.error('Error sending hire request:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Job Offer Functions
  const updateJobOfferStatus = async (jobOfferId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/business/job-offers/${jobOfferId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showToast(`Job offer ${newStatus} successfully`, 'success');
        fetchJobOffers(); // Refresh the list
      } else {
        const data = await response.json();
        showToast(`Failed to update job offer: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error updating job offer:', error);
      showToast('Error updating job offer', 'error');
    }
  };

  const viewHireRequestDetails = (request) => {
    // For now, just show an alert with details
    // In a real app, you might want to open a modal with more details
    const details = `
Driver: ${request.driver_profiles?.full_name || 'Unknown'}
Vehicle: ${request.vehicles ? `${request.vehicles.manufacturer} ${request.vehicles.model} (${request.vehicles.license_plate})` : 'No vehicle assigned'}
Status: ${request.status}
Sent: ${new Date(request.created_at).toLocaleString()}
Expires: ${request.expires_at ? new Date(request.expires_at).toLocaleString() : 'N/A'}
Message: ${request.message || 'No message'}
Driver Response: ${request.driver_message || 'No response yet'}
    `;
    alert(details);
  };

  const assignVehicleToDriver = async (driver) => {
    // This would open a modal to select a vehicle for the driver
    // For now, just show a placeholder
    showToast('Vehicle assignment feature coming soon!', 'info');
  };

  // Helper functions
  const openHireModal = (driver) => {
    setSelectedDriver(driver);
    setShowHireModal(true);
  };

  const openReviewsModal = (driver) => {
    setSelectedDriver(driver);
    fetchDriverReviews(driver.id);
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
        <p className="text-gray-400">Manage hired drivers and track job offer status</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="relative">
          {/* Tab Navigation */}
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`relative px-4 py-3 transition-all duration-300 ${
                activeTab === 'available'
                  ? 'text-primary font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Available Drivers ({availableDrivers.length})
              {activeTab === 'available' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('hired')}
              className={`relative px-4 py-3 transition-all duration-300 ${
                activeTab === 'hired'
                  ? 'text-primary font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Hired Drivers ({hiredDrivers.length})
              {activeTab === 'hired' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('hire-requests')}
              className={`relative px-4 py-3 transition-all duration-300 ${
                activeTab === 'hire-requests'
                  ? 'text-primary font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Hire Requests ({hireRequests.length})
              {activeTab === 'hire-requests' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Available Drivers Tab */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <DashboardCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{availableDrivers.length}</div>
                <div className="text-sm text-gray-400">Available Drivers</div>
              </div>
            </DashboardCard>
            <DashboardCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {hireRequests.filter(request => request.status === 'accepted').length}
                </div>
                <div className="text-sm text-gray-400">Accepted Offers</div>
              </div>
            </DashboardCard>
            <DashboardCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {hireRequests.filter(request => request.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-400">Pending Offers</div>
              </div>
            </DashboardCard>
            <DashboardCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {hireRequests.filter(request => request.status === 'rejected').length}
                </div>
                <div className="text-sm text-gray-400">Rejected Offers</div>
              </div>
            </DashboardCard>
          </div>

          {/* Available Drivers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {availableDrivers.map((driver) => (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DashboardCard className="p-6 hover:bg-white/15 transition-all duration-300 group relative overflow-hidden">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors mb-1">
                          {driver.full_name || 'Unknown Driver'}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">License: {driver.license_number}</p>
                        <p className="text-gray-400 text-xs">{driver.city}, {driver.state}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-white text-sm">({driver.rating || 0})</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Experience:</span>
                        <span className="text-white">{driver.experience_years || 0} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trips:</span>
                        <span className="text-white">{driver.total_trips || 0}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4">
                      <button
                        onClick={() => openHireModal(driver)}
                        className="w-full px-4 py-2 bg-primary hover:bg-primary/80 text-black rounded text-sm font-medium transition-colors"
                      >
                        Send Hire Request
                      </button>
                    </div>
                  </DashboardCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {availableDrivers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍💼</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Available Drivers</h3>
              <p className="text-gray-400 mb-6">No drivers are currently available for hire</p>
            </div>
          )}
        </div>
      )}

      {/* Hired Drivers Tab */}
      {activeTab === 'hired' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <DashboardCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{hiredDrivers.length}</div>
                <div className="text-sm text-gray-400">Total Hired</div>
              </div>
            </DashboardCard>
            <DashboardCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {hireRequests.filter(request => request.status === 'accepted').length}
                </div>
                <div className="text-sm text-gray-400">Accepted Offers</div>
              </div>
            </DashboardCard>
            <DashboardCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {hireRequests.filter(request => request.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-400">Pending Offers</div>
              </div>
            </DashboardCard>
            <DashboardCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {hireRequests.filter(request => request.status === 'rejected').length}
                </div>
                <div className="text-sm text-gray-400">Rejected Offers</div>
              </div>
            </DashboardCard>
          </div>

          {/* Hired Drivers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {hiredDrivers.map((driver) => (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DashboardCard className="p-6 hover:bg-white/15 transition-all duration-300 group relative overflow-hidden">
                    {/* Status Indicator Circle - Green for hired */}
                    <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-green-500" />
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors mb-1">
                          {driver.full_name || 'Unknown Driver'}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">License: {driver.license_number}</p>
                        <p className="text-gray-400 text-xs">{driver.city}, {driver.state}</p>
                      </div>
                      <button
                        onClick={() => openReviewsModal(driver)}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                        title="View reviews"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rating:</span>
                        <div className="flex items-center space-x-1">
                          {renderStars(Math.round(driver.rating || 0))}
                          <span className="text-white ml-1">({(driver.rating || 0).toFixed(1)})</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trips:</span>
                        <span className="text-white">{driver.total_trips || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hired:</span>
                        <span className="text-white">{driver.hired_at ? new Date(driver.hired_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vehicle:</span>
                        <span className="text-white text-xs">{driver.vehicle_info || 'Not assigned'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => assignVehicleToDriver(driver)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        Assign Vehicle
                      </button>
                    </div>
                  </DashboardCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {hiredDrivers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍💼</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Hired Drivers Yet</h3>
              <p className="text-gray-400 mb-6">Hire drivers to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Hire Requests Tab */}
      {activeTab === 'hire-requests' && (
        <div className="space-y-6">
          {/* Filter Buttons */}
          <div className="flex space-x-2">
            {['all', 'pending', 'accepted', 'rejected', 'expired'].map((filter) => {
              const count = filter === 'all' 
                ? hireRequests.length 
                : hireRequests.filter(request => request.status === filter).length;
              
              return (
                <button
                  key={filter}
                  onClick={() => setHireRequestFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    hireRequestFilter === filter
                      ? 'bg-primary text-black'
                      : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
                </button>
              );
            })}
          </div>

          {/* Hire Requests List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hireRequests
              .filter(request => hireRequestFilter === 'all' || request.status === hireRequestFilter)
              .map((request) => {
                // Determine status color
                const getStatusColor = () => {
                  switch (request.status) {
                    case 'accepted': return 'bg-green-500';
                    case 'pending': return 'bg-yellow-500';
                    case 'rejected': return 'bg-red-500';
                    case 'expired': return 'bg-gray-500';
                    default: return 'bg-gray-500';
                  }
                };

                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DashboardCard className="p-6 hover:bg-white/15 transition-all duration-300 group relative overflow-hidden">
                      {/* Status Indicator Circle */}
                      <div className={`absolute bottom-4 right-4 w-3 h-3 rounded-full ${getStatusColor()}`} />
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors mb-1">
                            {request.driver_profiles?.full_name || 'Unknown Driver'}
                          </h3>
                          <p className="text-gray-400 text-sm mb-2">
                            License: {request.driver_profiles?.license_number || 'N/A'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          request.status === 'accepted' ? 'bg-green-500/20 text-green-300' :
                          request.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {request.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Vehicle:</span>
                          <span className="text-white text-xs">
                            {request.vehicles 
                              ? `${request.vehicles.manufacturer} ${request.vehicles.model}`
                              : 'No vehicle'
                            }
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Sent:</span>
                          <span className="text-white text-xs">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {request.expires_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Expires:</span>
                            <span className="text-white text-xs">
                              {new Date(request.expires_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {request.message && (
                          <div className="mt-3 p-2 bg-white/5 rounded border-l-2 border-purple-400">
                            <p className="text-xs text-gray-300 line-clamp-2">
                              {request.message}
                            </p>
                          </div>
                        )}

                        {request.driver_message && (
                          <div className="mt-2 p-2 bg-green-500/10 rounded border-l-2 border-green-400">
                            <p className="text-xs text-green-300 line-clamp-2">
                              Response: {request.driver_message}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => viewHireRequestDetails(request)}
                          className="flex-1 px-3 py-2 bg-primary hover:bg-primary/80 text-black rounded text-xs font-medium transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </DashboardCard>
                  </motion.div>
                );
              })}
            
            {hireRequests.filter(request => hireRequestFilter === 'all' || request.status === hireRequestFilter).length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Hire Requests</h3>
                <p className="text-gray-400 mb-6">
                  {hireRequestFilter === 'all' 
                    ? 'No hire requests have been sent yet'
                    : `No ${hireRequestFilter} hire requests found`
                  }
                </p>
              </div>
            )}
          </div>
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