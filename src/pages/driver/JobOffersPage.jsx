import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  Car,
  Building2
} from 'lucide-react';
import { driverSidebarItems } from '../../config/driverSidebarConfig';
import { supabase } from '../../utils/supabase';

const JobOffersPage = () => {
  const [jobOffers, setJobOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [responding, setResponding] = useState(false);
  const [driverMessage, setDriverMessage] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchJobOffers = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get driver profile ID
      const { data: driverProfile, error: driverError } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (driverError || !driverProfile) {
        throw new Error('Driver profile not found');
      }

      // Call the Edge Function to get job offers
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-driver-job-offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          driver_id: driverProfile.id,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          limit: 50
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job offers');
      }

      const data = await response.json();
      setJobOffers(data.job_offers || []);
    } catch (error) {
      console.error('Error fetching job offers:', error);
      showToast('Failed to load job offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobOffers();
  }, [user?.id, selectedStatus]);

  const handleJobResponse = async (jobId, status) => {
    try {
      setResponding(true);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/on-job-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          job_id: jobId,
          status,
          driver_message: driverMessage.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to respond to job offer');
      }

      const data = await response.json();
      
      if (data.success) {
        showToast(
          status === 'accepted' ? 'Job offer accepted!' : 'Job offer rejected',
          'success'
        );
        setShowModal(false);
        setDriverMessage('');
        fetchJobOffers(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to respond to job offer');
      }
    } catch (error) {
      console.error('Error responding to job offer:', error);
      showToast(error.message, 'error');
    } finally {
      setResponding(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'accepted':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'expired':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <DashboardLayout title="Job Offers" sidebarItems={driverSidebarItems}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Job Offers</h1>
          <p className="text-gray-400">View and respond to job offers from businesses</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { id: 'all', label: 'All', count: jobOffers.length },
            { id: 'pending', label: 'Pending', count: jobOffers.filter(job => job.status === 'pending').length },
            { id: 'accepted', label: 'Accepted', count: jobOffers.filter(job => job.status === 'accepted').length },
            { id: 'rejected', label: 'Rejected', count: jobOffers.filter(job => job.status === 'rejected').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedStatus === tab.id
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Job Offers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : jobOffers.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Job Offers</h3>
            <p className="text-gray-400">
              {selectedStatus === 'all' 
                ? "You don't have any job offers yet. Complete your profile to start receiving offers."
                : `No ${selectedStatus} job offers found.`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobOffers.map((offer) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {offer.business_profiles.business_name || offer.business_profiles.user_profiles.full_name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {formatDate(offer.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(offer.status)}`}>
                    {getStatusIcon(offer.status)}
                    <span className="text-sm font-medium capitalize">{offer.status}</span>
                  </div>
                </div>

                {offer.message && (
                  <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-300 text-sm">{offer.message}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{offer.business_profiles.business_email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{offer.business_profiles.business_phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{offer.business_profiles.business_address}</span>
                  </div>
                  {offer.vehicles && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Car className="w-4 h-4" />
                      <span className="text-sm">
                        {offer.vehicles.manufacturer} {offer.vehicles.model} ({offer.vehicles.year})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Expires: {formatDate(offer.expires_at)}
                      {isExpired(offer.expires_at) && (
                        <span className="text-red-400 ml-1">(Expired)</span>
                      )}
                    </span>
                  </div>

                  {offer.status === 'pending' && !isExpired(offer.expires_at) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOffer(offer);
                          setShowModal(true);
                        }}
                        className="px-4 py-2 bg-primary text-black rounded-md hover:bg-primary/80 transition-colors text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Job Response Modal */}
        {showModal && selectedOffer && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
            <div className="bg-gray-900 w-full max-w-2xl rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                Job Offer from {selectedOffer.business_profiles.business_name}
              </h3>

              <div className="space-y-4 mb-6">
                {selectedOffer.message && (
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Message from Business:</h4>
                    <p className="text-gray-300">{selectedOffer.message}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-white mb-2">Business Details:</h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{selectedOffer.business_profiles.business_email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{selectedOffer.business_profiles.business_phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedOffer.business_profiles.business_address}</span>
                      </div>
                    </div>
                  </div>

                  {selectedOffer.vehicles && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Assigned Vehicle:</h4>
                      <div className="text-sm text-gray-300">
                        <p>{selectedOffer.vehicles.manufacturer} {selectedOffer.vehicles.model}</p>
                        <p>Year: {selectedOffer.vehicles.year}</p>
                        <p>Type: {selectedOffer.vehicles.vehicle_type}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Response (Optional)
                  </label>
                  <textarea
                    value={driverMessage}
                    onChange={(e) => setDriverMessage(e.target.value)}
                    placeholder="Add a message for the business..."
                    className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setDriverMessage('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  disabled={responding}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleJobResponse(selectedOffer.id, 'rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  disabled={responding}
                >
                  {responding ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleJobResponse(selectedOffer.id, 'accepted')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={responding}
                >
                  {responding ? 'Accepting...' : 'Accept'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobOffersPage;
