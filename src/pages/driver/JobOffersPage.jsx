import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../utils/supabase';
import { 
  Check, 
  X, 
  Clock,
  DollarSign,
  Calendar,
  Briefcase,
  Building2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

const JobOffersPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [jobOffers, setJobOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchJobOffers();
    }
  }, [user]);

  const fetchJobOffers = async () => {
    try {
      setLoading(true);
      
      // Get driver profile ID
      const { data: driverProfile, error: driverError } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (driverError) throw driverError;

      const { data: offers, error: offersError } = await supabase
        .from('driver_job_offers')
        .select('*')
        .eq('driver_id', driverProfile.id)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;

      setJobOffers(offers);
    } catch (error) {
      console.error('Error fetching job offers:', error);
      showToast('Failed to load job offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToOffer = (offer) => {
    setSelectedOffer(offer);
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async (response) => {
    try {
      setResponding(true);

      const responseData = await fetch(`/api/hiring/hire-requests/${selectedOffer.id}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-driver-id': user.id
        },
        body: JSON.stringify({
          response: response,
          driver_message: responseMessage
        })
      });

      if (!responseData.ok) {
        const error = await responseData.json();
        throw new Error(error.error || 'Failed to respond to offer');
      }

      showToast(
        response === 'accepted' 
          ? 'Job offer accepted! You will be contacted soon.' 
          : 'Job offer declined.',
        'success'
      );
      
      setShowResponseModal(false);
      setResponseMessage('');
      fetchJobOffers();
    } catch (error) {
      console.error('Error responding to offer:', error);
      showToast(error.message, 'error');
    } finally {
      setResponding(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOfferExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bgBlack text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading job offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgBlack text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Job Offers</h1>
          <p className="text-gray-400">View and respond to job offers from businesses</p>
        </div>

        {jobOffers.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Job Offers Yet</h3>
            <p className="text-gray-400">Complete your driver profile to start receiving job offers from businesses.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobOffers.map((offer) => (
              <div key={offer.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{offer.business_name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          <span>{offer.business_email}</span>
                        </div>
                        {offer.business_phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            <span>{offer.business_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(offer.status)}`}>
                      {offer.status}
                    </span>
                    {isOfferExpired(offer.expires_at) && offer.status === 'pending' && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        Expired
                      </span>
                    )}
                  </div>
                </div>

                {offer.business_address && (
                  <div className="flex items-center text-sm text-gray-400 mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{offer.business_address}</span>
                  </div>
                )}

                {offer.message && (
                  <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <p className="text-gray-300">{offer.message}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {offer.salary_offered && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                      <span className="font-semibold">{formatCurrency(offer.salary_offered)}</span>
                    </div>
                  )}
                  {offer.work_schedule && (
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-blue-400" />
                      <span>{offer.work_schedule}</span>
                    </div>
                  )}
                  {offer.start_date && (
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                      <span>{formatDate(offer.start_date)}</span>
                    </div>
                  )}
                  {offer.contract_duration_months && (
                    <div className="flex items-center text-sm">
                      <Briefcase className="w-4 h-4 mr-2 text-orange-400" />
                      <span>{offer.contract_duration_months} months</span>
                    </div>
                  )}
                </div>

                {offer.vehicle_name && (
                  <div className="bg-gray-700 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-300">
                      <strong>Vehicle:</strong> {offer.vehicle_name}
                      {offer.vehicle_type && ` (${offer.vehicle_type})`}
                    </p>
                  </div>
                )}

                {offer.driver_message && (
                  <div className="bg-blue-900 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-200">
                      <strong>Your Response:</strong> {offer.driver_message}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    <p>Received: {formatDate(offer.created_at)}</p>
                    {offer.expires_at && (
                      <p>Expires: {formatDate(offer.expires_at)}</p>
                    )}
                  </div>

                  {offer.status === 'pending' && !isOfferExpired(offer.expires_at) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRespondToOffer(offer)}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Respond
                      </button>
                    </div>
                  )}

                  {offer.status === 'accepted' && (
                    <div className="text-green-400 text-sm font-medium">
                      ✓ Offer Accepted
                    </div>
                  )}

                  {offer.status === 'rejected' && (
                    <div className="text-red-400 text-sm font-medium">
                      ✗ Offer Declined
                    </div>
                  )}

                  {isOfferExpired(offer.expires_at) && offer.status === 'pending' && (
                    <div className="text-gray-400 text-sm font-medium">
                      ⏰ Offer Expired
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && selectedOffer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Respond to Job Offer</h2>
              
              <div className="mb-4">
                <p className="text-gray-300 mb-2">
                  <strong>From:</strong> {selectedOffer.business_name}
                </p>
                {selectedOffer.salary_offered && (
                  <p className="text-gray-300 mb-2">
                    <strong>Salary:</strong> {formatCurrency(selectedOffer.salary_offered)}
                  </p>
                )}
                {selectedOffer.work_schedule && (
                  <p className="text-gray-300 mb-2">
                    <strong>Schedule:</strong> {selectedOffer.work_schedule}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Your Message (Optional)</label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  rows={3}
                  placeholder="Add a message to the business..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitResponse('rejected')}
                  disabled={responding}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  {responding ? 'Declining...' : 'Decline'}
                </button>
                <button
                  onClick={() => handleSubmitResponse('accepted')}
                  disabled={responding}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {responding ? 'Accepting...' : 'Accept'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobOffersPage;