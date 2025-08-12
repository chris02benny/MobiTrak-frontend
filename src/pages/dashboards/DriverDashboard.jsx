import React from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import DashboardCard from '../../components/DashboardCard'

const DriverDashboard = () => {
  const sidebarItems = [
    { icon: '📊', label: 'Overview', onClick: () => {} },
    { icon: '🛣️', label: 'My Trips', onClick: () => {} },
    { icon: '📅', label: 'Schedule', onClick: () => {} },
    { icon: '📈', label: 'Performance', onClick: () => {} },
    { icon: '🚗', label: 'Vehicle Status', onClick: () => {} },
    { icon: '💰', label: 'Earnings', onClick: () => {} },
  ]

  return (
    <DashboardLayout title="Driver Dashboard" sidebarItems={sidebarItems}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Today's Trips"
          value="5"
          subtitle="Scheduled for today"
          icon="🛣️"
          trend="neutral"
          trendValue="Same as yesterday"
        />
        <DashboardCard
          title="Completed"
          value="3"
          subtitle="Trips finished"
          icon="✅"
          trend="up"
          trendValue="+1"
        />
        <DashboardCard
          title="Earnings Today"
          value="$245"
          subtitle="Total earned"
          icon="💰"
          trend="up"
          trendValue="+15%"
        />
        <DashboardCard
          title="Rating"
          value="4.9"
          subtitle="Customer rating"
          icon="⭐"
          trend="up"
          trendValue="+0.1"
        />
      </div>

      {/* Current Trip Status */}
      <div className="mb-8">
        <DashboardCard title="Current Trip Status" className="bg-primary/10 border-primary/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-primary mb-2">Trip #1247</h4>
              <p className="text-sm text-gray-300">Pickup: Downtown Mall</p>
              <p className="text-sm text-gray-300">Destination: Airport Terminal 2</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">Customer</h4>
              <p className="text-sm text-gray-300">Sarah Johnson</p>
              <p className="text-sm text-gray-300">Phone: (555) 123-4567</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">Status</h4>
              <p className="text-sm text-green-400 font-semibold">En Route to Pickup</p>
              <p className="text-sm text-gray-300">ETA: 8 minutes</p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Trips */}
        <DashboardCard title="Upcoming Trips" className="col-span-1">
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">Trip #1248</h4>
                  <p className="text-sm text-gray-300">Business District → Hotel Plaza</p>
                  <p className="text-xs text-gray-500">Customer: Mike Chen</p>
                </div>
                <span className="text-sm text-primary font-semibold">2:30 PM</span>
              </div>
            </div>
            <div className="border-l-4 border-gray-600 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">Trip #1249</h4>
                  <p className="text-sm text-gray-300">Residential Area → Shopping Center</p>
                  <p className="text-xs text-gray-500">Customer: Lisa Wong</p>
                </div>
                <span className="text-sm text-gray-400 font-semibold">4:15 PM</span>
              </div>
            </div>
            <div className="border-l-4 border-gray-600 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">Trip #1250</h4>
                  <p className="text-sm text-gray-300">Train Station → University</p>
                  <p className="text-xs text-gray-500">Customer: David Park</p>
                </div>
                <span className="text-sm text-gray-400 font-semibold">6:00 PM</span>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Vehicle Information */}
        <DashboardCard title="Vehicle Information" className="col-span-1">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Vehicle ID</span>
              <span className="text-white font-semibold">V-007</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Model</span>
              <span className="text-white font-semibold">Toyota Camry 2023</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Fuel Level</span>
              <span className="text-green-400 font-semibold">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Mileage</span>
              <span className="text-white font-semibold">45,230 miles</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Next Service</span>
              <span className="text-primary font-semibold">In 2,770 miles</span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <DashboardCard
          title="Weekly Performance"
          subtitle="This week's statistics"
          icon="📊"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Trips Completed</span>
              <span className="text-primary">28</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Distance</span>
              <span className="text-primary">1,245 miles</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Average Rating</span>
              <span className="text-primary">4.9/5.0</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Earnings Summary"
          subtitle="This week"
          icon="💰"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">$1,245</div>
            <div className="text-sm text-green-400">+18% from last week</div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Driving Score"
          subtitle="Safety & efficiency"
          icon="🏆"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">92/100</div>
            <div className="text-sm text-green-400">Excellent performance</div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  )
}

export default DriverDashboard
