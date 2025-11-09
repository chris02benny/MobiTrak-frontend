import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import AdminBusinesses from './AdminBusinesses';
import AdminDrivers from './AdminDrivers';
import AdminCustomers from './AdminCustomers';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('businesses');
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    // Get admin info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setAdminProfile(user);
    }
  }, []);

  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0D0D0D' }}>
      {/* Sidebar Navigation */}
      <div className="w-64 shadow-lg flex flex-col sticky top-0 h-screen" style={{ backgroundColor: '#1F1F1F', borderRight: '1px solid #0D0D0D' }}>
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: '#0D0D0D' }}>
          <div className="flex items-center">
            <div className="h-8 w-8 bg-[#FFC107] rounded-lg flex items-center justify-center mr-3 shadow-card">
              <svg className="h-5 w-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white">MobiTrak Admin</h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'businesses', name: 'Businesses', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
            { id: 'drivers', name: 'Drivers', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { id: 'customers', name: 'Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out"
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
              {tab.name}
            </button>
          ))}
        </nav>

        {/* Admin Profile Section */}
        <div className="p-4 border-t" style={{ borderColor: '#0D0D0D' }}>
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full flex items-center justify-center mr-3 overflow-hidden" style={{ backgroundColor: '#FFC107' }}>
              <svg className="h-6 w-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">
                {adminProfile?.email || 'Admin User'}
              </p>
              <p className="text-xs truncate text-[#B0B0B0]">
                Administrator
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-[#F44336] hover:bg-[#D32F2F] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 py-8 px-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'businesses' && <AdminBusinesses />}
            {activeTab === 'drivers' && <AdminDrivers />}
            {activeTab === 'customers' && <AdminCustomers />}
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
};

export default AdminDashboard;
