import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import ConfirmationModal from '../../components/ConfirmationModal';

const AddVehiclePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
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
  
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [vehicleImage, setVehicleImage] = useState(null);
  const [rcBook, setRcBook] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrData, setOcrData] = useState(null);

  useEffect(() => {
    fetchLabels();
  }, []);

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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVehicleImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRcBookUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRcBook(file);
    }
  };

  const processOCR = async () => {
    if (!rcBook) {
      showToast('Please upload an RC book first', 'error');
      return;
    }

    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('rc_book', rcBook);

      const response = await fetch('http://localhost:5000/ocr/rc-book', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setOcrData(data.data);
        setShowOcrModal(true);
        showToast('OCR processing completed successfully', 'success');
      } else {
        showToast(`OCR processing failed: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      showToast('OCR processing failed', 'error');
    } finally {
      setOcrLoading(false);
    }
  };

  const applyOcrData = () => {
    if (ocrData) {
      setFormData(prev => ({
        ...prev,
        registration_number: ocrData.registration_number || prev.registration_number,
        chassis_number: ocrData.chassis_number || prev.chassis_number,
        owner_name: ocrData.owner_name || prev.owner_name,
        make: ocrData.vehicle_make || prev.make,
        model: ocrData.vehicle_model || prev.model,
        year: ocrData.vehicle_year || prev.year
      }));
      setShowOcrModal(false);
      showToast('OCR data applied successfully', 'success');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitFormData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitFormData.append(key, formData[key]);
        }
      });
      
      submitFormData.append('business_id', user.id);
      
      if (vehicleImage) {
        submitFormData.append('vehicle_image', vehicleImage);
      }
      if (rcBook) {
        submitFormData.append('rc_book', rcBook);
      }

      const response = await fetch('http://localhost:5000/vehicles', {
        method: 'POST',
        body: submitFormData
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Vehicle added successfully!', 'success');
        setFormData({
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
        setVehicleImage(null);
        setRcBook(null);
        setPreviewImage(null);
      } else {
        showToast(`Failed to add vehicle: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      showToast('Error adding vehicle', 'error');
    } finally {
      setLoading(false);
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
      onClick: () => window.location.href = '/dashboard/business' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ), 
      label: 'Add Vehicle', 
      onClick: () => {} 
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

  return (
    <DashboardLayout title="Add Vehicle" sidebarItems={sidebarItems}>
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
                <span className="ml-1 text-gray-400 md:ml-2">Add Vehicle</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DashboardCard title="Vehicle Information" className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-gray-300 mb-2">
                    Make *
                  </label>
                  <input
                    type="text"
                    name="make"
                    id="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    className="enterprise-input w-full"
                    placeholder="e.g., Toyota"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    name="model"
                    id="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="enterprise-input w-full"
                    placeholder="e.g., Camry"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    name="year"
                    id="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="enterprise-input w-full"
                    placeholder="e.g., 2020"
                    min="1900"
                    max="2030"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="vehicle_type" className="block text-sm font-medium text-gray-300 mb-2">
                    Vehicle Type *
                  </label>
                  <select
                    name="vehicle_type"
                    id="vehicle_type"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="registration_number" className="block text-sm font-medium text-gray-300 mb-2">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    name="registration_number"
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={handleInputChange}
                    className="enterprise-input w-full"
                    placeholder="e.g., KA01AB1234"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="chassis_number" className="block text-sm font-medium text-gray-300 mb-2">
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    name="chassis_number"
                    id="chassis_number"
                    value={formData.chassis_number}
                    onChange={handleInputChange}
                    className="enterprise-input w-full"
                    placeholder="e.g., CHASSIS123456789"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="owner_name" className="block text-sm font-medium text-gray-300 mb-2">
                  Owner Name
                </label>
                <input
                  type="text"
                  name="owner_name"
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={handleInputChange}
                  className="enterprise-input w-full"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="label_id" className="block text-sm font-medium text-gray-300 mb-2">
                    Vehicle Label
                  </label>
                  <select
                    name="label_id"
                    id="label_id"
                    value={formData.label_id}
                    onChange={handleInputChange}
                    className="enterprise-input w-full"
                  >
                    <option value="">Select a label (optional)</option>
                    {labels.map(label => (
                      <option key={label.id} value={label.id}>
                        {label.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="enterprise-input w-full"
                  >
                    <option value="available">Available</option>
                    <option value="under_maintenance">Under Maintenance</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="vehicle_image" className="block text-sm font-medium text-gray-300 mb-2">
                    Vehicle Image
                  </label>
                  <input
                    type="file"
                    name="vehicle_image"
                    id="vehicle_image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="enterprise-input w-full"
                  />
                  {previewImage && (
                    <div className="mt-4">
                      <img
                        src={previewImage}
                        alt="Vehicle preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="rc_book" className="block text-sm font-medium text-gray-300 mb-2">
                    RC Book (PDF/Image)
                  </label>
                  <div className="flex space-x-4">
                    <input
                      type="file"
                      name="rc_book"
                      id="rc_book"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleRcBookUpload}
                      className="enterprise-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={processOCR}
                      disabled={!rcBook || ocrLoading}
                      className="enterprise-button-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ocrLoading ? 'Processing...' : 'Extract Data'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="enterprise-button-secondary px-6 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="enterprise-button px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </DashboardCard>
        </div>

        <div className="space-y-6">
          <DashboardCard title="Quick Actions" className="p-6">
            <div className="space-y-4">
              <button
                onClick={() => window.location.href = '/business/labels'}
                className="w-full enterprise-button-secondary text-left p-3 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-[#fabb24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div>
                    <div className="font-semibold">Manage Labels</div>
                    <div className="text-sm text-gray-400">Create vehicle categories</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => window.location.href = '/business/vehicles'}
                className="w-full enterprise-button-secondary text-left p-3 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-[#fabb24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <div>
                    <div className="font-semibold">View Vehicles</div>
                    <div className="text-sm text-gray-400">Manage your fleet</div>
                  </div>
                </div>
              </button>
            </div>
          </DashboardCard>

          <DashboardCard title="Tips" className="p-6">
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-[#fabb24] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Upload RC book to auto-fill vehicle details using OCR</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 text-[#fabb24] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>High-quality images work better for OCR processing</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 text-[#fabb24] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Create labels to organize your vehicles by category</span>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onConfirm={applyOcrData}
        title="OCR Results"
        message={
          <div className="text-left">
            <p className="mb-4">The following data was extracted from your RC book:</p>
            {ocrData && (
              <div className="space-y-2 text-sm">
                <div><strong>Registration:</strong> {ocrData.registration_number}</div>
                <div><strong>Chassis:</strong> {ocrData.chassis_number}</div>
                <div><strong>Owner:</strong> {ocrData.owner_name}</div>
                <div><strong>Make:</strong> {ocrData.vehicle_make}</div>
                <div><strong>Model:</strong> {ocrData.vehicle_model}</div>
                <div><strong>Year:</strong> {ocrData.vehicle_year}</div>
              </div>
            )}
            <p className="mt-4">Would you like to apply this data to the form?</p>
          </div>
        }
        confirmText="Apply Data"
        cancelText="Cancel"
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
      />
    </DashboardLayout>
  );
};

export default AddVehiclePage;