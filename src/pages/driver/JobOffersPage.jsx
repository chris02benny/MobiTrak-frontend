import React from 'react';
import toast from 'react-hot-toast';

const JobOffersPage = ({ jobOffers, offersLoading, respondToOffer }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: '#FFC107' }}>Job Offers</h2>
      
      <div className="shadow rounded-lg p-6" style={{ backgroundColor: '#1F1F1F' }}>
        {offersLoading ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#FFC107' }}></div>
            <p className="mt-2" style={{ color: '#B0B0B0' }}>Loading job offers...</p>
          </div>
        ) : jobOffers.length === 0 ? (
          <div className="text-center py-6">
            <svg className="mx-auto h-12 w-12" style={{ color: '#B0B0B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#FFC107' }}>No job offers</h3>
            <p className="mt-1 text-sm" style={{ color: '#B0B0B0' }}>You haven't received any job offers yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobOffers.map((offer) => (
              <div key={offer.id} className="rounded-lg p-6 hover:shadow-md transition-shadow" style={{ border: '1px solid #1F1F1F', backgroundColor: '#0D0D0D' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#1F1F1F' }}>
                          {offer.business?.profileIcon ? (
                            <img
                              src={offer.business.profileIcon}
                              alt="Business Logo"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <svg className="h-6 w-6" style={{ color: '#B0B0B0' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium" style={{ color: '#FFC107' }}>
                            {offer.business?.companyName || offer.business?.email || 'Unknown Business'}
                          </h3>
                          {offer.business?.ownerName && (
                            <p className="text-sm" style={{ color: '#B0B0B0' }}>Owner: {offer.business.ownerName}</p>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        offer.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : offer.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-900 text-red-800'
                      }`}>
                        {offer.status}
                      </span>
                    </div>

                    {/* Business Details Section */}
                    <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#1F1F1F' }}>
                      <h4 className="text-sm font-medium mb-3" style={{ color: '#FFC107' }}>Business Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {offer.business?.contactNumber && (
                          <div>
                            <span className="font-medium" style={{ color: '#FFFFFF' }}>Contact:</span>
                            <span className="ml-2" style={{ color: '#B0B0B0' }}>{offer.business.contactNumber}</span>
                          </div>
                        )}
                        {offer.business?.address && (
                          <div>
                            <span className="font-medium" style={{ color: '#FFFFFF' }}>Location:</span>
                            <span className="ml-2" style={{ color: '#B0B0B0' }}>
                              {offer.business.address.city && offer.business.address.state 
                                ? `${offer.business.address.city}, ${offer.business.address.state}`
                                : offer.business.address.line1 || 'Not specified'
                              }
                            </span>
                          </div>
                        )}
                        {offer.business?.panCard && (
                          <div>
                            <span className="font-medium text-white">PAN:</span>
                            <span className="text-gray-400 ml-2">{offer.business.panCard}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-white">Email:</span>
                          <span className="text-gray-400 ml-2">{offer.business?.email || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Job Offer Details */}
                    <div className="bg-blue-900 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-yellow-500 mb-2">Job Offer Details</h4>
                      <p className="text-sm text-white mb-3">{offer.message}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium text-white">Daily Salary:</span>
                          <span className="text-green-600 font-semibold ml-2">₹{offer.salaryPerDay}/day</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          <span className="font-medium">Sent:</span> {new Date(offer.sentAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {offer.status === 'pending' && (
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => respondToOffer(offer.id, 'rejected')}
                      className="px-4 py-2 text-sm font-medium text-red-300 bg-red-900 hover:bg-red-800 rounded-md"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => respondToOffer(offer.id, 'accepted')}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobOffersPage;

