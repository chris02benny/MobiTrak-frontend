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
  
  const [activeTab, setActiveTab] = useState('hired');
  const [hiredDrivers, setHiredDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [jobOffers, setJobOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [jobOfferFilter, setJobOfferFilter] = useState('all');

  useEffect(() => {
    fetchHiredDrivers();
    fetchVehicles();
    fetchJobOffers();
    
    // If accessed via old job-offers route, switch to job-offers tab
    if (location.pathname === '/business/job-offers') {
      setActiveTab('job-offers');
    }
  }, [location.pathname]);

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

  const fetchJobOffers = async () => {
    try {
      const response = await fetch(`${API_BASE}/business/job-offers`, {
        headers: {
          'x-user-id': user.id,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setJobOffers(data.jobOffers || []);
      } else {
        console.error('Error fetching job offers:', data.message);
      }
    } catch (error) {
      console.error('Error fetching job offers:', error);
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
        fetchJobOffers(); // Refresh job offers list
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

  const viewJobOfferDetails = (offer) => {
    // For now, just show an alert with details
    // In a real app, you might want to open a modal with more details
    const details = `
Driver: ${offer.driver_profiles?.full_name || 'Unknown'}
Vehicle: ${offer.vehicles ? `${offer.vehicles.manufacturer} ${offer.vehicles.model} (${offer.vehicles.license_plate})` : 'No vehicle assigned'}
Status: ${offer.status}
Sent: ${new Date(offer.created_at).toLocaleString()}
Expires: ${offer.expires_at ? new Date(offer.expires_at).toLocaleString() : 'N/A'}
Message: ${offer.message || 'No message'}
Driver Response: ${offer.driver_message || 'No response yet'}
    `;
    alert(details);
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
            onClick={() => setActiveTab('job-offers')}
            className={`px-6 py-3 rounded-md transition-all ${
              activeTab === 'job-offers'
                ? 'bg-primary text-black font-semibold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Job Offers ({jobOffers.length})
          </button>
        </div>
      </div>

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
                  {jobOffers.filter(offer => offer.status === 'accepted').length}
                </div>
                <div className="text-sm text-gray-400">Accepted Offers</div>
              </div>
            </DashboardCard>
            <DashboardCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {jobOffers.filter(offer => offer.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-400">Pending Offers</div>
              </div>
            </DashboardCard>
            <DashboardCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {jobOffers.filter(offer => offer.status === 'rejected').length}
                </div>
                <div className="text-sm text-gray-400">Rejected Offers</div>
              </div>
            </DashboardCard>
          </div>

          {/* Hired Drivers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {hiredDrivers.map((driver) => {
                const driverJobOffers = jobOffers.filter(offer => offer.driver_id === driver.id);
                const latestOffer = driverJobOffers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                
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

                        {/* Job Offer Status */}
                        {latestOffer && (
                          <div className="mt-4 p-3 bg-white/10 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm text-gray-400">Latest Job Offer:</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                latestOffer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                latestOffer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                latestOffer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {latestOffer.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">
                              Sent: {new Date(latestOffer.created_at).toLocaleDateString()}
                            </p>
                            {latestOffer.message && (
                              <p className="text-xs text-gray-300 mt-1">
                                Message: {latestOffer.message}
                              </p>
                            )}
                            {latestOffer.driver_message && (
                              <p className="text-xs text-gray-300 mt-1">
                                Response: {latestOffer.driver_message}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </DashboardCard>
                  </motion.div>
                );
              })}
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

      {/* Job Offers Tab */}
      {activeTab === 'job-offers' && (
        <div className="space-y-6">
          {/* Filter Buttons */}
          <div className="flex space-x-2">
            {['all', 'pending', 'accepted', 'rejected', 'expired'].map((filter) => {
              const count = filter === 'all' 
                ? jobOffers.length 
                : jobOffers.filter(offer => offer.status === filter).length;
              
              return (
                <button
                  key={filter}
                  onClick={() => setJobOfferFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    jobOfferFilter === filter
                      ? 'bg-primary text-black'
                      : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
                </button>
              );
            })}
          </div>

          {/* Job Offers List */}
          <div className="space-y-4">
            {jobOffers
              .filter(offer => jobOfferFilter === 'all' || offer.status === jobOfferFilter)
              .map((offer) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DashboardCard className="p-6 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-white">
                            {offer.driver_profiles?.full_name || 'Unknown Driver'}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {offer.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-300">
                          <p>
                            <span className="font-medium">Vehicle:</span> {
                              offer.vehicles 
                                ? `${offer.vehicles.manufacturer} ${offer.vehicles.model} (${offer.vehicles.license_plate})`
                                : 'No vehicle assigned'
                            }
                          </p>
                          
                          <div className="flex space-x-6">
                            <p>
                              <span className="font-medium">Sent:</span> {new Date(offer.created_at).toLocaleString()}
                            </p>
                            {offer.expires_at && (
                              <p>
                                <span className="font-medium">Expires:</span> {new Date(offer.expires_at).toLocaleString()}
                              </p>
                            )}
                            {offer.responded_at && (
                              <p>
                                <span className="font-medium">Responded:</span> {new Date(offer.responded_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                          
                          {offer.message && (
                            <p>
                              <span className="font-medium">Message:</span> {offer.message}
                            </p>
                          )}
                          
                          {offer.driver_message && (
                            <p>
                              <span className="font-medium">Driver Response:</span> {offer.driver_message}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        {offer.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateJobOfferStatus(offer.id, 'accepted')}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Mark as Accepted
                            </button>
                            <button
                              onClick={() => updateJobOfferStatus(offer.id, 'rejected')}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Mark as Rejected
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => viewJobOfferDetails(offer)}
                          className="px-4 py-2 bg-primary hover:bg-primary/80 text-black rounded-lg text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </DashboardCard>
                </motion.div>
              ))}
            
            {jobOffers.filter(offer => jobOfferFilter === 'all' || offer.status === jobOfferFilter).length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Job Offers</h3>
                <p className="text-gray-400 mb-6">
                  {jobOfferFilter === 'all' 
                    ? 'No job offers have been sent yet'
                    : `No ${jobOfferFilter} job offers found`
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