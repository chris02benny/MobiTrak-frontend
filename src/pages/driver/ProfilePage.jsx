import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CreditCard, Truck, MapPin, Check, Car, Bike, Zap, Upload, FileText } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import ocrService from '../../services/ocrService';

// Create supabase client directly in this component as a fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gkuyixfyyjyxznbtxble.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrdXlpeGZ5eWp5eHpuYnR4YmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDU2NTcsImV4cCI6MjA3MDQyMTY1N30.orqqieiI1NUc7Yb_7Jca_hV2x2tAb-_mAReXiQTuFQ4';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

const DriverProfilePage = () => {
  // Profile sections state
  const [profileSections, setProfileSections] = useState({
    personal: {
      id: 'personal',
      title: 'Personal Details',
      icon: User,
      completed: false,
      data: {
        full_name: '',
        date_of_birth: '',
        blood_group: '',
        phone: ''
      }
    },
    license: {
      id: 'license',
      title: 'Driving License Details',
      icon: CreditCard,
      completed: false,
      data: {
        license_number: '',
        license_issue_date: '',
        license_valid_till: '',
        dl_front: null,
        dl_back: null,
        dl_front_url: '',
        dl_back_url: ''
      }
    },
    vehicle: {
      id: 'vehicle',
      title: 'Vehicle Class',
      icon: Truck,
      completed: false,
      data: {
        vehicle_classes: []
      }
    },
    address: {
      id: 'address',
      title: 'Address Details',
      icon: MapPin,
      completed: false,
      data: {
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        post_office_name: ''
      }
    }
  });

  const [expandedSection, setExpandedSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { supabase, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Vehicle class options
  const vehicleClassOptions = [
    { id: 'LMV', label: 'LMV', description: 'Light Motor Vehicle', icon: Car },
    { id: 'MCWG', label: 'MCWG', description: 'Motorcycle With Gear', icon: Bike },
    { id: 'MCWOG', label: 'MCWOG', description: 'Motorcycle Without Gear', icon: Zap },
    { id: 'HMV', label: 'HMV', description: 'Heavy Motor Vehicle', icon: Truck }
  ];

  // Calculate completion percentage
  const calculateProgress = () => {
    const completedSections = Object.values(profileSections).filter(section => section.completed).length;
    return Math.round((completedSections / Object.keys(profileSections).length) * 100);
  };

  // Check if section is completed based on its data
  const isSectionCompleted = (sectionId, data) => {
    switch (sectionId) {
      case 'personal':
        return data.full_name && data.date_of_birth && data.blood_group && data.phone;
      case 'license':
        return data.license_number && data.license_issue_date && data.license_valid_till && data.dl_front_url && data.dl_back_url;
      case 'vehicle':
        return data.vehicle_classes && data.vehicle_classes.length > 0;
      case 'address':
        return data.address_line1 && data.city && data.state && data.postal_code;
      default:
        return false;
    }
  };

  // Update section data and completion status
  const updateSectionData = (sectionId, newData) => {
    setProfileSections(prev => {
      const updatedSection = {
        ...prev[sectionId],
        data: { ...prev[sectionId].data, ...newData },
      };
      updatedSection.completed = isSectionCompleted(sectionId, updatedSection.data);

      return {
        ...prev,
        [sectionId]: updatedSection
      };
    });
  };

  // Validation for each section
  const validateSection = (sectionId, data) => {
    const newErrors = {};

    switch (sectionId) {
      case 'personal':
        if (!data.full_name?.trim()) newErrors.full_name = 'Full name is required';
        if (!data.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
        if (!data.blood_group) newErrors.blood_group = 'Blood group is required';
        if (!data.phone?.trim()) newErrors.phone = 'Phone number is required';
        else if (!/^\+?[\d\s-()]{10,15}$/.test(data.phone.replace(/\s/g, ''))) {
          newErrors.phone = 'Invalid phone number format';
        }
        break;

      case 'license':
        if (!data.license_number?.trim()) newErrors.license_number = 'License number is required';
        if (!data.license_issue_date) newErrors.license_issue_date = 'Issue date is required';
        if (!data.license_valid_till) newErrors.license_valid_till = 'Validity date is required';
        if (!data.dl_front_url && !data.dl_front) newErrors.dl_front = 'Driving license front is required';
        if (!data.dl_back_url && !data.dl_back) newErrors.dl_back = 'Driving license back is required';
        break;

      case 'vehicle':
        if (!data.vehicle_classes || data.vehicle_classes.length === 0) {
          newErrors.vehicle_classes = 'Please select at least one vehicle class';
        }
        break;

      case 'address':
        if (!data.address_line1?.trim()) newErrors.address_line1 = 'Address Line 1 is required';
        if (!data.city?.trim()) newErrors.city = 'City is required';
        if (!data.state?.trim()) newErrors.state = 'State is required';
        if (!data.postal_code?.trim()) newErrors.postal_code = 'Postal code is required';
        else if (!/^\d{6}$/.test(data.postal_code)) {
            newErrors.postal_code = 'Invalid postal code (must be 6 digits)';
        }
        break;
    }

    return newErrors;
  };

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Update profile sections with existing data
        setProfileSections(prev => ({
          personal: {
            ...prev.personal,
            data: {
              full_name: data.full_name || '',
              date_of_birth: data.date_of_birth || '',
              blood_group: data.blood_group || '',
              phone: data.phone_number || ''
            },
            completed: !!(data.full_name && data.date_of_birth && data.blood_group && data.phone_number)
          },
          license: {
            ...prev.license,
            data: {
              license_number: data.license_number || '',
              license_issue_date: data.license_issue_date || '',
              license_valid_till: data.license_valid_till || '',
              dl_front_url: data.dl_front_url || '',
              dl_back_url: data.dl_back_url || '',
            },
            completed: !!(data.license_number && data.license_issue_date && data.license_valid_till && data.dl_front_url && data.dl_back_url)
          },
          vehicle: {
            ...prev.vehicle,
            data: {
              vehicle_classes: data.vehicle_classes ? (Array.isArray(data.vehicle_classes) ? data.vehicle_classes : [data.vehicle_classes]) : []
            },
            completed: !!(data.vehicle_classes && (Array.isArray(data.vehicle_classes) ? data.vehicle_classes.length > 0 : true))
          },
          address: {
            ...prev.address,
            data: {
              address_line1: data.address_line1 || '',
              address_line2: data.address_line2 || '',
              city: data.city || '',
              state: data.state || '',
              postal_code: data.postal_code || '',
              post_office_name: data.post_office_name || ''
            },
            completed: !!(data.address_line1 && data.city && data.state && data.postal_code)
          }
        }));
      } else {
        // No profile exists yet, create one
        const { error: insertError } = await supabase
          .from('driver_profiles')
          .insert([{ user_id: user.id }]);

        if (insertError) {
          console.error('Error creating driver profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase, showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFileUpload = async (file) => {
    if (!file) return null;

    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('driver-licenses')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      showToast('Failed to upload file', 'error');
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from('driver-licenses').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleOcr = async (providedFile) => {
    const file = providedFile || profileSections.license.data.dl_front;
    if (!file) {
      showToast('Please select a front license image first.', 'warning');
      return;
    }

    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await ocrService.extractLicenseInfo(formData);
      if (response && response.licenseNumber) {
        updateSectionData('license', { license_number: response.licenseNumber });
        showToast('License number extracted successfully!', 'success');
      } else {
        showToast('Could not extract license number. Please enter it manually.', 'error');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      showToast('An error occurred during OCR.', 'error');
    } finally {
      setOcrLoading(false);
    }
  };
  
  const fetchCityAndState = async (postalCode) => {
    if (postalCode.length === 6) {
        setLoading(true);
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${postalCode}`);
            const data = await response.json();
            if (data && data[0].Status === 'Success') {
                const postOffice = data[0].PostOffice[0];
                updateSectionData('address', { city: postOffice.District, state: postOffice.State, post_office_name: postOffice.Name });
            } else {
                showToast('Invalid postal code', 'error');
            }
        } catch (error) {
            console.error('Error fetching postal code data:', error);
            showToast('Failed to fetch address details', 'error');
        } finally {
            setLoading(false);
        }
    }
  };

  // Handle section form submission
  const handleSectionSubmit = async (sectionId) => {
    const section = profileSections[sectionId];
    const sectionErrors = validateSection(sectionId, section.data);

    if (Object.keys(sectionErrors).length > 0) {
      setErrors(sectionErrors);
      showToast('Please fix the errors before saving', 'error');
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const updateData = {
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (sectionId === 'license') {
        if (section.data.dl_front && !section.data.dl_front_url) {
            updateData.dl_front_url = await handleFileUpload(section.data.dl_front);
        }
        if (section.data.dl_back && !section.data.dl_back_url) {
            updateData.dl_back_url = await handleFileUpload(section.data.dl_back);
        }
      }

      // Add section-specific data
      Object.keys(section.data).forEach(key => {
        if (key !== 'dl_front' && key !== 'dl_back') {
            updateData[key] = section.data[key];
        }
      });
      
      if (sectionId === 'personal') {
        updateData.phone_number = updateData.phone;
        delete updateData.phone;
      }


      const { error } = await supabase
        .from('driver_profiles')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving section:', error);
        showToast('Failed to save section', 'error');
        return;
      }

      // Update section completion status
      updateSectionData(sectionId, section.data);
      setExpandedSection(null);
      showToast(`${section.title} saved successfully!`, 'success');
      fetchProfile();

    } catch (error) {
      console.error('Error saving section:', error);
      showToast('Failed to save section', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle final profile submission
  const handleFinalSubmit = async () => {
    const allCompleted = Object.values(profileSections).every(section => section.completed);

    if (!allCompleted) {
      showToast('Please complete all sections before submitting', 'error');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('driver_profiles')
        .update({
          profile_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error completing profile:', error);
        showToast('Failed to complete profile', 'error');
        return;
      }

      showToast('Profile completed successfully!', 'success');

      // Redirect to dashboard after successful submission
      setTimeout(() => {
        navigate('/dashboard/driver');
      }, 1500);

    } catch (error) {
      console.error('Error completing profile:', error);
      showToast('Failed to complete profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sidebar navigation items (same as dashboard)
  const sidebarItems = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'Overview',
      onClick: () => navigate('/dashboard/driver')
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Profile',
      onClick: () => {} // Current page
    },
  ];

  const FileUploadField = ({ field, label, error, onFileSelect, file, previewUrl }) => {
    const [internalPreview, setInternalPreview] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, [field]: 'File size must be less than 5MB' }));
                return;
            }
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(selectedFile.type)) {
                setErrors(prev => ({ ...prev, [field]: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' }));
                return;
            }
            setErrors(prev => ({ ...prev, [field]: '' }));
            onFileSelect(field, selectedFile);

            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setInternalPreview(reader.result);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setInternalPreview(null);
            }
        }
    };

    return (
        <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">{label} *</label>
            <div className="flex items-center space-x-4">
                <label htmlFor={field} className="cursor-pointer enterprise-button-secondary px-4 py-2 flex items-center space-x-2">
                    <Upload size={16} />
                    <span>{file ? 'Change File' : 'Upload File'}</span>
                </label>
                <input id={field} type="file" className="hidden" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />
                {file && <span className="text-gray-400 text-sm">{file.name}</span>}
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            {(internalPreview || previewUrl) && (
                <div className="mt-4">
                    { (internalPreview || (previewUrl && previewUrl.match(/\.(jpeg|jpg|png|gif)$/i))) ?
                        <img src={internalPreview || previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                        :
                        <div className="w-32 h-32 bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                            <FileText size={32} className="text-gray-400" />
                            <span className="text-xs text-gray-400 mt-2">PDF Document</span>
                        </div>
                    }
                </div>
            )}
        </div>
    );
  };

  // Render form for each section
  const renderSectionForm = (section) => {
    const handleInputChange = (field, value) => {
      updateSectionData(section.id, { [field]: value });
      // Clear errors when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    const handleVehicleClassToggle = (classId) => {
      const currentClasses = section.data.vehicle_classes || [];
      const newClasses = currentClasses.includes(classId)
        ? currentClasses.filter(c => c !== classId)
        : [...currentClasses, classId];
      updateSectionData(section.id, { vehicle_classes: newClasses });
    };

    switch (section.id) {
      case 'personal':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Full Name *</label>
                <input
                  type="text"
                  className={`enterprise-input w-full ${errors.full_name ? 'border-red-500' : ''}`}
                  value={section.data.full_name || ''}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                />
                {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Date of Birth *</label>
                <input
                  type="date"
                  className={`enterprise-input w-full ${errors.date_of_birth ? 'border-red-500' : ''}`}
                  value={section.data.date_of_birth || ''}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
                {errors.date_of_birth && <p className="text-red-400 text-xs mt-1">{errors.date_of_birth}</p>}
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Blood Group *</label>
                <select
                  className={`enterprise-input w-full ${errors.blood_group ? 'border-red-500' : ''}`}
                  value={section.data.blood_group || ''}
                  onChange={(e) => handleInputChange('blood_group', e.target.value)}
                >
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                {errors.blood_group && <p className="text-red-400 text-xs mt-1">{errors.blood_group}</p>}
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Phone Number *</label>
                <input
                  type="tel"
                  className={`enterprise-input w-full ${errors.phone ? 'border-red-500' : ''}`}
                  value={section.data.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleSectionSubmit(section.id)}
                disabled={loading}
                className="enterprise-button px-6 py-2"
              >
                {loading ? 'Saving...' : 'Save Personal Details'}
              </button>
            </div>
          </div>
        );

      case 'license':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">Driving License Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-300 text-sm font-bold mb-2">License Number *</label>
                <input
                  type="text"
                  className={`enterprise-input w-full ${errors.license_number ? 'border-red-500' : ''}`}
                  value={section.data.license_number || ''}
                  onChange={(e) => handleInputChange('license_number', e.target.value.toUpperCase())}
                  placeholder="e.g., KL212019002353T"
                />
                {errors.license_number && <p className="text-red-400 text-xs mt-1">{errors.license_number}</p>}
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Issue Date *</label>
                <input
                  type="date"
                  className={`enterprise-input w-full ${errors.license_issue_date ? 'border-red-500' : ''}`}
                  value={section.data.license_issue_date || ''}
                  onChange={(e) => handleInputChange('license_issue_date', e.target.value)}
                />
                {errors.license_issue_date && <p className="text-red-400 text-xs mt-1">{errors.license_issue_date}</p>}
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Valid Till *</label>
                <input
                  type="date"
                  className={`enterprise-input w-full ${errors.license_valid_till ? 'border-red-500' : ''}`}
                  value={section.data.license_valid_till || ''}
                  onChange={(e) => handleInputChange('license_valid_till', e.target.value)}
                />
                {errors.license_valid_till && <p className="text-red-400 text-xs mt-1">{errors.license_valid_till}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <FileUploadField
                    field="dl_front"
                    label="Driving License Front"
                    error={errors.dl_front}
                    onFileSelect={(field, file) => { updateSectionData('license', { [field]: file }); handleOcr(file); }}
                    file={section.data.dl_front}
                    previewUrl={section.data.dl_front_url}
                />
                <FileUploadField
                    field="dl_back"
                    label="Driving License Back"
                    error={errors.dl_back}
                    onFileSelect={(field, file) => updateSectionData('license', { [field]: file })}
                    file={section.data.dl_back}
                    previewUrl={section.data.dl_back_url}
                />
            </div>
            <div className="flex justify-end items-center mt-6">
                <button
                    onClick={() => handleSectionSubmit(section.id)}
                    disabled={loading}
                    className="enterprise-button px-6 py-2"
                >
                    {loading ? 'Saving...' : 'Save License Details'}
                </button>
            </div>
          </div>
        );

      case 'vehicle':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">Vehicle Class Authorization</h4>
            <p className="text-gray-400 mb-4">Select the vehicle classes you are authorized to drive:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicleClassOptions.map(option => (
                <div
                  key={option.id}
                  onClick={() => handleVehicleClassToggle(option.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    (section.data.vehicle_classes || []).includes(option.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                      className={`p-2 rounded-lg transition-colors ${
                        (section.data.vehicle_classes || []).includes(option.id)
                          ? 'bg-primary/20 text-primary'
                          : 'bg-gray-700/50 text-gray-300'
                      }`}
                      aria-label={`${option.label} vehicle class icon`}
                    >
                      <option.icon size={20} />
                    </motion.div>
                    <div>
                      <h5 className="font-semibold text-white">{option.label}</h5>
                      <p className="text-sm text-gray-400">{option.description}</p>
                    </div>
                    {(section.data.vehicle_classes || []).includes(option.id) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <div
                          className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                          aria-label="Vehicle class selected"
                        >
                          <Check size={16} className="text-black" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.vehicle_classes && <p className="text-red-400 text-xs mt-1">{errors.vehicle_classes}</p>}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleSectionSubmit(section.id)}
                disabled={loading}
                className="enterprise-button px-6 py-2"
              >
                {loading ? 'Saving...' : 'Save Vehicle Classes'}
              </button>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">Address Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-gray-300 text-sm font-bold mb-2">Address Line 1 *</label>
                    <input
                        type="text"
                        className={`enterprise-input w-full ${errors.address_line1 ? 'border-red-500' : ''}`}
                        value={section.data.address_line1 || ''}
                        onChange={(e) => handleInputChange('address_line1', e.target.value)}
                        placeholder="House No, Building, Street"
                    />
                    {errors.address_line1 && <p className="text-red-400 text-xs mt-1">{errors.address_line1}</p>}
                </div>
                <div className="md:col-span-2">
                    <label className="block text-gray-300 text-sm font-bold mb-2">Address Line 2</label>
                    <input
                        type="text"
                        className="enterprise-input w-full"
                        value={section.data.address_line2 || ''}
                        onChange={(e) => handleInputChange('address_line2', e.target.value)}
                        placeholder="Area, Landmark"
                    />
                </div>
                <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">Postal Code *</label>
                    <input
                        type="text"
                        className={`enterprise-input w-full ${errors.postal_code ? 'border-red-500' : ''}`}
                        value={section.data.postal_code || ''}
                        onChange={(e) => handleInputChange('postal_code', e.target.value)}
                        onBlur={(e) => fetchCityAndState(e.target.value)}
                        placeholder="6-digit PIN code"
                        maxLength={6}
                    />
                    {errors.postal_code && <p className="text-red-400 text-xs mt-1">{errors.postal_code}</p>}
                </div>
                <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">Post Office</label>
                    <input
                        type="text"
                        className="enterprise-input w-full"
                        value={section.data.post_office_name || ''}
                        onChange={(e) => handleInputChange('post_office_name', e.target.value)}
                        placeholder="Auto-filled from PIN"
                    />
                </div>
                <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">City *</label>
                    <input
                        type="text"
                        className={`enterprise-input w-full ${errors.city ? 'border-red-500' : ''}`}
                        value={section.data.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City"
                    />
                    {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                </div>
                <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">State *</label>
                    <input
                        type="text"
                        className={`enterprise-input w-full ${errors.state ? 'border-red-500' : ''}`}
                        value={section.data.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="State"
                    />
                    {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleSectionSubmit(section.id)}
                disabled={loading}
                className="enterprise-button px-6 py-2"
              >
                {loading ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="Driver Profile" sidebarItems={sidebarItems}>
      <div className="max-w-4xl mx-auto mt-4">
        {/* Profile Completion Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="enterprise-card p-8 mb-8"
        >
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-black font-bold text-xl">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Complete your profile</h1>
              <p className="text-gray-400">
                By completing all the details you have a higher chance of being assigned to trips.
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-white">{calculateProgress()}%</span>
              <span className="text-sm text-gray-400">
                {Object.values(profileSections).filter(s => s.completed).length} of {Object.keys(profileSections).length} completed
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <motion.div
                className="bg-primary h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress()}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Profile Sections */}
          <div className="space-y-4">
            {Object.values(profileSections).map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border border-gray-600 rounded-lg overflow-hidden ${
                  section.completed ? 'bg-gray-800/50' : 'bg-gray-800'
                }`}
              >
                {/* Section Header */}
                <div
                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700/50 transition-colors ${
                    expandedSection === section.id ? 'bg-gray-700/50' : ''
                  }`}
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                >
                  <div className="flex items-center space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                      className={`p-3 rounded-lg transition-colors ${
                        section.completed
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-600/50'
                      }`}
                      aria-label={`${section.title} section icon`}
                    >
                      <section.icon size={24} />
                    </motion.div>
                    <div>
                      <h3 className={`font-semibold ${section.completed ? 'text-gray-400' : 'text-white'}`}>
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {section.completed ? 'Completed' : 'Click to complete'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {section.completed ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                        aria-label="Section completed"
                      >
                        <Check size={16} className="text-white" />
                      </motion.div>
                    ) : (
                      <div
                        className="w-6 h-6 border-2 border-gray-500 rounded-full"
                        aria-label="Section pending"
                      ></div>
                    )}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedSection === section.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expandable Form Section */}
                <AnimatePresence>
                  {expandedSection === section.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-600"
                    >
                      <div className="p-6">
                        {renderSectionForm(section)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Final Submit Button */}
          {Object.values(profileSections).every(section => section.completed) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="enterprise-button px-8 py-3 text-lg font-semibold"
              >
                {loading ? 'Completing Profile...' : 'Complete Profile'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DriverProfilePage;
