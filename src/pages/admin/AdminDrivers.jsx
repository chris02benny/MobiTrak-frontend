import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/admin/users/driver', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setDrivers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.name && driver.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Driver Users</h2>
        <p className="text-[#B0B0B0]">Manage all registered driver accounts</p>
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
            placeholder="Search by email or name..."
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
            <p className="text-[#B0B0B0] text-sm">Total Drivers</p>
            <p className="text-2xl font-bold text-white">{drivers.length}</p>
          </div>
          <div className="h-12 w-12 bg-[#FFC107] rounded-lg flex items-center justify-center">
            <svg className="h-6 w-6 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Drivers List */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#1F1F1F' }}>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFC107]"></div>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-[#B0B0B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">No drivers found</h3>
            <p className="mt-1 text-sm text-[#B0B0B0]">
              {searchTerm ? 'Try adjusting your search' : 'No drivers registered yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: '#0D0D0D' }}>
              <thead style={{ backgroundColor: '#0D0D0D' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">
                    Registered On
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#0D0D0D' }}>
                {filteredDrivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-[#0D0D0D] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#FFC107' }}>
                          {driver.profilePicture ? (
                            <img src={driver.profilePicture} alt="" className="h-10 w-10 rounded-full" />
                          ) : (
                            <span className="text-black font-semibold">
                              {driver.name ? driver.name[0].toUpperCase() : driver.email[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {driver.name || 'N/A'}
                          </div>
                          <div className="text-xs text-[#B0B0B0]">
                            {driver.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{driver.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{driver.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{formatDate(driver.createdAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDrivers;
