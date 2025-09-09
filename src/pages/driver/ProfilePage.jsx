import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CreditCard, Truck, MapPin, Check, Car, Bike, Zap } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

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
        issue_date: '',
        validity_nt: ''
      }
    },
    vehicle: {
      id: 'vehicle',
      title: 'Vehicle Class',
      icon: Truck,
      completed: false,
      data: {
        license_class: []
      }
    },
    address: {
      id: 'address',
      title: 'Address Details',
      icon: MapPin,
      completed: false,
      data: {
        address: ''
      }
    }
  });

  const [expandedSection, setExpandedSection] = useState(null);
  const [loading, setLoading] = useState(false);
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
        return data.license_number && data.issue_date && data.validity_nt;
      case 'vehicle':
        return data.license_class && data.license_class.length > 0;
      case 'address':
        return data.address && data.address.length >= 10;
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
        else if (!/^[A-Z]{2}\d{13}$/.test(data.license_number.replace(/\s/g, ''))) {
          newErrors.license_number = 'Invalid license format (e.g., KL212019002353T)';
        }
        if (!data.issue_date) newErrors.issue_date = 'Issue date is required';
        if (!data.validity_nt) newErrors.validity_nt = 'Validity date is required';
        break;

      case 'vehicle':
        if (!data.license_class || data.license_class.length === 0) {
          newErrors.license_class = 'Please select at least one vehicle class';
        }
        break;

      case 'address':
        if (!data.address?.trim()) newErrors.address = 'Address is required';
        else if (data.address.trim().length < 10) {
          newErrors.address = 'Please provide a complete address';
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
              phone: data.phone || ''
            },
            completed: !!(data.full_name && data.date_of_birth && data.blood_group && data.phone)
          },
          license: {
            ...prev.license,
            data: {
              license_number: data.license_number || '',
              issue_date: data.issue_date || '',
              validity_nt: data.validity_nt || ''
            },
            completed: !!(data.license_number && data.issue_date && data.validity_nt)
          },
          vehicle: {
            ...prev.vehicle,
            data: {
              license_class: data.license_class ? (Array.isArray(data.license_class) ? data.license_class : [data.license_class]) : []
            },
            completed: !!(data.license_class && (Array.isArray(data.license_class) ? data.license_class.length > 0 : true))
          },
          address: {
            ...prev.address,
            data: {
              address: data.address || ''
            },
            completed: !!(data.address && data.address.length >= 10)
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

      // Prepare data for database
      const updateData = {
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      // Add section-specific data
      Object.keys(section.data).forEach(key => {
        updateData[key] = section.data[key];
      });

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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'My Trips',
      onClick: () => {}
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 2m8-2l2 2m-2-2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9z" />
        </svg>
      ),
      label: 'Schedule',
      onClick: () => {}
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'Performance',
      onClick: () => {}
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Vehicle Status',
      onClick: () => {}
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      label: 'Earnings',
      onClick: () => {}
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
      const currentClasses = section.data.license_class || [];
      const newClasses = currentClasses.includes(classId)
        ? currentClasses.filter(c => c !== classId)
        : [...currentClasses, classId];
      updateSectionData(section.id, { license_class: newClasses });
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
              <div>
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
                  className={`enterprise-input w-full ${errors.issue_date ? 'border-red-500' : ''}`}
                  value={section.data.issue_date || ''}
                  onChange={(e) => handleInputChange('issue_date', e.target.value)}
                />
                {errors.issue_date && <p className="text-red-400 text-xs mt-1">{errors.issue_date}</p>}
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Valid Till *</label>
                <input
                  type="date"
                  className={`enterprise-input w-full ${errors.validity_nt ? 'border-red-500' : ''}`}
                  value={section.data.validity_nt || ''}
                  onChange={(e) => handleInputChange('validity_nt', e.target.value)}
                />
                {errors.validity_nt && <p className="text-red-400 text-xs mt-1">{errors.validity_nt}</p>}
              </div>
            </div>
            <div className="flex justify-end mt-6">
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
                    (section.data.license_class || []).includes(option.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                      className={`p-2 rounded-lg transition-colors ${
                        (section.data.license_class || []).includes(option.id)
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
                    {(section.data.license_class || []).includes(option.id) && (
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
            {errors.license_class && <p className="text-red-400 text-xs mt-1">{errors.license_class}</p>}
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
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Complete Address *</label>
              <textarea
                rows={4}
                className={`enterprise-input w-full ${errors.address ? 'border-red-500' : ''}`}
                value={section.data.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your complete address including house number, street, area, city, state, and PIN code"
              />
              {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
              <p className="text-xs text-gray-500 mt-1">Minimum 10 characters required</p>
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