import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { 
  CarIcon, 
  ClockIcon, 
  CurrencyRupeeIcon, 
  UserIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const Rentals = () => {
  const { user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRentals();
  }, [filter]);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('rentals')
        .select(`
          *,
          vehicles(make, model, license_plate, vehicle_type, vehicle_image_url),
          business_profiles(business_name, business_phone),
          driver_profiles(full_name, phone_number)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRentals(data || []);
    } catch (err) {
      console.error('Error fetching rentals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const filters = [
    { value: 'all', label: 'All Rentals' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Rentals
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your vehicle rental bookings
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === filterOption.value
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading rentals
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rentals List */}
        {rentals.length === 0 ? (
          <div className="text-center py-12">
            <CarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rentals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? "You haven't made any rental bookings yet."
                : `No ${filter} rentals found.`
              }
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => window.location.href = '/customer/vehicles'}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Vehicles
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {rentals.map((rental) => (
                <li key={rental.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {rental.vehicles?.vehicle_image_url ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={rental.vehicles.vehicle_image_url}
                              alt={rental.vehicles.make}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <CarIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {rental.vehicles?.make} {rental.vehicles?.model}
                            </p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                              {rental.status}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="mr-4">
                              {rental.vehicles?.license_plate}
                            </span>
                            <span className="mr-4">
                              {rental.business_profiles?.business_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(rental.total_amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(rental.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Rental Details */}
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>
                          {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>{rental.pickup_location}</span>
                      </div>
                      {rental.driver_profiles && (
                        <div className="flex items-center text-sm text-gray-500">
                          <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>{rental.driver_profiles.full_name}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>{rental.rental_type}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex space-x-3">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => window.location.href = `/customer/rentals/${rental.id}`}
                      >
                        View Details
                      </button>
                      {rental.status === 'pending' && (
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this rental?')) {
                              // Handle cancellation
                              console.log('Cancel rental:', rental.id);
                            }
                          }}
                        >
                          Cancel
                        </button>
                      )}
                      {rental.status === 'completed' && (
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={() => window.location.href = `/customer/reviews/new?rental_id=${rental.id}`}
                        >
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Rentals;
