import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Car, Building2, MessageSquare } from 'lucide-react';

const JobOfferModal = ({ 
  isOpen, 
  onClose, 
  driver, 
  vehicles = [], 
  onSubmit, 
  loading = false 
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [message, setMessage] = useState('');
  const [offerDetails, setOfferDetails] = useState({
    salary: '',
    workHours: '',
    benefits: '',
    startDate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedVehicle && vehicles.length > 0) {
      alert('Please select a vehicle for this job offer');
      return;
    }

    onSubmit({
      driver_id: driver.id,
      vehicle_id: selectedVehicle || null,
      message: message.trim() || undefined,
      offer_details: {
        ...offerDetails,
        salary: offerDetails.salary || undefined,
        workHours: offerDetails.workHours || undefined,
        benefits: offerDetails.benefits || undefined,
        startDate: offerDetails.startDate || undefined
      }
    });
  };

  const handleClose = () => {
    setSelectedVehicle('');
    setMessage('');
    setOfferDetails({
      salary: '',
      workHours: '',
      benefits: '',
      startDate: ''
    });
    onClose();
  };

  if (!isOpen || !driver) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 w-full max-w-2xl rounded-lg border border-gray-700 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Send Job Offer</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Driver Info */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              {driver.profile_picture_url ? (
                <img
                  src={driver.profile_picture_url}
                  alt={driver.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Building2 className="w-8 h-8 text-black" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {driver.full_name || driver.user_profiles?.full_name}
              </h3>
              <p className="text-gray-400">{driver.user_profiles?.email}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
                <span>{driver.experience_years} years experience</span>
                <span>⭐ {driver.rating || 'No rating'}</span>
                <span>{driver.total_trips} trips</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vehicle Selection */}
          {vehicles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assign Vehicle (Optional)
              </label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">No vehicle assignment</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.manufacturer} {vehicle.model} ({vehicle.year}) - {vehicle.license_plate}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Message to Driver
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a personalized message to the driver..."
              className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Offer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Salary/Compensation
              </label>
              <input
                type="text"
                value={offerDetails.salary}
                onChange={(e) => setOfferDetails(prev => ({ ...prev, salary: e.target.value }))}
                placeholder="e.g., ₹25,000/month"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Work Hours
              </label>
              <input
                type="text"
                value={offerDetails.workHours}
                onChange={(e) => setOfferDetails(prev => ({ ...prev, workHours: e.target.value }))}
                placeholder="e.g., 8 hours/day, 6 days/week"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Benefits
              </label>
              <input
                type="text"
                value={offerDetails.benefits}
                onChange={(e) => setOfferDetails(prev => ({ ...prev, benefits: e.target.value }))}
                placeholder="e.g., Health insurance, fuel allowance"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={offerDetails.startDate}
                onChange={(e) => setOfferDetails(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-black rounded-md hover:bg-primary/80 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Job Offer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default JobOfferModal;
