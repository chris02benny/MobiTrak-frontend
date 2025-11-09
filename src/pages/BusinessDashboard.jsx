import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import toast, { Toaster } from 'react-hot-toast';
import OverviewPage from './business/OverviewPage';
import VehiclesPage from './business/VehiclesPage';
import DriversPage from './business/DriversPage';
import ReportsPage from './business/ReportsPage';
import TripsPage from './business/TripsPage';
import ProfilePage from './business/ProfilePage';
import EnquiriesPage from './business/EnquiriesPage';
import CustomersPage from './business/CustomersPage';

const BusinessDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubTab, setActiveSubTab] = useState({ trips: 'add', drivers: 'hire' });
  const [vehicles, setVehicles] = useState([]);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [vehicleStats, setVehicleStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    retired: 0
  });
  const [driversStats, setDriversStats] = useState({
    hired: 0,
    available: 0
  });
  const [tripsStats, setTripsStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });
  const [vehicleForm, setVehicleForm] = useState({
    vehicleImage: null,
    rcImage: null,
    registeredNumber: '',
    makersName: '',
    registeredOwnerName: '',
    vehicleClass: '',
    fuel: '',
    certificateOfFitnessFrom: '',
    certificateOfFitnessTo: '',
    seatingCapacity: '',
    vehicleType: ''
  });
  const [isExtractingRC, setIsExtractingRC] = useState(false);
  const [isExtractingRCInEdit, setIsExtractingRCInEdit] = useState(false);
  const [updatedFields, setUpdatedFields] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const vehicleImageRef = useRef(null);
  const rcImageRef = useRef(null);

  // Drivers state
  const [drivers, setDrivers] = useState([]);
  const [hiredDrivers, setHiredDrivers] = useState([]);
  const [pendingOffers, setPendingOffers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [hiredDriversLoading, setHiredDriversLoading] = useState(false);
  const [pendingOffersLoading, setPendingOffersLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({ message: '', salaryPerDay: '' });

  // Business Profile state
  const [businessProfile, setBusinessProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const handleLogout = () => {
    onLogout();
  };

  // Format time ago helper function
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  // Fetch business profile on component mount
  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  // Fetch vehicles when vehicles or overview tab is active
  useEffect(() => {
    if (activeTab === 'vehicles' || activeTab === 'overview') {
      fetchVehicles();
    }
    if (activeTab === 'drivers') {
      fetchAvailableDrivers();
      fetchHiredDrivers();
      fetchPendingOffers();
    }
    if (activeTab === 'overview') {
      fetchDriversStats();
      fetchTripsStats();
    }
  }, [activeTab]);

  const fetchAvailableDrivers = async () => {
    try {
      setDriversLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/drivers/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setDrivers(Array.isArray(data.drivers) ? data.drivers : []);
      } else {
        console.error('Failed to fetch drivers', res.status);
        toast.error('Failed to fetch drivers');
      }
    } catch (e) {
      console.error('Error fetching drivers', e);
      toast.error('Error fetching drivers');
    } finally {
      setDriversLoading(false);
    }
  };

  const fetchHiredDrivers = async () => {
    try {
      setHiredDriversLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/drivers/hired', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setHiredDrivers(Array.isArray(data.drivers) ? data.drivers : []);
      } else {
        console.error('Failed to fetch hired drivers', res.status);
        toast.error('Failed to fetch hired drivers');
      }
    } catch (e) {
      console.error('Error fetching hired drivers', e);
      toast.error('Error fetching hired drivers');
    } finally {
      setHiredDriversLoading(false);
    }
  };

  const fetchPendingOffers = async () => {
    try {
      setPendingOffersLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/job-offers/business', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        // Filter for pending offers only
        const pending = (data.jobOffers || []).filter(offer => offer.status === 'pending');
        setPendingOffers(pending);
      } else {
        console.error('Failed to fetch pending offers', res.status);
        toast.error('Failed to fetch pending offers');
      }
    } catch (e) {
      console.error('Error fetching pending offers', e);
      toast.error('Error fetching pending offers');
    } finally {
      setPendingOffersLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, skipping vehicle fetch');
        return;
      }

      const response = await fetch('/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const vehiclesData = data.vehicles || [];
        setVehicles(vehiclesData);
        
        // Calculate vehicle statistics
        const stats = {
          total: vehiclesData.length,
          active: vehiclesData.filter(v => v.status === 'active').length,
          maintenance: vehiclesData.filter(v => v.status === 'maintenance').length,
          retired: vehiclesData.filter(v => v.status === 'retired').length
        };
        setVehicleStats(stats);
        
        // Generate recent activity from vehicles
        const vehicleActivity = vehiclesData
          .sort((a, b) => new Date(b.createdAt || b.addedAt) - new Date(a.createdAt || a.addedAt))
          .slice(0, 3)
          .map(vehicle => ({
            id: `vehicle-${vehicle._id}`,
            type: 'vehicle_added',
            message: `Vehicle ${vehicle.registeredNumber} (${vehicle.makersName}) was added`,
            timestamp: vehicle.createdAt || vehicle.addedAt,
            vehicle: {
              registeredNumber: vehicle.registeredNumber,
              makersName: vehicle.makersName,
              status: vehicle.status
            }
          }));
        
        // Only update vehicle activities, keep existing driver and trip activities
        setRecentActivity(prev => {
          const nonVehicleActivities = prev.filter(activity => activity.type !== 'vehicle_added');
          return [...vehicleActivity, ...nonVehicleActivities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
        });
        
        console.log('Vehicles fetched successfully:', vehiclesData.length);
        console.log('Vehicle stats:', stats);
      } else {
        console.error('Failed to fetch vehicles:', response.status);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      if (error.message.includes('Failed to fetch')) {
        console.log('Backend server is not running. Please start it with: cd backend && npm run dev');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDriversStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for drivers stats');
        return;
      }

      console.log('Fetching drivers stats...');
      
      // Fetch both available and hired drivers
      const [availableResponse, hiredResponse] = await Promise.all([
        fetch('/api/drivers/available', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/drivers/hired', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      let availableCount = 0;
      let hiredCount = 0;
      let driverActivities = [];

      console.log('Available drivers response status:', availableResponse.status);
      console.log('Hired drivers response status:', hiredResponse.status);

      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        availableCount = availableData.drivers?.length || 0;
        console.log('Available drivers count:', availableCount);
      } else {
        console.error('Failed to fetch available drivers:', availableResponse.status);
      }

      if (hiredResponse.ok) {
        const hiredData = await hiredResponse.json();
        const hiredDrivers = hiredData.drivers || [];
        hiredCount = hiredDrivers.length;
        console.log('Hired drivers count:', hiredCount);
        console.log('Hired drivers data:', hiredDrivers);
        
        // Add driver activities to recent activity
        driverActivities = hiredDrivers
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
          .slice(0, 3)
          .map(driver => ({
            id: `driver-${driver._id}`,
            type: 'driver_hired',
            message: `Driver ${driver.name} was hired`,
            timestamp: driver.updatedAt || driver.createdAt,
            driver: {
              name: driver.name,
              status: 'hired'
            }
          }));
      } else {
        console.error('Failed to fetch hired drivers:', hiredResponse.status);
      }
      
      const stats = {
        hired: hiredCount,
        available: availableCount
      };
      console.log('Setting drivers stats:', stats);
      setDriversStats(stats);
      
      if (driverActivities.length > 0) {
        setRecentActivity(prev => {
          const nonDriverActivities = prev.filter(activity => activity.type !== 'driver_hired');
          return [...driverActivities, ...nonDriverActivities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
        });
      }
    } catch (error) {
      console.error('Error fetching drivers stats:', error);
    }
  };

  const fetchTripsStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for trips stats');
        return;
      }

      console.log('Fetching trips stats...');
      
      const response = await fetch('/api/trips', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Trips response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const trips = data.trips || [];
        console.log('Trips data:', trips);
        
        const stats = {
          total: trips.length,
          active: trips.filter(t => t.status === 'active').length,
          completed: trips.filter(t => t.status === 'completed').length
        };
        console.log('Setting trips stats:', stats);
        setTripsStats(stats);
        
        // Add trip activities to recent activity
        const tripActivities = trips
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
          .map(trip => ({
            id: `trip-${trip._id}`,
            type: 'trip_created',
            message: `Trip from ${trip.startAddress} to ${trip.endAddress} was created`,
            timestamp: trip.createdAt,
            trip: {
              startAddress: trip.startAddress,
              endAddress: trip.endAddress,
              status: trip.status
            }
          }));
        
        setRecentActivity(prev => {
          const nonTripActivities = prev.filter(activity => activity.type !== 'trip_created');
          return [...tripActivities, ...nonTripActivities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
        });
      } else {
        console.error('Failed to fetch trips:', response.status);
      }
    } catch (error) {
      console.error('Error fetching trips stats:', error);
    }
  };

  const fetchBusinessProfile = async () => {
    try {
      setProfileLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for business profile');
        return;
      }

      const response = await fetch('/api/business/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBusinessProfile(data.business);
        console.log('Business profile fetched:', data.business);
      } else if (response.status === 404) {
        console.log('Business profile not found - will be created when user opens profile modal');
        setBusinessProfile(null);
      } else {
        console.error('Failed to fetch business profile:', response.status);
        toast.error('Failed to load business profile');
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
      toast.error('Error loading business profile');
    } finally {
      setProfileLoading(false);
    }
  };


  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Compress the image before processing
        const compressedImage = await compressImage(file);
        
        setVehicleForm(prev => ({
          ...prev,
          [type]: compressedImage
        }));
        
        // If RC image is uploaded, extract data automatically (works for both add and edit)
        if (type === 'rcImage') {
          if (showEditVehicle) {
            setIsExtractingRCInEdit(true);
          }
          await extractRCData(compressedImage);
          if (showEditVehicle) {
            setIsExtractingRCInEdit(false);
          }
        }
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error('Error processing image. Please try again.');
      }
    }
  };

  const extractRCData = async (imageBase64) => {
    try {
      setIsExtractingRC(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login first');
        return;
      }

      console.log('Extracting RC data...');
      console.log('Image data length:', imageBase64.length);
      console.log('Image data preview:', imageBase64.substring(0, 100) + '...');
      
      const response = await fetch('/api/vehicles/extract-rc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl: imageBase64 })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('RC extraction response:', data);
        console.log('Raw RC data:', data.data);
        
        if (data.data) {
          const updatedFieldsList = [];
          
          setVehicleForm(prev => {
            const newForm = {
              ...prev,
              registeredNumber: data.data.registeredNumber || '',
              makersName: data.data.makersName || '',
              registeredOwnerName: data.data.registeredOwnerName || '',
              vehicleClass: data.data.vehicleClass || '',
              fuel: data.data.fuel || '',
              seatingCapacity: data.data.seatingCapacity || '',
              certificateOfFitnessFrom: data.data.certificateOfFitness?.validFrom || '',
              certificateOfFitnessTo: data.data.certificateOfFitness?.validTo || ''
            };
            
            // Track which fields were updated
            if (data.data.registeredNumber) updatedFieldsList.push('Registration Number');
            if (data.data.makersName) updatedFieldsList.push('Manufacturer');
            if (data.data.registeredOwnerName) updatedFieldsList.push('Owner Name');
            if (data.data.vehicleClass) updatedFieldsList.push('Vehicle Class');
            if (data.data.fuel) updatedFieldsList.push('Fuel Type');
            if (data.data.seatingCapacity && data.data.seatingCapacity !== null && data.data.seatingCapacity !== 'null') {
              console.log('Seating capacity found:', data.data.seatingCapacity);
              updatedFieldsList.push('Seating Capacity');
            } else {
              console.log('Seating capacity NOT found in RC data, will remain empty');
              // Don't update seating capacity if not found
            }
            
            return newForm;
          });
          
          setUpdatedFields(updatedFieldsList);
          console.log('RC data extracted successfully');
          toast.success(`Updated: ${updatedFieldsList.join(', ')}`);
          
          // Clear highlight after 3 seconds
          setTimeout(() => {
            setUpdatedFields([]);
          }, 3000);
        } else {
          console.warn('No data extracted from RC image');
        }
      } else {
        const errorData = await response.json();
        console.error('RC extraction failed:', errorData);
        console.error('Response status:', response.status);
        console.error('Response headers:', response.headers);
        toast.error('Failed to extract RC data: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error extracting RC data:', error);
      if (error.message.includes('Failed to fetch')) {
        alert('Cannot connect to server. Please make sure the backend is running on http://localhost:4000');
      } else {
        alert('Error extracting RC data: ' + error.message);
      }
    } finally {
      setIsExtractingRC(false);
    }
  };

  const clearVehicleForm = () => {
    setVehicleForm({
      vehicleImage: null,
      rcImage: null,
      registeredNumber: '',
      makersName: '',
      registeredOwnerName: '',
      vehicleClass: '',
      fuel: '',
      certificateOfFitnessFrom: '',
      certificateOfFitnessTo: '',
      seatingCapacity: '',
      vehicleType: ''
    });
    
    // Clear file inputs using refs
    if (vehicleImageRef.current) vehicleImageRef.current.value = '';
    if (rcImageRef.current) rcImageRef.current.value = '';
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      vehicleImage: null, // Don't pre-populate with URLs - let user upload new images if needed
      rcImage: null, // Don't pre-populate with URLs - let user upload new images if needed
      registeredNumber: vehicle.registeredNumber || '',
      makersName: vehicle.makersName || '',
      registeredOwnerName: vehicle.registeredOwnerName || '',
      vehicleClass: vehicle.vehicleClass || '',
      fuel: vehicle.fuel || '',
      certificateOfFitnessFrom: vehicle.certificateOfFitness?.validFrom ? new Date(vehicle.certificateOfFitness.validFrom).toISOString().split('T')[0] : '',
      certificateOfFitnessTo: vehicle.certificateOfFitness?.validTo ? new Date(vehicle.certificateOfFitness.validTo).toISOString().split('T')[0] : '',
      seatingCapacity: vehicle.seatingCapacity || '',
      vehicleType: vehicle.vehicleType || ''
    });
    setShowEditVehicle(true);
  };

  const handleViewVehicleDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleDetails(true);
  };

  const isFieldUpdated = (fieldName) => {
    return updatedFields.includes(fieldName);
  };

  const handleDeleteVehicle = (vehicleId) => {
    setVehicleToDelete(vehicleId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/vehicles/${vehicleToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Vehicle deleted successfully!');
        fetchVehicles(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error('Error deleting vehicle: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Error deleting vehicle: ' + error.message);
    } finally {
      setShowDeleteConfirm(false);
      setVehicleToDelete(null);
    }
  };

  const cancelDeleteVehicle = () => {
    setShowDeleteConfirm(false);
    setVehicleToDelete(null);
  };

  const handleImageClick = (imageUrl, alt) => {
    setSelectedImage({ url: imageUrl, alt: alt });
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Check for duplicate vehicle registration number (excluding current vehicle)
      const existingVehicle = vehicles.find(v => 
        v._id !== editingVehicle._id &&
        v.registeredNumber && vehicleForm.registeredNumber && 
        v.registeredNumber.toLowerCase().trim() === vehicleForm.registeredNumber.toLowerCase().trim()
      );
      
      if (existingVehicle) {
        toast.error(`A vehicle with registration number "${vehicleForm.registeredNumber}" already exists. Please use a different registration number.`);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/vehicles/${editingVehicle._id}/images`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicleImage: vehicleForm.vehicleImage,
          rcImage: vehicleForm.rcImage,
          registeredNumber: vehicleForm.registeredNumber,
          makersName: vehicleForm.makersName,
          registeredOwnerName: vehicleForm.registeredOwnerName,
          vehicleClass: vehicleForm.vehicleClass,
          fuel: vehicleForm.fuel,
          certificateOfFitness: {
            validFrom: vehicleForm.certificateOfFitnessFrom,
            validTo: vehicleForm.certificateOfFitnessTo
          },
          seatingCapacity: parseInt(vehicleForm.seatingCapacity),
          vehicleType: vehicleForm.vehicleType
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Vehicle updated successfully:', data);
        setShowEditVehicle(false);
        setEditingVehicle(null);
        clearVehicleForm();
        fetchVehicles(); // Refresh the list
        toast.success('Vehicle updated successfully!');
      } else {
        const errorData = await response.json();
        toast.error('Error updating vehicle: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error('Error updating vehicle: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Check for duplicate vehicle registration number
      const existingVehicle = vehicles.find(v => 
        v.registeredNumber && vehicleForm.registeredNumber && 
        v.registeredNumber.toLowerCase().trim() === vehicleForm.registeredNumber.toLowerCase().trim()
      );
      
      if (existingVehicle) {
        toast.error(`A vehicle with registration number "${vehicleForm.registeredNumber}" already exists. Please use a different registration number.`);
        setLoading(false);
        return;
      }
      
      console.log('=== FRONTEND DEBUG ===');
      console.log('Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'Missing');
      console.log('Authorization header:', `Bearer ${token}`);
      console.log('Vehicle form data:', vehicleForm);
      
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicleImage: vehicleForm.vehicleImage,
          rcImage: vehicleForm.rcImage,
          registeredNumber: vehicleForm.registeredNumber,
          makersName: vehicleForm.makersName,
          registeredOwnerName: vehicleForm.registeredOwnerName,
          vehicleClass: vehicleForm.vehicleClass,
          fuel: vehicleForm.fuel,
          certificateOfFitness: {
            validFrom: vehicleForm.certificateOfFitnessFrom,
            validTo: vehicleForm.certificateOfFitnessTo
          },
          seatingCapacity: parseInt(vehicleForm.seatingCapacity) || null,
          vehicleType: vehicleForm.vehicleType
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Vehicle added successfully:', data);
        clearVehicleForm();
        
        // Add to recent activity immediately
        const newActivity = {
          id: data.vehicle.id,
          type: 'vehicle_added',
          message: `Vehicle ${data.vehicle.registeredNumber} (${data.vehicle.makersName}) was added`,
          timestamp: new Date().toISOString(),
          vehicle: {
            registeredNumber: data.vehicle.registeredNumber,
            makersName: data.vehicle.makersName,
            status: data.vehicle.status
          }
        };
        setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
        
        // Update vehicle stats immediately
        setVehicleStats(prev => ({
          ...prev,
          total: prev.total + 1,
          active: data.vehicle.status === 'active' ? prev.active + 1 : prev.active
        }));
        
        fetchVehicles(); // Refresh the complete list
        toast.success('Vehicle added successfully!');
      } else {
        const errorData = await response.json();
        toast.error('Error adding vehicle: ' + errorData.message);
        clearVehicleForm(); // Clear form even on error
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error('Error adding vehicle: ' + error.message);
      clearVehicleForm(); // Clear form even on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0D0D0D' }}>
      {/* Sidebar Navigation */}
      <div className="w-64 shadow-lg flex flex-col sticky top-0 h-screen" style={{ backgroundColor: '#1F1F1F', borderRight: '1px solid #0D0D0D' }}>
      {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: '#0D0D0D' }}>
            <div className="flex items-center">
            <div className="h-8 w-8 bg-[#FFC107] rounded-lg flex items-center justify-center mr-3 shadow-card">
                <svg className="h-5 w-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 14H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">MobiTrak Business</h1>
            </div>
            </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'overview', name: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
            { id: 'vehicles', name: 'Vehicles', icon: 'M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' },
            { id: 'enquiries', name: 'Enquiries', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
            { id: 'drivers', name: 'Drivers', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { id: 'trips', name: 'Trips', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            { id: 'reports', name: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'profile', name: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out"
              style={activeTab === tab.id ? {
                backgroundColor: '#FFC107',
                color: '#000000'
              } : {
                backgroundColor: 'transparent',
                color: '#FFFFFF'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = '#FFC107';
                  e.currentTarget.style.color = '#000000';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
                {tab.name}
              </button>
            ))}
      </nav>

        {/* Business Profile Section */}
        <div className="p-4 border-t" style={{ borderColor: '#0D0D0D' }}>
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full flex items-center justify-center mr-3 overflow-hidden" style={{ backgroundColor: '#1F1F1F' }}>
              {businessProfile?.profileIcon ? (
                <img
                  src={businessProfile.profileIcon}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg className="h-6 w-6 text-[#B0B0B0]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">
                {businessProfile?.companyName || 'Business Name'}
              </p>
              <p className="text-xs truncate text-[#B0B0B0]">
                {businessProfile?.ownerName || 'Owner Name'}
              </p>
              {businessProfile?.address && (
                <p className="text-xs truncate text-[#B0B0B0]">
                  {businessProfile.address.city}, {businessProfile.address.state}
                </p>
              )}
            </div>
          </div>


          <button
            onClick={handleLogout}
            className="w-full bg-[#F44336] hover:bg-[#D32F2F] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out"
          >
            Logout
          </button>
        </div>
                </div>
                
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 py-8 px-6">
          <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <OverviewPage 
              vehicleStats={vehicleStats}
              recentActivity={recentActivity}
              formatTimeAgo={formatTimeAgo}
              driversStats={driversStats}
              tripsStats={tripsStats}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehiclesPage 
              vehicles={vehicles}
              loading={loading}
              vehicleForm={vehicleForm}
              setVehicleForm={setVehicleForm}
              handleAddVehicle={handleAddVehicle}
              handleImageUpload={handleImageUpload}
              isExtractingRC={isExtractingRC}
              isFieldUpdated={isFieldUpdated}
              vehicleImageRef={vehicleImageRef}
              rcImageRef={rcImageRef}
              handleViewVehicleDetails={handleViewVehicleDetails}
              handleEditVehicle={handleEditVehicle}
              handleDeleteVehicle={handleDeleteVehicle}
            />
          )}

          {activeTab === 'enquiries' && (
            <EnquiriesPage />
          )}

          {activeTab === 'drivers' && (
            <DriversPage 
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              drivers={drivers}
              hiredDrivers={hiredDrivers}
              pendingOffers={pendingOffers}
              driversLoading={driversLoading}
              hiredDriversLoading={hiredDriversLoading}
              pendingOffersLoading={pendingOffersLoading}
              fetchAvailableDrivers={fetchAvailableDrivers}
              fetchHiredDrivers={fetchHiredDrivers}
              fetchPendingOffers={fetchPendingOffers}
              selectedDriver={selectedDriver}
              showDriverDetails={showDriverDetails}
              setSelectedDriver={setSelectedDriver}
              setShowDriverDetails={setShowDriverDetails}
              offerForm={offerForm}
              setOfferForm={setOfferForm}
              showOfferModal={showOfferModal}
              setShowOfferModal={setShowOfferModal}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersPage />
          )}

          {activeTab === 'reports' && (
            <ReportsPage />
          )}

          {activeTab === 'trips' && (
            <TripsPage 
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              vehicles={vehicles}
              fetchVehicles={fetchVehicles}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePage onProfileUpdate={fetchBusinessProfile} />
          )}
            </div>
        </main>
              </div>

      {/* Edit Vehicle Modal */}
      {showEditVehicle && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md" style={{ backgroundColor: '#1F1F1F', borderColor: '#0D0D0D' }}>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: '#FFC107' }}>Edit Vehicle</h3>
                <button
                  onClick={() => {
                    clearVehicleForm();
                    setShowEditVehicle(false);
                    setEditingVehicle(null);
                  }}
                  className="transition-colors"
                  style={{ color: '#B0B0B0' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#B0B0B0'}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateVehicle} className="space-y-4">
                {/* Vehicle Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                    Vehicle Image (Optional)
                  </label>
                  <p className="text-xs mb-2" style={{ color: '#B0B0B0' }}>
                    Upload a new image to replace the current one, or leave empty to keep the existing image.
                  </p>
                  <input
                    ref={vehicleImageRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'vehicleImage')}
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:text-black hover:file:bg-opacity-90 file:transition-all"
                    style={{ color: '#B0B0B0' }}
                  />
                  {vehicleForm.vehicleImage && (
                    <div className="mt-2">
                      <img
                        src={vehicleForm.vehicleImage}
                        alt="Vehicle preview"
                        className="h-32 w-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* RC Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                    RC Document (Required)
                  </label>
                  <p className="text-xs mb-2" style={{ color: '#B0B0B0' }}>
                    Upload a new RC document to replace the current one, or leave empty to keep the existing document.
                  </p>
                  <input
                    ref={rcImageRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'rcImage')}
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:text-black hover:file:bg-opacity-90 file:transition-all"
                    style={{ color: '#B0B0B0' }}
                  />
                  {vehicleForm.rcImage && (
                    <div className="mt-2">
                      <img
                        src={vehicleForm.rcImage}
                        alt="RC preview"
                        className="h-32 w-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  {/* RC Extraction Loading for Edit Mode */}
                  {isExtractingRCInEdit && (
                    <div className="mt-2 flex items-center" style={{ color: '#FFC107' }}>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: '#FFC107' }}></div>
                      <span className="text-sm">Extracting RC data...</span>
                    </div>
                  )}
                </div>

                {/* RC Extracted Fields */}
                <div className="rounded-lg p-4" style={{ backgroundColor: '#1F1F1F', border: '1px solid #0D0D0D' }}>
                  <h4 className="text-sm font-medium mb-3" style={{ color: '#FFC107' }}>RC Book Information (Auto-filled)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                        Registered Number
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.registeredNumber}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, registeredNumber: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                          isFieldUpdated('Registration Number') 
                            ? 'border-green-500 text-green-400' 
                            : ''
                        }`}
                        style={{ 
                          borderColor: isFieldUpdated('Registration Number') ? '#4CAF50' : '#0D0D0D',
                          backgroundColor: '#0D0D0D',
                          color: '#FFFFFF'
                        }}
                        onFocus={(e) => !isFieldUpdated('Registration Number') && (e.target.style.borderColor = '#FFC107')}
                        onBlur={(e) => !isFieldUpdated('Registration Number') && (e.target.style.borderColor = '#0D0D0D')}
                        placeholder="Auto-filled from RC"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                        Maker's Name
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.makersName}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, makersName: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                          isFieldUpdated('Manufacturer') 
                            ? 'border-green-500 text-green-400' 
                            : ''
                        }`}
                        style={{ 
                          borderColor: isFieldUpdated('Manufacturer') ? '#4CAF50' : '#0D0D0D',
                          backgroundColor: '#0D0D0D',
                          color: '#FFFFFF'
                        }}
                        onFocus={(e) => !isFieldUpdated('Manufacturer') && (e.target.style.borderColor = '#FFC107')}
                        onBlur={(e) => !isFieldUpdated('Manufacturer') && (e.target.style.borderColor = '#0D0D0D')}
                        placeholder="Auto-filled from RC"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                        Name of Regd Owner
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.registeredOwnerName}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, registeredOwnerName: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                          isFieldUpdated('Owner Name') 
                            ? 'border-green-500 text-green-400' 
                            : ''
                        }`}
                        style={{ 
                          borderColor: isFieldUpdated('Owner Name') ? '#4CAF50' : '#0D0D0D',
                          backgroundColor: '#0D0D0D',
                          color: '#FFFFFF'
                        }}
                        onFocus={(e) => !isFieldUpdated('Owner Name') && (e.target.style.borderColor = '#FFC107')}
                        onBlur={(e) => !isFieldUpdated('Owner Name') && (e.target.style.borderColor = '#0D0D0D')}
                        placeholder="Auto-filled from RC"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                        Class of Vehicle
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.vehicleClass}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, vehicleClass: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                          isFieldUpdated('Vehicle Class') 
                            ? 'border-green-500 text-green-400' 
                            : ''
                        }`}
                        style={{ 
                          borderColor: isFieldUpdated('Vehicle Class') ? '#4CAF50' : '#0D0D0D',
                          backgroundColor: '#0D0D0D',
                          color: '#FFFFFF'
                        }}
                        onFocus={(e) => !isFieldUpdated('Vehicle Class') && (e.target.style.borderColor = '#FFC107')}
                        onBlur={(e) => !isFieldUpdated('Vehicle Class') && (e.target.style.borderColor = '#0D0D0D')}
                        placeholder="Auto-filled from RC"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                        Fuel
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.fuel}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, fuel: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                          isFieldUpdated('Fuel Type') 
                            ? 'border-green-500 text-green-400' 
                            : ''
                        }`}
                        style={{ 
                          borderColor: isFieldUpdated('Fuel Type') ? '#4CAF50' : '#0D0D0D',
                          backgroundColor: '#0D0D0D',
                          color: '#FFFFFF'
                        }}
                        onFocus={(e) => !isFieldUpdated('Fuel Type') && (e.target.style.borderColor = '#FFC107')}
                        onBlur={(e) => !isFieldUpdated('Fuel Type') && (e.target.style.borderColor = '#0D0D0D')}
                        placeholder="Auto-filled from RC"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                        Certificate of Fitness Valid From
                      </label>
                      <input
                        type="date"
                        value={vehicleForm.certificateOfFitnessFrom}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, certificateOfFitnessFrom: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: '#0D0D0D', backgroundColor: '#0D0D0D', color: '#FFFFFF' }}
                        onFocus={(e) => e.target.style.borderColor = '#FFC107'}
                        onBlur={(e) => e.target.style.borderColor = '#0D0D0D'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                        Certificate of Fitness Valid To
                      </label>
                      <input
                        type="date"
                        value={vehicleForm.certificateOfFitnessTo}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, certificateOfFitnessTo: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: '#0D0D0D', backgroundColor: '#0D0D0D', color: '#FFFFFF' }}
                        onFocus={(e) => e.target.style.borderColor = '#FFC107'}
                        onBlur={(e) => e.target.style.borderColor = '#0D0D0D'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                        Seating Capacity
                      </label>
                      <input
                        type="number"
                        value={vehicleForm.seatingCapacity}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, seatingCapacity: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                          isFieldUpdated('Seating Capacity') 
                            ? 'border-green-500 text-green-400' 
                            : ''
                        }`}
                        style={{ 
                          borderColor: isFieldUpdated('Seating Capacity') ? '#4CAF50' : '#0D0D0D',
                          backgroundColor: '#0D0D0D',
                          color: '#FFFFFF'
                        }}
                        onFocus={(e) => !isFieldUpdated('Seating Capacity') && (e.target.style.borderColor = '#FFC107')}
                        onBlur={(e) => !isFieldUpdated('Seating Capacity') && (e.target.style.borderColor = '#0D0D0D')}
                        placeholder={vehicleForm.seatingCapacity ? "Auto-filled from RC" : "Not found in RC - Enter manually"}
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                    Vehicle Type *
                  </label>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, vehicleType: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: '#1F1F1F', backgroundColor: '#1F1F1F', color: '#FFFFFF' }}
                    onFocus={(e) => e.target.style.borderColor = '#FFC107'}
                    onBlur={(e) => e.target.style.borderColor = '#1F1F1F'}
                    required
                  >
                    <option value="" style={{ backgroundColor: '#1F1F1F' }}>Select Vehicle Type</option>
                    <option value="Logistics" style={{ backgroundColor: '#1F1F1F' }}>Logistics</option>
                    <option value="Passenger" style={{ backgroundColor: '#1F1F1F' }}>Passenger</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      clearVehicleForm();
                      setShowEditVehicle(false);
                      setEditingVehicle(null);
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-md border transition-all"
                    style={{ borderColor: '#FFC107', color: '#FFC107', backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F1F1F'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium rounded-md flex items-center transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#FFC107', color: '#000000' }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#FFB300')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#FFC107')}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: '#000000' }}></div>
                        Updating...
                      </>
                    ) : (
                      'Update Vehicle'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      {showVehicleDetails && selectedVehicle && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-card rounded-md" style={{ backgroundColor: '#1F1F1F', borderColor: '#1F1F1F' }}>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: '#FFC107' }}>Vehicle Details</h3>
                <button
                  onClick={() => {
                    setShowVehicleDetails(false);
                    setSelectedVehicle(null);
                  }}
                  className="transition-colors"
                  style={{ color: '#B0B0B0' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#B0B0B0'}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Vehicle Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {selectedVehicle.vehicleImage?.url && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>Vehicle Image</h4>
                      <img
                        src={selectedVehicle.vehicleImage.url}
                        alt="Vehicle"
                        className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(selectedVehicle.vehicleImage.url, "Vehicle")}
                      />
                    </div>
                  )}
                  {selectedVehicle.rcImage?.url && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>RC Document</h4>
                      <img
                        src={selectedVehicle.rcImage.url}
                        alt="RC Document"
                        className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(selectedVehicle.rcImage.url, "RC Document")}
                      />
                    </div>
                  )}
                </div>

                {/* Vehicle Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>Registration Number</label>
                      <p className="mt-1 text-sm" style={{ color: '#FFFFFF' }}>{selectedVehicle.registeredNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>Maker's Name</label>
                      <p className="mt-1 text-sm" style={{ color: '#FFFFFF' }}>{selectedVehicle.makersName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>Registered Owner</label>
                      <p className="mt-1 text-sm" style={{ color: '#FFFFFF' }}>{selectedVehicle.registeredOwnerName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>Vehicle Class</label>
                      <p className="mt-1 text-sm" style={{ color: '#FFFFFF' }}>{selectedVehicle.vehicleClass}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>Fuel Type</label>
                      <p className="mt-1 text-sm" style={{ color: '#FFFFFF' }}>{selectedVehicle.fuel}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedVehicle.vehicleType && (
                      <div>
                        <label className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>Vehicle Type</label>
                        <p className="mt-1 text-sm" style={{ color: '#FFFFFF' }}>{selectedVehicle.vehicleType}</p>
                      </div>
                    )}
                    {selectedVehicle.seatingCapacity && (
                      <div>
                        <label className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>Seating Capacity</label>
                        <p className="mt-1 text-sm" style={{ color: '#FFFFFF' }}>{selectedVehicle.seatingCapacity} seats</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>Added On</label>
                      <p className="mt-1 text-sm" style={{ color: '#FFFFFF' }}>
                        {selectedVehicle.createdAt ? new Date(selectedVehicle.createdAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>Last Updated</label>
                      <p className="mt-1 text-sm" style={{ color: '#FFFFFF' }}>
                        {selectedVehicle.lastUpdated ? new Date(selectedVehicle.lastUpdated).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Certificate of Fitness */}
                {selectedVehicle.certificateOfFitness && (
                  <div>
                    <h4 className="text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>Certificate of Fitness</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium" style={{ color: '#B0B0B0' }}>Valid From</label>
                        <p className="text-sm" style={{ color: '#FFFFFF' }}>
                          {selectedVehicle.certificateOfFitness.validFrom 
                            ? new Date(selectedVehicle.certificateOfFitness.validFrom).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium" style={{ color: '#B0B0B0' }}>Valid To</label>
                        <p className="text-sm" style={{ color: '#FFFFFF' }}>
                          {selectedVehicle.certificateOfFitness.validTo 
                            ? new Date(selectedVehicle.certificateOfFitness.validTo).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4" style={{ borderColor: '#3a3a3a', borderTop: '1px solid' }}>
                <button
                  onClick={() => {
                    setShowVehicleDetails(false);
                    setSelectedVehicle(null);
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out border border-[#FFC107] text-[#FFC107] bg-transparent hover:bg-[#1F1F1F]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowVehicleDetails(false);
                    setSelectedVehicle(null);
                    handleEditVehicle(selectedVehicle);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ease-in-out bg-[#FFC107] text-black hover:bg-[#FFB300]"
                >
                  Edit Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.alt}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="relative p-5 border w-96 shadow-card rounded-md" style={{ backgroundColor: '#1F1F1F', borderColor: '#1F1F1F' }}>
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full" style={{ backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#F44336' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mt-4" style={{ color: '#FFC107' }}>Delete Vehicle</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm" style={{ color: '#B0B0B0' }}>
                  Are you sure you want to delete this vehicle? This action cannot be undone and will permanently remove the vehicle and all associated images.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={cancelDeleteVehicle}
                  className="px-4 py-2 text-sm font-medium border rounded-md focus:outline-none transition-all duration-200 ease-in-out"
                  style={{ borderColor: '#FFC107', color: '#FFC107', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F1F1F'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteVehicle}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none transition-all duration-200 ease-in-out"
                  style={{ backgroundColor: '#F44336' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D32F2F'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F44336'}
                >
                  Delete Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <Toaster position="top-right" />
    </div>
  );
};

export default BusinessDashboard;

