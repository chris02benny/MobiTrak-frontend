import React from 'react';

const AddVehiclePage = ({
  vehicleForm,
  setVehicleForm,
  handleAddVehicle,
  handleImageUpload,
  loading,
  isExtractingRC,
  isFieldUpdated,
  vehicleImageRef,
  rcImageRef
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: '#FFC107' }}>Add New Vehicle</h2>
        <p className="mt-2 text-sm" style={{ color: '#B0B0B0' }}>
          Upload your vehicle's RC book and we'll automatically extract the details
        </p>
      </div>

      <form onSubmit={handleAddVehicle} className="space-y-6">
        <div className="shadow rounded-lg p-6" style={{ backgroundColor: '#1F1F1F' }}>
          {/* Vehicle Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
              Vehicle Image (Optional)
            </label>
            <input
              ref={vehicleImageRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'vehicleImage')}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFC107] file:text-black hover:file:bg-[#FFB300] file:transition-all"
              style={{ color: '#B0B0B0' }}
            />
            {vehicleForm.vehicleImage && (
              <div className="mt-4">
                <img
                  src={vehicleForm.vehicleImage}
                  alt="Vehicle preview"
                  className="h-48 w-48 object-cover rounded-lg border-2"
                  style={{ borderColor: '#FFC107' }}
                />
              </div>
            )}
          </div>

          {/* RC Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
              RC Book Image (Required) *
            </label>
            <input
              ref={rcImageRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'rcImage')}
              required
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFC107] file:text-black hover:file:bg-[#FFB300] file:transition-all"
              style={{ color: '#B0B0B0' }}
            />
            {vehicleForm.rcImage && (
              <div className="mt-4">
                <img
                  src={vehicleForm.rcImage}
                  alt="RC preview"
                  className="h-48 w-48 object-cover rounded-lg border-2"
                  style={{ borderColor: '#FFC107' }}
                />
              </div>
            )}
            <p className="mt-2 text-xs" style={{ color: '#B0B0B0' }}>
              Upload a clear image of your vehicle's RC book. We'll automatically extract the details.
            </p>
            
            {/* RC Extraction Loading */}
            {isExtractingRC && (
              <div className="mt-3 flex items-center p-3 rounded-md" style={{ backgroundColor: '#0D0D0D', color: '#FFC107' }}>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-3" style={{ borderColor: '#FFC107' }}></div>
                <span className="text-sm font-medium">Extracting RC data...</span>
              </div>
            )}
          </div>
        </div>

        {/* RC Extracted Fields */}
        <div className="shadow rounded-lg p-6" style={{ backgroundColor: '#1F1F1F' }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: '#FFC107' }}>Vehicle Information</h3>
          <p className="text-sm mb-6" style={{ color: '#B0B0B0' }}>Auto-filled from RC book or enter manually</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Registered Number *
              </label>
              <input
                type="text"
                value={vehicleForm.registeredNumber}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, registeredNumber: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                  isFieldUpdated('Registration Number') ? 'ring-2 ring-green-500' : ''
                }`}
                style={{ 
                  borderColor: isFieldUpdated('Registration Number') ? '#4CAF50' : '#0D0D0D',
                  backgroundColor: '#0D0D0D',
                  color: '#FFFFFF'
                }}
                onFocus={(e) => !isFieldUpdated('Registration Number') && (e.target.style.borderColor = '#FFC107')}
                onBlur={(e) => !isFieldUpdated('Registration Number') && (e.target.style.borderColor = '#0D0D0D')}
                placeholder="e.g., KL-01-AB-1234"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Maker's Name *
              </label>
              <input
                type="text"
                value={vehicleForm.makersName}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, makersName: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                  isFieldUpdated('Manufacturer') ? 'ring-2 ring-green-500' : ''
                }`}
                style={{ 
                  borderColor: isFieldUpdated('Manufacturer') ? '#4CAF50' : '#0D0D0D',
                  backgroundColor: '#0D0D0D',
                  color: '#FFFFFF'
                }}
                onFocus={(e) => !isFieldUpdated('Manufacturer') && (e.target.style.borderColor = '#FFC107')}
                onBlur={(e) => !isFieldUpdated('Manufacturer') && (e.target.style.borderColor = '#0D0D0D')}
                placeholder="e.g., Toyota, Honda"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Registered Owner Name
              </label>
              <input
                type="text"
                value={vehicleForm.registeredOwnerName}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, registeredOwnerName: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                  isFieldUpdated('Owner Name') ? 'ring-2 ring-green-500' : ''
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
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Vehicle Class
              </label>
              <input
                type="text"
                value={vehicleForm.vehicleClass}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, vehicleClass: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                  isFieldUpdated('Vehicle Class') ? 'ring-2 ring-green-500' : ''
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
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Fuel Type
              </label>
              <input
                type="text"
                value={vehicleForm.fuel}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, fuel: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                  isFieldUpdated('Fuel Type') ? 'ring-2 ring-green-500' : ''
                }`}
                style={{ 
                  borderColor: isFieldUpdated('Fuel Type') ? '#4CAF50' : '#0D0D0D',
                  backgroundColor: '#0D0D0D',
                  color: '#FFFFFF'
                }}
                onFocus={(e) => !isFieldUpdated('Fuel Type') && (e.target.style.borderColor = '#FFC107')}
                onBlur={(e) => !isFieldUpdated('Fuel Type') && (e.target.style.borderColor = '#0D0D0D')}
                placeholder="e.g., Petrol, Diesel, CNG"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Seating Capacity
              </label>
              <input
                type="number"
                value={vehicleForm.seatingCapacity}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, seatingCapacity: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                  isFieldUpdated('Seating Capacity') ? 'ring-2 ring-green-500' : ''
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

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Certificate of Fitness - Valid From
              </label>
              <input
                type="date"
                value={vehicleForm.certificateOfFitnessFrom}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, certificateOfFitnessFrom: e.target.value }))}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#0D0D0D', backgroundColor: '#0D0D0D', color: '#FFFFFF' }}
                onFocus={(e) => e.target.style.borderColor = '#FFC107'}
                onBlur={(e) => e.target.style.borderColor = '#0D0D0D'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Certificate of Fitness - Valid To
              </label>
              <input
                type="date"
                value={vehicleForm.certificateOfFitnessTo}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, certificateOfFitnessTo: e.target.value }))}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#0D0D0D', backgroundColor: '#0D0D0D', color: '#FFFFFF' }}
                onFocus={(e) => e.target.style.borderColor = '#FFC107'}
                onBlur={(e) => e.target.style.borderColor = '#0D0D0D'}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Vehicle Type *
              </label>
              <select
                value={vehicleForm.vehicleType}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, vehicleType: e.target.value }))}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#0D0D0D', backgroundColor: '#0D0D0D', color: '#FFFFFF' }}
                onFocus={(e) => e.target.style.borderColor = '#FFC107'}
                onBlur={(e) => e.target.style.borderColor = '#0D0D0D'}
                required
              >
                <option value="" style={{ backgroundColor: '#0D0D0D' }}>Select Vehicle Type</option>
                <option value="Logistics" style={{ backgroundColor: '#0D0D0D' }}>Logistics</option>
                <option value="Passenger" style={{ backgroundColor: '#0D0D0D' }}>Passenger</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={loading || !vehicleForm.rcImage || isExtractingRC}
            className="px-6 py-3 text-sm font-medium rounded-lg flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            style={{ backgroundColor: '#FFC107', color: '#000000' }}
            onMouseEnter={(e) => !loading && !isExtractingRC && (e.currentTarget.style.backgroundColor = '#FFB300')}
            onMouseLeave={(e) => !loading && !isExtractingRC && (e.currentTarget.style.backgroundColor = '#FFC107')}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2" style={{ borderColor: '#000000' }}></div>
                Adding Vehicle...
              </>
            ) : isExtractingRC ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2" style={{ borderColor: '#000000' }}></div>
                Extracting RC Data...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Vehicle
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVehiclePage;
