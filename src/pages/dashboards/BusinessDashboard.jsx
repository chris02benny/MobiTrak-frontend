import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import {
  Car,
  Route,
  DollarSign,
  AlertTriangle,
  Trophy,
  Fuel,
  Star
} from 'lucide-react';

const BusinessDashboard = () => {
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [showFleetManagement, setShowFleetManagement] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: '',
    license_plate: '',
  });
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchVehicles = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:5000/vehicles?business_id=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setVehicles(data.data);
      } else {
        showToast(`Failed to fetch vehicles: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showToast('Error fetching vehicles.', 'error');
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVehicle({ ...newVehicle, [name]: value });
  };

  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const vehicleData = {
        ...newVehicle,
        business_id: user.id,
        registration_number: newVehicle.license_plate, // Map license_plate to registration_number
        vehicle_type: 'car', // Default vehicle type
        status: 'available' // Default status
      };

      const response = await fetch('http://localhost:5000/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Vehicle added successfully!', 'success');
        setNewVehicle({ make: '', model: '', year: '', license_plate: '' });
        setShowAddVehicleForm(false);
        fetchVehicles();
      } else {
        showToast(`Failed to add vehicle: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      showToast('Error adding vehicle.', 'error');
    }
  };

  const handleEditClick = (vehicle) => {
    setEditingVehicle({ ...vehicle });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingVehicle({ ...editingVehicle, [name]: value });
  };

  const handleUpdateVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingVehicle),
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Vehicle updated successfully!', 'success');
        setEditingVehicle(null);
        fetchVehicles();
      } else {
        showToast(`Failed to update vehicle: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      showToast('Error updating vehicle.', 'error');
    }
  };

  const handleDeleteClick = (vehicleId) => {
    setVehicleToDelete(vehicleId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/vehicles/${vehicleToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showToast('Vehicle deleted successfully!', 'success');
        fetchVehicles();
      } else {
        const data = await response.json();
        showToast(`Failed to delete vehicle: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showToast('Error deleting vehicle.', 'error');
    } finally {
      setDeleteModalOpen(false);
      setVehicleToDelete(null);
    }
  };

  const sidebarItems = [
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      label: 'Overview', 
      onClick: () => { setShowAddVehicleForm(false); setShowFleetManagement(false); } 
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
      onClick: () => window.location.href = '/business/drivers' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      label: 'Analytics', 
      onClick: () => { setShowAddVehicleForm(false); setShowFleetManagement(false); } 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ), 
      label: 'Maintenance', 
      onClick: () => { setShowAddVehicleForm(false); setShowFleetManagement(false); } 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ), 
      label: 'Reports', 
      onClick: () => { setShowAddVehicleForm(false); setShowFleetManagement(false); } 
    },
  ];

  return (
    <DashboardLayout title="Business Overview" sidebarItems={sidebarItems}>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
      />
      {showFleetManagement ? (
        <DashboardCard title="Fleet Management" className="p-6">
          {editingVehicle ? (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Edit Vehicle</h3>
              <form onSubmit={handleUpdateVehicleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="editMake" className="block text-sm font-medium text-gray-300 mb-1">Make</label>
                  <input
                    type="text"
                    name="make"
                    id="editMake"
                    value={editingVehicle.make}
                    onChange={handleEditFormChange}
                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editModel" className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                  <input
                    type="text"
                    name="model"
                    id="editModel"
                    value={editingVehicle.model}
                    onChange={handleEditFormChange}
                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editYear" className="block text-sm font-medium text-gray-300 mb-1">Year</label>
                  <input
                    type="number"
                    name="year"
                    id="editYear"
                    value={editingVehicle.year}
                    onChange={handleEditFormChange}
                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editLicensePlate" className="block text-sm font-medium text-gray-300 mb-1">License Plate</label>
                  <input
                    type="text"
                    name="license_plate"
                    id="editLicensePlate"
                    value={editingVehicle.license_plate}
                    onChange={handleEditFormChange}
                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setEditingVehicle(null)} // Cancel edit
                    className="py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out"
                  >
                    Update Vehicle
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          <h3 className="text-xl font-semibold text-white mb-4">Your Fleet</h3>
          {vehicles.length > 0 ? (
            <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-lg p-4">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Make</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Model</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Year</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">License Plate</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-700 transition duration-150 ease-in-out">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{vehicle.make}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{vehicle.model}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{vehicle.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{vehicle.license_plate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(vehicle)}
                          className="text-primary hover:text-primary-light mr-4 transition duration-150 ease-in-out"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(vehicle.id)}
                          className="text-red-500 hover:text-red-700 transition duration-150 ease-in-out"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 p-4">No vehicles in your fleet. Add one using the "Add Vehicle" option in the sidebar.</p>
          )}
        </DashboardCard>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard
              title="Total Vehicles"
              value={vehicles.length.toString()}
              subtitle="Active fleet vehicles"
              icon={<Car className="w-6 h-6" />}
              trend="up"
              trendValue="+2"
            />
            <DashboardCard
              title="Active Trips"
              value="12"
              subtitle="Currently in progress"
              icon={<Route className="w-6 h-6" />}
              trend="up"
              trendValue="+5"
            />
            <DashboardCard
              title="Revenue"
              value="$15,420"
              subtitle="This month"
              icon={<DollarSign className="w-6 h-6" />}
              trend="up"
              trendValue="+12%"
            />
            <DashboardCard
              title="Maintenance Due"
              value="3"
              subtitle="Vehicles need service"
              icon={<AlertTriangle className="w-6 h-6" />}
              trend="down"
              trendValue="-1"
            />
          </div>

          {/* Main Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Fleet Status */}
            <DashboardCard title="Fleet Status" className="col-span-1">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Available</span>
                  <span className="text-green-400 font-semibold">18 vehicles</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">In Transit</span>
                  <span className="text-primary font-semibold">5 vehicles</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Maintenance</span>
                  <span className="text-red-400 font-semibold">1 vehicle</span>
                </div>
              </div>
            </DashboardCard>

            {/* Recent Activities */}
            <DashboardCard title="Recent Activities" className="col-span-1">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Trip #1234 completed</span>
                  <span className="text-gray-500 ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span className="text-gray-300">Vehicle V-001 started trip</span>
                  <span className="text-gray-500 ml-auto">15 min ago</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Maintenance alert for V-003</span>
                  <span className="text-gray-500 ml-auto">1 hour ago</span>
                </div>
              </div>
            </DashboardCard>
          </div>

          {/* Additional Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <DashboardCard
              title="Driver Performance"
              subtitle="Top performing drivers this month"
              icon={<Trophy className="w-6 h-6" />}
            >
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>John Doe</span>
                  <span className="text-primary">98% rating</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Jane Smith</span>
                  <span className="text-primary">96% rating</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Mike Johnson</span>
                  <span className="text-primary">94% rating</span>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Fuel Efficiency"
              subtitle="Average across fleet"
              icon={<Fuel className="w-6 h-6" />}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">24.5 MPG</div>
                <div className="text-sm text-green-400">+2.1% improvement</div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Customer Satisfaction"
              subtitle="Based on recent feedback"
              icon={<Star className="w-6 h-6" />}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">4.8/5.0</div>
                <div className="text-sm text-green-400">+0.2 from last month</div>
              </div>
            </DashboardCard>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default BusinessDashboard;
