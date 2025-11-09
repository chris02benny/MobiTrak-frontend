import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const TripsListPage = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/trips', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load trips');
      const data = await res.json();
      
      // Filter out pending_payment trips, only show confirmed/scheduled trips
      const confirmedTrips = (data.trips || []).filter(trip => 
        trip.status !== 'pending_payment'
      );
      
      setTrips(confirmedTrips);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const deleteTrip = async (id) => {
    if (!confirm('Delete this trip?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/trips/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Trip deleted');
      fetchTrips();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete trip');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: '#FFC107' }}>Confirmed Trips ({trips.length})</h2>
      </div>

      <div className="shadow rounded-lg" style={{ backgroundColor: '#1F1F1F' }}>
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : trips.length === 0 ? (
          <div className="p-6" style={{ color: '#888888' }}>No trips yet.</div>
        ) : (
          <div className="p-4 space-y-3">
            {trips.map(t => (
              <div key={t._id} className="rounded-full p-4 flex items-center justify-between" style={{ border: '1px solid #4a4a4a', backgroundColor: '#0D0D0D' }}>
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: '#FFC107' }}>{t.startAddress} → {t.endAddress}</div>
                  <div className="text-xs" style={{ color: '#888888' }}>{new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()} • {t.numDays || 1} day(s)</div>
                  <div className="text-xs" style={{ color: '#888888' }}>Distance: {t.distanceKm} km • Total: ₹ {Number(t.totalAmount || 0).toLocaleString()}</div>
                  <div className="text-xs" style={{ color: '#888888' }}>Vehicle: {t.vehicleId?.registeredNumber || t.vehicleId} • Driver: {t.driverId?.name || t.driverId}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${t.status === 'completed' ? 'bg-green-900 text-green-300' : t.status === 'in_progress' ? 'bg-blue-900 text-blue-300' : 'bg-gray-800 text-gray-300'}`}>{t.status}</span>
                  <button 
                    onClick={() => deleteTrip(t._id)} 
                    className="px-3 py-1 rounded-full text-sm transition-colors"
                    style={{ backgroundColor: '#FFC107', color: '#000000' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripsListPage;



