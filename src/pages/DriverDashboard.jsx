import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import ProfilePage from './driver/ProfilePage';
import JobOffersPage from './driver/JobOffersPage';
import { THEME_COLORS, getThemeStyles } from '../utils/theme';

const DriverDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    dlNumber: '',
    dlIssueDate: '',
    dlValidity: '',
    name: '',
    dateOfBirth: '',
    bloodGroup: '',
    permanentAddress: '',
    vehicleClass: []
  });
  const [licenseImages, setLicenseImages] = useState({
    front: null,
    back: null
  });
  const [jobOffers, setJobOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    completedTrips: 0
  });

  const handleLogout = () => {
    onLogout();
  };

  // Load driver profile on component mount
  useEffect(() => {
    loadDriverProfile();
  }, []);

  // Load job offers when offers tab is active
  useEffect(() => {
    if (activeTab === 'offers') {
      loadJobOffers();
    }
  }, [activeTab]);

  // Load assigned trips and earnings when overview tab is active
  useEffect(() => {
    if (activeTab === 'overview') {
      loadAssignedTrips();
      loadEarnings();
    }
  }, [activeTab]);

  const loadDriverProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/drivers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDriverProfile(data.driver);
        if (data.driver) {
          setProfileForm({
            dlNumber: data.driver.dlNumber || '',
            dlIssueDate: data.driver.dlIssueDate ? new Date(data.driver.dlIssueDate).toISOString().split('T')[0] : '',
            dlValidity: data.driver.dlValidity ? new Date(data.driver.dlValidity).toISOString().split('T')[0] : '',
            name: data.driver.name || '',
            dateOfBirth: data.driver.dateOfBirth ? new Date(data.driver.dateOfBirth).toISOString().split('T')[0] : '',
            bloodGroup: data.driver.bloodGroup || '',
            permanentAddress: data.driver.permanentAddress || '',
            vehicleClass: data.driver.vehicleClass || []
          });
        }
      }
    } catch (error) {
      console.error('Error loading driver profile:', error);
    }
  };

  const loadJobOffers = async () => {
    try {
      setOffersLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/job-offers/driver', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Job offers response:', data);
        console.log('Job offers data:', data.jobOffers);
        setJobOffers(data.jobOffers || []);
      } else {
        console.error('Failed to load job offers:', response.status);
        toast.error('Failed to load job offers');
      }
    } catch (error) {
      console.error('Error loading job offers:', error);
      toast.error('Error loading job offers');
    } finally {
      setOffersLoading(false);
    }
  };

  const respondToOffer = async (offerId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/job-offers/${offerId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`Job offer ${status} successfully!`);
        loadJobOffers(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || `Failed to ${status} offer`);
      }
    } catch (error) {
      console.error(`Error ${status}ing offer:`, error);
      toast.error(`Error ${status}ing offer`);
    }
  };

  const loadAssignedTrips = async () => {
    try {
      setTripsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/drivers/assigned-trips', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignedTrips(data.trips || []);
      } else {
        console.error('Failed to load assigned trips:', response.status);
        toast.error('Failed to load assigned trips');
      }
    } catch (error) {
      console.error('Error loading assigned trips:', error);
      toast.error('Error loading assigned trips');
    } finally {
      setTripsLoading(false);
    }
  };

  const loadEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/drivers/earnings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEarnings(data.earnings || { total: 0, thisMonth: 0, completedTrips: 0 });
      } else {
        console.error('Failed to load earnings:', response.status);
        // Don't show error toast for earnings as it's not critical
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
      // Don't show error toast for earnings as it's not critical
    }
  };

  const handleImageUpload = (side, file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target.result;
      setLicenseImages(prev => ({
        ...prev,
        [side]: imageData
      }));
      
      // Automatically extract data when image is uploaded
      await extractLicenseInfo(side, imageData);
    };
    reader.readAsDataURL(file);
  };

  const extractLicenseInfo = async (side, imageData = null) => {
    const imageToUse = imageData || licenseImages[side];
    if (!imageToUse) {
      alert('Please upload an image first');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const base64Data = imageToUse.split(',')[1];
      
      const response = await fetch('/api/drivers/extract-license-info', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
          side: side
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const extractedData = data.data;
          
          if (side === 'front') {
            // Update form with front side data
            setProfileForm(prev => ({
              ...prev,
              dlNumber: extractedData.dlNumber !== 'Not Available' ? extractedData.dlNumber : prev.dlNumber,
              dlIssueDate: extractedData.dlIssueDate ? extractedData.dlIssueDate : prev.dlIssueDate,
              dlValidity: extractedData.dlValidity ? extractedData.dlValidity : prev.dlValidity,
              name: extractedData.name !== 'Not Available' ? extractedData.name : prev.name,
              dateOfBirth: extractedData.dateOfBirth ? extractedData.dateOfBirth : prev.dateOfBirth,
              bloodGroup: extractedData.bloodGroup !== 'Not Available' ? extractedData.bloodGroup : prev.bloodGroup,
              permanentAddress: extractedData.permanentAddress !== 'Not Available' ? extractedData.permanentAddress : prev.permanentAddress
            }));
            
            // Show success message with extracted fields
            const extractedFields = [];
            if (extractedData.dlNumber !== 'Not Available') extractedFields.push('DL Number');
            if (extractedData.name !== 'Not Available') extractedFields.push('Name');
            if (extractedData.dlIssueDate) extractedFields.push('Issue Date');
            if (extractedData.dlValidity) extractedFields.push('Validity');
            if (extractedData.dateOfBirth) extractedFields.push('Date of Birth');
            if (extractedData.bloodGroup !== 'Not Available') extractedFields.push('Blood Group');
            if (extractedData.permanentAddress !== 'Not Available') extractedFields.push('Address');
            
            console.log(`Front side extracted: ${extractedFields.join(', ')}`);
          } else {
            // Update form with back side data (vehicle class)
            const vehicleClasses = Array.isArray(extractedData.vehicleClass) ? extractedData.vehicleClass : [extractedData.vehicleClass];
            const validClasses = vehicleClasses.filter(cls => cls !== 'Not Available');
            
            if (validClasses.length > 0) {
              setProfileForm(prev => ({
                ...prev,
                vehicleClass: validClasses
              }));
              console.log(`Back side extracted: Vehicle Classes - ${validClasses.join(', ')}`);
            }
          }
        }
      } else {
        const errorData = await response.json();
        console.error(`Failed to extract information: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error extracting license info:', error);
      alert('Error extracting information from image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    
    if (!licenseImages.front || !licenseImages.back) {
      alert('Please upload both front and back images of your driving license');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const frontBase64 = licenseImages.front.split(',')[1];
      const backBase64 = licenseImages.back.split(',')[1];

      const response = await fetch('/api/drivers/upload-license', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...profileForm,
          frontImageBase64: frontBase64,
          backImageBase64: backBase64
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Profile updated successfully!');
        loadDriverProfile(); // Reload profile data
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0D0D0D' }}>
      {/* Sidebar Navigation */}
      <div className="w-64 shadow-lg flex flex-col sticky top-0 h-screen" style={{ backgroundColor: '#1F1F1F', borderRight: '1px solid #0D0D0D' }}>
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: '#0D0D0D' }}>
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: '#FFC107' }}>
              <svg className="h-5 w-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 14H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold" style={{ color: '#FFFFFF' }}>MobiTrak Driver</h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'overview', name: 'Overview', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
            { id: 'trips', name: 'My Trips', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            { id: 'profile', name: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { id: 'offers', name: 'Job Offers', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors"
              style={activeTab === tab.id ? {
                backgroundColor: '#FFC107',
                color: '#000000'
              } : {
                backgroundColor: 'transparent',
                color: '#FFFFFF'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = '#FFC107';
                  e.currentTarget.style.color = '#000000';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
            >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="flex-1 text-left">{tab.name}</span>
              
              {/* Profile Warning Badge */}
              {tab.id === 'profile' && driverProfile && !driverProfile.profileCompleted && (
                <div className="flex items-center">
                  <div className="relative">
                    <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Driver Profile Section */}
        <div className="p-4 border-t" style={{ borderColor: '#0D0D0D' }}>
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full flex items-center justify-center mr-3 overflow-hidden" style={{ backgroundColor: '#1F1F1F' }}>
              {driverProfile?.profileIcon ? (
                <img
                  src={driverProfile.profileIcon}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg className="h-6 w-6" style={{ color: '#B0B0B0' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#FFC107' }}>
                {driverProfile?.name || 'Driver Name'}
              </p>
              <p className="text-xs truncate" style={{ color: '#B0B0B0' }}>
                {driverProfile?.dlNumber || 'License Number'}
              </p>
              {driverProfile?.status && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  driverProfile.status === 'Hired' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {driverProfile.status}
                </span>
              )}
            </div>
          </div>

          {/* Profile Completion Warning */}
          {driverProfile && !driverProfile.profileCompleted && (
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#1F1F1F', border: '1px solid #FFC107' }}>
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FFC107' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs" style={{ color: '#FFFFFF' }}>
                  Complete your profile to receive job offers
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#F44336' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D32F2F'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F44336'}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 py-8 px-6">
          <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="rounded-lg shadow p-6" style={{ backgroundColor: '#1F1F1F' }}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#FFC107' }}>Driver Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="rounded-lg p-4" style={{ backgroundColor: '#0D0D0D', border: '1px solid #1F1F1F' }}>
                    <h3 className="text-lg font-semibold" style={{ color: '#FFC107' }}>Profile Status</h3>
                    <p style={{ color: '#FFFFFF' }}>
                      {driverProfile?.profileCompleted ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: '#0D0D0D', border: '1px solid #1F1F1F' }}>
                    <h3 className="text-lg font-semibold" style={{ color: '#FFC107' }}>Job Offers</h3>
                    <p style={{ color: '#FFFFFF' }}>{jobOffers.length} available</p>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: '#0D0D0D', border: '1px solid #1F1F1F' }}>
                    <h3 className="text-lg font-semibold" style={{ color: '#FFC107' }}>Driver Status</h3>
                    <p style={{ color: '#FFFFFF' }}>{driverProfile?.status || 'Pending'}</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity - Assigned Trips */}
              <div className="rounded-lg shadow p-6" style={{ backgroundColor: '#1F1F1F' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFC107' }}>Recent Activity</h3>
                {tripsLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#FFC107' }}></div>
                    <p className="mt-2" style={{ color: '#B0B0B0' }}>Loading recent trips...</p>
                  </div>
                ) : assignedTrips.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12" style={{ color: '#B0B0B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium" style={{ color: '#FFC107' }}>No assigned trips</h3>
                    <p className="mt-1 text-sm" style={{ color: '#B0B0B0' }}>You haven't been assigned to any trips yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignedTrips.slice(0, 5).map((trip) => (
                      <div key={trip.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#0D0D0D' }}>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: '#FFC107' }}>
                            Trip to {trip.destination || 'Unknown Destination'}
                          </p>
                          <p className="text-xs" style={{ color: '#B0B0B0' }}>
                            Assigned by {trip.business?.companyName || 'Business'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            trip.status === 'assigned' 
                              ? 'bg-blue-100 text-blue-800'
                              : trip.status === 'in_progress'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-700 text-gray-800'
                          }`}>
                            {trip.status === 'assigned' ? 'Assigned' : trip.status === 'in_progress' ? 'In Progress' : trip.status}
                          </span>
                          <p className="text-xs mt-1" style={{ color: '#B0B0B0' }}>
                            {new Date(trip.assignedAt || trip.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'profile' && (
            <ProfilePage 
              driverProfile={driverProfile}
              setDriverProfile={setDriverProfile}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              licenseImages={licenseImages}
              setLicenseImages={setLicenseImages}
              handleImageUpload={handleImageUpload}
              extractLicenseInfo={extractLicenseInfo}
              handleSubmitProfile={handleSubmitProfile}
              loading={loading}
            />
          )}
          {activeTab === 'trips' && (
            <div className="space-y-6">
              <div className="rounded-lg shadow p-6" style={{ backgroundColor: '#1F1F1F' }}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#FFC107' }}>My Assigned Trips</h2>
                {tripsLoading ? (
                  <div className="text-center py-6">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#FFC107' }}></div>
                    <p className="mt-2" style={{ color: '#B0B0B0' }}>Loading trips...</p>
                  </div>
                ) : assignedTrips.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12" style={{ color: '#B0B0B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium" style={{ color: '#FFC107' }}>No assigned trips</h3>
                    <p className="mt-1 text-sm" style={{ color: '#B0B0B0' }}>You haven't been assigned to any trips yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignedTrips.map((trip) => (
                      <div key={trip.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" style={{ borderColor: '#1F1F1F' }}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-medium" style={{ color: '#FFC107' }}>
                                Trip to {trip.destination || 'Unknown Destination'}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                trip.status === 'assigned' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : trip.status === 'in_progress'
                                  ? 'bg-green-100 text-green-800'
                                  : trip.status === 'completed'
                                  ? 'bg-gray-700 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {trip.status === 'assigned' ? 'Assigned' : 
                                 trip.status === 'in_progress' ? 'In Progress' : 
                                 trip.status === 'completed' ? 'Completed' : trip.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400 mb-2">
                              <div>
                                <strong>Business:</strong> {trip.business?.companyName || 'Unknown Business'}
                              </div>
                              <div>
                                <strong>Vehicle:</strong> {trip.vehicle?.registeredNumber || 'Not assigned'}
                              </div>
                            </div>
                            
                            {trip.route && (
                              <div className="text-sm text-gray-400 mb-2">
                                <strong>Route:</strong> {trip.route.from} → {trip.route.to}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400 mb-2">
                              <div>
                                <strong>Assigned:</strong> {new Date(trip.assignedAt || trip.createdAt).toLocaleDateString()}
                              </div>
                              {trip.earnings && (
                                <div>
                                  <strong>Earnings:</strong> ₹{trip.earnings.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {trip.status === 'assigned' && (
                          <div className="flex justify-end space-x-3">
                            <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">
                              Start Trip
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-md">
                              View Details
                            </button>
                          </div>
                        )}
                        
                        {trip.status === 'in_progress' && (
                          <div className="flex justify-end space-x-3">
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                              Update Status
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">
                              Complete Trip
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'offers' && (
            <JobOffersPage 
              jobOffers={jobOffers}
              offersLoading={offersLoading}
              respondToOffer={respondToOffer}
            />
          )}
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
};

export default DriverDashboard;

