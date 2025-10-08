import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import ConfirmationModal from '../../components/ConfirmationModal';
import UpgradeModal from '../../components/UpgradeModal';
import { businessSidebarItems } from '../../config/businessSidebarConfig';
import { supabase } from '../../utils/supabase';
import { Plus, Search, Car, CheckCircle, AlertTriangle, Clock, X, Upload, FileText } from 'lucide-react';

const VehiclesPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Vehicle data states
  const [vehicles, setVehicles] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterLabel, setFilterLabel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  
  // Form data states
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    registration_number: '',
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

  // File upload states
  const [vehicleImages, setVehicleImages] = useState([]);
  const [rcBook, setRcBook] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [rcBookPreview, setRcBookPreview] = useState(null);

  // Subscription states
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const subscriptionFetchedRef = useRef(false);

  // Validation patterns
  const validationPatterns = {
    registrationNumber: /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/,
    ownerName: /^[A-Za-z\s]{3,}$/
  };

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
    { value: 'available', label: 'Available to assign', color: 'bg-green-500' },
    { value: 'assigned', label: 'Driver Assigned', color: 'bg-blue-500' },
    { value: 'maintenance', label: 'Service needed', color: 'bg-red-500' },
    { value: 'unavailable', label: 'Unavailable', color: 'bg-gray-500' }
  ];

  // Fetch car makes from NHTSA API
  const fetchCarMakes = useCallback(async () => {
    if (carMakes.length > 0) return;

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

  // Fetch subscription data
  const fetchSubscriptionData = useCallback(async () => {
    if (!user?.id || subscriptionFetchedRef.current) return;
    
    subscriptionFetchedRef.current = true;
    setSubscriptionLoading(true);
    try {
      // Get user profile with subscription data from Supabase
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('subscription_type, vehicle_limit, subscription_start_date, subscription_end_date')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Get current vehicle count
      const { count: vehicleCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', user.id);

      const currentCount = vehicleCount || 0;
      const vehicleLimit = profile?.vehicle_limit || 5;
      const canAddVehicle = currentCount < vehicleLimit;

      setSubscriptionData({
        subscription_type: profile?.subscription_type || 'free',
        vehicle_limit: vehicleLimit,
        current_count: currentCount,
        can_add_vehicle: canAddVehicle,
        subscription_start_date: profile?.subscription_start_date,
        subscription_end_date: profile?.subscription_end_date
      });
    } catch (error) {
      console.error('Error fetching subscription data:', error);
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

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('business_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showToast('Error fetching vehicles', 'error');
    }
  };

  // Fetch labels
  const fetchLabels = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_labels')
        .select('*')
        .eq('business_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLabels(data || []);
    } catch (error) {
      console.error('Error fetching labels:', error);
      showToast('Error fetching labels', 'error');
    }
  };

  useEffect(() => {
    if (user?.id) {
      subscriptionFetchedRef.current = false;
      fetchSubscriptionData();
      fetchCarMakes();
      fetchVehicles();
      fetchLabels();
    }
  }, [user?.id, fetchCarMakes, fetchSubscriptionData]);

  // Cleanup RC book preview URL on unmount
  useEffect(() => {
    return () => {
      if (rcBookPreview) {
        URL.revokeObjectURL(rcBookPreview);
      }
    };
  }, [rcBookPreview]);

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

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

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

  // Handle make selection
  const handleMakeSelect = (make) => {
    setFormData(prev => ({ ...prev, make }));
    setShowMakeDropdown(false);
    setTouched(prev => ({ ...prev, make: true }));

    const error = validateField('make', make);
    setErrors(prev => ({ ...prev, make: error }));
  };

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

  // Handle multiple image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // Process uploaded files
  const processFiles = (files) => {
    const validFiles = [];
    const newPreviewImages = [];

    files.forEach(file => {
      const error = validateImageFile(file);
      if (error) {
        showToast(error, 'error');
        return;
      }
      validFiles.push(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviewImages.push(e.target.result);
        if (newPreviewImages.length === validFiles.length) {
          setPreviewImages(prev => [...prev, ...newPreviewImages]);
        }
      };
      reader.readAsDataURL(file);
    });

    setVehicleImages(prev => [...prev, ...validFiles]);
  };

  // Handle RC book upload
  const handleRcBookUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processRcBookFile(file);
    }
  };

  // Handle RC book drag and drop
  const handleRcBookDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRcBookDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processRcBookFile(files[0]);
    }
  };

  // Process RC book file
  const processRcBookFile = (file) => {
    const error = validateRcBookFile(file);
    if (error) {
      showToast(error, 'error');
      return;
    }
    setRcBook(file);
    // Create preview URL for PDF
    const previewUrl = URL.createObjectURL(file);
    setRcBookPreview(previewUrl);
  };

  // Remove RC book file
  const removeRcBook = () => {
    if (rcBookPreview) {
      URL.revokeObjectURL(rcBookPreview);
    }
    setRcBook(null);
    setRcBookPreview(null);
  };


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (subscriptionData && subscriptionData.can_add_vehicle === false) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);

    try {
      // Upload vehicle images to Supabase storage
      let vehicleImageUrls = [];
      if (vehicleImages.length > 0) {
        for (const image of vehicleImages) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('vehicle-files')
            .upload(fileName, image);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('vehicle-files')
            .getPublicUrl(fileName);

          vehicleImageUrls.push(publicUrl);
        }
      }

      // Upload RC book to Supabase storage
      let rcBookUrl = null;
      if (rcBook) {
        const fileExt = rcBook.name.split('.').pop();
        const fileName = `${user.id}/rc-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vehicle-files')
          .upload(fileName, rcBook);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle-files')
          .getPublicUrl(fileName);

        rcBookUrl = publicUrl;
      }

      // Insert vehicle data into Supabase
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .insert({
          manufacturer: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          registration_number: formData.registration_number,
          owner_name: formData.owner_name,
          status: formData.status,
          business_id: user.id,
          vehicle_image_url: vehicleImageUrls.length > 0 ? vehicleImageUrls[0] : null,
          rc_book_front_url: rcBookUrl
        })
        .select()
        .single();

      if (error) throw error;

      // Insert multiple vehicle images if any
      if (vehicleImageUrls.length > 0) {
        const imageInserts = vehicleImageUrls.map((url, index) => ({
          vehicle_id: vehicleData.id,
          image_url: url,
          image_order: index
        }));

        const { error: imagesError } = await supabase
          .from('vehicle_images')
          .insert(imageInserts);

        if (imagesError) throw imagesError;
      }

      showToast('Vehicle added successfully!', 'success');
      resetForm();
      setShowAddModal(false);
      fetchVehicles();
      fetchSubscriptionData(); // Refresh subscription data to update vehicle count
    } catch (error) {
      console.error('Error adding vehicle:', error);
      showToast('Error adding vehicle', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: '',
      registration_number: '',
      owner_name: '',
      status: 'available'
    });
    setErrors({});
    setTouched({});
    setVehicleImages([]);
    setRcBook(null);
    setPreviewImages([]);
    // Clear RC book preview URL
    if (rcBookPreview) {
      URL.revokeObjectURL(rcBookPreview);
      setRcBookPreview(null);
    }
  };

  // Handle edit vehicle
  const handleEditVehicle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          manufacturer: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          registration_number: formData.registration_number,
          owner_name: formData.owner_name,
          status: formData.status
        })
        .eq('id', editingVehicle.id)
        .eq('business_id', user.id)
        .select()
        .single();

      if (error) throw error;

      showToast('Vehicle updated successfully!', 'success');
      setShowEditModal(false);
      setEditingVehicle(null);
      fetchVehicles();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      showToast('Error updating vehicle', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', deletingVehicle.id)
        .eq('business_id', user.id);

      if (error) throw error;

      showToast('Vehicle deleted successfully!', 'success');
      setShowDeleteModal(false);
      setDeletingVehicle(null);
      fetchVehicles();
      fetchSubscriptionData(); // Refresh subscription data to update vehicle count
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showToast('Error deleting vehicle', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.manufacturer,
      model: vehicle.model,
      year: vehicle.year,
      registration_number: vehicle.registration_number,
      vehicle_type: vehicle.vehicle_type,
      label_id: vehicle.label_id || '',
      owner_name: vehicle.owner_name || '',
      status: vehicle.status
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (vehicle) => {
    setDeletingVehicle(vehicle);
    setShowDeleteModal(true);
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesLabel = !filterLabel || vehicle.label_id === filterLabel;
    const matchesStatus = !filterStatus || vehicle.status === filterStatus;
    const matchesSearch = !searchTerm || 
      vehicle.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesLabel && matchesStatus && matchesSearch;
  });

  // Get status color
  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'bg-gray-500';
  };

  // Get status label
  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.label : status;
  };

  // Calculate vehicle counts by status
  const vehicleCounts = useMemo(() => {
    const counts = {
      total: vehicles.length,
      available: vehicles.filter(v => v.status === 'available').length,
      assigned: vehicles.filter(v => v.status === 'assigned').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length
    };
    return counts;
  }, [vehicles]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const requiredFields = ['make', 'model', 'year', 'registration_number', 'owner_name'];
    const allFieldsFilled = requiredFields.every(field => formData[field]?.toString().trim());
    const noErrors = requiredFields.every(field => !errors[field]);
    return allFieldsFilled && noErrors;
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
    <DashboardLayout title="Vehicles" sidebarItems={businessSidebarItems}>
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
                <span className="ml-1 text-gray-400 md:ml-2">Vehicles</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <DashboardCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">All Vehicles</p>
              <p className="text-2xl font-bold text-white">{vehicleCounts.total} Units</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Available to assign</p>
              <p className="text-2xl font-bold text-white">{vehicleCounts.available} Units</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Driver Assigned</p>
              <p className="text-2xl font-bold text-white">{vehicleCounts.assigned} Units</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Service needed</p>
              <p className="text-2xl font-bold text-white">{vehicleCounts.maintenance} Units</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Header with Add Vehicle Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">All Vehicles</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="enterprise-button px-6 py-3 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Vehicle</span>
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <DashboardCard className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            {/* Search Input */}
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-300 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pl-8 bg-gray-700 border border-gray-600 rounded-md text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-300 mb-1">Status</label>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm appearance-none"
                >
                  <option value="">Select</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterLabel('');
                  setFilterStatus('');
                  setSearchTerm('');
                }}
                className="px-3 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
              
              {/* Search Button */}
              <button
                onClick={() => {
                  // Trigger search (already handled by state changes)
                }}
                className="px-4 py-2 bg-primary hover:bg-primary/80 text-black rounded-md transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
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
                      {vehicle.manufacturer} {vehicle.model}
                    </h3>
                    <p className="text-gray-400 text-sm">{vehicle.registration_number}</p>
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

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(vehicle.status)}`}>
                    {getStatusLabel(vehicle.status)}
                  </span>
                </div>

                {/* Vehicle Image */}
                <div className="mb-4">
                  <div className="w-full h-40 bg-gray-700 rounded-lg flex items-center justify-center">
                    {vehicle.vehicle_image_url ? (
                      <img
                        src={vehicle.vehicle_image_url}
                        alt={`${vehicle.manufacturer} ${vehicle.model}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </div>
              </DashboardCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 && vehicles.length > 0 && (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <Search className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Vehicles Found</h3>
          <p className="text-gray-400 mb-6">Try adjusting your filters to see more vehicles</p>
          <button
            onClick={() => {
              setFilterLabel('');
              setFilterStatus('');
              setSearchTerm('');
            }}
            className="enterprise-button px-6 py-3"
          >
            Clear Filters
          </button>
        </div>
      )}

      {vehicles.length === 0 && (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <Car className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Vehicles Yet</h3>
          <p className="text-gray-400 mb-6">Add your first vehicle to get started</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="enterprise-button px-6 py-3"
          >
            Add Your First Vehicle
          </motion.button>
        </div>
      )}

      {/* Add Vehicle Modal */}
      <ConfirmationModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onConfirm={handleSubmit}
        title="Add Vehicle"
        maxWidth="max-w-4xl"
        maxHeight="max-h-[90vh]"
        disabled={!isFormValid}
        message={
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <label htmlFor="make" className="block text-sm font-medium text-gray-300 mb-1">
                  Manufacturer *
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
                <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  name="year"
                  id="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className={`enterprise-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    touched.year && errors.year ? 'border-red-500' : ''
                  }`}
                  placeholder="e.g., 2020"
                  min="1980"
                  max={new Date().getFullYear()}
                  required
                />
                <ErrorMessage error={touched.year ? errors.year : ''} />
              </div>
              <div>
                <label htmlFor="registration_number" className="block text-sm font-medium text-gray-300 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  name="registration_number"
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={handleInputChange}
                  onInput={(e) => {
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
            </div>

            <div>
              <label htmlFor="owner_name" className="block text-sm font-medium text-gray-300 mb-1">
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
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Vehicle Images
              </label>
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-3 text-center hover:border-gray-500 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('vehicle_images').click()}
              >
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-gray-300 mb-1 text-sm">Drag & Drop your files here</p>
                  <p className="text-gray-500 text-xs mb-2">OR</p>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm bg-primary hover:bg-primary/80 text-black rounded-md transition-colors"
                  >
                    Browse Files
                  </button>
                </div>
                <input
                  type="file"
                  name="vehicle_images"
                  id="vehicle_images"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageUpload}
                  multiple
                  className="hidden"
                />
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Multiple JPG and PNG files under 5MB each
              </div>

              {previewImages.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-16 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImages(prev => prev.filter((_, i) => i !== index));
                          setVehicleImages(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                RC Book (PDF/Image)
              </label>
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-3 text-center hover:border-gray-500 transition-colors"
              >
                {!rcBook ? (
                  <div
                    className="cursor-pointer"
                    onDragOver={handleRcBookDragOver}
                    onDrop={handleRcBookDrop}
                    onClick={() => document.getElementById('rc_book').click()}
                  >
                    <div className="flex flex-col items-center">
                      <FileText className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-gray-300 mb-1 text-sm">Drag & Drop your RC book here</p>
                      <p className="text-gray-500 text-xs mb-2">OR</p>
                      <button
                        type="button"
                        className="px-3 py-1.5 text-sm bg-primary hover:bg-primary/80 text-black rounded-md transition-colors"
                      >
                        Browse Files
                      </button>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="text-sm text-green-400 flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      File uploaded: {rcBook.name}
                    </div>
                    <div className="w-full h-20 bg-gray-800 rounded border border-gray-600 flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">PDF Document</p>
                        <p className="text-xs text-gray-500 truncate max-w-32">{rcBook.name}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeRcBook}
                      className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Remove
                    </button>
                  </motion.div>
                )}
                <input
                  type="file"
                  name="rc_book"
                  id="rc_book"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleRcBookUpload}
                  className="hidden"
                />
              </div>
              <div className="text-xs text-gray-400 mt-2">
                PDF, JPG, or PNG files under 10MB
              </div>
            </div>
          </div>
        }
        confirmText="Add Vehicle"
        cancelText="Cancel"
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
        loading={loading}
      />

      {/* Edit Vehicle Modal */}
      <ConfirmationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={handleEditVehicle}
        title="Edit Vehicle"
        maxWidth="max-w-4xl"
        maxHeight="max-h-[90vh]"
        message={
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-make" className="block text-sm font-medium text-gray-300 mb-1">
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
                <label htmlFor="edit-model" className="block text-sm font-medium text-gray-300 mb-1">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-year" className="block text-sm font-medium text-gray-300 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  id="edit-year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="enterprise-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-registration_number" className="block text-sm font-medium text-gray-300 mb-1">
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
            </div>
            <div>
              <label htmlFor="edit-owner_name" className="block text-sm font-medium text-gray-300 mb-1">
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
            <div>
              <label htmlFor="edit-status" className="block text-sm font-medium text-gray-300 mb-1">
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

export default VehiclesPage;
