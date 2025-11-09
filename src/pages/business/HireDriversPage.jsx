import React, { useState } from 'react';
import toast from 'react-hot-toast';

const HireDriversPage = ({ 
  drivers,
  driversLoading,
  fetchAvailableDrivers,
  selectedDriver,
  showDriverDetails,
  setSelectedDriver,
  setShowDriverDetails,
  offerForm,
  setOfferForm,
  showOfferModal,
  setShowOfferModal
}) => {
  const [expandedDriver, setExpandedDriver] = useState(null);
  const [driverDetails, setDriverDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleClassFilters, setVehicleClassFilters] = useState({
    HMV: false,
    LMV: false,
    MCWG: false,
    MCWOG: false
  });

  const fetchDriverDetails = async (driverId) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/drivers/${driverId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setDriverDetails(prev => ({
          ...prev,
          [driverId]: data.driver
        }));
      } else {
        toast.error('Failed to fetch driver details');
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
      toast.error('Error fetching driver details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleDriverExpanded = (driverId) => {
    if (expandedDriver === driverId) {
      setExpandedDriver(null);
    } else {
      setExpandedDriver(driverId);
      if (!driverDetails[driverId]) {
        fetchDriverDetails(driverId);
      }
    }
  };

  const openOfferModal = (driver) => {
    setSelectedDriver(driver);
    setShowOfferModal(true);
  };

  const handleSendOffer = async () => {
    if (!selectedDriver || !offerForm.message || !offerForm.salaryPerDay) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      const response = await fetch('/api/job-offers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driverId: selectedDriver._id,
          message: offerForm.message,
          salaryPerDay: parseFloat(offerForm.salaryPerDay)
        })
      });

      if (response.ok) {
        toast.success('Job offer sent successfully!');
        setShowOfferModal(false);
        setOfferForm({ message: '', salaryPerDay: '' });
        setSelectedDriver(null);
        fetchAvailableDrivers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to send job offer');
      }
    } catch (error) {
      console.error('Error sending job offer:', error);
      toast.error('Error sending job offer');
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const activeFilters = Object.keys(vehicleClassFilters).filter(key => vehicleClassFilters[key]);
    const matchesFilters = activeFilters.length === 0 || 
                          activeFilters.some(filter => 
                            driver.licenseDetails?.vehicleClasses?.includes(filter)
                          );
    
    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search drivers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{
              backgroundColor: '#1F1F1F',
              color: '#FFFFFF',
              border: '1px solid #0D0D0D'
            }}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {['HMV', 'LMV', 'MCWG', 'MCWOG'].map(filter => (
            <button
              key={filter}
              onClick={() => setVehicleClassFilters(prev => ({
                ...prev,
                [filter]: !prev[filter]
              }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                vehicleClassFilters[filter]
                  ? 'bg-[#FFC107] text-black'
                  : 'bg-[#1F1F1F] text-[#B0B0B0] hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Available Drivers */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
          Available Drivers ({filteredDrivers.length})
        </h3>

        {driversLoading ? (
          <div className="p-6 rounded-lg text-center" style={{ backgroundColor: '#1F1F1F', color: '#B0B0B0' }}>
            Loading drivers...
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-6 rounded-lg text-center" style={{ backgroundColor: '#1F1F1F', color: '#B0B0B0' }}>
            No available drivers found
          </div>
        ) : (
          filteredDrivers.map(driver => (
            <div
              key={driver._id}
              className="rounded-lg p-4"
              style={{ backgroundColor: '#1F1F1F' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium" style={{ color: '#FFC107' }}>
                    {driver.name}
                  </h4>
                  <p className="text-sm" style={{ color: '#B0B0B0' }}>
                    {driver.email}
                  </p>
                  {driver.licenseDetails?.vehicleClasses && (
                    <div className="flex gap-2 mt-2">
                      {driver.licenseDetails.vehicleClasses.map(vc => (
                        <span
                          key={vc}
                          className="px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: '#0D0D0D', color: '#FFC107' }}
                        >
                          {vc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleDriverExpanded(driver._id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: expandedDriver === driver._id ? '#FFC107' : '#0D0D0D',
                      color: expandedDriver === driver._id ? '#000000' : '#FFFFFF'
                    }}
                  >
                    {expandedDriver === driver._id ? 'Hide Details' : 'View Details'}
                  </button>
                  <button
                    onClick={() => openOfferModal(driver)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-all"
                  >
                    Send Offer
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedDriver === driver._id && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#0D0D0D' }}>
                  {loadingDetails && !driverDetails[driver._id] ? (
                    <p style={{ color: '#B0B0B0' }}>Loading details...</p>
                  ) : driverDetails[driver._id] ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>Phone</p>
                        <p className="text-sm" style={{ color: '#B0B0B0' }}>
                          {driverDetails[driver._id].phoneNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>License Number</p>
                        <p className="text-sm" style={{ color: '#B0B0B0' }}>
                          {driverDetails[driver._id].licenseDetails?.licenseNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>Address</p>
                        <p className="text-sm" style={{ color: '#B0B0B0' }}>
                          {driverDetails[driver._id].address || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>Experience</p>
                        <p className="text-sm" style={{ color: '#B0B0B0' }}>
                          {driverDetails[driver._id].yearsOfExperience || 'N/A'} years
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#B0B0B0' }}>No additional details available</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Send Offer Modal */}
      {showOfferModal && selectedDriver && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="rounded-lg max-w-md w-full p-6" style={{ backgroundColor: '#1F1F1F' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium" style={{ color: '#FFC107' }}>
                Send Job Offer to {selectedDriver.name}
              </h3>
              <button
                onClick={() => {
                  setShowOfferModal(false);
                  setOfferForm({ message: '', salaryPerDay: '' });
                  setSelectedDriver(null);
                }}
                style={{ color: '#B0B0B0' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  Salary per Day (₹)
                </label>
                <input
                  type="number"
                  value={offerForm.salaryPerDay}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, salaryPerDay: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#0D0D0D',
                    color: '#FFFFFF',
                    border: '1px solid #1F1F1F'
                  }}
                  placeholder="Enter salary per day"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  Message
                </label>
                <textarea
                  value={offerForm.message}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#0D0D0D',
                    color: '#FFFFFF',
                    border: '1px solid #1F1F1F'
                  }}
                  placeholder="Enter your message to the driver..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowOfferModal(false);
                    setOfferForm({ message: '', salaryPerDay: '' });
                    setSelectedDriver(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: '#0D0D0D',
                    color: '#FFFFFF'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendOffer}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#FFC107] text-black hover:bg-[#FFB300] transition-all"
                >
                  Send Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HireDriversPage;
