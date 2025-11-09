import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const PendingTripsPage = () => {
  const [pendingTrips, setPendingTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch pending trips
  const fetchPendingTrips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        toast.error('Please log in to view pending trips');
        return;
      }
      
      const res = await fetch('/api/enquiries/business/pending-trips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to load pending trips');
      }
      
      const data = await res.json();
      setPendingTrips(data.enquiries || []);
    } catch (error) {
      console.error('Error fetching pending trips:', error);
      toast.error('Failed to load pending trips: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load pending trips on component mount
  useEffect(() => {
    fetchPendingTrips();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_payment': return 'bg-yellow-900 text-yellow-300';
      case 'scheduled': return 'bg-blue-900 text-blue-300';
      case 'in_progress': return 'bg-green-900 text-green-300';
      case 'completed': return 'bg-green-900 text-green-300';
      case 'cancelled': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-800 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: '#FFC107' }}>Pending Trip Confirmations</h2>
      </div>

      <div className="shadow rounded-2xl" style={{ backgroundColor: '#1F1F1F' }}>
        <div className="p-4 border-b" style={{ borderColor: '#4a4a4a' }}>
          <h3 className="text-lg font-medium" style={{ color: '#FFC107' }}>
            Trips Awaiting Customer Payment ({pendingTrips.length})
          </h3>
          <p className="text-sm mt-1" style={{ color: '#888888' }}>
            These trips have been created and are waiting for customer payment confirmation.
          </p>
        </div>
        
        {loading ? (
          <div className="p-6">Loading pending trips...</div>
        ) : pendingTrips.length === 0 ? (
          <div className="p-6" style={{ color: '#888888' }}>No pending trips at the moment.</div>
        ) : (
          <div className="p-4 space-y-4">
            {pendingTrips.map((trip) => (
              <div key={trip.id} className="rounded-2xl p-4 hover:shadow-md transition-shadow" style={{ border: '1px solid #4a4a4a', backgroundColor: '#0D0D0D' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-sm font-medium" style={{ color: '#FFC107' }}>
                        {trip.vehicle.number} - {trip.vehicle.name}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('pending_payment')}`}>
                        Awaiting Payment
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-2" style={{ color: '#888888' }}>
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>Customer:</strong> {trip.customer.name}
                      </div>
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>Vehicle Class:</strong> {trip.vehicle.class}
                      </div>
                    </div>
                    
                    <div className="text-sm mb-2" style={{ color: '#888888' }}>
                      <strong style={{ color: '#FFFFFF' }}>Route:</strong> {trip.route.from} → {trip.route.to}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-2" style={{ color: '#888888' }}>
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>Dates:</strong> {new Date(trip.dates.start).toLocaleDateString()} - {new Date(trip.dates.end).toLocaleDateString()}
                      </div>
                      <div>
                        <strong style={{ color: '#FFFFFF' }}>Trip ID:</strong> {trip.tripId}
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: '#FFC107' }}>
                      <div className="text-sm" style={{ color: '#000000' }}>
                        <strong>Total Amount:</strong> ₹{trip.amount.total?.toLocaleString()}
                      </div>
                      <div className="text-xs" style={{ color: '#333333' }}>
                        <strong>Advance Required:</strong> ₹{trip.amount.advance?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingTripsPage;

