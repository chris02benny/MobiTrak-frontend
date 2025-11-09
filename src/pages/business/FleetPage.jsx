import React from 'react';

const FleetPage = ({ 
  vehicles, 
  loading, 
  clearVehicleForm, 
  setShowAddVehicle, 
  handleViewVehicleDetails, 
  handleEditVehicle, 
  handleDeleteVehicle 
}) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: '#FFC107' }}>Fleet Management</h2>
        <button
          onClick={() => {
            clearVehicleForm();
            setShowAddVehicle(true);
          }}
          className="px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
          style={{ backgroundColor: '#FFC107', color: '#0D0D0D' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFB300'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFC107'}
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Vehicle
        </button>
      </div>

      {/* Vehicles List */}
      <div className="shadow rounded-lg" style={{ backgroundColor: '#1F1F1F' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: '#0D0D0D' }}>
          <h3 className="text-lg font-medium" style={{ color: '#FFC107' }}>Your Vehicles ({vehicles.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#FFC107' }}></div>
            <p className="mt-2" style={{ color: '#B0B0B0' }}>Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="mx-auto h-12 w-12" style={{ color: '#B0B0B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#FFC107' }}>No vehicles</h3>
            <p className="mt-1 text-sm" style={{ color: '#B0B0B0' }}>Get started by adding your first vehicle.</p>
            <div className="mt-6">
              <button
                onClick={() => {
                  clearVehicleForm();
                  setShowAddVehicle(true);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: '#FFC107', color: '#0D0D0D' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFB300'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFC107'}
              >
                Add Vehicle
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle._id} className="rounded-lg shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: '#0D0D0D', border: '1px solid #1F1F1F' }}>
                  <div className="flex">
                    {/* Left Column - Vehicle Image */}
                    <div className="w-1/3 p-4">
                      {vehicle.vehicleImage?.url ? (
                        <img
                          src={vehicle.vehicleImage.url}
                          alt="Vehicle"
                          className="w-full h-40 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-40 rounded-md flex items-center justify-center" style={{ backgroundColor: '#1F1F1F' }}>
                          <svg className="h-12 w-12" style={{ color: '#B0B0B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Right Column - Details and Actions */}
                    <div className="w-2/3 p-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-semibold" style={{ color: '#FFC107' }}>
                            {vehicle.registeredNumber}
                          </h3>
                          <p className="text-sm" style={{ color: '#FFFFFF' }}>{vehicle.makersName}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            {/* <p className="text-sm text-gray-500">
                              {vehicle.make} ({vehicle.year})
                            </p> */}
                            {vehicle.seatingCapacity && (
                              <p className="text-sm" style={{ color: '#B0B0B0' }}>
                                Seats: {vehicle.seatingCapacity}
                              </p>
                            )}
                            {vehicle.vehicleType && (
                              <p className="text-sm" style={{ color: '#B0B0B0' }}>
                                Type: {vehicle.vehicleType}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: '#1F1F1F' }}>
                        <button
                          onClick={() => handleViewVehicleDetails(vehicle)}
                          className="px-3 py-1 rounded font-medium transition-colors"
                          style={{ backgroundColor: '#FFC107', color: '#0D0D0D' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFB300'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFC107'}
                        >
                          View Details
                        </button>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEditVehicle(vehicle)}
                            className="p-2 rounded-md transition-colors"
                            style={{ color: '#FFC107' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#1F1F1F';
                              e.currentTarget.style.color = '#FFB300';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#FFC107';
                            }}
                            title="Edit Vehicle"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(vehicle._id)}
                            className="p-2 rounded-md transition-colors"
                            style={{ color: '#F44336' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#1F1F1F';
                              e.currentTarget.style.color = '#D32F2F';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#F44336';
                            }}
                            title="Delete Vehicle"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetPage;



