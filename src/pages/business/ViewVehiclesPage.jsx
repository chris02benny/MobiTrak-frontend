import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import ConfirmationModal from '../../components/ConfirmationModal';

const ViewVehiclesPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [vehicles, setVehicles] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [filterLabel, setFilterLabel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    registration_number: '',
    vehicle_type: 'sedan',
    label_id: '',
    chassis_number: '',
    owner_name: '',
    status: 'available'
  });

  const vehicleTypes = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'truck', label: 'Truck' },
    { value: 'bus', label: 'Bus' },
    { value: 'van', label: 'Van' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'available', label: 'Available', color: 'text-green-400' },
    { value: 'under_maintenance', label: 'Under Maintenance', color: 'text-yellow-400' },
    { value: 'unavailable', label: 'Unavailable', color: 'text-red-400' },
    { value: 'in_use', label: 'In Use', color: 'text-blue-400' }
  ];

  useEffect(() => {
    fetchVehicles();
    fetchLabels();
  }, []);

  const fetchVehicles = async () => {
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
      showToast('Error fetching vehicles', 'error');
    }
  };

  const fetchLabels = async () => {
    try {
      const response = await fetch(`http://localhost:5000/labels?business_id=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setLabels(data.data);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditVehicle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Vehicle updated successfully!', 'success');
        setShowEditModal(false);
        setEditingVehicle(null);
        fetchVehicles();
      } else {
        showToast(`Failed to update vehicle: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      showToast('Error updating vehicle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/vehicles/${deletingVehicle.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Vehicle deleted successfully!', 'success');
        setShowDeleteModal(false);
        setDeletingVehicle(null);
        fetchVehicles();
      } else {
        const data = await response.json();
        showToast(`Failed to delete vehicle: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showToast('Error deleting vehicle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      registration_number: vehicle.registration_number,
      vehicle_type: vehicle.vehicle_type,
      label_id: vehicle.label_id || '',
      chassis_number: vehicle.chassis_number || '',
      owner_name: vehicle.owner_name || '',
      status: vehicle.status
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (vehicle) => {
    setDeletingVehicle(vehicle);
    setShowDeleteModal(true);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesLabel = !filterLabel || vehicle.label_id === filterLabel;
    const matchesStatus = !filterStatus || vehicle.status === filterStatus;
    return matchesLabel && matchesStatus;
  });

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'text-gray-400';
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.label : status;
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
      onClick: () => {} 
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
    <DashboardLayout title="View & Manage Vehicles" sidebarItems={sidebarItems}>
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
                <span className="ml-1 text-gray-400 md:ml-2">View Vehicles</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vehicle Fleet</h1>
          <p className="text-gray-400">Manage and monitor your vehicle fleet</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/business/add-vehicle'}
          className="enterprise-button px-6 py-3 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Vehicle</span>
        </motion.button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <DashboardCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="filter-label" className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Label
              </label>
              <select
                id="filter-label"
                value={filterLabel}
                onChange={(e) => setFilterLabel(e.target.value)}
                className="enterprise-input w-full"
              >
                <option value="">All Labels</option>
                {labels.map(label => (
                  <option key={label.id} value={label.id}>
                    {label.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-status" className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Status
              </label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="enterprise-input w-full"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterLabel('');
                  setFilterStatus('');
                }}
                className="enterprise-button-secondary px-4 py-2 w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredVehicles.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardCard className="p-6 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-gray-400 text-sm">{vehicle.year}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(vehicle)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Edit vehicle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(vehicle)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete vehicle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Registration:</span>
                    <span className="text-white font-medium">{vehicle.registration_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white capitalize">{vehicle.vehicle_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-medium ${getStatusColor(vehicle.status)}`}>
                      {getStatusLabel(vehicle.status)}
                    </span>
                  </div>
                  {vehicle.vehicle_labels && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Label:</span>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: vehicle.vehicle_labels.color }}
                        />
                        <span className="text-white">{vehicle.vehicle_labels.name}</span>
                      </div>
                    </div>
                  )}
                  {vehicle.owner_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Owner:</span>
                      <span className="text-white">{vehicle.owner_name}</span>
                    </div>
                  )}
                </div>

                {vehicle.vehicle_image_url && (
                  <div className="mt-4">
                    <img
                      src={vehicle.vehicle_image_url}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-600"
                    />
                  </div>
                )}
              </DashboardCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 && vehicles.length > 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Vehicles Found</h3>
          <p className="text-gray-400 mb-6">Try adjusting your filters to see more vehicles</p>
          <button
            onClick={() => {
              setFilterLabel('');
              setFilterStatus('');
            }}
            className="enterprise-button px-6 py-3"
          >
            Clear Filters
          </button>
        </div>
      )}

      {vehicles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚗</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Vehicles Yet</h3>
          <p className="text-gray-400 mb-6">Add your first vehicle to get started</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/business/add-vehicle'}
            className="enterprise-button px-6 py-3"
          >
            Add Your First Vehicle
          </motion.button>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      <ConfirmationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={handleEditVehicle}
        title="Edit Vehicle"
        message={
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-make" className="block text-sm font-medium text-gray-300 mb-2">
                  Make *
                </label>
                <input
                  type="text"
                  id="edit-make"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  className="enterprise-input w-full"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-model" className="block text-sm font-medium text-gray-300 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  id="edit-model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="enterprise-input w-full"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-year" className="block text-sm font-medium text-gray-300 mb-2">
                  Year *
                </label>
                <input
                  type="number"
                  id="edit-year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="enterprise-input w-full"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-vehicle_type" className="block text-sm font-medium text-gray-300 mb-2">
                  Vehicle Type *
                </label>
                <select
                  id="edit-vehicle_type"
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleInputChange}
                  className="enterprise-input w-full"
                  required
                >
                  {vehicleTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-registration_number" className="block text-sm font-medium text-gray-300 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  id="edit-registration_number"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleInputChange}
                  className="enterprise-input w-full"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-chassis_number" className="block text-sm font-medium text-gray-300 mb-2">
                  Chassis Number
                </label>
                <input
                  type="text"
                  id="edit-chassis_number"
                  name="chassis_number"
                  value={formData.chassis_number}
                  onChange={handleInputChange}
                  className="enterprise-input w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="edit-owner_name" className="block text-sm font-medium text-gray-300 mb-2">
                Owner Name
              </label>
              <input
                type="text"
                id="edit-owner_name"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleInputChange}
                className="enterprise-input w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-label_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Vehicle Label
                </label>
                <select
                  id="edit-label_id"
                  name="label_id"
                  value={formData.label_id}
                  onChange={handleInputChange}
                  className="enterprise-input w-full"
                >
                  <option value="">No Label</option>
                  {labels.map(label => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="edit-status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="enterprise-input w-full"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        }
        confirmText="Update Vehicle"
        cancelText="Cancel"
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
        loading={loading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteVehicle}
        title="Delete Vehicle"
        message={`Are you sure you want to delete the vehicle "${deletingVehicle?.make} ${deletingVehicle?.model}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-500 hover:bg-red-600 text-white"
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default ViewVehiclesPage;
