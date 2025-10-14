import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import { supabase } from '../../utils/supabase';
import { driverSidebarItems } from '../../config/driverSidebarConfig';
import { 
  BriefcaseIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const JobsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [hireRequests, setHireRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected

  useEffect(() => {
    fetchHireRequests();
  }, []);

  const fetchHireRequests = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching job offers for user:', user.id);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/drivers/hire-requests`, {
        headers: {
          'x-user-id': user.id,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job offers');
      }

      const data = await response.json();
      console.log('Job offers data:', data);
      setHireRequests(data.hireRequests || []);
    } catch (error) {
      console.error('Error fetching job offers:', error);
      showToast(`Error fetching job offers: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJobResponse = async (hireRequestId, response) => {
    try {
      setLoading(true);
      
      const response_data = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/drivers/hire-requests/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          hireRequestId: hireRequestId,
          response: response
        })
      });

      if (!response_data.ok) {
        const errorData = await response_data.json();
        throw new Error(errorData.message || 'Failed to respond to hire request');
      }

      const data = await response_data.json();

      showToast(
        response === 'accepted' 
          ? 'Job offer accepted successfully!' 
          : 'Job offer declined',
        response === 'accepted' ? 'success' : 'info'
      );

      // Refresh hire requests
      await fetchHireRequests();
      setShowJobDetails(false);
      setSelectedJob(null);
    } catch (error) {
      console.error('Error responding to hire request:', error);
      showToast(`Error responding to hire request: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'accepted': return 'text-green-400 bg-green-400/20';
      case 'declined': return 'text-red-400 bg-red-400/20';
      case 'expired': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'accepted': return <CheckCircleIcon className="w-4 h-4" />;
      case 'declined': return <XCircleIcon className="w-4 h-4" />;
      case 'expired': return <ClockIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const filteredOffers = hireRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout title="Job Offers" sidebarItems={driverSidebarItems}>
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/dashboard/driver" className="text-gray-400 hover:text-primary transition-colors">
                Dashboard
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-gray-400 md:ml-2">Job Offers</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Job Offers</h1>
        <p className="text-gray-400">Manage your job offers and opportunities</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { key: 'all', label: 'All', count: jobOffers.length },
            { key: 'pending', label: 'Pending', count: jobOffers.filter(o => o.status === 'pending').length },
            { key: 'accepted', label: 'Accepted', count: jobOffers.filter(o => o.status === 'accepted').length },
            { key: 'declined', label: 'Declined', count: jobOffers.filter(o => o.status === 'declined').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Job Offers List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400">Loading job offers...</div>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BriefcaseIcon className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">No Job Offers</p>
            <p className="text-sm mt-2">
              {filter === 'all' 
                ? 'You haven\'t received any job offers yet' 
                : `No ${filter} job offers found`
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredOffers.map((offer) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardCard className="p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-white">
                          {offer.business_profiles?.business_name || 'Unknown Business'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(offer.status)}`}>
                          {getStatusIcon(offer.status)}
                          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <CalendarIcon className="w-4 h-4" />
                          <span className="text-sm">Received: {formatDate(offer.created_at)}</span>
                        </div>
                        
                        {offer.offer_details?.salary && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            <span className="text-sm">{offer.offer_details.salary}</span>
                          </div>
                        )}

                        {offer.vehicles && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPinIcon className="w-4 h-4" />
                            <span className="text-sm">{offer.vehicles.manufacturer} {offer.vehicles.model}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-300">
                          <span className="text-sm">License: {offer.vehicles?.license_plate || 'Not assigned'}</span>
                        </div>
                      </div>

                      {offer.message && (
                        <div className="bg-gray-800/50 p-3 rounded-lg mb-4">
                          <p className="text-gray-300 text-sm">
                            <strong>Message:</strong> {offer.message}
                          </p>
                        </div>
                      )}

                      {offer.offer_details && Object.keys(offer.offer_details).length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {offer.offer_details.workHours && (
                            <div>
                              <span className="text-gray-400 text-sm">Work Hours:</span>
                              <p className="text-white text-sm">{offer.offer_details.workHours}</p>
                            </div>
                          )}
                          {offer.offer_details.benefits && (
                            <div>
                              <span className="text-gray-400 text-sm">Benefits:</span>
                              <p className="text-white text-sm">{offer.offer_details.benefits}</p>
                            </div>
                          )}
                          {offer.offer_details.startDate && (
                            <div>
                              <span className="text-gray-400 text-sm">Start Date:</span>
                              <p className="text-white text-sm">{offer.offer_details.startDate}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => openJobDetails(offer)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                      >
                        <EyeIcon className="w-4 h-4" />
                        View Details
                      </button>

                      {offer.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleJobResponse(offer.id, 'accepted')}
                            disabled={loading}
                            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleJobResponse(offer.id, 'rejected')}
                            disabled={loading}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </DashboardCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 w-full max-w-2xl rounded-lg border border-gray-700 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Job Offer Details</h2>
                <button
                  onClick={() => setShowJobDetails(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {selectedJob.business_profiles.business_name || selectedJob.business_profiles.user_profiles.full_name}
                  </h3>
                  <p className="text-gray-400">{selectedJob.business_profiles.business_email}</p>
                </div>

                {selectedJob.message && (
                  <div>
                    <h4 className="text-md font-semibold text-white mb-2">Message</h4>
                    <p className="text-gray-300 bg-gray-800 p-3 rounded-lg">{selectedJob.message}</p>
                  </div>
                )}

                {selectedJob.offer_details && Object.keys(selectedJob.offer_details).length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-white mb-3">Offer Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(selectedJob.offer_details).map(([key, value]) => (
                        value && (
                          <div key={key} className="bg-gray-800 p-3 rounded-lg">
                            <span className="text-gray-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <p className="text-white">{value}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowJobDetails(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  {selectedJob.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleJobResponse(selectedJob.id, 'accepted')}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Accept Offer
                      </button>
                      <button
                        onClick={() => handleJobResponse(selectedJob.id, 'declined')}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Decline Offer
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default JobsPage;
