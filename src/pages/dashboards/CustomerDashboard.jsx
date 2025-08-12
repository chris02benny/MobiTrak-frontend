import React from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import DashboardCard from '../../components/DashboardCard'

const CustomerDashboard = () => {
  const sidebarItems = [
    { icon: '📊', label: 'Overview', onClick: () => {} },
    { icon: '🚗', label: 'Book a Ride', onClick: () => {} },
    { icon: '📋', label: 'My Bookings', onClick: () => {} },
    { icon: '📈', label: 'Trip History', onClick: () => {} },
    { icon: '💳', label: 'Payment Methods', onClick: () => {} },
    { icon: '⭐', label: 'Rate & Review', onClick: () => {} },
  ]

  return (
    <DashboardLayout title="Customer Dashboard" sidebarItems={sidebarItems}>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Book New Ride"
          subtitle="Quick booking"
          icon="🚗"
          className="bg-primary/10 border-primary/30 hover:bg-primary/20"
        />
        <DashboardCard
          title="Active Bookings"
          value="2"
          subtitle="Current trips"
          icon="📋"
          trend="neutral"
          trendValue="2 pending"
        />
        <DashboardCard
          title="Total Trips"
          value="47"
          subtitle="All time"
          icon="📈"
          trend="up"
          trendValue="+3 this month"
        />
        <DashboardCard
          title="Saved Locations"
          value="5"
          subtitle="Favorite places"
          icon="📍"
        />
      </div>

      {/* Current Trip Status */}
      <div className="mb-8">
        <DashboardCard title="Current Trip" className="bg-green-500/10 border-green-500/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-green-400 mb-2">Trip #1247</h4>
              <p className="text-sm text-gray-300">From: Your Location</p>
              <p className="text-sm text-gray-300">To: Downtown Office</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">Driver</h4>
              <p className="text-sm text-gray-300">John Doe</p>
              <p className="text-sm text-gray-300">⭐ 4.9 rating</p>
              <p className="text-sm text-gray-300">📞 (555) 987-6543</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">Status</h4>
              <p className="text-sm text-green-400 font-semibold">Driver En Route</p>
              <p className="text-sm text-gray-300">ETA: 5 minutes</p>
              <p className="text-sm text-gray-300">Vehicle: Toyota Camry (V-007)</p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Bookings */}
        <DashboardCard title="Upcoming Bookings" className="col-span-1">
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">Airport Transfer</h4>
                  <p className="text-sm text-gray-300">Home → International Airport</p>
                  <p className="text-xs text-gray-500">Tomorrow, 6:00 AM</p>
                </div>
                <span className="text-sm text-primary font-semibold">Confirmed</span>
              </div>
            </div>
            <div className="border-l-4 border-gray-600 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">Business Meeting</h4>
                  <p className="text-sm text-gray-300">Office → Conference Center</p>
                  <p className="text-xs text-gray-500">Friday, 2:00 PM</p>
                </div>
                <span className="text-sm text-gray-400 font-semibold">Pending</span>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Recent Trip History */}
        <DashboardCard title="Recent Trips" className="col-span-1">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <div>
                <p className="text-sm font-medium">Home → Shopping Mall</p>
                <p className="text-xs text-gray-500">Yesterday, 3:30 PM</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary font-semibold">$18.50</p>
                <p className="text-xs text-gray-500">⭐ 5.0</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <div>
                <p className="text-sm font-medium">Office → Restaurant</p>
                <p className="text-xs text-gray-500">Monday, 7:15 PM</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary font-semibold">$12.75</p>
                <p className="text-xs text-gray-500">⭐ 4.8</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-sm font-medium">Train Station → Home</p>
                <p className="text-xs text-gray-500">Sunday, 9:45 PM</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary font-semibold">$22.30</p>
                <p className="text-xs text-gray-500">⭐ 4.9</p>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <DashboardCard
          title="Monthly Summary"
          subtitle="This month's activity"
          icon="📊"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Trips</span>
              <span className="text-primary">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Spent</span>
              <span className="text-primary">$245.80</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Average Rating Given</span>
              <span className="text-primary">4.8/5.0</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Favorite Routes"
          subtitle="Most used destinations"
          icon="📍"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Home ↔ Office</span>
              <span className="text-primary">18 trips</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Home ↔ Airport</span>
              <span className="text-primary">8 trips</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Office ↔ Mall</span>
              <span className="text-primary">6 trips</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Loyalty Status"
          subtitle="Rewards & benefits"
          icon="🏆"
        >
          <div className="text-center">
            <div className="text-lg font-bold text-primary mb-2">Gold Member</div>
            <div className="text-sm text-gray-300 mb-2">1,250 points earned</div>
            <div className="text-xs text-green-400">Next tier: 750 points to go</div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  )
}

export default CustomerDashboard
