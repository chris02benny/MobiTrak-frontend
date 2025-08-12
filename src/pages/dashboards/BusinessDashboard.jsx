import React from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import DashboardCard from '../../components/DashboardCard'

const BusinessDashboard = () => {
  const sidebarItems = [
    { icon: '📊', label: 'Overview', onClick: () => {} },
    { icon: '🚗', label: 'Fleet Management', onClick: () => {} },
    { icon: '📈', label: 'Analytics', onClick: () => {} },
    { icon: '🔧', label: 'Maintenance', onClick: () => {} },
    { icon: '👥', label: 'Drivers', onClick: () => {} },
    { icon: '📋', label: 'Reports', onClick: () => {} },
  ]

  return (
    <DashboardLayout title="Business Overview" sidebarItems={sidebarItems}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Vehicles"
          value="24"
          subtitle="Active fleet vehicles"
          icon="🚗"
          trend="up"
          trendValue="+2"
        />
        <DashboardCard
          title="Active Trips"
          value="12"
          subtitle="Currently in progress"
          icon="🛣️"
          trend="up"
          trendValue="+5"
        />
        <DashboardCard
          title="Revenue"
          value="$15,420"
          subtitle="This month"
          icon="💰"
          trend="up"
          trendValue="+12%"
        />
        <DashboardCard
          title="Maintenance Due"
          value="3"
          subtitle="Vehicles need service"
          icon="⚠️"
          trend="down"
          trendValue="-1"
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fleet Status */}
        <DashboardCard title="Fleet Status" className="col-span-1">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Available</span>
              <span className="text-green-400 font-semibold">18 vehicles</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">In Transit</span>
              <span className="text-primary font-semibold">5 vehicles</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Maintenance</span>
              <span className="text-red-400 font-semibold">1 vehicle</span>
            </div>
          </div>
        </DashboardCard>

        {/* Recent Activities */}
        <DashboardCard title="Recent Activities" className="col-span-1">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span className="text-gray-300">Trip #1234 completed</span>
              <span className="text-gray-500 ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
              <span className="text-gray-300">Vehicle V-001 started trip</span>
              <span className="text-gray-500 ml-auto">15 min ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
              <span className="text-gray-300">Maintenance alert for V-003</span>
              <span className="text-gray-500 ml-auto">1 hour ago</span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <DashboardCard
          title="Driver Performance"
          subtitle="Top performing drivers this month"
          icon="🏆"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>John Doe</span>
              <span className="text-primary">98% rating</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Jane Smith</span>
              <span className="text-primary">96% rating</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Mike Johnson</span>
              <span className="text-primary">94% rating</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Fuel Efficiency"
          subtitle="Average across fleet"
          icon="⛽"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">24.5 MPG</div>
            <div className="text-sm text-green-400">+2.1% improvement</div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Customer Satisfaction"
          subtitle="Based on recent feedback"
          icon="⭐"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">4.8/5.0</div>
            <div className="text-sm text-green-400">+0.2 from last month</div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  )
}

export default BusinessDashboard
