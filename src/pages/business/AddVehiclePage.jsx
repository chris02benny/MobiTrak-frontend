import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import ConfirmationModal from '../../components/ConfirmationModal';
import UpgradeModal from '../../components/UpgradeModal';

const AddVehiclePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    registration_number: '',
    chassis_number: '',
    owner_name: '',
    status: 'available'
  });

  // Validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [carMakes, setCarMakes] = useState([]);
  const [filteredMakes, setFilteredMakes] = useState([]);
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [makesLoading, setMakesLoading] = useState(false);


  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [vehicleImage, setVehicleImage] = useState(null);
  const [rcBook, setRcBook] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const subscriptionFetchedRef = useRef(false);

  // Validation patterns
  const validationPatterns = {
    registrationNumber: /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/,
    chassisNumber: /^[A-Z0-9]{10,20}$/,
    ownerName: /^[A-Za-z\s]{3,}$/
  };

  // Fetch car makes from NHTSA API
  const fetchCarMakes = useCallback(async () => {
    if (carMakes.length > 0) return; // Already fetched

    setMakesLoading(true);
    try {
      const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json');
      const data = await response.json();
      if (data.Results) {
        const makes = data.Results.map(make => make.Make_Name).sort();
        setCarMakes(makes);
      }
    } catch (error) {
      console.error('Error fetching car makes:', error);
      showToast('Failed to load car makes', 'error');
    } finally {
      setMakesLoading(false);
    }
  }, [carMakes.length, showToast]);

  // Validation functions
  const validateField = useCallback((name, value) => {
    const currentYear = new Date().getFullYear();

    switch (name) {
      case 'make':
        if (!value.trim()) return 'Make is required';
        if (carMakes.length > 0 && !carMakes.some(make =>
          make.toLowerCase() === value.toLowerCase()
        )) {
          return 'Please select a valid car make from the dropdown';
        }
        return '';

      case 'model':
        if (!value.trim()) return 'Model is required';
        if (value.trim().length < 2) return 'Model must be at least 2 characters';
        return '';

      case 'year':
        if (!value) return 'Year is required';
        const yearNum = parseInt(value);
        if (yearNum < 1980 || yearNum > currentYear) {
          return `Year must be between 1980 and ${currentYear}`;
        }
        return '';


      case 'registration_number':
        if (!value.trim()) return 'Registration number is required';
        if (!validationPatterns.registrationNumber.test(value.toUpperCase())) {
          return 'Invalid format. Example: KA01AB1234';
        }
        return '';

      case 'chassis_number':
        if (!value.trim()) return 'Chassis number is required';
        if (!validationPatterns.chassisNumber.test(value.toUpperCase())) {
          return 'Invalid format. Must be 10-20 uppercase letters and digits';
        }
        return '';

      case 'owner_name':
        if (!value.trim()) return 'Owner name is required';
        if (!validationPatterns.ownerName.test(value)) {
          return 'Owner name must be at least 3 characters and contain only letters and spaces';
        }
        return '';

      default:
        return '';
    }
  }, [carMakes]);

  // Real-time validation on keyup
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;

    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    // Handle make field autocomplete
    if (name === 'make') {
      if (value.trim()) {
        const filtered = carMakes.filter(make =>
          make.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredMakes(filtered);
        setShowMakeDropdown(filtered.length > 0);
      } else {
        setShowMakeDropdown(false);
      }
    }
  }, [validateField, carMakes]);

  const fetchSubscriptionData = useCallback(async () => {
    if (!user?.id || subscriptionFetchedRef.current) return; // Prevent multiple calls

    subscriptionFetchedRef.current = true;
    setSubscriptionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/subscription/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      } else {
        console.error('Error fetching subscription data: HTTP', response.status);
        // Set default subscription data if fetch fails
        setSubscriptionData({
          subscription_type: 'free',
          vehicle_limit: 5,
          current_count: 0,
          can_add_vehicle: true
        });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      // Set default subscription data if fetch fails
      setSubscriptionData({
        subscription_type: 'free',
        vehicle_limit: 5,
        current_count: 0,
        can_add_vehicle: true
      });
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      subscriptionFetchedRef.current = false; // Reset ref when user changes
      fetchSubscriptionData();
      fetchCarMakes();
    }
  }, [user?.id, fetchCarMakes, fetchSubscriptionData]);





  // File validation functions
  const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG and PNG files are allowed';
    }
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }
    return '';
  };

  const validateRcBookFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF, JPG, and PNG files are allowed';
    }
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    return '';
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const error = validateImageFile(file);
      if (error) {
        setErrors(prev => ({ ...prev, vehicle_image: error }));
        showToast(error, 'error');
        return;
      }

      setErrors(prev => ({ ...prev, vehicle_image: '' }));
      setVehicleImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRcBookUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const error = validateRcBookFile(file);
      if (error) {
        setErrors(prev => ({ ...prev, rc_book: error }));
        showToast(error, 'error');
        return;
      }

      setErrors(prev => ({ ...prev, rc_book: '' }));
      setRcBook(file);
    }
  };

  // Handle make selection from dropdown
  const handleMakeSelect = (make) => {
    setFormData(prev => ({ ...prev, make }));
    setShowMakeDropdown(false);
    setTouched(prev => ({ ...prev, make: true }));

    const error = validateField('make', make);
    setErrors(prev => ({ ...prev, make: error }));
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
      const updatedData = {
        ...formData,
        registration_number: ocrData.registration_number || formData.registration_number,
        chassis_number: ocrData.chassis_number || formData.chassis_number,
        owner_name: ocrData.owner_name || formData.owner_name,
        make: ocrData.vehicle_make || formData.make,
        model: ocrData.vehicle_model || formData.model,
        year: ocrData.vehicle_year || formData.year
      };

      setFormData(updatedData);

      // Mark fields as touched and validate them
      const fieldsToValidate = ['registration_number', 'chassis_number', 'owner_name', 'make', 'model', 'year'];
      const newTouched = { ...touched };
      const newErrors = { ...errors };

      fieldsToValidate.forEach(field => {
        if (updatedData[field]) {
          newTouched[field] = true;
          newErrors[field] = validateField(field, updatedData[field]);
        }
      });

      setTouched(newTouched);
      setErrors(newErrors);
      setShowOcrModal(false);
      showToast('OCR data applied successfully', 'success');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check subscription limits before proceeding
    if (subscriptionData && subscriptionData.can_add_vehicle === false) {
      setShowUpgradeModal(true);
      return;
    }

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
          chassis_number: '',
          owner_name: '',
          status: 'available'
        });
        setErrors({});
        setTouched({});
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

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const requiredFields = ['make', 'model', 'year', 'registration_number', 'chassis_number', 'owner_name'];

    // Check if all required fields are filled and have no errors
    const allFieldsFilled = requiredFields.every(field => formData[field]?.toString().trim());
    const noErrors = requiredFields.every(field => !errors[field]);
    const noFileErrors = !errors.vehicle_image && !errors.rc_book;

    return allFieldsFilled && noErrors && noFileErrors;
  }, [formData, errors]);



  // Error message component
  const ErrorMessage = ({ error }) => (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-red-400 text-sm mt-1 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  );

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
                <div className="relative">
                  <label htmlFor="make" className="block text-sm font-medium text-gray-300 mb-2">
                    Make *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="make"
                      id="make"
                      value={formData.make}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (carMakes.length === 0) fetchCarMakes();
                        if (formData.make && filteredMakes.length > 0) {
                          setShowMakeDropdown(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding dropdown to allow selection
                        setTimeout(() => setShowMakeDropdown(false), 200);
                      }}
                      className={`enterprise-input w-full ${
                        touched.make && errors.make ? 'border-red-500' : ''
                      }`}
                      placeholder="e.g., Toyota"
                      required
                    />
                    {makesLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                        />
                      </div>
                    )}

                    {/* Make dropdown */}
                    <AnimatePresence>
                      {showMakeDropdown && filteredMakes.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                          {filteredMakes.slice(0, 10).map((make, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleMakeSelect(make)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                            >
                              {make}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <ErrorMessage error={touched.make ? errors.make : ''} />
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
                    className={`enterprise-input w-full ${
                      touched.model && errors.model ? 'border-red-500' : ''
                    }`}
                    placeholder="e.g., Camry"
                    required
                  />
                  <ErrorMessage error={touched.model ? errors.model : ''} />
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
                    className={`enterprise-input w-full ${
                      touched.year && errors.year ? 'border-red-500' : ''
                    }`}
                    placeholder="e.g., 2020"
                    min="1980"
                    max={new Date().getFullYear()}
                    required
                  />
                  <ErrorMessage error={touched.year ? errors.year : ''} />
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
                    onInput={(e) => {
                      // Auto-uppercase for registration number
                      e.target.value = e.target.value.toUpperCase();
                    }}
                    className={`enterprise-input w-full ${
                      touched.registration_number && errors.registration_number ? 'border-red-500' : ''
                    }`}
                    placeholder="e.g., KA01AB1234"
                    maxLength="10"
                    required
                  />
                  <ErrorMessage error={touched.registration_number ? errors.registration_number : ''} />
                </div>
                <div>
                  <label htmlFor="chassis_number" className="block text-sm font-medium text-gray-300 mb-2">
                    Chassis Number *
                  </label>
                  <input
                    type="text"
                    name="chassis_number"
                    id="chassis_number"
                    value={formData.chassis_number}
                    onChange={handleInputChange}
                    onInput={(e) => {
                      // Auto-uppercase for chassis number
                      e.target.value = e.target.value.toUpperCase();
                    }}
                    className={`enterprise-input w-full ${
                      touched.chassis_number && errors.chassis_number ? 'border-red-500' : ''
                    }`}
                    placeholder="e.g., CHASSIS123456789"
                    maxLength="20"
                    required
                  />
                  <ErrorMessage error={touched.chassis_number ? errors.chassis_number : ''} />
                </div>
              </div>

              <div>
                <label htmlFor="owner_name" className="block text-sm font-medium text-gray-300 mb-2">
                  Owner Name *
                </label>
                <input
                  type="text"
                  name="owner_name"
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={handleInputChange}
                  className={`enterprise-input w-full ${
                    touched.owner_name && errors.owner_name ? 'border-red-500' : ''
                  }`}
                  placeholder="e.g., John Doe"
                  required
                />
                <ErrorMessage error={touched.owner_name ? errors.owner_name : ''} />
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

              <div className="space-y-6">
                <div>
                  <label htmlFor="vehicle_image" className="block text-sm font-medium text-gray-300 mb-2">
                    Vehicle Image
                  </label>
                  <input
                    type="file"
                    name="vehicle_image"
                    id="vehicle_image"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageUpload}
                    className={`enterprise-input w-full ${
                      errors.vehicle_image ? 'border-red-500' : ''
                    }`}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Only JPG and PNG files under 5MB are allowed
                  </div>
                  <ErrorMessage error={errors.vehicle_image} />

                  {previewImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4"
                    >
                      <img
                        src={previewImage}
                        alt="Vehicle preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                      />
                    </motion.div>
                  )}
                </div>

                <div>
                  <label htmlFor="rc_book" className="block text-sm font-medium text-gray-300 mb-2">
                    RC Book (PDF/Image)
                  </label>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        name="rc_book"
                        id="rc_book"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleRcBookUpload}
                        className={`enterprise-input w-full ${
                          errors.rc_book ? 'border-red-500' : ''
                        }`}
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        PDF, JPG, or PNG files under 10MB
                      </div>
                      <ErrorMessage error={errors.rc_book} />
                    </div>
                    <button
                      type="button"
                      onClick={processOCR}
                      disabled={!rcBook || ocrLoading}
                      className="enterprise-button-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ocrLoading ? 'Processing...' : 'Extract Data'}
                    </button>
                  </div>
                  {rcBook && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-green-400 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      File uploaded: {rcBook.name}
                    </motion.div>
                  )}
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
                  disabled={loading || !isFormValid}
                  className={`enterprise-button px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                    !isFormValid ? 'bg-gray-600 hover:bg-gray-600' : ''
                  }`}
                  title={!isFormValid ? 'Please fill all required fields correctly' : ''}
                >
                  {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
                </button>
              </div>

              {/* Form validation summary */}
              {Object.keys(touched).length > 0 && !isFormValid && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
                >
                  <div className="flex items-center text-red-400 text-sm">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Please correct the errors above before submitting
                  </div>
                </motion.div>
              )}
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentCount={subscriptionData?.current_count || 0}
        vehicleLimit={subscriptionData?.vehicle_limit || 5}
      />
    </DashboardLayout>
  );
};

export default AddVehiclePage;