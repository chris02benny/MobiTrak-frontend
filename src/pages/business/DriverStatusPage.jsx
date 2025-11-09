import React, { useState } from 'react';
import toast from 'react-hot-toast';

const DriverStatusPage = ({ 
  pendingOffers = [],
  pendingOffersLoading = false,
  fetchPendingOffers
}) => {
  const [statusFilter, setStatusFilter] = useState('all');

  const handleCancelOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to cancel this offer?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      const response = await fetch(`/api/job-offers/${offerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Offer cancelled successfully');
        fetchPendingOffers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to cancel offer');
      }
    } catch (error) {
      console.error('Error cancelling offer:', error);
      toast.error('Error cancelling offer');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'accepted':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredOffers = statusFilter === 'all' 
    ? pendingOffers 
    : pendingOffers.filter(offer => offer.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Status Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            statusFilter === 'all'
              ? 'bg-[#FFC107] text-black'
              : 'bg-[#1F1F1F] text-[#B0B0B0] hover:text-white'
          }`}
        >
          All ({pendingOffers.length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            statusFilter === 'pending'
              ? 'bg-[#FFC107] text-black'
              : 'bg-[#1F1F1F] text-[#B0B0B0] hover:text-white'
          }`}
        >
          Pending ({pendingOffers.filter(o => o.status === 'pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('accepted')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            statusFilter === 'accepted'
              ? 'bg-[#FFC107] text-black'
              : 'bg-[#1F1F1F] text-[#B0B0B0] hover:text-white'
          }`}
        >
          Accepted ({pendingOffers.filter(o => o.status === 'accepted').length})
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            statusFilter === 'rejected'
              ? 'bg-[#FFC107] text-black'
              : 'bg-[#1F1F1F] text-[#B0B0B0] hover:text-white'
          }`}
        >
          Rejected ({pendingOffers.filter(o => o.status === 'rejected').length})
        </button>
      </div>

      {/* Job Offers List */}
      <div className="space-y-4">
        {pendingOffersLoading ? (
          <div className="p-6 rounded-lg text-center" style={{ backgroundColor: '#1F1F1F', color: '#B0B0B0' }}>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC107]"></div>
            <p className="mt-2">Loading offers...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-6 rounded-lg text-center" style={{ backgroundColor: '#1F1F1F', color: '#B0B0B0' }}>
            {statusFilter === 'all' ? (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>No job offers yet</p>
                <p className="text-sm mt-2">Send offers to drivers from the Hire Drivers tab</p>
              </>
            ) : (
              <p>No {statusFilter} offers found</p>
            )}
          </div>
        ) : (
          filteredOffers.map(offer => (
            <div
              key={offer._id}
              className="rounded-lg p-4 hover:shadow-md transition-shadow"
              style={{ backgroundColor: '#1F1F1F' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-medium" style={{ color: '#FFC107' }}>
                      {offer.driverId?.name || 'Unknown Driver'}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                      {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-2" style={{ color: '#B0B0B0' }}>
                    <div>
                      <strong style={{ color: '#FFFFFF' }}>Email:</strong> {offer.driverId?.email || 'N/A'}
                    </div>
                    <div>
                      <strong style={{ color: '#FFFFFF' }}>Salary:</strong> ₹{offer.salaryPerDay}/day
                    </div>
                  </div>

                  {offer.message && (
                    <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#0D0D0D' }}>
                      <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>Your Message:</p>
                      <p className="text-sm mt-1" style={{ color: '#B0B0B0' }}>
                        {offer.message}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4 mt-3 text-xs" style={{ color: '#888888' }}>
                    <span>Sent: {new Date(offer.createdAt).toLocaleDateString()}</span>
                    {offer.updatedAt && offer.updatedAt !== offer.createdAt && (
                      <span>Updated: {new Date(offer.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {offer.status === 'pending' && (
                    <button
                      onClick={() => handleCancelOffer(offer._id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-all"
                    >
                      Cancel Offer
                    </button>
                  )}
                  {offer.status === 'accepted' && (
                    <div className="px-4 py-2 rounded-lg text-sm text-center" style={{ backgroundColor: '#0D0D0D', color: '#4CAF50' }}>
                      ✓ Hired
                    </div>
                  )}
                  {offer.status === 'rejected' && (
                    <div className="px-4 py-2 rounded-lg text-sm text-center" style={{ backgroundColor: '#0D0D0D', color: '#F44336' }}>
                      ✗ Declined
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DriverStatusPage;
