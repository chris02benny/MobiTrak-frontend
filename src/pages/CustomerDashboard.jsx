import { useState, useEffect } from 'react';
import VehiclesPage from './customer/VehiclesPage';
import EnquiriesPage from './customer/EnquiriesPage';
import MyTripsPage from './customer/MyTripsPage';
import ProfilePage from './customer/ProfilePage';

const CustomerDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [customerProfile, setCustomerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);


  const handleLogout = () => {
    onLogout();
  };

  // Fetch customer profile
  const fetchCustomerProfile = async () => {
    try {
      setProfileLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found for customer profile');
        return;
      }

      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomerProfile(data.profile);
        console.log('Customer profile fetched:', data.profile);
      } else if (response.status === 404) {
        console.log('Customer profile not found');
        setCustomerProfile(null);
      } else {
        console.error('Failed to fetch customer profile:', response.status);
      }
    } catch (error) {
      console.error('Error fetching customer profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Load customer profile on component mount
  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <header className="shadow-sm border-b bg-[#1F1F1F] border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-[#FFC107] rounded-lg flex items-center justify-center mr-3 shadow-card">
                <svg className="h-5 w-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 14H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">MobiTrak Customer</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Profile Section */}
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden bg-[#1F1F1F]">
                  {customerProfile?.profilePicture ? (
                    <img
                      src={customerProfile.profilePicture}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg className="h-6 w-6 text-[#B0B0B0]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">
                    {customerProfile?.name || 'Customer'}
                  </span>
                  <span className="text-xs text-[#B0B0B0]">Customer</span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-[#F44336] hover:bg-[#D32F2F] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="shadow-sm bg-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'vehicles', name: 'Find Vehicles' },
              { id: 'enquiries', name: 'My Enquiries' },
              { id: 'trips', name: 'My Trips' },
              { id: 'profile', name: 'Profile' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ease-in-out"
                style={activeTab === tab.id ? {
                  borderColor: '#FFC107',
                  color: '#FFC107'
                } : {
                  borderColor: 'transparent',
                  color: '#B0B0B0'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#B0B0B0';
                  }
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'vehicles' && <VehiclesPage />}
          {activeTab === 'enquiries' && <EnquiriesPage />}
          {activeTab === 'trips' && <MyTripsPage />}
          {activeTab === 'profile' && <ProfilePage onProfileUpdate={fetchCustomerProfile} />}
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;

