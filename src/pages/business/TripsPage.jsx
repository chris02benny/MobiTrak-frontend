import React from 'react';
import TripsTab from '../TripsTab';
import TripsListPage from './TripsListPage';
import PendingTripsPage from './PendingTripsPage';

const TripsPage = ({ 
  activeSubTab, 
  setActiveSubTab, 
  vehicles, 
  fetchVehicles 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: '#FEEE00' }}>Trips</h2>
      </div>

      {/* Trips Sub Navigation */}
      <div className="shadow rounded-lg" style={{ backgroundColor: '#232323' }}>
        <div className="border-b" style={{ borderColor: '#3a3a3a' }}>
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveSubTab(prev => ({ ...prev, trips: 'add' }))}
              className="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              style={activeSubTab.trips === 'add' ? {
                borderColor: '#FEEE00',
                color: '#FEEE00'
              } : {
                borderColor: 'transparent',
                color: '#888888'
              }}
              onMouseEnter={(e) => {
                if (activeSubTab.trips !== 'add') {
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSubTab.trips !== 'add') {
                  e.currentTarget.style.color = '#888888';
                }
              }}
            >
              Add Trip
            </button>
            <button
              onClick={() => setActiveSubTab(prev => ({ ...prev, trips: 'pending' }))}
              className="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              style={activeSubTab.trips === 'pending' ? {
                borderColor: '#FEEE00',
                color: '#FEEE00'
              } : {
                borderColor: 'transparent',
                color: '#888888'
              }}
              onMouseEnter={(e) => {
                if (activeSubTab.trips !== 'pending') {
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSubTab.trips !== 'pending') {
                  e.currentTarget.style.color = '#888888';
                }
              }}
            >
              Pending Trips
            </button>
            <button
              onClick={() => setActiveSubTab(prev => ({ ...prev, trips: 'view' }))}
              className="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              style={activeSubTab.trips === 'view' ? {
                borderColor: '#FEEE00',
                color: '#FEEE00'
              } : {
                borderColor: 'transparent',
                color: '#888888'
              }}
              onMouseEnter={(e) => {
                if (activeSubTab.trips !== 'view') {
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSubTab.trips !== 'view') {
                  e.currentTarget.style.color = '#888888';
                }
              }}
            >
              Confirmed Trips
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeSubTab.trips === 'add' && (
            <TripsTab vehicles={vehicles} onRefreshVehicles={fetchVehicles} />
          )}

          {activeSubTab.trips === 'pending' && (
            <PendingTripsPage />
          )}

          {activeSubTab.trips === 'view' && (
            <TripsListPage />
          )}
        </div>
      </div>
    </div>
  );
};

export default TripsPage;



