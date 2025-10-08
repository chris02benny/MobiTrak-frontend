import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import ocrService from '../services/ocrService';
import DashboardLayout from '../components/DashboardLayout';
import { 
  UserIcon, 
  IdentificationIcon, 
  MapPinIcon, 
  TruckIcon,
  CameraIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const DriverProfileCompletion = () => {
  const { user, initializing } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [licenseBackUrl, setLicenseBackUrl] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [editingSection, setEditingSection] = useState(null);
  const [profileData, setProfileData] = useState({
    // Personal Details
    full_name: '',
    date_of_birth: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // License Details
    license_number: '',
    license_type: '',
    license_expiry: '',
    license_image: null,
    
    // Experience
    years_of_experience: 0,
    previous_companies: '',
    specializations: '',
    preferred_vehicle_types: ''
  });

  const profileSections = [
    { id: 'personal', name: 'Personal Information', icon: UserIcon },
    { id: 'license', name: 'License Details', icon: IdentificationIcon },
    { id: 'address', name: 'Address', icon: MapPinIcon },
    { id: 'experience', name: 'Experience Details', icon: TruckIcon }
  ];

  const licenseTypes = [
    'LMV', 'MCWG', 'MGV', 'HMV', 'HGMV', 'HPMV'
  ];

  const vehicleTypes = [
    'sedan', 'suv', 'hatchback', 'truck', 'bus', 'van', 'motorcycle'
  ];

  const specializations = [
    'City Driving', 'Highway Driving', 'Long Distance', 'Heavy Vehicles', 
    'Passenger Transport', 'Cargo Transport', 'Emergency Driving'
  ];

  useEffect(() => {
    if (initializing) return;
    if (!user?.id) return;
    fetchExistingProfile();
  }, [user?.id, initializing]);

  const fetchExistingProfile = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfileData({
          ...data,
          previous_companies: data.previous_companies?.join(', ') || '',
          specializations: data.specializations?.join(', ') || '',
          preferred_vehicle_types: data.preferred_vehicle_types?.join(', ') || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateOcrProgress = (data) => {
    const fields = [
      'full_name', 'date_of_birth', 'license_number', 'license_expiry', 
      'address', 'city', 'state', 'pincode', 'license_type'
    ];
    
    const filledFields = fields.filter(field => data[field] && data[field].toString().trim() !== '');
    const progress = Math.round((filledFields.length / fields.length) * 100);
    return progress;
  };

  const handleFileUpload = async (file, side = 'front') => {
    try {
      setError(null);
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        throw new Error('Please upload a valid image file (JPG, PNG)');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Store the file for processing
      if (side === 'front') {
        setFrontImage(file);
      } else {
        setBackImage(file);
      }

      console.log(`${side} image selected for processing`);
      
    } catch (err) {
      console.error('Error selecting file:', err);
      setError(err.message || 'Failed to select file');
    }
  };

  const processLicenseImages = async () => {
    if (!frontImage) {
      setError('Please upload the front side of your driving license');
      return;
    }

    try {
      setLoading(true);
      setOcrLoading(true);
      setError(null);
      setValidationStatus(null);

      console.log('Processing both license images...');
      
      // Process front image
      const frontResult = await ocrService.processLicenseFile(frontImage);
      
      if (!frontResult.validation?.isValid) {
        throw new Error(frontResult.validation?.message || 'Invalid front side document');
      }

      let backResult = null;
      if (backImage) {
        backResult = await ocrService.processLicenseFile(backImage);
        
        if (!backResult.validation?.isValid) {
          console.warn('Back image validation failed, continuing with front only');
        }
      }

      // Combine results from both images
      const combinedData = {
        // Personal details (prefer front, fallback to back)
        full_name: frontResult.full_name || backResult?.full_name || '',
        date_of_birth: frontResult.date_of_birth || backResult?.date_of_birth || '',
        address: frontResult.address || backResult?.address || '',
        
        // License details
        license_number: frontResult.license_number || backResult?.license_number || '',
        license_expiry: frontResult.validity_nt || frontResult.validity_tr || frontResult.expiry_date || 
                       backResult?.validity_nt || backResult?.validity_tr || backResult?.expiry_date || '',
        license_type: frontResult.license_class || backResult?.license_class || '',
        
        // Additional details
        fathers_name: frontResult.fathers_name || backResult?.fathers_name || '',
        blood_group: frontResult.blood_group || backResult?.blood_group || '',
        issuing_authority: frontResult.issuing_authority || backResult?.issuing_authority || '',
        
        // Raw data for debugging
        raw_front: frontResult.raw_extracted_text || '',
        raw_back: backResult?.raw_extracted_text || '',
        validation: frontResult.validation
      };

      setExtractedData(combinedData);
      setValidationStatus({
        isValid: true,
        confidence: frontResult.validation?.confidence || 100,
        message: 'Valid Indian Driving License detected and processed successfully'
      });

      // Upload images to storage
      await uploadImagesToStorage();

      // Autofill all profile data
      const updatedProfileData = {
        ...profileData,
        // Personal details
        full_name: combinedData.full_name,
        date_of_birth: combinedData.date_of_birth,
        address: combinedData.address,
        
        // License details
        license_number: combinedData.license_number,
        license_expiry: combinedData.license_expiry,
        license_type: combinedData.license_type,
        
        // Additional fields
        phone_number: profileData.phone_number, // Keep existing phone
        city: profileData.city, // Keep existing city
        state: profileData.state, // Keep existing state
        pincode: profileData.pincode, // Keep existing pincode
      };

      setProfileData(updatedProfileData);

      // Calculate and set OCR progress
      const progress = calculateOcrProgress(updatedProfileData);
      setOcrProgress(progress);

      console.log('✅ All license data processed and form autofilled successfully');
      
    } catch (err) {
      console.error('Error processing license images:', err);
      setError(err.message || 'Failed to process license images');
      setValidationStatus({
        isValid: false,
        confidence: 0,
        message: err.message || 'Processing failed'
      });
    } finally {
      setLoading(false);
      setOcrLoading(false);
    }
  };

  const uploadImagesToStorage = async () => {
    try {
      // Upload front image
      const frontExt = frontImage.name.split('.').pop();
      const frontFileName = `${user.id}_license_front_${Date.now()}.${frontExt}`;
      const frontPath = `licenses/${frontFileName}`;

      const { data: frontData, error: frontError } = await supabase.storage
        .from('driver-licenses')
        .upload(frontPath, frontImage);

      if (frontError) throw frontError;

      const { data: { publicUrl: frontUrl } } = supabase.storage
        .from('driver-licenses')
        .getPublicUrl(frontPath);

      setProfileData(prev => ({ ...prev, license_image: frontUrl }));

      // Upload back image if exists
      if (backImage) {
        const backExt = backImage.name.split('.').pop();
        const backFileName = `${user.id}_license_back_${Date.now()}.${backExt}`;
        const backPath = `licenses/${backFileName}`;

        const { data: backData, error: backError } = await supabase.storage
          .from('driver-licenses')
          .upload(backPath, backImage);

        if (backError) throw backError;

        const { data: { publicUrl: backUrl } } = supabase.storage
          .from('driver-licenses')
          .getPublicUrl(backPath);

        setLicenseBackUrl(backUrl);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      throw new Error('Failed to upload images to storage');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const submitData = {
        ...profileData,
        previous_companies: profileData.previous_companies.split(',').map(s => s.trim()).filter(s => s),
        specializations: profileData.specializations.split(',').map(s => s.trim()).filter(s => s),
        preferred_vehicle_types: profileData.preferred_vehicle_types.split(',').map(s => s.trim()).filter(s => s),
        profile_complete: true
      };

      // Safe update-then-insert without relying on onConflict
      const { data: existingProfile, error: checkError } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('driver_profiles')
          .update({ ...submitData, user_id: user.id })
          .eq('user_id', user.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('driver_profiles')
          .insert([{ user_id: user.id, ...submitData }]);
        if (insertError) throw insertError;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderProfileCard = (section) => {
    const isEditing = editingSection === section.id;
    
    switch (section.id) {
      case 'personal':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">{section.name}</h3>
              <button
                onClick={() => setEditingSection(isEditing ? null : section.id)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.full_name || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={profileData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.date_of_birth || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.phone_number || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Blood Group</label>
                  {isEditing ? (
                    <select
                      value={extractedData?.blood_group || ''}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select blood group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{extractedData?.blood_group || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'license':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">{section.name}</h3>
              <button
                onClick={() => setEditingSection(isEditing ? null : section.id)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">License Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.license_number}
                      onChange={(e) => handleInputChange('license_number', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.license_number || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">License Type</label>
                  {isEditing ? (
                    <select
                      value={profileData.license_type}
                      onChange={(e) => handleInputChange('license_type', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select license type</option>
                      {licenseTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.license_type || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">License Expiry Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={profileData.license_expiry}
                      onChange={(e) => handleInputChange('license_expiry', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.license_expiry || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Issuing Authority</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">{extractedData?.issuing_authority || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">{section.name}</h3>
              <button
                onClick={() => setEditingSection(isEditing ? null : section.id)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Address</label>
                {isEditing ? (
                  <textarea
                    value={profileData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-gray-900">{profileData.address || 'Not provided'}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.city || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">State</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.state || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Pincode</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.pincode || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">{section.name}</h3>
              <button
                onClick={() => setEditingSection(isEditing ? null : section.id)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Years of Experience</label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={profileData.years_of_experience}
                      onChange={(e) => handleInputChange('years_of_experience', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.years_of_experience || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Previous Companies</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.previous_companies}
                      onChange={(e) => handleInputChange('previous_companies', e.target.value)}
                      placeholder="Company 1, Company 2, Company 3"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.previous_companies || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Specializations</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.specializations}
                      onChange={(e) => handleInputChange('specializations', e.target.value)}
                      placeholder="City Driving, Highway Driving, Long Distance"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.specializations || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Preferred Vehicle Types</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.preferred_vehicle_types}
                      onChange={(e) => handleInputChange('preferred_vehicle_types', e.target.value)}
                      placeholder="sedan, suv, truck"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{profileData.preferred_vehicle_types || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Profile Completed!</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your driver profile has been completed successfully. You can now start receiving job offers.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => window.location.href = '/driver/dashboard'}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            Complete your driver profile to start receiving job offers
          </p>
        </div>

        {/* License Upload Section - Always Visible */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                📄 Upload Your Driving License
              </h3>
              <p className="text-sm text-gray-600">
                Upload both front and back sides of your Indian Driving License. 
                We'll automatically extract and fill your details across all sections.
              </p>
            </div>

            {/* OCR Progress Indicator */}
            {ocrProgress > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    📊 OCR Data Fill Progress
                  </span>
                  <span className="text-sm font-bold text-blue-900">
                    {ocrProgress}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${ocrProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Validation Status */}
            {validationStatus && (
              <div className={`mb-4 p-4 rounded-md ${
                validationStatus.isValid 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex">
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      validationStatus.isValid ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {validationStatus.isValid ? '✅ Valid License' : '❌ Invalid Document'}
                    </h3>
                    <div className={`mt-2 text-sm ${
                      validationStatus.isValid ? 'text-green-700' : 'text-red-700'
                    }`}>
                      <p>{validationStatus.message}</p>
                      {validationStatus.confidence > 0 && (
                        <p className="mt-1">Confidence: {validationStatus.confidence}%</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Front Side (Required) *
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  frontImage ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}>
                  {frontImage ? (
                    <div>
                      <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-2" />
                      <p className="text-sm text-green-700 font-medium">{frontImage.name}</p>
                      <button
                        onClick={() => setFrontImage(null)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <CameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500 font-medium">
                          Click to upload front
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handleFileUpload(e.target.files[0], 'front');
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Back Side (Optional)
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  backImage ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}>
                  {backImage ? (
                    <div>
                      <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-2" />
                      <p className="text-sm text-green-700 font-medium">{backImage.name}</p>
                      <button
                        onClick={() => setBackImage(null)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <CameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500 font-medium">
                          Click to upload back
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handleFileUpload(e.target.files[0], 'back');
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Process Button */}
            <div className="text-center mt-6">
              <button
                onClick={processLicenseImages}
                disabled={!frontImage || ocrLoading}
                className={`px-8 py-3 rounded-md font-medium ${
                  !frontImage || ocrLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {ocrLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing License...
                  </div>
                ) : (
                  '🚀 Process License & Auto-Fill All Details'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Cards */}
        <div className="space-y-6">
          {profileSections.map((section) => (
            <div key={section.id}>
              {renderProfileCard(section)}
            </div>
          ))}
        </div>

        {/* Complete Profile Button */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center px-8 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DriverProfileCompletion;
