import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import { businessSidebarItems } from '../../config/businessSidebarConfig';
import { supabase } from '../../utils/supabase';
import {
  Car,
  Route,
  DollarSign,
  AlertTriangle,
  Trophy,
  Fuel,
  Star,
  Eye,
  ChevronRight
} from 'lucide-react';

const BusinessDashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapElRef = useRef(null);
  const markerRef = useRef(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const fetchVehicles = async () => {
    if (!user?.id) return;

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
      showToast('Error fetching vehicles.', 'error');
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user?.id]);

  // Load Google Maps JS API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    if (window.google && window.google.maps) {
      setMapsReady(true);
      return;
    }
    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapsReady(true);
    document.body.appendChild(script);
  }, []);

  // Fetch existing business location
  useEffect(() => {
    const fetchLocation = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('business_profiles')
        .select('latitude, longitude')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && data) {
        setLatitude(data.latitude ?? null);
        setLongitude(data.longitude ?? null);
      }
    };
    fetchLocation();
  }, [user?.id]);

  // Initialize Map
  useEffect(() => {
    if (!mapsReady || !mapElRef.current) return;
    const center = (latitude && longitude) ? { lat: Number(latitude), lng: Number(longitude) } : { lat: 20.5937, lng: 78.9629 };
    const map = new window.google.maps.Map(mapElRef.current, {
      center,
      zoom: (latitude && longitude) ? 14 : 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });
    mapRef.current = map;

    // Place existing marker
    if (latitude && longitude) {
      markerRef.current = new window.google.maps.Marker({ position: center, map, draggable: true });
      markerRef.current.addListener('dragend', (e) => {
        setLatitude(e.latLng.lat());
        setLongitude(e.latLng.lng());
      });
    }

    // Click to set marker
    map.addListener('click', (e) => {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      if (!markerRef.current) {
        markerRef.current = new window.google.maps.Marker({ position: pos, map, draggable: true });
        markerRef.current.addListener('dragend', (ev) => {
          setLatitude(ev.latLng.lat());
          setLongitude(ev.latLng.lng());
        });
      } else {
        markerRef.current.setPosition(pos);
      }
      setLatitude(pos.lat);
      setLongitude(pos.lng);
    });
  }, [mapsReady]);

  const handleSaveLocation = async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({ latitude, longitude })
        .eq('user_id', user.id);
      if (error) throw error;
      showToast('Business location saved successfully', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to save location', 'error');
    }
  };



  return (
    <DashboardLayout title="Business Overview" sidebarItems={businessSidebarItems}>
      <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard
              title="Total Vehicles"
              value={vehicles.length.toString()}
              subtitle="Active fleet vehicles"
              icon={<Car className="w-6 h-6" />}
              trend="up"
              trendValue="+2"
            />
            <DashboardCard
              title="Active Trips"
              value="12"
              subtitle="Currently in progress"
              icon={<Route className="w-6 h-6" />}
              trend="up"
              trendValue="+5"
            />
            <DashboardCard
              title="Revenue"
              value="$15,420"
              subtitle="This month"
              icon={<DollarSign className="w-6 h-6" />}
              trend="up"
              trendValue="+12%"
            />
            <DashboardCard
              title="Maintenance Due"
              value="3"
              subtitle="Vehicles need service"
              icon={<AlertTriangle className="w-6 h-6" />}
              trend="down"
              trendValue="-1"
            />
          </div>

          {/* Main Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Fleet Status */}
            <DashboardCard title="Fleet Status" className="col-span-1">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Available</span>
                  <span className="text-green-400 font-semibold">18 vehicles</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">In Transit</span>
                  <span className="text-primary font-semibold">5 vehicles</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Maintenance</span>
                  <span className="text-red-400 font-semibold">1 vehicle</span>
                </div>
              </div>
            </DashboardCard>

            {/* Recent Activities */}
            <DashboardCard title="Recent Activities" className="col-span-1">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Trip #1234 completed</span>
                  <span className="text-gray-500 ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span className="text-gray-300">Vehicle V-001 started trip</span>
                  <span className="text-gray-500 ml-auto">15 min ago</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Maintenance alert for V-003</span>
                  <span className="text-gray-500 ml-auto">1 hour ago</span>
                </div>
              </div>
            </DashboardCard>
          </div>

          {/* Business Location (Pin on Map) */}
          <div className="grid grid-cols-1 gap-8 mt-8">
            <DashboardCard title="Business Location" className="col-span-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm">Pin your business location on the map</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
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
                              markerRef.current = new window.google.maps.Marker({ position: coords, map: mapRef.current, draggable: true });
                              markerRef.current.addListener('dragend', (e) => {
                                setLatitude(e.latLng.lat());
                                setLongitude(e.latLng.lng());
                              });
                            } else {
                              markerRef.current.setPosition(coords);
                            }
                          }
                          setLatitude(coords.lat);
                          setLongitude(coords.lng);
                          showToast('Location set to current position', 'success');
                        },
                        () => showToast('Unable to retrieve your location', 'error'),
                        { enableHighAccuracy: true }
                      );
                    }}
                    className="enterprise-button-secondary px-4 py-2"
                  >
                    Use My Current Location
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLocation}
                    className="enterprise-button px-4 py-2"
                    disabled={!latitude || !longitude}
                  >
                    Save Location
                  </button>
                </div>
              </div>
              <div ref={mapElRef} className="w-full h-72 rounded-lg border border-gray-700 bg-gray-800" />
              <div className="text-xs text-gray-500 mt-2">Lat: {latitude ?? '-'} | Lng: {longitude ?? '-'}</div>
              {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                <div className="text-xs text-red-400 mt-2">Set VITE_GOOGLE_MAPS_API_KEY in mobitrak-app/.env to enable the map.</div>
              )}
            </DashboardCard>
          </div>

          {/* Your Vehicles Section */}
          <div className="mt-8">
            <DashboardCard 
              className="mb-6"
            >
              {/* Custom header with expandable arrow button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-200">Your Vehicles</h3>
                <button
                  onClick={() => navigate('/business/vehicles')}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/80 text-black rounded-full transition-colors duration-200"
                >
                  <span className="text-sm font-medium">View more</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {vehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No vehicles added yet</p>
                    <button
                      onClick={() => navigate('/business/vehicles')}
                      className="px-4 py-2 bg-primary hover:bg-primary/80 text-black rounded-md transition-colors"
                    >
                      Add Your First Vehicle
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {vehicles.slice(0, 3).map((vehicle) => (
                        <div key={vehicle.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-white font-medium">
                                {vehicle.manufacturer} {vehicle.model}
                              </h4>
                              <p className="text-gray-400 text-sm">{vehicle.registration_number}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vehicle.status === 'available' ? 'bg-green-500/20 text-green-400' :
                              vehicle.status === 'in_use' ? 'bg-yellow-500/20 text-yellow-400' :
                              vehicle.status === 'under_maintenance' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {vehicle.status === 'available' ? 'Available' :
                               vehicle.status === 'in_use' ? 'In Use' :
                               vehicle.status === 'under_maintenance' ? 'Maintenance' :
                               vehicle.status}
                            </span>
                          </div>
                          <div className="w-full h-24 bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                            {vehicle.vehicle_image_url ? (
                              <img
                                src={vehicle.vehicle_image_url}
                                alt={`${vehicle.manufacturer} ${vehicle.model}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Car className="w-8 h-8 text-gray-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            Added {new Date(vehicle.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </DashboardCard>
          </div>

          {/* Additional Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <DashboardCard
              title="Driver Performance"
              subtitle="Top performing drivers this month"
              icon={<Trophy className="w-6 h-6" />}
            >
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>John Doe</span>
                  <span className="text-primary">98% rating</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Jane Smith</span>
                  <span className="text-primary">96% rating</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Mike Johnson</span>
                  <span className="text-primary">94% rating</span>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Fuel Efficiency"
              subtitle="Average across fleet"
              icon={<Fuel className="w-6 h-6" />}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">24.5 MPG</div>
                <div className="text-sm text-green-400">+2.1% improvement</div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Customer Satisfaction"
              subtitle="Based on recent feedback"
              icon={<Star className="w-6 h-6" />}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">4.8/5.0</div>
                <div className="text-sm text-green-400">+0.2 from last month</div>
              </div>
            </DashboardCard>
          </div>
      </>
    </DashboardLayout>
  );
};

export default BusinessDashboard;
