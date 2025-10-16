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
  const [showRcReuploadModal, setShowRcReuploadModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [rcReuploadVehicle, setRcReuploadVehicle] = useState(null);
  
  // Card expansion states
  const [expandedCards, setExpandedCards] = useState(new Set());
  
  // Form data states (RC OCR fields)
  const [formData, setFormData] = useState({
    registered_number: '',
    maker_name: '',
    owner_name: '',
    class_of_vehicle: '',
    fuel_type: '',
    seating_capacity: '',
    tax_license_no: '',
    tax_paid_from: '',
    tax_paid_to: '',
    date_of_registration: '',
    fitness_valid_from: '',
    fitness_valid_to: '',
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
    // Primary strict Indian RC format; fallback loose matcher added in OCR parser
    registeredNumber: /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/,
    ownerName: /^[A-Za-z\s]{3,}$/,
    date: /^(0?[1-9]|[12][0-9]|3[01])[\/.-](0?[1-9]|1[012])[\/.-](\d{4})$/
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
        .select(`
          *,
          vehicle_images (
            id,
            image_url,
            image_order
          )
        `)
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

  // Validation functions (updated for OCR fields)
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'registered_number':
        if (!value.trim()) return 'Registration number is required';
        if (!validationPatterns.registeredNumber.test(value.toUpperCase())) {
          return 'Invalid format. Example: KA01AB1234';
        }
        return '';

      case 'maker_name':
        if (!value.trim()) return 'Maker/Manufacturer is required';
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
  }, []);

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
    const maxSize = 1 * 1024 * 1024; // 1MB

    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF, JPG, and PNG files are allowed';
    }
    if (file.size > maxSize) {
      return 'File size must be less than 1MB';
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

  const [ocrLoading, setOcrLoading] = useState(false);

  // OCR call to ocr.space
  const ocrExtractRc = async (file) => {
    setOcrLoading(true);
    try {
      // Only attempt OCR for image files; PDFs often need conversion
      if (!/^image\//.test(file.type)) {
        throw new Error('Please upload an image (JPEG/PNG) for OCR');
      }
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          const b64 = typeof result === 'string' ? result.split(',')[1] : '';
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Try backend first
      const apiBase = import.meta.env.VITE_API_BASE;
      if (apiBase) {
        try {
          const res = await fetch(`${apiBase}/api/ocr/rc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64, fileType: file.type })
          });
          const json = await res.json();
          if (res.ok && json?.data) return json.data;
          throw new Error(json?.error || 'Backend OCR failed');
        } catch (e) {
          // fall through to direct OpenRouter if configured
        }
      }

      // Fallback: call OpenRouter directly from frontend if key provided
      const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!openrouterKey) {
        throw new Error('Set VITE_OPENROUTER_API_KEY in mobitrak-app/.env to enable OCR without backend.');
      }
      const payload = {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: [{ type: 'text', text: 'You are an OCR parser. Extract the following fields from this Indian vehicle RC scan and return ONLY compact JSON with these exact keys: registered_number, maker_name, owner_name, class_of_vehicle, fuel_type, seating_capacity, tax_license_no, tax_paid_from, tax_paid_to, date_of_registration, fitness_valid_from, fitness_valid_to. Dates should be DD/MM/YYYY when present; if a field is missing, use an empty string.' }] },
          { role: 'user', content: [
            { type: 'text', text: 'Parse this RC image and return only the JSON.' },
            { type: 'image_url', image_url: `data:${file.type};base64,${base64}` }
          ]}
        ],
        temperature: 0
      };
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'mobiTrak RC OCR'
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error?.message || 'OpenRouter OCR failed');
      const content = data?.choices?.[0]?.message?.content;
      const textOut = Array.isArray(content) ? content.map(p => p.text).join('\n') : (typeof content === 'string' ? content : '');
      try {
        return JSON.parse(textOut);
      } catch {
        const m = textOut.match(/\{[\s\S]*\}/);
        if (m) return JSON.parse(m[0]);
        throw new Error('Failed to parse OCR JSON');
      }
    } finally {
      setOcrLoading(false);
    }
  };

  const parseDate = (str) => {
    if (!str) return '';
    const m = str.match(validationPatterns.date);
    if (!m) return '';
    const [, dd, mm, yyyy] = m;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(dd)}/${pad(mm)}/${yyyy}`;
  };

  const parseRcText = (text) => {
    const get = (regexes) => {
      for (const r of regexes) {
        const m = text.match(r);
        if (m && m[1]) return m[1].trim();
      }
      return '';
    };
    let registered_number = get([
      /Reg(?:istration)?\s*No\.?\s*[:\-]?\s*([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})/i,
      /Regn\.?\s*No\.?\s*[:\-]?\s*([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})/i,
    ]);
    if (!registered_number) {
      const loose = text.match(/([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})/i);
      registered_number = loose?.[1] || '';
    }
    const maker_name = get([
      /Maker\/?Manufacturer\s*[:\-]?\s*([A-Za-z0-9 ,.()\-\/&]+)/i,
      /Make\s*[:\-]?\s*([A-Za-z0-9 ,.()\-\/&]+)/i,
    ]);
    const owner_name = get([
      /Owner\s*Name\s*[:\-]?\s*([A-Za-z ]{3,})/i,
      /Name\s*of\s*Owner\s*[:\-]?\s*([A-Za-z ]{3,})/i,
    ]);
    const class_of_vehicle = get([
      /Class\s*of\s*Vehicle\s*[:\-]?\s*([A-Za-z0-9 .\-\/]+)/i,
    ]);
    const fuel_type = get([
      /Fuel\s*[:\-]?\s*([A-Za-z ]+)/i,
      /Fuel\s*Type\s*[:\-]?\s*([A-Za-z ]+)/i,
    ]);
    const seating_capacity = get([
      /Seating\s*Capacity\s*[:\-]?\s*(\d{1,3})/i,
      /Seats\s*[:\-]?\s*(\d{1,3})/i,
    ]);
    const tax_license_no = get([
      /Tax\s*Licen[cs]e\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)/i,
    ]);
    const tax_paid_from = parseDate(get([
      /Tax\s*Paid\s*From\s*[:\-]?\s*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{4})/i,
    ]));
    const tax_paid_to = parseDate(get([
      /Tax\s*Paid\s*To\s*[:\-]?\s*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{4})/i,
    ]));
    const date_of_registration = parseDate(get([
      /Date\s*of\s*Registration\s*[:\-]?\s*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{4})/i,
      /Dt\.?\s*of\s*Regn\.?\s*[:\-]?\s*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{4})/i,
    ]));
    const fitness_valid_from = parseDate(get([
      /Fitness\s*Valid\s*From\s*[:\-]?\s*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{4})/i,
    ]));
    const fitness_valid_to = parseDate(get([
      /Fitness\s*Valid\s*To\s*[:\-]?\s*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{4})/i,
    ]));

    return {
      registered_number,
      maker_name,
      owner_name,
      class_of_vehicle,
      fuel_type,
      seating_capacity,
      tax_license_no,
      tax_paid_from,
      tax_paid_to,
      date_of_registration,
      fitness_valid_from,
      fitness_valid_to
    };
  };

  // Process RC book file
  const processRcBookFile = async (file) => {
    const error = validateRcBookFile(file);
    if (error) {
      showToast(error, 'error');
      return;
    }
    setRcBook(file);
    // Create preview URL for PDF
    const previewUrl = URL.createObjectURL(file);
    setRcBookPreview(previewUrl);
    try {
      const maybeData = await ocrExtractRc(file);
      const extracted = typeof maybeData === 'string' ? parseRcText(maybeData) : maybeData;
      setFormData(prev => ({
        ...prev,
        ...extracted,
        registered_number: (extracted.registered_number || '').toUpperCase()
      }));
      showToast('RC details extracted. Please verify and save.', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to extract RC details', 'error');
    }
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

      // Normalize fuel type to satisfy DB check constraint
      const allowedFuelTypes = ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'];
      const normalizeFuelType = (raw) => {
        if (!raw) return null;
        const v = String(raw).toLowerCase().trim();
        // common variants mapping
        const map = {
          petrol: 'petrol',
          gasoline: 'petrol',
          gas: 'petrol',
          diesel: 'diesel',
          ev: 'electric',
          electric: 'electric',
          electricity: 'electric',
          hybrid: 'hybrid',
          cng: 'cng',
          'compressed natural gas': 'cng',
          lpg: 'lpg',
          'liquefied petroleum gas': 'lpg'
        };
        const mapped = map[v] || v;
        return allowedFuelTypes.includes(mapped) ? mapped : null;
      };

      const normalizedFuel = normalizeFuelType(formData.fuel_type);

      // Insert vehicle data into Supabase (new OCR fields)
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .insert({
          registered_number: formData.registered_number,
          maker_name: formData.maker_name,
          owner_name: formData.owner_name,
          class_of_vehicle: formData.class_of_vehicle || null,
          fuel_type: normalizedFuel,
          seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null,
          tax_license_no: formData.tax_license_no || null,
          tax_paid_from: formData.tax_paid_from || null,
          tax_paid_to: formData.tax_paid_to || null,
          date_of_registration: formData.date_of_registration || null,
          fitness_valid_from: formData.fitness_valid_from || null,
          fitness_valid_to: formData.fitness_valid_to || null,
          status: formData.status,
          business_id: user.id,
          vehicle_image_url: vehicleImageUrls.length > 0 ? vehicleImageUrls[0] : null,
          rc_book_url: rcBookUrl
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

  // Reset form to OCR fields
  const resetForm = () => {
    setFormData({
      registered_number: '',
      maker_name: '',
      owner_name: '',
      class_of_vehicle: '',
      fuel_type: '',
      seating_capacity: '',
      tax_license_no: '',
      tax_paid_from: '',
      tax_paid_to: '',
      date_of_registration: '',
      fitness_valid_from: '',
      fitness_valid_to: '',
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

  // Toggle card expansion
  const toggleCardExpansion = (vehicleId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  // Open RC reupload modal
  const openRcReuploadModal = (vehicle) => {
    setRcReuploadVehicle(vehicle);
    setFormData({
      registered_number: vehicle.registered_number || '',
      maker_name: vehicle.maker_name || '',
      owner_name: vehicle.owner_name || '',
      class_of_vehicle: vehicle.class_of_vehicle || '',
      fuel_type: vehicle.fuel_type || '',
      seating_capacity: vehicle.seating_capacity || '',
      tax_license_no: vehicle.tax_license_no || '',
      tax_paid_from: vehicle.tax_paid_from || '',
      tax_paid_to: vehicle.tax_paid_to || '',
      date_of_registration: vehicle.date_of_registration || '',
      fitness_valid_from: vehicle.fitness_valid_from || '',
      fitness_valid_to: vehicle.fitness_valid_to || '',
      status: vehicle.status || 'available'
    });
    setShowRcReuploadModal(true);
  };

  // Handle RC reupload
  const handleRcReupload = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload new RC book to Supabase storage
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

      // Normalize fuel type to satisfy DB check constraint
      const allowedFuelTypes = ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'];
      const normalizeFuelType = (raw) => {
        if (!raw) return null;
        const v = String(raw).toLowerCase().trim();
        const map = {
          petrol: 'petrol',
          gasoline: 'petrol',
          gas: 'petrol',
          diesel: 'diesel',
          ev: 'electric',
          electric: 'electric',
          electricity: 'electric',
          hybrid: 'hybrid',
          cng: 'cng',
          'compressed natural gas': 'cng',
          lpg: 'lpg',
          'liquefied petroleum gas': 'lpg'
        };
        const mapped = map[v] || v;
        return allowedFuelTypes.includes(mapped) ? mapped : null;
      };

      const normalizedFuel = normalizeFuelType(formData.fuel_type);

      // Update vehicle data in Supabase
      const { error } = await supabase
        .from('vehicles')
        .update({
          registered_number: formData.registered_number,
          maker_name: formData.maker_name,
          owner_name: formData.owner_name,
          class_of_vehicle: formData.class_of_vehicle || null,
          fuel_type: normalizedFuel,
          seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null,
          tax_license_no: formData.tax_license_no || null,
          tax_paid_from: formData.tax_paid_from || null,
          tax_paid_to: formData.tax_paid_to || null,
          date_of_registration: formData.date_of_registration || null,
          fitness_valid_from: formData.fitness_valid_from || null,
          fitness_valid_to: formData.fitness_valid_to || null,
          rc_book_url: rcBookUrl || rcReuploadVehicle.rc_book_url
        })
        .eq('id', rcReuploadVehicle.id)
        .eq('business_id', user.id);

      if (error) throw error;

      showToast('Vehicle details updated successfully!', 'success');
      setShowRcReuploadModal(false);
      setRcReuploadVehicle(null);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      showToast('Error updating vehicle details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesLabel = !filterLabel || vehicle.label_id === filterLabel;
    const matchesStatus = !filterStatus || vehicle.status === filterStatus;
    const matchesSearch = !searchTerm || 
      (vehicle.maker_name && vehicle.maker_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.manufacturer && vehicle.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.registered_number && vehicle.registered_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.registration_number && vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
    const requiredFields = ['registered_number', 'maker_name', 'owner_name'];
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
      <div className="space-y-4">
        <AnimatePresence>
          {filteredVehicles.map((vehicle) => {
            const isExpanded = expandedCards.has(vehicle.id);
            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardCard className="p-4 hover:bg-white/15 transition-all duration-300 group cursor-pointer" onClick={() => toggleCardExpansion(vehicle.id)}>
                  {/* Simplified View */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Vehicle Image */}
                      <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 ? (
                          <img
                            src={vehicle.vehicle_images[0].image_url}
                            alt={`${vehicle.maker_name || vehicle.manufacturer} ${vehicle.model}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : vehicle.vehicle_image_url ? (
                          <img
                            src={vehicle.vehicle_image_url}
                            alt={`${vehicle.maker_name || vehicle.manufacturer} ${vehicle.model}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Car className="w-8 h-8 text-gray-500" />
                        )}
                      </div>

                      {/* Basic Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors truncate">
                          {vehicle.maker_name || vehicle.manufacturer} {vehicle.model}
                        </h3>
                        <p className="text-gray-400 text-sm truncate">
                          {vehicle.registered_number || vehicle.registration_number || 'No registration'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(vehicle.status)}`}>
                            {getStatusLabel(vehicle.status)}
                          </span>
                          {vehicle.fuel_type && (
                            <span className="text-xs text-gray-400">
                              {vehicle.fuel_type.charAt(0).toUpperCase() + vehicle.fuel_type.slice(1)}
                            </span>
                          )}
                          {vehicle.seating_capacity && (
                            <span className="text-xs text-gray-400">
                              {vehicle.seating_capacity} seats
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* RC Reupload Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openRcReuploadModal(vehicle);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/80 text-black rounded-full transition-colors duration-200"
                        title="Reupload RC"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">Reupload RC</span>
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(vehicle);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200"
                        title="Delete vehicle"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-sm font-medium">Delete</span>
                      </button>

                      {/* Expand/Collapse Icon */}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-2"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>

                  {/* Detailed View - Expandable */}
                  <motion.div
                    initial={false}
                    animate={{ 
                      height: isExpanded ? "auto" : 0,
                      opacity: isExpanded ? 1 : 0
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Vehicle Images */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-white">Vehicle Images</h4>
                          {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {vehicle.vehicle_images
                                .sort((a, b) => a.image_order - b.image_order)
                                .map((img, index) => (
                                <div key={img.id} className="relative">
                                  <img
                                    src={img.image_url}
                                    alt={`${vehicle.maker_name || vehicle.manufacturer} ${vehicle.model} - Image ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-600"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : vehicle.vehicle_image_url ? (
                            <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                              <img
                                src={vehicle.vehicle_image_url}
                                alt={`${vehicle.maker_name || vehicle.manufacturer} ${vehicle.model}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Right Column - Vehicle Details */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-white">Vehicle Details</h4>
                          <div className="space-y-3">
                            {/* Registered Number */}
                            <div>
                              <label className="text-sm font-medium text-gray-400">Registered Number</label>
                              <p className="text-lg font-semibold text-white">
                                {vehicle.registered_number || vehicle.registration_number || 'N/A'}
                              </p>
                            </div>

                            {/* Fuel Type */}
                            <div>
                              <label className="text-sm font-medium text-gray-400">Fuel Type</label>
                              <p className="text-lg text-white">
                                {vehicle.fuel_type ? vehicle.fuel_type.charAt(0).toUpperCase() + vehicle.fuel_type.slice(1) : 'N/A'}
                              </p>
                            </div>

                            {/* Seating Capacity */}
                            <div>
                              <label className="text-sm font-medium text-gray-400">Seating Capacity</label>
                              <p className="text-lg text-white">
                                {vehicle.seating_capacity ? `${vehicle.seating_capacity} seats` : 'N/A'}
                              </p>
                            </div>

                            {/* Additional Details */}
                            {vehicle.owner_name && (
                              <div>
                                <label className="text-sm font-medium text-gray-400">Owner Name</label>
                                <p className="text-lg text-white">{vehicle.owner_name}</p>
                              </div>
                            )}

                            {vehicle.class_of_vehicle && (
                              <div>
                                <label className="text-sm font-medium text-gray-400">Vehicle Class</label>
                                <p className="text-lg text-white">{vehicle.class_of_vehicle}</p>
                              </div>
                            )}

                            {vehicle.date_of_registration && (
                              <div>
                                <label className="text-sm font-medium text-gray-400">Registration Date</label>
                                <p className="text-lg text-white">{vehicle.date_of_registration}</p>
                              </div>
                            )}

                            {vehicle.tax_license_no && (
                              <div>
                                <label className="text-sm font-medium text-gray-400">Tax License No</label>
                                <p className="text-lg text-white">{vehicle.tax_license_no}</p>
                              </div>
                            )}

                            {vehicle.fitness_valid_to && (
                              <div>
                                <label className="text-sm font-medium text-gray-400">Fitness Valid To</label>
                                <p className="text-lg text-white">{vehicle.fitness_valid_to}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </DashboardCard>
              </motion.div>
            );
          })}
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
        maxWidth="max-w-5xl"
        maxHeight="max-h-[90vh]"
        disabled={!isFormValid}
        message={
          <div className="space-y-2">
            {/* OCR Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="registered_number" className="block text-sm font-medium text-gray-300 mb-1">Registered Number *</label>
                <input type="text" id="registered_number" name="registered_number" value={formData.registered_number} onChange={handleInputChange} onInput={(e)=>{e.target.value=e.target.value.toUpperCase();}} className={`enterprise-input w-full ${touched.registered_number && errors.registered_number ? 'border-red-500':''}`} placeholder="e.g., KL05AK1233" required />
                <ErrorMessage error={touched.registered_number ? errors.registered_number : ''} />
              </div>
              <div>
                <label htmlFor="maker_name" className="block text-sm font-medium text-gray-300 mb-1">Maker/Manufacturer *</label>
                <input type="text" id="maker_name" name="maker_name" value={formData.maker_name} onChange={handleInputChange} className={`enterprise-input w-full ${touched.maker_name && errors.maker_name ? 'border-red-500':''}`} placeholder="e.g., Ashok Leyland Ltd" required />
                <ErrorMessage error={touched.maker_name ? errors.maker_name : ''} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="owner_name" className="block text-sm font-medium text-gray-300 mb-1">Owner Name *</label>
                <input type="text" id="owner_name" name="owner_name" value={formData.owner_name} onChange={handleInputChange} className={`enterprise-input w-full ${touched.owner_name && errors.owner_name ? 'border-red-500':''}`} placeholder="e.g., Thomas Thomas" required />
                <ErrorMessage error={touched.owner_name ? errors.owner_name : ''} />
              </div>
              <div>
                <label htmlFor="class_of_vehicle" className="block text-sm font-medium text-gray-300 mb-1">Class of Vehicle</label>
                <input type="text" id="class_of_vehicle" name="class_of_vehicle" value={formData.class_of_vehicle} onChange={handleInputChange} className="enterprise-input w-full" placeholder="e.g., HMPV-Cong. Carrg" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-300 mb-1">Fuel Type</label>
                <input type="text" id="fuel_type" name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} className="enterprise-input w-full" placeholder="e.g., Diesel" />
              </div>
              <div>
                <label htmlFor="seating_capacity" className="block text-sm font-medium text-gray-300 mb-1">Seating Capacity</label>
                <input type="number" id="seating_capacity" name="seating_capacity" value={formData.seating_capacity} onChange={handleInputChange} className="enterprise-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="e.g., 50" />
              </div>
              <div>
                <label htmlFor="tax_license_no" className="block text-sm font-medium text-gray-300 mb-1">Tax License No</label>
                <input type="text" id="tax_license_no" name="tax_license_no" value={formData.tax_license_no} onChange={handleInputChange} className="enterprise-input w-full" placeholder="e.g., 222/490474/2019" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="tax_paid_from" className="block text-sm font-medium text-gray-300 mb-1">Tax Paid From</label>
                <input type="text" id="tax_paid_from" name="tax_paid_from" value={formData.tax_paid_from} onChange={handleInputChange} className="enterprise-input w-full" placeholder="DD/MM/YYYY" />
              </div>
              <div>
                <label htmlFor="tax_paid_to" className="block text-sm font-medium text-gray-300 mb-1">Tax Paid To</label>
                <input type="text" id="tax_paid_to" name="tax_paid_to" value={formData.tax_paid_to} onChange={handleInputChange} className="enterprise-input w-full" placeholder="DD/MM/YYYY" />
              </div>
              <div>
                <label htmlFor="date_of_registration" className="block text-sm font-medium text-gray-300 mb-1">Date of Registration</label>
                <input type="text" id="date_of_registration" name="date_of_registration" value={formData.date_of_registration} onChange={handleInputChange} className="enterprise-input w-full" placeholder="DD/MM/YYYY" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="fitness_valid_from" className="block text-sm font-medium text-gray-300 mb-1">Fitness Valid From</label>
                <input type="text" id="fitness_valid_from" name="fitness_valid_from" value={formData.fitness_valid_from} onChange={handleInputChange} className="enterprise-input w-full" placeholder="DD/MM/YYYY" />
              </div>
              <div>
                <label htmlFor="fitness_valid_to" className="block text-sm font-medium text-gray-300 mb-1">Fitness Valid To</label>
                <input type="text" id="fitness_valid_to" name="fitness_valid_to" value={formData.fitness_valid_to} onChange={handleInputChange} className="enterprise-input w-full" placeholder="DD/MM/YYYY" />
              </div>
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
                PDF, JPG, or PNG files under 1MB (OCR applied automatically)
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


      {/* RC Reupload Modal */}
      <ConfirmationModal
        isOpen={showRcReuploadModal}
        onClose={() => {
          setShowRcReuploadModal(false);
          setRcReuploadVehicle(null);
          resetForm();
        }}
        onConfirm={handleRcReupload}
        title="Update Vehicle Details"
        maxWidth="max-w-5xl"
        maxHeight="max-h-[90vh]"
        disabled={!isFormValid}
        message={
          <div className="space-y-2">
            {/* OCR Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="rc-registered_number" className="block text-sm font-medium text-gray-300 mb-1">Registered Number *</label>
                <input type="text" id="rc-registered_number" name="registered_number" value={formData.registered_number} onChange={handleInputChange} onInput={(e)=>{e.target.value=e.target.value.toUpperCase();}} className={`enterprise-input w-full ${touched.registered_number && errors.registered_number ? 'border-red-500':''}`} placeholder="e.g., KL05AK1233" required />
                <ErrorMessage error={touched.registered_number ? errors.registered_number : ''} />
              </div>
              <div>
                <label htmlFor="rc-maker_name" className="block text-sm font-medium text-gray-300 mb-1">Maker/Manufacturer *</label>
                <input type="text" id="rc-maker_name" name="maker_name" value={formData.maker_name} onChange={handleInputChange} className={`enterprise-input w-full ${touched.maker_name && errors.maker_name ? 'border-red-500':''}`} placeholder="e.g., Ashok Leyland Ltd" required />
                <ErrorMessage error={touched.maker_name ? errors.maker_name : ''} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="rc-owner_name" className="block text-sm font-medium text-gray-300 mb-1">Owner Name *</label>
                <input type="text" id="rc-owner_name" name="owner_name" value={formData.owner_name} onChange={handleInputChange} className={`enterprise-input w-full ${touched.owner_name && errors.owner_name ? 'border-red-500':''}`} placeholder="e.g., Thomas Thomas" required />
                <ErrorMessage error={touched.owner_name ? errors.owner_name : ''} />
              </div>
              <div>
                <label htmlFor="rc-class_of_vehicle" className="block text-sm font-medium text-gray-300 mb-1">Class of Vehicle</label>
                <input type="text" id="rc-class_of_vehicle" name="class_of_vehicle" value={formData.class_of_vehicle} onChange={handleInputChange} className="enterprise-input w-full" placeholder="e.g., HMPV-Cong. Carrg" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="rc-fuel_type" className="block text-sm font-medium text-gray-300 mb-1">Fuel Type</label>
                <input type="text" id="rc-fuel_type" name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} className="enterprise-input w-full" placeholder="e.g., Diesel" />
              </div>
              <div>
                <label htmlFor="rc-seating_capacity" className="block text-sm font-medium text-gray-300 mb-1">Seating Capacity</label>
                <input type="number" id="rc-seating_capacity" name="seating_capacity" value={formData.seating_capacity} onChange={handleInputChange} className="enterprise-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="e.g., 50" />
              </div>
              <div>
                <label htmlFor="rc-tax_license_no" className="block text-sm font-medium text-gray-300 mb-1">Tax License No</label>
                <input type="text" id="rc-tax_license_no" name="tax_license_no" value={formData.tax_license_no} onChange={handleInputChange} className="enterprise-input w-full" placeholder="e.g., 222/490474/2019" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="rc-tax_paid_from" className="block text-sm font-medium text-gray-300 mb-1">Tax Paid From</label>
                <input type="text" id="rc-tax_paid_from" name="tax_paid_from" value={formData.tax_paid_from} onChange={handleInputChange} className="enterprise-input w-full" placeholder="DD/MM/YYYY" />
              </div>
              <div>
                <label htmlFor="rc-tax_paid_to" className="block text-sm font-medium text-gray-300 mb-1">Tax Paid To</label>
                <input type="text" id="rc-tax_paid_to" name="tax_paid_to" value={formData.tax_paid_to} onChange={handleInputChange} className="enterprise-input w-full" placeholder="DD/MM/YYYY" />
              </div>
              <div>
                <label htmlFor="rc-date_of_registration" className="block text-sm font-medium text-gray-300 mb-1">Date of Registration</label>
                <input type="text" id="rc-date_of_registration" name="date_of_registration" value={formData.date_of_registration} onChange={handleInputChange} className="enterprise-input w-full" placeholder="DD/MM/YYYY" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="rc-fitness_valid_from" className="block text-sm font-medium text-gray-300 mb-1">Fitness Valid From</label>
                <input type="text" id="rc-fitness_valid_from" name="fitness_valid_from" value={formData.fitness_valid_from} onChange={handleInputChange} className="enterprise-input w-full" placeholder="DD/MM/YYYY" />
              </div>
              <div>
                <label htmlFor="rc-fitness_valid_to" className="block text-sm font-medium text-gray-300 mb-1">Fitness Valid To</label>
                <input type="text" id="rc-fitness_valid_to" name="fitness_valid_to" value={formData.fitness_valid_to} onChange={handleInputChange} className="enterprise-input w-full" placeholder="DD/MM/YYYY" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                RC Book (PDF/Image) - Optional
              </label>
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-3 text-center hover:border-gray-500 transition-colors"
              >
                {!rcBook ? (
                  <div
                    className="cursor-pointer"
                    onDragOver={handleRcBookDragOver}
                    onDrop={handleRcBookDrop}
                    onClick={() => document.getElementById('rc-reupload-book').click()}
                  >
                    <div className="flex flex-col items-center">
                      <FileText className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-gray-300 mb-1 text-sm">Drag & Drop new RC book here</p>
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
                  name="rc-reupload-book"
                  id="rc-reupload-book"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleRcBookUpload}
                  className="hidden"
                />
              </div>
              <div className="text-xs text-gray-400 mt-2">
                PDF, JPG, or PNG files under 1MB (OCR applied automatically)
              </div>
            </div>
          </div>
        }
        confirmText="Update Vehicle"
        cancelText="Cancel"
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
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

