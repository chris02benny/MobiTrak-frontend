import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for vehicle form validation with real-time validation
 * Provides validation functions, error states, and form validity checking
 */
export const useVehicleValidation = (carMakes = []) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation patterns
  const validationPatterns = {
    registrationNumber: /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/,
    chassisNumber: /^[A-Z0-9]{10,20}$/,
    ownerName: /^[A-Za-z\s]{3,}$/
  };

  // Vehicle classes
  const vehicleClasses = ['LMV', 'HMV', 'MCWG', 'MCWOG'];

  // File validation functions
  const validateImageFile = useCallback((file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG and PNG files are allowed';
    }
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }
    return '';
  }, []);

  const validateRcBookFile = useCallback((file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF, JPG, and PNG files are allowed';
    }
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    return '';
  }, []);

  // Field validation function
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
        
      case 'vehicle_class':
        if (!value) return 'Vehicle class is required';
        if (!vehicleClasses.includes(value)) {
          return 'Please select a valid vehicle class';
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
  }, [carMakes, vehicleClasses, validationPatterns]);

  // Validate single field and update errors
  const validateSingleField = useCallback((name, value) => {
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    return error;
  }, [validateField]);

  // Mark field as touched
  const markFieldTouched = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  // Validate all fields
  const validateAllFields = useCallback((formData) => {
    const requiredFields = ['make', 'model', 'year', 'vehicle_class', 'registration_number', 'chassis_number', 'owner_name'];
    const newErrors = {};
    const newTouched = {};

    requiredFields.forEach(field => {
      newTouched[field] = true;
      newErrors[field] = validateField(field, formData[field] || '');
    });

    setTouched(newTouched);
    setErrors(newErrors);

    return requiredFields.every(field => !newErrors[field]);
  }, [validateField]);

  // Check if form is valid
  const isFormValid = useCallback((formData) => {
    const requiredFields = ['make', 'model', 'year', 'vehicle_class', 'registration_number', 'chassis_number', 'owner_name'];
    
    // Check if all required fields are filled and have no errors
    const allFieldsFilled = requiredFields.every(field => formData[field]?.toString().trim());
    const noErrors = requiredFields.every(field => !errors[field]);
    const noFileErrors = !errors.vehicle_image && !errors.rc_book;
    
    return allFieldsFilled && noErrors && noFileErrors;
  }, [errors]);

  // Reset validation state
  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  // Set file validation error
  const setFileError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  // Clear file validation error
  const clearFileError = useCallback((fieldName) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  }, []);

  // Get validation summary
  const getValidationSummary = useMemo(() => {
    const errorFields = Object.keys(errors).filter(key => errors[key]);
    const touchedFields = Object.keys(touched);
    
    return {
      hasErrors: errorFields.length > 0,
      errorCount: errorFields.length,
      touchedCount: touchedFields.length,
      errorFields,
      touchedFields
    };
  }, [errors, touched]);

  return {
    errors,
    touched,
    validateField,
    validateSingleField,
    markFieldTouched,
    validateAllFields,
    isFormValid,
    resetValidation,
    validateImageFile,
    validateRcBookFile,
    setFileError,
    clearFileError,
    getValidationSummary,
    validationPatterns,
    vehicleClasses
  };
};

export default useVehicleValidation;
