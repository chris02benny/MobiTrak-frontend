import React, { useState } from 'react';
import AddVehiclePage from './AddVehiclePage';
import ViewVehiclesPage from './ViewVehiclesPage';

const VehiclesPage = ({
  vehicles,
  loading,
  vehicleForm,
  setVehicleForm,
  handleAddVehicle,
  handleImageUpload,
  isExtractingRC,
  isFieldUpdated,
  vehicleImageRef,
  rcImageRef,
  handleViewVehicleDetails,
  handleEditVehicle,
  handleDeleteVehicle
}) => {
  const [activeTab, setActiveTab] = useState('view');

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#FFC107' }}>Your Vehicles</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b" style={{ borderColor: '#1F1F1F' }}>
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('view')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'view'
                ? 'border-[#FFC107] text-[#FFC107]'
                : 'border-transparent text-[#B0B0B0] hover:text-[#FFFFFF] hover:border-[#B0B0B0]'
            }`}
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View Vehicles
            </div>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'add'
                ? 'border-[#FFC107] text-[#FFC107]'
                : 'border-transparent text-[#B0B0B0] hover:text-[#FFFFFF] hover:border-[#B0B0B0]'
            }`}
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Vehicle
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'view' && (
          <ViewVehiclesPage
            vehicles={vehicles}
            loading={loading}
            handleViewVehicleDetails={handleViewVehicleDetails}
            handleEditVehicle={handleEditVehicle}
            handleDeleteVehicle={handleDeleteVehicle}
          />
        )}

        {activeTab === 'add' && (
          <AddVehiclePage
            vehicleForm={vehicleForm}
            setVehicleForm={setVehicleForm}
            handleAddVehicle={handleAddVehicle}
            handleImageUpload={handleImageUpload}
            loading={loading}
            isExtractingRC={isExtractingRC}
            isFieldUpdated={isFieldUpdated}
            vehicleImageRef={vehicleImageRef}
            rcImageRef={rcImageRef}
          />
        )}
      </div>
    </div>
  );
};

export default VehiclesPage;
