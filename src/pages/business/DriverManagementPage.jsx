import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import ConfirmationModal from '../../components/ConfirmationModal';

const DriverManagementPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('hired');
  const [hiredDrivers, setHiredDrivers] = useState([]);
  const [driverPool, setDriverPool] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchHiredDrivers();
    fetchDriverPool();
    fetchVehicles();
    fetchAssignments();
  }, []);

  const fetchHiredDrivers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/drivers?business_id=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setHiredDrivers(data.data.filter(driver => driver.user_profiles?.profile_complete));
      } else {
        showToast(`Failed to fetch hired drivers: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching hired drivers:', error);
      showToast('Error fetching hired drivers', 'error');
    }
  };

  const fetchDriverPool = async () => {
    try {
      const response = await fetch('http://localhost:5000/driver-pool');
      const data = await response.json();
      if (response.ok) {
        setDriverPool(data.data);
      } else {
        showToast(`Failed to fetch driver pool: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching driver pool:', error);
      showToast('Error fetching driver pool', 'error');
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`http://localhost:5000/vehicles?business_id=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setVehicles(data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/assignments?business_id=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setAssignments(data.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchDriverReviews = async (driverId) => {
    try {
      const response = await fetch(`http://localhost:5000/drivers/${driverId}/reviews`);
      const data = await response.json();
      if (response.ok) {
        setReviews(data.data);
        setShowReviewsModal(true);
      } else {
        showToast(`Failed to fetch reviews: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showToast('Error fetching reviews', 'error');
    }
  };

  const handleHireDriver = async () => {
    if (!selectedDriver) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/drivers/hire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: user.id,
          driver_pool_id: selectedDriver.id
        }),
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Driver hired successfully!', 'success');
        setShowHireModal(false);
        setSelectedDriver(null);
        fetchHiredDrivers();
        fetchDriverPool();
      } else {
        showToast(`Failed to hire driver: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error hiring driver:', error);
      showToast('Error hiring driver', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver || !selectedVehicle) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: user.id,
          driver_id: selectedDriver.id,
          vehicle_id: selectedVehicle
        }),
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Driver assigned to vehicle successfully!', 'success');
        setShowAssignModal(false);
        setSelectedDriver(null);
        setSelectedVehicle('');
        fetchAssignments();
      } else {
        showToast(`Failed to assign driver: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      showToast('Error assigning driver', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignDriver = async (assignmentId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/assignments/${assignmentId}/unassign`, {
        method: 'PUT',
      });

      if (response.ok) {
        showToast('Driver unassigned successfully!', 'success');
        fetchAssignments();
      } else {
        const data = await response.json();
        showToast(`Failed to unassign driver: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error unassigning driver:', error);
      showToast('Error unassigning driver', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openHireModal = (driver) => {
    setSelectedDriver(driver);
    setShowHireModal(true);
  };

  const openAssignModal = (driver) => {
    setSelectedDriver(driver);
    setShowAssignModal(true);
  };

  const openReviewsModal = (driver) => {
    setSelectedDriver(driver);
    fetchDriverReviews(driver.id);
  };

  const getAvailableVehicles = () => {
    const assignedVehicleIds = assignments.map(assignment => assignment.vehicle_id);
    return vehicles.filter(vehicle => !assignedVehicleIds.includes(vehicle.id));
  };

  const getDriverAssignment = (driverId) => {
    return assignments.find(assignment => assignment.driver_id === driverId);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-lg ${i <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const sidebarItems = [
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      label: 'Overview', 
      onClick: () => window.location.href = '/dashboard/business' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ), 
      label: 'Add Vehicle', 
      onClick: () => window.location.href = '/business/add-vehicle' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ), 
      label: 'View Vehicles', 
      onClick: () => window.location.href = '/business/vehicles' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ), 
      label: 'Manage Labels', 
      onClick: () => window.location.href = '/business/labels' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ), 
      label: 'Driver Management', 
      onClick: () => {} 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      label: 'Analytics', 
      onClick: () => {} 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ), 
      label: 'Maintenance', 
      onClick: () => {} 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ), 
      label: 'Reports', 
      onClick: () => {} 
    },
  ];

  return (
    <DashboardLayout title="Driver Management" sidebarItems={sidebarItems}>
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/dashboard/business" className="text-gray-400 hover:text-primary transition-colors">
                Dashboard
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-gray-400 md:ml-2">Driver Management</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Driver Management</h1>
        <p className="text-gray-400">Hire drivers, manage assignments, and view performance</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-white/10 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('hired')}
            className={`px-6 py-3 rounded-md transition-all ${
              activeTab === 'hired'
                ? 'bg-primary text-black font-semibold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Hired Drivers ({hiredDrivers.length})
          </button>
          <button
            onClick={() => setActiveTab('pool')}
            className={`px-6 py-3 rounded-md transition-all ${
              activeTab === 'pool'
                ? 'bg-primary text-black font-semibold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Driver Pool ({driverPool.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-3 rounded-md transition-all ${
              activeTab === 'assignments'
                ? 'bg-primary text-black font-semibold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Assignments ({assignments.length})
          </button>
        </div>
      </div>

      {/* Hired Drivers Tab */}
      {activeTab === 'hired' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {hiredDrivers.map((driver) => {
              const assignment = getDriverAssignment(driver.id);
              return (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DashboardCard className="p-6 hover:bg-white/15 transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                          {driver.user_profiles?.full_name || 'Unknown Driver'}
                        </h3>
                        <p className="text-gray-400 text-sm">{driver.user_profiles?.email}</p>
                        <p className="text-gray-400 text-sm">License: {driver.driver_profiles?.license_number}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openReviewsModal(driver)}
                          className="p-2 text-gray-400 hover:text-primary transition-colors"
                          title="View reviews"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openAssignModal(driver)}
                          className="p-2 text-gray-400 hover:text-primary transition-colors"
                          title="Assign to vehicle"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Address:</span>
                        <span className="text-white">{driver.driver_profiles?.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white">{driver.driver_profiles?.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rating:</span>
                        <div className="flex items-center space-x-1">
                          {renderStars(Math.round(driver.rating))}
                          <span className="text-white ml-1">({driver.rating.toFixed(1)})</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trips:</span>
                        <span className="text-white">{driver.total_trips}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hired:</span>
                        <span className="text-white">{new Date(driver.hire_date).toLocaleDateString()}</span>
                      </div>
                      {assignment && (
                        <div className="mt-4 p-3 bg-white/10 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-gray-400">Assigned to:</p>
                              <p className="text-white font-medium">
                                {assignment.vehicles?.make} {assignment.vehicles?.model}
                              </p>
                              <p className="text-xs text-gray-400">
                                {assignment.vehicles?.registration_number}
                              </p>
                            </div>
                            <button
                              onClick={() => handleUnassignDriver(assignment.id)}
                              className="p-2 text-red-400 hover:text-red-300 transition-colors"
                              title="Unassign"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DashboardCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Driver Pool Tab */}
      {activeTab === 'pool' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {driverPool.map((driver) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardCard className="p-6 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                        {driver.user_profiles?.full_name || 'Unknown Driver'}
                      </h3>
                      <p className="text-gray-400 text-sm">{driver.user_profiles?.email}</p>
                    </div>
                    <button
                      onClick={() => openHireModal(driver)}
                      className="enterprise-button px-4 py-2 text-sm"
                    >
                      Hire
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">License:</span>
                      <span className="text-white">{driver.license_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating:</span>
                      <div className="flex items-center space-x-1">
                        {renderStars(Math.round(driver.rating))}
                        <span className="text-white ml-1">({driver.rating.toFixed(1)})</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Experience:</span>
                      <span className="text-white">{driver.experience_years} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trips:</span>
                      <span className="text-white">{driver.total_trips}</span>
                    </div>
                    {driver.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white">{driver.phone}</span>
                      </div>
                    )}
                  </div>
                </DashboardCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {assignments.map((assignment) => (
            <DashboardCard key={assignment.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {assignment.drivers?.user_profiles?.full_name || 'Unknown Driver'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      License: {assignment.drivers?.license_number}
                    </p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {assignment.vehicles?.make} {assignment.vehicles?.model}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {assignment.vehicles?.registration_number}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Assigned</p>
                    <p className="text-white">
                      {new Date(assignment.assigned_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnassignDriver(assignment.id)}
                    className="enterprise-button-secondary px-4 py-2 text-sm"
                  >
                    Unassign
                  </button>
                </div>
              </div>
            </DashboardCard>
          ))}
          {assignments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚗👨‍💼</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Assignments Yet</h3>
              <p className="text-gray-400 mb-6">Assign drivers to vehicles to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Empty States */}
      {activeTab === 'hired' && hiredDrivers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👨‍💼</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Hired Drivers Yet</h3>
          <p className="text-gray-400 mb-6">Hire drivers from the driver pool to get started</p>
          <button
            onClick={() => setActiveTab('pool')}
            className="enterprise-button px-6 py-3"
          >
            View Driver Pool
          </button>
        </div>
      )}

      {activeTab === 'pool' && driverPool.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Drivers Available</h3>
          <p className="text-gray-400 mb-6">No drivers are currently available in the pool</p>
        </div>
      )}

      {/* Hire Driver Modal */}
      <ConfirmationModal
        isOpen={showHireModal}
        onClose={() => setShowHireModal(false)}
        onConfirm={handleHireDriver}
        title="Hire Driver"
        message={
          <div className="text-left">
            <p className="mb-4">Are you sure you want to hire this driver?</p>
            {selectedDriver && (
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {selectedDriver.user_profiles?.full_name}</div>
                <div><strong>Email:</strong> {selectedDriver.user_profiles?.email}</div>
                <div><strong>License:</strong> {selectedDriver.license_number}</div>
                <div><strong>Rating:</strong> {selectedDriver.rating.toFixed(1)}/5.0</div>
                <div><strong>Experience:</strong> {selectedDriver.experience_years} years</div>
              </div>
            )}
          </div>
        }
        confirmText="Hire Driver"
        cancelText="Cancel"
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
        loading={loading}
      />

      {/* Assign Driver Modal */}
      <ConfirmationModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onConfirm={handleAssignDriver}
        title="Assign Driver to Vehicle"
        message={
          <div className="space-y-4">
            <div>
              <p className="mb-2">Assign <strong>{selectedDriver?.user_profiles?.full_name}</strong> to a vehicle:</p>
            </div>
            <div>
              <label htmlFor="vehicle-select" className="block text-sm font-medium text-gray-300 mb-2">
                Select Vehicle
              </label>
              <select
                id="vehicle-select"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="enterprise-input w-full"
              >
                <option value="">Choose a vehicle</option>
                {getAvailableVehicles().map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} - {vehicle.registration_number}
                  </option>
                ))}
              </select>
            </div>
            {getAvailableVehicles().length === 0 && (
              <p className="text-yellow-400 text-sm">No available vehicles. All vehicles are already assigned.</p>
            )}
          </div>
        }
        confirmText="Assign Driver"
        cancelText="Cancel"
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
        loading={loading}
        disabled={!selectedVehicle}
      />

      {/* Reviews Modal */}
      <ConfirmationModal
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        onConfirm={() => setShowReviewsModal(false)}
        title={`Reviews for ${selectedDriver?.user_profiles?.full_name}`}
        message={
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="p-4 bg-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {renderStars(review.rating)}
                      <span className="text-white font-medium">{review.rating}/5</span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-300 text-sm">{review.comment}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    By: {review.user_profiles?.full_name || 'Anonymous'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No reviews yet</p>
            )}
          </div>
        }
        confirmText="Close"
        cancelText=""
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
        showCancel={false}
      />
    </DashboardLayout>
  );
};

export default DriverManagementPage;
