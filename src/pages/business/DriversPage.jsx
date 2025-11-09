import React from 'react';
import HireDriversPage from './HireDriversPage';
import DriverStatusPage from './DriverStatusPage';
import ManageDriversPage from './ManageDriversPage';

const DriversPage = ({ 
  activeSubTab, 
  setActiveSubTab,
  drivers, 
  hiredDrivers, 
  pendingOffers,
  driversLoading, 
  hiredDriversLoading, 
  pendingOffersLoading,
  fetchAvailableDrivers, 
  fetchHiredDrivers,
  fetchPendingOffers,
  selectedDriver,
  showDriverDetails,
  setSelectedDriver,
  setShowDriverDetails,
  offerForm,
  setOfferForm,
  showOfferModal,
  setShowOfferModal
}) => {
  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#FFC107' }}>Your Drivers</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b" style={{ borderColor: '#1F1F1F' }}>
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveSubTab(prev => ({ ...prev, drivers: 'hire' }))}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeSubTab.drivers === 'hire'
                ? 'border-[#FFC107] text-[#FFC107]'
                : 'border-transparent text-[#B0B0B0] hover:text-[#FFFFFF] hover:border-[#B0B0B0]'
            }`}
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Hire Drivers
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab(prev => ({ ...prev, drivers: 'status' }))}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeSubTab.drivers === 'status'
                ? 'border-[#FFC107] text-[#FFC107]'
                : 'border-transparent text-[#B0B0B0] hover:text-[#FFFFFF] hover:border-[#B0B0B0]'
            }`}
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Driver Status
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab(prev => ({ ...prev, drivers: 'manage' }))}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeSubTab.drivers === 'manage'
                ? 'border-[#FFC107] text-[#FFC107]'
                : 'border-transparent text-[#B0B0B0] hover:text-[#FFFFFF] hover:border-[#B0B0B0]'
            }`}
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Manage Drivers
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeSubTab.drivers === 'hire' && (
          <HireDriversPage 
            drivers={drivers}
            driversLoading={driversLoading}
            fetchAvailableDrivers={fetchAvailableDrivers}
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

        {activeSubTab.drivers === 'status' && (
          <DriverStatusPage 
            pendingOffers={pendingOffers}
            pendingOffersLoading={pendingOffersLoading}
            fetchPendingOffers={fetchPendingOffers}
          />
        )}

        {activeSubTab.drivers === 'manage' && (
          <ManageDriversPage 
            hiredDrivers={hiredDrivers}
            hiredDriversLoading={hiredDriversLoading}
            fetchHiredDrivers={fetchHiredDrivers}
            selectedDriver={selectedDriver}
            showDriverDetails={showDriverDetails}
            setSelectedDriver={setSelectedDriver}
            setShowDriverDetails={setShowDriverDetails}
          />
        )}
      </div>
    </div>
  );
};

export default DriversPage;
