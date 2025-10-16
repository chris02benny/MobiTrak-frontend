import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { Camera, Loader2 } from 'lucide-react';
import { businessSidebarItems } from '../../config/businessSidebarConfig';

const BusinessProfilePage = () => {
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const mapRef = useRef(null);
  const mapElRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteInputRef = useRef(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const imageRef = useRef(null);
  const cropContainerRef = useRef(null);
  const [cropCircleSize, setCropCircleSize] = useState(280);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 1 });
  const previewSize = 512; // output square size

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const updateCircleSize = useCallback(() => {
    const el = cropContainerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const base = Math.min(w, h);
    const size = Math.max(160, Math.min(360, Math.floor(base * 0.8)));
    setCropCircleSize(size);
  }, []);

  useEffect(() => {
    if (showCropper) {
      updateCircleSize();
      const onResize = () => updateCircleSize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, [showCropper, updateCircleSize]);

  const clampOffsets = useCallback(() => {
    const img = imageRef.current;
    const container = cropContainerRef.current;
    if (!img || !container) return;
    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    const drawW = naturalW * cropZoom;
    const drawH = naturalH * cropZoom;
    const radius = cropCircleSize / 2;
    const centerX = 0; // offsets are applied relative to center
    const centerY = 0;
    const minX = - (drawW / 2 - radius);
    const maxX =   (drawW / 2 - radius);
    const minY = - (drawH / 2 - radius);
    const maxY =   (drawH / 2 - radius);
    setCropX(prev => clamp(prev, minX, maxX));
    setCropY(prev => clamp(prev, minY, maxY));
  }, [cropZoom, cropCircleSize]);

  useEffect(() => {
    if (showCropper) clampOffsets();
  }, [cropZoom, cropCircleSize, showCropper, clampOffsets]);
  const [loading, setLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching business profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('business_profiles')
        .select('business_name, business_email, business_phone, business_address, bio, profile_picture_url, profile_complete, address_line, city, state, postal_code, country, latitude, longitude')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching business profile:', error);
        throw error;
      }

      if (data) {
        console.log('Business profile found:', data);
        setBusinessName(data.business_name || '');
        setBusinessEmail(data.business_email || '');
        setBusinessPhone(data.business_phone || '');
        setBusinessAddress(data.business_address || '');
        setBio(data.bio || '');
        setProfilePictureUrl(data.profile_picture_url || '');
        setProfileComplete(data.profile_complete || false);
        setAddressLine(data.address_line || '');
        setCity(data.city || '');
        setStateName(data.state || '');
        setPostalCode(data.postal_code || '');
        setCountry(data.country || '');
        setLatitude(data.latitude ?? null);
        setLongitude(data.longitude ?? null);
      } else {
        console.log('No business profile found, creating one...');
        // No profile exists yet, create one
        const { data: newProfile, error: insertError } = await supabase
          .from('business_profiles')
          .insert([{ 
            user_id: user.id,
            business_name: '',
            business_email: user.email || '',
            business_phone: '',
            business_address: '',
            bio: '',
            profile_picture_url: '',
            profile_complete: false,
            address_line: '',
            city: '',
            state: '',
            postal_code: '',
            country: '',
            latitude: null,
            longitude: null
          }])
          .select('*')
          .single();

        if (insertError) {
          console.error('Error creating business profile:', insertError);
          showToast(`Failed to create business profile: ${insertError.message}`, 'error');
        } else {
          console.log('Business profile created successfully:', newProfile);
          // Set the form fields with the new profile data
          setBusinessName(newProfile.business_name || '');
          setBusinessEmail(newProfile.business_email || '');
          setBusinessPhone(newProfile.business_phone || '');
          setBusinessAddress(newProfile.business_address || '');
          setBio(newProfile.bio || '');
          setProfilePictureUrl(newProfile.profile_picture_url || '');
          setProfileComplete(newProfile.profile_complete || false);
          setAddressLine(newProfile.address_line || '');
          setCity(newProfile.city || '');
          setStateName(newProfile.state || '');
          setPostalCode(newProfile.postal_code || '');
          setCountry(newProfile.country || '');
          setLatitude(newProfile.latitude ?? null);
          setLongitude(newProfile.longitude ?? null);
        }
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
      showToast(`Failed to load business profile: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({
          business_name: businessName,
          business_email: businessEmail,
          business_phone: businessPhone,
          business_address: businessAddress,
          bio: bio,
          profile_picture_url: profilePictureUrl || null,
          address_line: addressLine || null,
          city: city || null,
          state: stateName || null,
          postal_code: postalCode || null,
          country: country || null,
          latitude: latitude,
          longitude: longitude
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update profile completion status
      const isComplete = businessName && businessEmail && businessPhone && (businessAddress || addressLine) && city && stateName && postalCode && country;
      if (isComplete) {
        await supabase
          .from('business_profiles')
          .update({ profile_complete: true })
          .eq('user_id', user.id);
      }

      showToast('Business profile updated successfully!', 'success');
      navigate('/dashboard/business');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Google Maps JS API with Places
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found. Set VITE_GOOGLE_MAPS_API_KEY in .env file');
      setMapsError('API key not configured');
      return;
    }
    if (window.google && window.google.maps) {
      setMapsReady(true);
      return;
    }
    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps?.places) {
        setMapsReady(true);
        setMapsError(null);
      } else {
        console.warn('Google Maps Places library failed to load');
        setMapsError('Places library failed to load');
      }
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      setMapsError('Failed to load Google Maps');
    };
    
    // Add error listener for billing issues
    window.gm_authFailure = () => {
      console.error('Google Maps authentication failed - check API key and billing');
      setMapsError('Billing not enabled for this API key');
    };
    
    document.body.appendChild(script);
  }, []);

  // Initialize Map when ready and element exists
  useEffect(() => {
    if (!mapsReady || !mapElRef.current || mapsError) return;
    
    try {
      const center = (latitude && longitude) ? { lat: Number(latitude), lng: Number(longitude) } : { lat: 20.5937, lng: 78.9629 };
      const map = new window.google.maps.Map(mapElRef.current, {
        center,
        zoom: (latitude && longitude) ? 14 : 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: []
      });
      mapRef.current = map;

      // Place marker if we have coords - use AdvancedMarkerElement if available
      if (latitude && longitude) {
        if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
          markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ 
            position: center, 
            map,
            title: 'Business Location'
          });
        } else {
          // Fallback to deprecated Marker
          markerRef.current = new window.google.maps.Marker({ position: center, map });
        }
      }

      // click to set marker and state
      map.addListener('click', (e) => {
        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        if (!markerRef.current) {
          if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
            markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ 
              position: pos, 
              map,
              title: 'Business Location'
            });
          } else {
            markerRef.current = new window.google.maps.Marker({ position: pos, map });
          }
        } else {
          markerRef.current.position = pos;
        }
        setLatitude(pos.lat);
        setLongitude(pos.lng);
      });

      // Places Autocomplete
      if (autocompleteInputRef.current && window.google?.maps?.places) {
        try {
          const ac = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
            fields: ['geometry', 'name', 'formatted_address']
          });
          ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (!place.geometry) return;
            const pos = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            map.setCenter(pos);
            map.setZoom(15);
            if (!markerRef.current) {
              if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
                markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ 
                  position: pos, 
                  map,
                  title: 'Business Location'
                });
              } else {
                markerRef.current = new window.google.maps.Marker({ position: pos, map });
              }
            } else {
              markerRef.current.position = pos;
            }
            setLatitude(pos.lat);
            setLongitude(pos.lng);
          });
        } catch (error) {
          console.warn('Google Places Autocomplete not available:', error);
        }
      }
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setMapsError('Failed to initialize map');
    }
  }, [mapsReady, latitude, longitude, mapsError]);

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (mapRef.current) {
          mapRef.current.setCenter(coords);
          mapRef.current.setZoom(15);
          if (!markerRef.current) {
            markerRef.current = new window.google.maps.Marker({ position: coords, map: mapRef.current });
          } else {
            markerRef.current.setPosition(coords);
          }
        }
        setLatitude(coords.lat);
        setLongitude(coords.lng);
        showToast('Business location set to current position', 'success');
      },
      () => showToast('Unable to retrieve your location', 'error'),
      { enableHighAccuracy: true }
    );
  };


  return (
    <DashboardLayout title="Business Profile" sidebarItems={businessSidebarItems}>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="enterprise-card p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-primary text-black p-2 rounded-full cursor-pointer shadow-md" aria-label="Upload profile image">
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setCropImageSrc(reader.result?.toString() || '');
                      setCropZoom(1);
                      setCropX(0);
                      setCropY(0);
                      setShowCropper(true);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{businessName || user?.email}</h1>
              <p className="text-gray-400 capitalize">{userRole} Account</p>
              <div className="flex items-center mt-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${profileComplete ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={`text-sm ${profileComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                  {profileComplete ? 'Profile Complete' : 'Profile Incomplete'}
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Account Details Card */}
        <div className="enterprise-card p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">Account Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div>
                <label htmlFor="businessName" className="block text-gray-300 text-sm font-bold mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  id="businessName"
                  className="enterprise-input w-full"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your company name"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Legal business name</p>
              </div>

              {/* Business Phone */}
              <div>
                <label htmlFor="businessPhone" className="block text-gray-300 text-sm font-bold mb-2">
                  Business Phone *
                </label>
                <input
                  type="tel"
                  id="businessPhone"
                  className="enterprise-input w-full"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="Enter business phone number"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Primary business contact number</p>
              </div>
            </div>

            {/* Business Email */}
            <div>
              <label htmlFor="businessEmail" className="block text-gray-300 text-sm font-bold mb-2">
                Business Email *
              </label>
              <input
                type="email"
                id="businessEmail"
                className="enterprise-input w-full"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="Enter business email address"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Official business email</p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-gray-300 text-sm font-bold mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                className="enterprise-input w-full h-28 resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your business (max 500 chars)"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
            </div>

        </form>
        </div>

        {/* Contact Information + Location Card */}
        <div className="enterprise-card p-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">Contact Information</h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="addressLine" className="block text-gray-300 text-sm font-bold mb-2">Address Line</label>
                <input type="text" id="addressLine" className="enterprise-input w-full" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Apartment, suite, unit, building, etc." />
              </div>
              <div>
                <label htmlFor="businessAddress" className="block text-gray-300 text-sm font-bold mb-2">Address</label>
                <input type="text" id="businessAddress" className="enterprise-input w-full" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder="Street address" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="city" className="block text-gray-300 text-sm font-bold mb-2">City</label>
                <input type="text" id="city" className="enterprise-input w-full" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              </div>
              <div>
                <label htmlFor="state" className="block text-gray-300 text-sm font-bold mb-2">State</label>
                <input type="text" id="state" className="enterprise-input w-full" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-gray-300 text-sm font-bold mb-2">Pincode</label>
                <input type="text" id="postalCode" className="enterprise-input w-full" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Postal code" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="country" className="block text-gray-300 text-sm font-bold mb-2">Country</label>
                <input type="text" id="country" className="enterprise-input w-full" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
              </div>
              <div>
                <label htmlFor="autocomplete" className="block text-gray-300 text-sm font-bold mb-2">Search Location</label>
                <input 
                  ref={autocompleteInputRef} 
                  id="autocomplete" 
                  type="text" 
                  className="enterprise-input w-full" 
                  placeholder={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "Search your business location" : "Google Maps not configured"}
                  disabled={!import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                />
                {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                  <p className="text-xs text-gray-500 mt-1">Set VITE_GOOGLE_MAPS_API_KEY in .env to enable location search</p>
                )}
              </div>
            </div>

            {/* Map */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm">Pin your business location on the map</p>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={handleUseCurrentLocation} 
                    className="enterprise-button-secondary px-4 py-2"
                    disabled={mapsError}
                  >
                    Use My Current Location
                  </button>
                  <button 
                    type="button" 
                    onClick={async () => {
                      // Save only location quickly
                      try {
                        const { error } = await supabase.from('business_profiles').update({ latitude, longitude }).eq('user_id', user.id);
                        if (error) throw error;
                        showToast('Business location saved successfully', 'success');
                      } catch (e) {
                        showToast(e.message || 'Failed to save location', 'error');
                      }
                    }} 
                    className="enterprise-button px-4 py-2"
                    disabled={mapsError}
                  >
                    Save Location
                  </button>
                </div>
              </div>
              
              {mapsError ? (
                <div className="w-full h-72 rounded-lg border border-red-500 bg-red-900/20 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-red-400 mb-2 text-lg">⚠️ Google Maps Error</div>
                    <p className="text-red-300 mb-2">{mapsError}</p>
                    {mapsError.includes('Billing') && (
                      <div className="text-sm text-red-200">
                        <p>To fix this issue:</p>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                          <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                          <li>Enable billing for your project</li>
                          <li>Enable the Maps JavaScript API</li>
                          <li>Check your API key permissions</li>
                        </ol>
                      </div>
                    )}
                    <div className="mt-4 text-xs text-gray-400">
                      You can still manually enter coordinates below
                    </div>
                  </div>
                </div>
              ) : !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                <div className="w-full h-72 rounded-lg border border-gray-700 bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-400 mb-2">Google Maps not configured</p>
                    <p className="text-xs text-gray-500">Set VITE_GOOGLE_MAPS_API_KEY in .env file to enable map</p>
                  </div>
                </div>
              ) : (
                <div ref={mapElRef} className="w-full h-72 rounded-lg border border-gray-700 bg-gray-800" />
              )}
              
              <div className="text-xs text-gray-500 mt-2">Lat: {latitude ?? '-'} | Lng: {longitude ?? '-'}</div>
              
              {/* Manual coordinate input as fallback */}
              {mapsError && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Manual Location Entry</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={latitude || ''}
                        onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : null)}
                        className="enterprise-input text-sm"
                        placeholder="e.g., 9.531693"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={longitude || ''}
                        onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : null)}
                        className="enterprise-input text-sm"
                        placeholder="e.g., 76.819030"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                className="enterprise-button flex-1 py-3"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2"
                    />
                    Updating Profile...
                  </div>
                ) : (
                  'Update Business Profile'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/dashboard/business')}
                className="enterprise-button-secondary flex-1 py-3"
                disabled={loading}
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>

        {/* Image Cropper Modal */}
        {showCropper && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
            <div className="bg-gray-900 w-full max-w-xl rounded-lg p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Adjust profile photo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center">
                  <div
                    ref={cropContainerRef}
                    className="w-full aspect-square bg-black relative rounded-lg overflow-hidden touch-none select-none"
                    onWheel={(e) => {
                      e.preventDefault();
                      const delta = -e.deltaY / 500;
                      setCropZoom((z) => clamp(z + delta, 1, 4));
                    }}
                    onMouseDown={(e) => {
                      setIsDragging(true);
                      dragStartRef.current = { x: e.clientX, y: e.clientY };
                      posStartRef.current = { x: cropX, y: cropY };
                    }}
                    onMouseMove={(e) => {
                      if (!isDragging) return;
                      const dx = e.clientX - dragStartRef.current.x;
                      const dy = e.clientY - dragStartRef.current.y;
                      setCropX(posStartRef.current.x + dx);
                      setCropY(posStartRef.current.y + dy);
                    }}
                    onMouseUp={() => { setIsDragging(false); clampOffsets(); }}
                    onMouseLeave={() => { if (isDragging) { setIsDragging(false); clampOffsets(); } }}
                    onTouchStart={(e) => {
                      if (e.touches.length === 1) {
                        const t = e.touches[0];
                        setIsDragging(true);
                        dragStartRef.current = { x: t.clientX, y: t.clientY };
                        posStartRef.current = { x: cropX, y: cropY };
                      } else if (e.touches.length === 2) {
                        pinchRef.current.active = true;
                        const [t1, t2] = e.touches;
                        const dx = t2.clientX - t1.clientX;
                        const dy = t2.clientY - t1.clientY;
                        pinchRef.current.startDist = Math.hypot(dx, dy);
                        pinchRef.current.startZoom = cropZoom;
                      }
                    }}
                    onTouchMove={(e) => {
                      if (pinchRef.current.active && e.touches.length === 2) {
                        e.preventDefault();
                        const [t1, t2] = e.touches;
                        const dx = t2.clientX - t1.clientX;
                        const dy = t2.clientY - t1.clientY;
                        const dist = Math.hypot(dx, dy);
                        const delta = (dist - pinchRef.current.startDist) / 300;
                        setCropZoom(clamp(pinchRef.current.startZoom + delta, 1, 4));
                      } else if (isDragging && e.touches.length === 1) {
                        const t = e.touches[0];
                        const dx = t.clientX - dragStartRef.current.x;
                        const dy = t.clientY - dragStartRef.current.y;
                        setCropX(posStartRef.current.x + dx);
                        setCropY(posStartRef.current.y + dy);
                      }
                    }}
                    onTouchEnd={() => {
                      pinchRef.current.active = false;
                      if (isDragging) { setIsDragging(false); clampOffsets(); }
                    }}
                  >
                    {cropImageSrc && (
                      <img
                        ref={imageRef}
                        src={cropImageSrc}
                        alt="To crop"
                        className="absolute top-1/2 left-1/2 select-none pointer-events-none"
                        style={{
                          transform: `translate(calc(-50% + ${cropX}px), calc(-50% + ${cropY}px)) scale(${cropZoom})`,
                          transformOrigin: 'center',
                          maxWidth: 'none',
                          willChange: 'transform'
                        }}
                      />
                    )}
                    <svg className="absolute inset-0 w-full h-full" aria-hidden>
                      <defs>
                        <mask id="circleMask">
                          <rect x="0" y="0" width="100%" height="100%" fill="white" />
                          <circle cx="50%" cy="50%" r={cropCircleSize / 2} fill="black" />
                        </mask>
                      </defs>
                      <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#circleMask)" />
                      <circle cx="50%" cy="50%" r={cropCircleSize / 2} fill="none" stroke="white" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="w-full mt-4">
                    <label className="text-xs text-gray-400">Zoom</label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.01"
                      value={cropZoom}
                      onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center">
                    {cropImageSrc && (
                      <img
                        src={cropImageSrc}
                        alt="Preview"
                        className="select-none"
                        style={{
                          transform: `translate(${cropX}px, ${cropY}px) scale(${cropZoom})`,
                          transformOrigin: 'center',
                          maxWidth: 'none'
                        }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Preview</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="enterprise-button-secondary px-4 py-2"
                  onClick={() => setShowCropper(false)}
                  disabled={uploadingImage}
                >
                  Cancel
                </button>
                <button
                  className="enterprise-button px-4 py-2 flex items-center gap-2"
                  disabled={uploadingImage}
                  onClick={async () => {
                    if (!cropImageSrc || !user?.id) return;
                    try {
                      setUploadingImage(true);
                      // Draw cropped square to canvas with circular clip (WhatsApp-like)
                      const img = new Image();
                      img.crossOrigin = 'anonymous';
                      const blob = await new Promise((resolve, reject) => {
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          const size = previewSize;
                          canvas.width = size;
                          canvas.height = size;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return reject(new Error('Canvas context not available'));
                          ctx.clearRect(0, 0, size, size);
                          // Circular clip
                          ctx.save();
                          ctx.beginPath();
                          ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
                          ctx.closePath();
                          ctx.clip();
                          const scale = cropZoom;
                          const drawW = img.width * scale;
                          const drawH = img.height * scale;
                          const dx = size/2 - drawW/2 + cropX;
                          const dy = size/2 - drawH/2 + cropY;
                          ctx.drawImage(img, dx, dy, drawW, drawH);
                          ctx.restore();
                          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))), 'image/png', 0.95);
                        };
                        img.onerror = reject;
                        img.src = cropImageSrc;
                      });

                      // Upload blob (PNG to preserve transparent corners)
                      const fileExt = 'png';
                      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;
                      const { error: uploadError } = await supabase.storage
                        .from('profile-pictures')
                        .upload(filePath, blob, { contentType: 'image/png', upsert: true });
                      if (uploadError) throw uploadError;
                      const { data: publicData } = supabase.storage
                        .from('profile-pictures')
                        .getPublicUrl(filePath);
                      const publicUrl = publicData?.publicUrl || '';
                      setProfilePictureUrl(publicUrl);
                      await supabase
                        .from('business_profiles')
                        .update({ profile_picture_url: publicUrl })
                        .eq('user_id', user.id);
                      showToast('Profile image updated', 'success');
                      setShowCropper(false);
                    } catch (err) {
                      console.error(err);
                      showToast('Image crop/upload failed', 'error');
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BusinessProfilePage;
