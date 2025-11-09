import React from 'react';

const ViewVehiclesPage = ({ 
  vehicles, 
  loading, 
  handleViewVehicleDetails, 
  handleEditVehicle, 
  handleDeleteVehicle 
}) => {
  return (
    <div>
      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#FFC107' }}></div>
          <p className="mt-4 text-lg" style={{ color: '#B0B0B0' }}>Loading vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="p-12 text-center">
          <svg className="mx-auto h-16 w-16 mb-4" style={{ color: '#B0B0B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 14H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
          </svg>
          <h3 className="text-xl font-medium mb-2" style={{ color: '#FFC107' }}>No vehicles found</h3>
          <p className="text-sm mb-6" style={{ color: '#B0B0B0' }}>You haven't added any vehicles yet. Go to the "Add Vehicle" tab to add your first vehicle.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle._id} className="rounded-lg shadow-sm hover:shadow-md transition-all duration-200" style={{ backgroundColor: '#1F1F1F' }}>
                  <div className="flex flex-col md:flex-row">
                    {/* Left Column - Vehicle Image */}
                    <div className="md:w-1/3 p-4">
                      {vehicle.vehicleImage?.url ? (
                        <img
                          src={vehicle.vehicleImage.url}
                          alt="Vehicle"
                          className="w-full h-48 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-48 rounded-md flex items-center justify-center" style={{ backgroundColor: '#0D0D0D' }}>
                          <svg className="h-16 w-16" style={{ color: '#B0B0B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 14H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Right Column - Details and Actions */}
                    <div className="md:w-2/3 p-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-semibold mb-1" style={{ color: '#FFC107' }}>
                            {vehicle.registeredNumber}
                          </h3>
                          <p className="text-base font-medium" style={{ color: '#FFFFFF' }}>{vehicle.makersName}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {vehicle.seatingCapacity && (
                            <div>
                              <p className="text-xs font-medium" style={{ color: '#B0B0B0' }}>Seating Capacity</p>
                              <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                                {vehicle.seatingCapacity} seats
                              </p>
                            </div>
                          )}
                          {vehicle.vehicleType && (
                            <div>
                              <p className="text-xs font-medium" style={{ color: '#B0B0B0' }}>Vehicle Type</p>
                              <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                                {vehicle.vehicleType}
                              </p>
                            </div>
                          )}
                          {vehicle.fuel && (
                            <div>
                              <p className="text-xs font-medium" style={{ color: '#B0B0B0' }}>Fuel Type</p>
                              <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                                {vehicle.fuel}
                              </p>
                            </div>
                          )}
                          {vehicle.vehicleClass && (
                            <div>
                              <p className="text-xs font-medium" style={{ color: '#B0B0B0' }}>Vehicle Class</p>
                              <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                                {vehicle.vehicleClass}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-between items-center pt-4 mt-4 border-t" style={{ borderColor: '#0D0D0D' }}>
                        <button
                          onClick={() => handleViewVehicleDetails(vehicle)}
                          className="px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm"
                          style={{ backgroundColor: '#FFC107', color: '#0D0D0D' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFB300'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFC107'}
                        >
                          View Details
                        </button>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEditVehicle(vehicle)}
                            className="p-2 rounded-md transition-all duration-200"
                            style={{ color: '#FFC107' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#0D0D0D';
                              e.currentTarget.style.color = '#FFB300';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#FFC107';
                            }}
                            title="Edit Vehicle"
                          >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(vehicle._id)}
                            className="p-2 rounded-md transition-all duration-200"
                            style={{ color: '#F44336' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#0D0D0D';
                              e.currentTarget.style.color = '#D32F2F';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#F44336';
                            }}
                            title="Delete Vehicle"
                          >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          )}
    </div>
  );
};

export default ViewVehiclesPage;
