import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminBusinesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCards, setExpandedCards] = useState([]);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/admin/users/business', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Businesses response:', response.data);
      console.log('Number of businesses:', response.data.users?.length);
      
      if (response.data.users && response.data.users.length > 0) {
        console.log('First business sample:', response.data.users[0]);
        console.log('First business details:', response.data.users[0]?.businessDetails);
      }

      setBusinesses(response.data.users || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error('Failed to fetch businesses');
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business =>
    business.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (business.name && business.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (business.businessDetails?.companyName && business.businessDetails.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (business.businessDetails?.ownerName && business.businessDetails.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleExpand = (businessId) => {
    setExpandedCards(prev => 
      prev.includes(businessId) 
        ? prev.filter(id => id !== businessId)
        : [...prev, businessId]
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Business Users</h2>
        <p className="text-[#B0B0B0]">Manage all registered business accounts</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-[#B0B0B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by email, company name, or owner name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition-all"
            style={{ backgroundColor: '#1F1F1F', borderColor: '#0D0D0D' }}
          />
        </div>
      </div>

      {/* Stats Card */}
      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#1F1F1F' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#B0B0B0] text-sm">Total Businesses</p>
            <p className="text-2xl font-bold text-white">{businesses.length}</p>
          </div>
          <div className="h-12 w-12 bg-[#FFC107] rounded-lg flex items-center justify-center">
            <svg className="h-6 w-6 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Businesses List */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFC107]"></div>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-12 rounded-lg" style={{ backgroundColor: '#1F1F1F' }}>
            <svg className="mx-auto h-12 w-12 text-[#B0B0B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">No businesses found</h3>
            <p className="mt-1 text-sm text-[#B0B0B0]">
              {searchTerm ? 'Try adjusting your search' : 'No businesses registered yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBusinesses.map((business) => {
              const isExpanded = expandedCards.includes(business._id);
              const businessDetails = business.businessDetails;

              return (
                <div 
                  key={business._id} 
                  className="rounded-lg overflow-hidden transition-all duration-300"
                  style={{ backgroundColor: '#1F1F1F' }}
                >
                  {/* Main Card Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      {/* Profile Picture - Centered */}
                      <div className="h-16 w-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFC107' }}>
                        {businessDetails?.profileIcon ? (
                          <img src={businessDetails.profileIcon} alt="" className="h-16 w-16 rounded-full object-cover" />
                        ) : business.profilePicture ? (
                          <img src={business.profilePicture} alt="" className="h-16 w-16 rounded-full object-cover" />
                        ) : (
                          <span className="text-black font-bold text-xl">
                            {businessDetails?.companyName 
                              ? businessDetails.companyName[0].toUpperCase() 
                              : business.email[0].toUpperCase()
                            }
                          </span>
                        )}
                      </div>

                      {/* Business Info - Single Row */}
                      <div className="flex-1 min-w-0">
                        {/* Company Name */}
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {businessDetails?.companyName || 'Company Name Not Set'}
                        </h3>
                        
                        {/* Details in Single Row */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#B0B0B0]">
                          {/* Owner Name */}
                          {businessDetails?.ownerName && (
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              <span className="truncate">{businessDetails.ownerName}</span>
                            </div>
                          )}

                          {/* Contact Number */}
                          {businessDetails?.contactNumber && (
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="truncate">{businessDetails.contactNumber}</span>
                            </div>
                          )}

                          {/* Email */}
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            <span className="truncate">{business.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* View More Button - Centered */}
                      <button
                        onClick={() => toggleExpand(business._id)}
                        className="p-2 rounded-lg hover:bg-[#0D0D0D] transition-all duration-200 flex-shrink-0"
                        style={{ color: '#FFC107' }}
                      >
                        <svg 
                          className={`h-6 w-6 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-6 pt-2 border-t" style={{ borderColor: '#0D0D0D' }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-[#FFC107] mb-3">Business Information</h4>
                          
                          {/* PAN Card */}
                          {businessDetails?.panCard && (
                            <div>
                              <label className="text-xs text-[#B0B0B0] block mb-1">PAN Card</label>
                              <p className="text-sm text-white">{businessDetails.panCard}</p>
                            </div>
                          )}

                          {/* User Phone */}
                          {business.phone && (
                            <div>
                              <label className="text-xs text-[#B0B0B0] block mb-1">User Phone</label>
                              <p className="text-sm text-white">{business.phone}</p>
                            </div>
                          )}

                          {/* Registration Date */}
                          <div>
                            <label className="text-xs text-[#B0B0B0] block mb-1">Registered On</label>
                            <p className="text-sm text-white">{formatDate(business.createdAt)}</p>
                          </div>

                          {/* Location Status */}
                          {businessDetails?.isLocationSet !== undefined && (
                            <div>
                              <label className="text-xs text-[#B0B0B0] block mb-1">Location Status</label>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                businessDetails.isLocationSet 
                                  ? 'bg-green-900 text-green-200' 
                                  : 'bg-red-900 text-red-200'
                              }`}>
                                {businessDetails.isLocationSet ? 'Location Set' : 'Location Not Set'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-[#FFC107] mb-3">Address Details</h4>
                          
                          {businessDetails?.address ? (
                            <>
                              {businessDetails.address.line1 && (
                                <div>
                                  <label className="text-xs text-[#B0B0B0] block mb-1">Address Line 1</label>
                                  <p className="text-sm text-white">{businessDetails.address.line1}</p>
                                </div>
                              )}
                              
                              {businessDetails.address.line2 && (
                                <div>
                                  <label className="text-xs text-[#B0B0B0] block mb-1">Address Line 2</label>
                                  <p className="text-sm text-white">{businessDetails.address.line2}</p>
                                </div>
                              )}

                              {(businessDetails.address.city || businessDetails.address.state || businessDetails.address.pincode) && (
                                <div>
                                  <label className="text-xs text-[#B0B0B0] block mb-1">City, State & Pincode</label>
                                  <p className="text-sm text-white">
                                    {[
                                      businessDetails.address.city,
                                      businessDetails.address.state,
                                      businessDetails.address.pincode
                                    ].filter(Boolean).join(', ')}
                                  </p>
                                </div>
                              )}

                              {businessDetails.address.country && (
                                <div>
                                  <label className="text-xs text-[#B0B0B0] block mb-1">Country</label>
                                  <p className="text-sm text-white">{businessDetails.address.country}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-[#B0B0B0] italic">No address information available</p>
                          )}

                          {/* Location Address */}
                          {businessDetails?.location?.address && (
                            <div>
                              <label className="text-xs text-[#B0B0B0] block mb-1">Location Address</label>
                              <p className="text-sm text-white">{businessDetails.location.address}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PAN Card Image */}
                      {businessDetails?.panCardImage && (
                        <div className="mt-6">
                          <label className="text-xs text-[#B0B0B0] block mb-2">PAN Card Image</label>
                          <img 
                            src={businessDetails.panCardImage} 
                            alt="PAN Card" 
                            className="max-w-xs rounded-lg border"
                            style={{ borderColor: '#0D0D0D' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBusinesses;
