import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../utils/supabase';
import { 
  UserPlus, 
  Eye, 
  X,
  Check,
  Clock,
  DollarSign,
  Calendar,
  Briefcase
} from 'lucide-react';

const DriverManagementPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('available');
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [hireRequests, setHireRequests] = useState([]);
  const [hiredDrivers, setHiredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [hireForm, setHireForm] = useState({
    message: '',
    salary_offered: '',
    work_schedule: '',
    start_date: '',
    contract_duration_months: '',
    vehicle_id: ''
  });
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get business profile ID
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (businessError) throw businessError;

      // Fetch available drivers
      const { data: drivers, error: driversError } = await supabase
        .from('available_drivers')
        .select('*');

      if (driversError) throw driversError;

      // Fetch hire requests
      const { data: requests, error: requestsError } = await supabase
        .from('business_hire_requests')
        .select('*')
        .eq('business_id', businessProfile.id);

      if (requestsError) throw requestsError;

      // Fetch hired drivers
      const { data: hired, error: hiredError } = await supabase
        .from('driver_profiles')
        .select(`
          id,
          full_name,
          license_number,
          experience_years,
          rating,
          total_trips,
          city,
          state,
          profile_picture_url,
          hired_at
        `)
        .eq('hired_by_business_id', businessProfile.id)
        .eq('is_hired', true);

      if (hiredError) throw hiredError;

      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, manufacturer, model, license_plate')
        .eq('business_id', user.id);

      if (vehiclesError) throw vehiclesError;

      setAvailableDrivers(drivers);
      setHireRequests(requests);
      setHiredDrivers(hired);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load driver data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHireDriver = (driver) => {
    setSelectedDriver(driver);
    setShowHireModal(true);
  };

  const handleSubmitHireRequest = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Get business profile ID
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (businessError) throw businessError;

      const response = await fetch('/api/hiring/hire-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': businessProfile.id
        },
        body: JSON.stringify({
          business_id: businessProfile.id,
          driver_id: selectedDriver.driver_profile_id,
          vehicle_id: hireForm.vehicle_id || null,
          message: hireForm.message,
          salary_offered: hireForm.salary_offered ? parseFloat(hireForm.salary_offered) : null,
          work_schedule: hireForm.work_schedule,
          start_date: hireForm.start_date,
          contract_duration_months: hireForm.contract_duration_months ? parseInt(hireForm.contract_duration_months) : null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send hire request');
      }

      showToast('Hire request sent successfully!', 'success');
      setShowHireModal(false);
      setHireForm({
        message: '',
        salary_offered: '',
        work_schedule: '',
        start_date: '',
        contract_duration_months: '',
        vehicle_id: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error sending hire request:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelHireRequest = async (requestId) => {
    try {
      const response = await fetch(`/api/hiring/hire-requests/${requestId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': user.id
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel hire request');
      }

      showToast('Hire request cancelled', 'success');
      fetchData();
    } catch (error) {
      console.error('Error cancelling hire request:', error);
      showToast(error.message, 'error');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-bgBlack text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading driver data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgBlack text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Driver Management</h1>
          <p className="text-gray-400">Manage your driver hiring and assignments</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'available', label: 'Available Drivers', count: availableDrivers.length },
            { id: 'requests', label: 'Hire Requests', count: hireRequests.length },
            { id: 'hired', label: 'Hired Drivers', count: hiredDrivers.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Available Drivers Tab */}
        {activeTab === 'available' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableDrivers.map((driver) => (
              <div key={driver.driver_profile_id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {driver.full_name?.charAt(0) || 'D'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{driver.full_name || 'Unknown Driver'}</h3>
                    <p className="text-gray-400 text-sm">{driver.license_number}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{driver.experience_years || 0} years experience</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1">{driver.rating || 0} rating</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-400">{driver.city}, {driver.state}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleHireDriver(driver)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Job Offer
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hire Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {hireRequests.map((request) => (
              <div key={request.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{request.driver_name}</h3>
                    <p className="text-gray-400">{request.driver_email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {request.salary_offered && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      <span>₹{request.salary_offered.toLocaleString()}</span>
                    </div>
                  )}
                  {request.work_schedule && (
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{request.work_schedule}</span>
                    </div>
                  )}
                  {request.start_date && (
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{new Date(request.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {request.message && (
                  <p className="text-gray-300 mb-4">{request.message}</p>
                )}

                {request.driver_message && (
                  <div className="bg-gray-700 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-300">
                      <strong>Driver Response:</strong> {request.driver_message}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleCancelHireRequest(request.id)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hired Drivers Tab */}
        {activeTab === 'hired' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hiredDrivers.map((driver) => (
              <div key={driver.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {driver.full_name?.charAt(0) || 'D'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{driver.full_name || 'Unknown Driver'}</h3>
                    <p className="text-gray-400 text-sm">{driver.license_number}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{driver.experience_years || 0} years experience</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1">{driver.rating || 0} rating</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-400">Hired on {new Date(driver.hired_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hire Modal */}
        {showHireModal && selectedDriver && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Send Job Offer</h2>
              
              <form onSubmit={handleSubmitHireRequest}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Driver</label>
                    <p className="text-gray-300">{selectedDriver.full_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      value={hireForm.message}
                      onChange={(e) => setHireForm({...hireForm, message: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      rows={3}
                      placeholder="Tell the driver about the job opportunity..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Salary Offered (₹)</label>
                    <input
                      type="number"
                      value={hireForm.salary_offered}
                      onChange={(e) => setHireForm({...hireForm, salary_offered: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      placeholder="e.g., 25000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Work Schedule</label>
                    <input
                      type="text"
                      value={hireForm.work_schedule}
                      onChange={(e) => setHireForm({...hireForm, work_schedule: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      placeholder="e.g., 9 AM - 6 PM, Monday to Friday"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={hireForm.start_date}
                      onChange={(e) => setHireForm({...hireForm, start_date: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Contract Duration (months)</label>
                    <input
                      type="number"
                      value={hireForm.contract_duration_months}
                      onChange={(e) => setHireForm({...hireForm, contract_duration_months: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      placeholder="e.g., 12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Vehicle (Optional)</label>
                    <select
                      value={hireForm.vehicle_id}
                      onChange={(e) => setHireForm({...hireForm, vehicle_id: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Select a vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.manufacturer} {vehicle.model} ({vehicle.license_plate})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowHireModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Offer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverManagementPage;