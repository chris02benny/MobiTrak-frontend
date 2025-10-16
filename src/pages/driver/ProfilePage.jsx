import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CreditCard, Truck, MapPin, Check, Car, Bike, Zap, Upload, FileText, Loader2, Camera, CheckCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import ocrService from '../../services/ocrService';
import { driverSidebarItems } from '../../config/driverSidebarConfig.jsx';

// Using shared Supabase client from utils to avoid multiple instances

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
        profile_picture: null,
        profile_picture_url: '',
        bio: ''
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
        issuing_authority: '',
        dl_front: null,
        dl_back: null,
        dl_front_url: '',
        dl_back_url: ''
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
  const [editingSection, setEditingSection] = useState(null);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();


  // Calculate completion percentage
  const calculateProgress = () => {
    const completedSections = Object.values(profileSections).filter(section => section.completed).length;
    return Math.round((completedSections / Object.keys(profileSections).length) * 100);
  };


  // Parse address components from address string
  const parseAddressComponents = (addressString) => {
    if (!addressString) return { city: '', state: '', postalCode: '' };
    
    const components = { city: '', state: '', postalCode: '' };
    
    // Clean the address string first
    let cleanAddress = addressString
      .replace(/,\s*,+/g, ',') // Remove multiple commas
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    // Extract postal code (6-digit number)
    const postalCodeMatch = cleanAddress.match(/\b(\d{6})\b/);
    if (postalCodeMatch) {
      components.postalCode = postalCodeMatch[1];
    }
    
    // Extract city (look for city name before postal code)
    const cityMatch = cleanAddress.match(/([A-Z][A-Z\s]+?)(?:,\s*\d{6}|$)/);
    if (cityMatch) {
      components.city = cityMatch[1].trim();
    }
    
    // For Kerala licenses, state is usually Kerala
    if (cleanAddress.toUpperCase().includes('KERALA') || cleanAddress.toUpperCase().includes('KOTTAYAM')) {
      components.state = 'Kerala';
    }
    
    console.log('🔍 Parsed address components from:', cleanAddress.substring(0, 100) + '...');
    console.log('🏙️ Extracted city:', components.city);
    console.log('🏛️ Extracted state:', components.state);
    console.log('📮 Extracted postal code:', components.postalCode);
    
    return components;
  };


  // Check if section is completed based on its data
  const isSectionCompleted = (sectionId, data) => {
    switch (sectionId) {
      case 'personal':
        // Profile picture and bio are optional and do not affect completion
        return data.full_name && data.date_of_birth && data.blood_group;
      case 'license':
        // License section is complete only if ALL fields are filled AND files are uploaded
        return data.license_number && 
               data.license_issue_date && 
               data.license_valid_till && 
               data.issuing_authority &&
               (data.dl_front_url || data.dl_front) && 
               (data.dl_back_url || data.dl_back);
      case 'address':
        return data.address_line1 && data.city && data.state && data.postal_code;
      default:
        return false;
    }
  };

  // Get missing fields for a section
  const getMissingFields = (sectionId, data) => {
    const missing = [];
    switch (sectionId) {
      case 'personal':
        if (!data.full_name) missing.push('full_name');
        if (!data.date_of_birth) missing.push('date_of_birth');
        if (!data.blood_group) missing.push('blood_group');
        break;
      case 'license':
        if (!data.license_number) missing.push('license_number');
        if (!data.license_issue_date) missing.push('license_issue_date');
        if (!data.license_valid_till) missing.push('license_valid_till');
        if (!data.issuing_authority) missing.push('issuing_authority');
        if (!data.dl_front_url && !data.dl_front) missing.push('dl_front (file or URL)');
        if (!data.dl_back_url && !data.dl_back) missing.push('dl_back (file or URL)');
        break;
      case 'address':
        if (!data.address_line1) missing.push('address_line1');
        if (!data.city) missing.push('city');
        if (!data.state) missing.push('state');
        if (!data.postal_code) missing.push('postal_code');
        break;
    }
    return missing;
  };

  // Update section data and completion status
  const updateSectionData = (sectionId, newData) => {
    console.log(`🔄 Updating ${sectionId} section with:`, newData);
    setProfileSections(prev => {
      const updatedSection = {
        ...prev[sectionId],
        data: { ...prev[sectionId].data, ...newData },
      };
      updatedSection.completed = isSectionCompleted(sectionId, updatedSection.data);

      const result = {
        ...prev,
        [sectionId]: updatedSection
      };
      console.log(`🔄 Updated ${sectionId} section data:`, result[sectionId].data);
      return result;
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
        break;

      case 'license':
        if (!data.license_number?.trim()) newErrors.license_number = 'License number is required';
        if (!data.license_issue_date) newErrors.license_issue_date = 'Issue date is required';
        if (!data.license_valid_till) newErrors.license_valid_till = 'Validity date is required';
        if (!data.dl_front_url && !data.dl_front) newErrors.dl_front = 'Driving license front is required';
        if (!data.dl_back_url && !data.dl_back) newErrors.dl_back = 'Driving license back is required';
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

  // Clean up duplicate profiles for the current user
  const cleanupDuplicateProfiles = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get all profiles for this user
      const { data: allProfiles, error: fetchError } = await supabase
        .from('driver_profiles')
        .select('id, profile_complete, license_number, full_name, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching profiles for cleanup:', fetchError);
        return;
      }

      if (allProfiles && allProfiles.length > 1) {
        // Find the most complete profile (prefer complete profiles, then by most recent)
        const completeProfiles = allProfiles.filter(p => p.profile_complete && p.license_number && p.full_name);
        const keepProfile = completeProfiles.length > 0 ? completeProfiles[0] : allProfiles[0];
        
        // Delete all other profiles
        const profilesToDelete = allProfiles.filter(p => p.id !== keepProfile.id);
        
        if (profilesToDelete.length > 0) {
          console.log(`🧹 Cleaning up ${profilesToDelete.length} duplicate profiles, keeping:`, keepProfile.id);
          
          for (const profile of profilesToDelete) {
            const { error: deleteError } = await supabase
              .from('driver_profiles')
              .delete()
              .eq('id', profile.id);
            
            if (deleteError) {
              console.error('Error deleting duplicate profile:', deleteError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in cleanup function:', error);
    }
  }, [user?.id]);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Clean up duplicates first
      await cleanupDuplicateProfiles();
      
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : data;

      if (row) {
        // Update profile sections with existing data
        setProfileSections(prev => ({
          personal: {
            ...prev.personal,
            data: {
              full_name: row.full_name || '',
              date_of_birth: row.date_of_birth || '',
              blood_group: row.blood_group || '',
              profile_picture_url: row.profile_picture_url || '',
              bio: row.bio || ''
            },
            completed: !!(row.full_name && row.date_of_birth && row.blood_group)
          },
          license: {
            ...prev.license,
            data: {
              license_number: row.license_number || '',
              license_issue_date: row.license_issue_date || '',
              license_valid_till: row.license_valid_till || '',
              issuing_authority: row.issuing_authority || '',
              dl_front_url: row.dl_front_url || '',
              dl_back_url: row.dl_back_url || '',
            },
            completed: !!(row.license_number && row.license_issue_date && row.license_valid_till && 
                          (row.dl_front_url || row.dl_front) && (row.dl_back_url || row.dl_back))
          },
          address: {
            ...prev.address,
            data: {
              address_line1: row.address_line1 || '',
              address_line2: row.address_line2 || '',
              city: row.city || '',
              state: row.state || '',
              postal_code: row.postal_code || '',
              post_office_name: row.post_office_name || ''
            },
            completed: !!(row.address_line1 && row.city && row.state && row.postal_code)
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

  const uploadFileToStorage = async (file, bucket = 'driver-licenses') => {
    if (!file) return null;

    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      showToast('Failed to upload file', 'error');
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  };

  const handleFileUpload = async (file, side = 'front') => {
    try {
      setErrors({});
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        throw new Error('Please upload a valid image file (JPG, PNG)');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }
      if (side === 'front') {
        setFrontImage(file);
        // Immediately store the file in the license section
        updateSectionData('license', { dl_front: file });
      } else if (side === 'back') {
        setBackImage(file);
        // Immediately store the file in the license section
        updateSectionData('license', { dl_back: file });
      } else if (side === 'profile') {
        setProfilePicture(file);
        // Immediately store the file in the personal section
        updateSectionData('personal', { profile_picture: file });
      }
      console.log(`${side} image selected and stored in ${side === 'profile' ? 'personal' : 'license'} section`);
    } catch (err) {
      console.error('Error selecting file:', err);
      showToast(err.message || 'Failed to select file', 'error');
    }
  };

  const processLicenseImages = async () => {
    if (!frontImage || !backImage) {
      showToast('Please upload both front and back sides of your driving license', 'error');
      return;
    }
    try {
      setLoading(true);
      setOcrLoading(true);
      setErrors({});

      console.log('Processing both license images...');
      const frontResult = await ocrService.processLicenseFile(frontImage);
      if (!frontResult.validation?.isValid) {
        throw new Error(frontResult.validation?.message || 'Invalid front side document');
      }

      let backResult = null;
      let dlNumberMatch = true;

      // Back side is mandatory; process and validate
      console.log('🔄 Processing back image...');
      backResult = await ocrService.processLicenseFile(backImage);
      console.log('🔄 Back image OCR result:', backResult);
      console.log('🔄 Back image raw text:', backResult.raw_extracted_text);
      if (!backResult.validation?.isValid) {
        throw new Error(backResult.validation?.message || 'Invalid back side document');
      } else {
        // Verify DL numbers match between front and back
        const frontDL = frontResult.license_number?.toUpperCase().replace(/\s/g, '');
        const backDL = backResult.license_number?.toUpperCase().replace(/\s/g, '');
        if (frontDL && backDL) {
          dlNumberMatch = frontDL === backDL;
          if (!dlNumberMatch) {
            console.warn('⚠️ DL numbers do not match between front and back sides');
            showToast('Warning: DL numbers on front and back sides do not match', 'warning');
          } else {
            console.log('✅ DL numbers match between front and back sides');
          }
        }
      }

      const combinedData = {
        full_name: frontResult.full_name || backResult?.full_name || '',
        date_of_birth: frontResult.date_of_birth || backResult?.date_of_birth || '',
        address_line1: frontResult.address || backResult?.address || '',
        license_number: frontResult.license_number || backResult?.license_number || '',
        issue_date: frontResult.issue_date || backResult?.issue_date || '', // Add this line
        license_valid_till: frontResult.validity_nt || frontResult.validity_tr || frontResult.expiry_date ||
                            backResult?.validity_nt || backResult?.validity_tr || backResult?.expiry_date || '',
        blood_group: frontResult.blood_group || backResult?.blood_group || '',
        issuing_authority: frontResult.issuing_authority || backResult?.issuing_authority || '',
        raw_front: frontResult.raw_extracted_text || '',
        raw_back: backResult?.raw_extracted_text || '',
        validation: frontResult.validation,
        dl_number_match: dlNumberMatch
      };

      setExtractedData(combinedData);
      
      let validationMessage = 'Valid Indian Driving License detected and processed successfully';
      if (backImage && !dlNumberMatch) {
        validationMessage += ' (Warning: DL numbers do not match)';
      }


      // Update all profile sections with extracted data
      updateSectionData('personal', {
        full_name: combinedData.full_name,
        date_of_birth: combinedData.date_of_birth,
        blood_group: combinedData.blood_group
      });

        updateSectionData('license', {
          license_number: combinedData.license_number,
          license_issue_date: combinedData.issue_date,
          license_valid_till: combinedData.license_valid_till,
          issuing_authority: combinedData.issuing_authority,
          dl_front: frontImage, // Store the uploaded front file
          dl_back: backImage    // Store the uploaded back file
        });
        console.log('🔄 Setting license data with issue_date:', combinedData.issue_date);
        console.log('🔄 Combined data keys:', Object.keys(combinedData));
        console.log('🔄 Combined data issue_date:', combinedData.issue_date);

      // Parse address components
      const addressString = combinedData.address || combinedData.address_line1 || '';
      const addressComponents = parseAddressComponents(addressString);
      
      updateSectionData('address', {
        address_line1: addressString,
        city: addressComponents.city,
        state: addressComponents.state,
        postal_code: addressComponents.postalCode
      });
      console.log('🔄 Setting address data:', addressString);
      console.log('🔄 Parsed address components:', addressComponents);



      showToast('License processed successfully! All details have been auto-filled.', 'success');
      console.log('✅ All license data processed and form autofilled successfully');
    } catch (err) {
      console.error('Error processing license images:', err);
      showToast(err.message || 'Failed to process license images', 'error');
    } finally {
      setLoading(false);
      setOcrLoading(false);
    }
  };

  const handleOcr = async (providedFile) => {
    const file = providedFile || profileSections.license.data.dl_front;
    if (!file) {
      showToast('Please select a front license image first.', 'warning');
      return;
    }

    setOcrLoading(true);
    try {
      // Prefer image uploads for best OCR results
      const result = await ocrService.processLicenseFile(file);

      if (result) {
        const updates = {};
        if (result.license_number) updates.license_number = result.license_number.toUpperCase();
        if (result.issue_date) {
          updates.license_issue_date = result.issue_date;
          console.log('🔄 Mapping issue_date to license_issue_date:', result.issue_date);
        }
        if (result.expiry_date || result.validity_nt || result.validity_tr) {
          updates.license_valid_till = result.expiry_date || result.validity_nt || result.validity_tr;
        }
        // Optionally fill personal data from OCR when empty
        if (!profileSections.personal.data.full_name && result.full_name) {
          updateSectionData('personal', { full_name: result.full_name });
        }
        if (!profileSections.personal.data.date_of_birth && result.date_of_birth) {
          updateSectionData('personal', { date_of_birth: result.date_of_birth });
        }

        if (Object.keys(updates).length > 0) {
          updateSectionData('license', updates);
          showToast('License info extracted successfully!', 'success');
        } else {
          showToast('Could not extract license number. Please enter it manually.', 'error');
        }
      } else {
        showToast('Could not extract license number. Please enter it manually.', 'error');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      showToast(error.message || 'An error occurred during OCR.', 'error');
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
            updateData.dl_front_url = await uploadFileToStorage(section.data.dl_front);
        }
        if (section.data.dl_back && !section.data.dl_back_url) {
            updateData.dl_back_url = await uploadFileToStorage(section.data.dl_back);
        }
      }
      
      // Move profile picture upload to dedicated handler; personal section save won't require it

      // Add section-specific data
      Object.keys(section.data).forEach(key => {
        if (key !== 'dl_front' && key !== 'dl_back') {
            updateData[key] = section.data[key];
        }
      });
      


      // First try to update existing profile
      const { error: updateError } = await supabase
        .from('driver_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      let error = updateError;
      if (updateError) {
        // If update fails (no existing record), create new one
        const { error: insertError } = await supabase
          .from('driver_profiles')
          .insert([{ ...updateData, user_id: user.id }]);
        error = insertError;
      }

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
    // Debug: Log completion status for each section
    console.log('🔍 Checking section completion status:');
    Object.entries(profileSections).forEach(([sectionId, section]) => {
      const isCompleted = isSectionCompleted(sectionId, section.data);
      console.log(`📋 ${sectionId}:`, {
        title: section.title,
        completed: section.completed,
        calculatedCompleted: isCompleted,
        data: section.data,
        missingFields: getMissingFields(sectionId, section.data)
      });
    });

    const incompleteSections = [];
    const missingFieldsDetails = [];
    
    Object.entries(profileSections).forEach(([sectionId, section]) => {
      if (!section.completed) {
        incompleteSections.push(section.title);
        const missingFields = getMissingFields(sectionId, section.data);
        if (missingFields.length > 0) {
          missingFieldsDetails.push(`${section.title}: ${missingFields.join(', ')}`);
        }
      }
    });

    const allCompleted = Object.values(profileSections).every(section => section.completed);
    console.log('✅ All sections completed:', allCompleted);

    if (!allCompleted) {
      let errorMessage = 'Please complete all sections before submitting.';
      if (incompleteSections.length > 0) {
        errorMessage += `\n\nIncomplete sections: ${incompleteSections.join(', ')}`;
      }
      if (missingFieldsDetails.length > 0) {
        errorMessage += `\n\nMissing fields:\n${missingFieldsDetails.join('\n')}`;
      }
      showToast(errorMessage, 'error');
      return;
    }

    try {
      setLoading(true);

      // Upload files to storage if they exist and get URLs
      let dlFrontUrl = profileSections.license.data.dl_front_url;
      let dlBackUrl = profileSections.license.data.dl_back_url;

      if (profileSections.license.data.dl_front && !dlFrontUrl) {
        console.log('📤 Uploading front license image to storage...');
        try {
          dlFrontUrl = await uploadFileToStorage(profileSections.license.data.dl_front);
          console.log('✅ Front image uploaded:', dlFrontUrl);
        } catch (uploadError) {
          console.error('❌ Failed to upload front image:', uploadError);
          showToast('Warning: Front license image could not be uploaded to storage. Profile will be saved without file URLs.', 'warning');
          // Continue without the URL - the file object is still stored
          dlFrontUrl = null;
        }
      }

      if (profileSections.license.data.dl_back && !dlBackUrl) {
        console.log('📤 Uploading back license image to storage...');
        try {
          dlBackUrl = await uploadFileToStorage(profileSections.license.data.dl_back);
          console.log('✅ Back image uploaded:', dlBackUrl);
        } catch (uploadError) {
          console.error('❌ Failed to upload back image:', uploadError);
          showToast('Warning: Back license image could not be uploaded to storage. Profile will be saved without file URLs.', 'warning');
          // Continue without the URL - the file object is still stored
          dlBackUrl = null;
        }
      }

      // Check if profile is actually complete (all sections + files uploaded)
      const isProfileActuallyComplete = Object.entries(profileSections).every(([sectionId, section]) => {
        return isSectionCompleted(sectionId, section.data);
      }) && dlFrontUrl && dlBackUrl; // Ensure files are actually uploaded to storage

      console.log('🔍 Profile completion check:', {
        allSectionsComplete: Object.entries(profileSections).every(([sectionId, section]) => isSectionCompleted(sectionId, section.data)),
        filesUploaded: { dlFrontUrl, dlBackUrl },
        isProfileActuallyComplete
      });

      // Prepare all profile data for database update
      const profileData = {
        // Personal information
        full_name: profileSections.personal.data.full_name,
        date_of_birth: profileSections.personal.data.date_of_birth,
        blood_group: profileSections.personal.data.blood_group,
        
        // License information
        license_number: profileSections.license.data.license_number,
        license_issue_date: profileSections.license.data.license_issue_date,
        license_valid_till: profileSections.license.data.license_valid_till,
        issuing_authority: profileSections.license.data.issuing_authority,
        dl_front_url: dlFrontUrl,
        dl_back_url: dlBackUrl,
        
        // Address information
        address_line1: profileSections.address.data.address_line1,
        address_line2: profileSections.address.data.address_line2,
        city: profileSections.address.data.city,
        state: profileSections.address.data.state,
        postal_code: profileSections.address.data.postal_code,
        
        // Profile completion status - set based on actual completion
        profile_complete: isProfileActuallyComplete,
        updated_at: new Date().toISOString()
      };

      console.log('🔄 Saving profile data:', profileData);

      // Always update the existing profile for this user
      // If no profile exists, create one first
      const { data: existingProfile, error: fetchError } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking existing profile:', fetchError);
        showToast('Failed to check existing profile', 'error');
        return;
      }

      let error;
      if (existingProfile) {
        // Update the most recent existing profile
        console.log('🔄 Updating existing profile:', existingProfile.id);
        const { error: updateError } = await supabase
          .from('driver_profiles')
          .update(profileData)
          .eq('id', existingProfile.id);
        error = updateError;
      } else {
        // Create new profile only if none exists
        console.log('🆕 Creating new profile for user');
        const { error: insertError } = await supabase
          .from('driver_profiles')
          .insert([{ ...profileData, user_id: user.id }]);
        error = insertError;
      }

      if (error) {
        console.error('Error saving profile:', error);
        
        // Handle specific error cases
        if (error.code === '23505') {
          if (error.message.includes('license_number')) {
            showToast('A profile with this license number already exists. Please check your license number.', 'error');
          } else {
            showToast('Profile already exists for this user. Updating existing profile.', 'warning');
            // Try to update the existing profile
            const { error: updateError } = await supabase
              .from('driver_profiles')
              .update(profileData)
              .eq('user_id', user.id);
            
            if (updateError) {
              showToast('Failed to update existing profile', 'error');
              return;
            }
          }
        } else {
          showToast('Failed to save profile data', 'error');
          return;
        }
      }

      showToast('Profile saved successfully!', 'success');
      console.log('✅ Profile data saved to database');

      // Redirect to dashboard after successful submission
      setTimeout(() => {
        navigate('/dashboard/driver');
      }, 1500);

    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Failed to save profile data', 'error');
    } finally {
      setLoading(false);
    }
  };


  const FileUploadField = ({ field, label, error, onFileSelect, file, previewUrl }) => {
    const [internalPreview, setInternalPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const processSelectedFile = (selectedFile) => {
      if (!selectedFile) return;
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
    };

    const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      processSelectedFile(selectedFile);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      processSelectedFile(droppedFile);
    };

    return (
        <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">{label} *</label>
            <div
              className={`border-2 ${isDragging ? 'border-primary/70' : 'border-dashed border-gray-600'} rounded-lg p-4 bg-gray-800/40 transition-colors`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <label htmlFor={field} className="w-full cursor-pointer flex flex-col items-center justify-center py-6">
                <div className="flex flex-row items-center gap-3">
                  {field === 'dl_front' && ocrLoading ? (
                    <Loader2 size={28} className="animate-spin text-primary" />
                  ) : (
                    <Upload size={28} className="text-gray-300" />
                  )}
                  <span className="text-sm text-gray-300">Drag and drop file to upload</span>
                </div>
                <div className="flex flex-row items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">or</span>
                  <span className="enterprise-button-secondary px-4 py-1 text-sm">Browse</span>
                </div>
                <span className="mt-2 text-xs text-gray-500">Supported: JPG, PNG, PDF</span>
                {field === 'dl_front' && (
                  <span className="mt-1 text-[11px] text-gray-400">Image processing recommended for best OCR results</span>
                )}
              </label>
              <input id={field} type="file" className="hidden" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />
              {file && <div className="mt-3 text-gray-400 text-sm truncate">{file.name}</div>}
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            {(internalPreview || previewUrl) && (
              <div className="mt-4">
                {(internalPreview || (previewUrl && previewUrl.match(/\.(jpeg|jpg|png|gif)$/i))) ? (
                  <img src={internalPreview || previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                ) : (
                  <div className="w-32 h-32 bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                    <FileText size={32} className="text-gray-400" />
                    <span className="text-xs text-gray-400 mt-2">PDF Document</span>
                  </div>
                )}
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


    switch (section.id) {
      case 'personal':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">Personal Information</h4>
            {/* Profile Photo & Bio moved to its own card below; keep essentials here */}
            <div className="hidden">
              <label className="block text-gray-300 text-sm font-bold mb-2">Profile Picture *</label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                (profilePicture || section.data.profile_picture_url) ? 'border-green-500/50 bg-green-500/10' : 'border-gray-600'
              }`}>
                {(profilePicture || section.data.profile_picture_url) ? (
                  <div>
                    {section.data.profile_picture_url ? (
                      <div>
                        <img 
                          src={section.data.profile_picture_url} 
                          alt="Profile Picture" 
                          className="mx-auto h-24 w-24 object-cover rounded-full mb-2"
                        />
                        <p className="text-sm text-green-300 font-medium">Profile Picture Uploaded</p>
                        <button
                          onClick={() => {
                            updateSectionData('personal', { profile_picture_url: '' });
                            setProfilePicture(null);
                          }}
                          className="mt-2 text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-2" />
                        <p className="text-sm text-green-300 font-medium">{profilePicture.name}</p>
                        <button
                          onClick={() => setProfilePicture(null)}
                          className="mt-2 text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-primary hover:text-primary/80 font-medium">
                        Click to upload profile picture
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleFileUpload(e.target.files[0], 'profile');
                          }
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
              {errors.profile_picture && <p className="text-red-400 text-xs mt-1">{errors.profile_picture}</p>}
            </div>

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
            </div>
            
            {/* Hidden placeholder (bio handled in separate card) */}
            <div className="hidden mt-4">
              <label className="block text-gray-300 text-sm font-bold mb-2">Bio *</label>
              <textarea
                className={`enterprise-input w-full h-24 resize-none ${errors.bio ? 'border-red-500' : ''}`}
                value={section.data.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself, your driving experience, and what makes you a great driver..."
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && <p className="text-red-400 text-xs">{errors.bio}</p>}
                <p className="text-xs text-gray-500 ml-auto">{(section.data.bio || '').length}/500 characters</p>
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
                    onFileSelect={(field, file) => { updateSectionData('license', { [field]: file }); handleOcr(file); }}
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

  // Render profile card for each section
  const renderProfileCard = (section) => {
    const isEditing = editingSection === section.id;
    
    switch (section.id) {
      case 'personal':
        return (
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-white">Personal Information</h3>
                {section.completed && (
                  <svg className="w-5 h-5 ml-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <button
                onClick={() => setEditingSection(isEditing ? null : section.id)}
                className="enterprise-button-secondary px-3 py-2 text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Profile Picture Display */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                  {section.data.profile_picture_url ? (
                    <img 
                      src={section.data.profile_picture_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300">Profile Picture</p>
                  <p className="text-xs text-gray-500">
                    {section.data.profile_picture_url ? 'Uploaded' : 'Not provided'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={section.data.full_name || ''}
                      onChange={(e) => updateSectionData('personal', { full_name: e.target.value })}
                      className="enterprise-input mt-1 block w-full"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-white">{section.data.full_name || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={section.data.date_of_birth || ''}
                      onChange={(e) => updateSectionData('personal', { date_of_birth: e.target.value })}
                      className="enterprise-input mt-1 block w-full"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-white">{section.data.date_of_birth || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Blood Group</label>
                  {isEditing ? (
                    <select
                      value={section.data.blood_group || ''}
                      onChange={(e) => updateSectionData('personal', { blood_group: e.target.value })}
                      className="enterprise-input mt-1 block w-full"
                    >
                      <option value="">Select blood group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-white">{section.data.blood_group || 'Not provided'}</p>
                  )}
                </div>
              </div>
              
              {/* Bio Display */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Bio</label>
                {isEditing ? (
                  <textarea
                    value={section.data.bio || ''}
                    onChange={(e) => updateSectionData('personal', { bio: e.target.value })}
                    className="enterprise-input mt-1 block w-full h-24 resize-none"
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-white">
                    {section.data.bio || 'Not provided'}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'license':
        return (
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-white">License Details</h3>
                {section.completed && (
                  <svg className="w-5 h-5 ml-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <button
                onClick={() => setEditingSection(isEditing ? null : section.id)}
                className="enterprise-button-secondary px-3 py-2 text-sm"
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
                  <label className="block text-sm font-medium text-gray-300">License Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={section.data.license_number || ''}
                      onChange={(e) => updateSectionData('license', { license_number: e.target.value })}
                      className="enterprise-input mt-1 block w-full"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-white">{section.data.license_number || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Issue Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={section.data.license_issue_date || ''}
                      onChange={(e) => updateSectionData('license', { license_issue_date: e.target.value })}
                      className="enterprise-input mt-1 block w-full"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-white">{section.data.license_issue_date || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Valid Till</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={section.data.license_valid_till || ''}
                      onChange={(e) => updateSectionData('license', { license_valid_till: e.target.value })}
                      className="enterprise-input mt-1 block w-full"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-white">{section.data.license_valid_till || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Issuing Authority</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={section.data.issuing_authority || ''}
                      onChange={(e) => updateSectionData('license', { issuing_authority: e.target.value })}
                      className="enterprise-input mt-1 block w-full"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-white">{section.data.issuing_authority || extractedData?.issuing_authority || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );


      case 'address':
        return (
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-white">Address</h3>
                {section.completed && (
                  <svg className="w-5 h-5 ml-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <button
                onClick={() => setEditingSection(isEditing ? null : section.id)}
                className="enterprise-button-secondary px-3 py-2 text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Address Line 1</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={section.data.address_line1 || ''}
                    onChange={(e) => updateSectionData('address', { address_line1: e.target.value })}
                    className="enterprise-input mt-1 block w-full"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-white">{section.data.address_line1 || 'Not provided'}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={section.data.city || ''}
                      onChange={(e) => updateSectionData('address', { city: e.target.value })}
                      className="enterprise-input mt-1 block w-full"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-white">{section.data.city || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">State</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={section.data.state || ''}
                      onChange={(e) => updateSectionData('address', { state: e.target.value })}
                      className="enterprise-input mt-1 block w-full"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-white">{section.data.state || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Postal Code</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={section.data.postal_code || ''}
                      onChange={(e) => updateSectionData('address', { postal_code: e.target.value })}
                      className="enterprise-input mt-1 block w-full"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-white">{section.data.postal_code || 'Not provided'}</p>
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

  return (
    <DashboardLayout title="Driver Profile" sidebarItems={driverSidebarItems}>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="mt-2 text-sm text-gray-400">
            Complete your driver profile to start receiving job offers
          </p>
        </div>

        {/* License Upload Section - Always Visible */}
        <div className="mb-8">
          <div className="enterprise-card p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-white mb-2">
                📄 Upload Your Driving License
                      </h3>
              <p className="text-sm text-gray-400">
                Upload both front and back sides of your Indian Driving License. 
                We'll automatically extract and fill your details across all sections.
                      </p>
                    </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Front Side (Required) *
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  (frontImage || profileSections.license.data.dl_front_url) ? 'border-green-500/50 bg-green-500/10' : 'border-gray-600'
                }`}>
                  {(frontImage || profileSections.license.data.dl_front_url) ? (
                    <div>
                      {profileSections.license.data.dl_front_url ? (
                        <div>
                          <img 
                            src={profileSections.license.data.dl_front_url} 
                            alt="Front License" 
                            className="mx-auto h-24 w-32 object-cover rounded-lg mb-2"
                          />
                          <p className="text-sm text-green-300 font-medium">Front License Uploaded</p>
                          <button
                            onClick={() => {
                              updateSectionData('license', { dl_front_url: '' });
                              setFrontImage(null);
                            }}
                            className="mt-2 text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-2" />
                          <p className="text-sm text-green-300 font-medium">{frontImage.name}</p>
                          <button
                            onClick={() => setFrontImage(null)}
                            className="mt-2 text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-primary hover:text-primary/80 font-medium">
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Back Side (Required) *
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  (backImage || profileSections.license.data.dl_back_url) ? 'border-green-500/50 bg-green-500/10' : 'border-gray-600'
                }`}>
                  {(backImage || profileSections.license.data.dl_back_url) ? (
                    <div>
                      {profileSections.license.data.dl_back_url ? (
                        <div>
                          <img 
                            src={profileSections.license.data.dl_back_url} 
                            alt="Back License" 
                            className="mx-auto h-24 w-32 object-cover rounded-lg mb-2"
                          />
                          <p className="text-sm text-green-300 font-medium">Back License Uploaded</p>
                          <button
                            onClick={() => {
                              updateSectionData('license', { dl_back_url: '' });
                              setBackImage(null);
                            }}
                            className="mt-2 text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-2" />
                          <p className="text-sm text-green-300 font-medium">{backImage.name}</p>
                          <button
                            onClick={() => setBackImage(null)}
                            className="mt-2 text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-primary hover:text-primary/80 font-medium">
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
                disabled={!frontImage || !backImage || ocrLoading}
                className={`px-8 py-3 rounded-md font-medium ${
                  !frontImage || !backImage || ocrLoading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'enterprise-button'
                }`}
              >
                {ocrLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing License...
                  </div>
                ) : (
                  'Submit Driving License'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Cards */}
        <div className="space-y-6">
          {/* Profile Photo & Bio - Separate Card (moved to top) */}
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Profile Photo & Bio</h3>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const updates = { updated_at: new Date().toISOString() };
                    
                    // Upload to profile-pictures bucket
                    if (profileSections.personal.data.profile_picture && !profileSections.personal.data.profile_picture_url) {
                      const url = await uploadFileToStorage(profileSections.personal.data.profile_picture, 'profile-pictures');
                      updates.profile_picture_url = url;
                      updateSectionData('personal', { profile_picture_url: url });
                    }
                    updates.bio = profileSections.personal.data.bio || null;
                    
                    // First try to update existing profile
                    const { error: updateError } = await supabase
                      .from('driver_profiles')
                      .update(updates)
                      .eq('user_id', user.id);
                    
                    if (updateError) {
                      // If update fails (no existing record), create new one
                      const { error: insertError } = await supabase
                        .from('driver_profiles')
                        .insert([{ ...updates, user_id: user.id }]);
                      
                      if (insertError) throw insertError;
                    }
                    
                    showToast('Profile photo and bio saved!', 'success');
                    fetchProfile();
                  } catch (e) {
                    console.error(e);
                    showToast('Failed to save profile photo/bio', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="enterprise-button-secondary px-3 py-2 text-sm"
              >
                Save
              </button>
            </div>
            <div className="flex items-start gap-6">
              <div className="relative w-24 h-24">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                  {profileSections.personal.data.profile_picture_url ? (
                    <img src={profileSections.personal.data.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-primary text-black rounded-full p-2 cursor-pointer shadow-md">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], 'profile');
                      }
                    }}
                  />
                </label>
              </div>
              <div className="flex-1">
                <label className="block text-gray-300 text-sm font-bold mb-2">Bio</label>
                <textarea
                  className="enterprise-input w-full h-24 resize-none"
                  value={profileSections.personal.data.bio || ''}
                  onChange={(e) => updateSectionData('personal', { bio: e.target.value })}
                  placeholder="Tell us about yourself, your driving experience, etc."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{(profileSections.personal.data.bio || '').length}/500 characters</p>
              </div>
            </div>
          </div>

          {Object.values(profileSections).map((section) => (
            <div key={section.id}>
              {renderProfileCard(section)}
            </div>
          ))}
        </div>

        {/* Complete Profile Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleFinalSubmit}
            disabled={loading}
            className="enterprise-button px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DriverProfilePage;
