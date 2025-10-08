import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfilePicture } from '../hooks/useProfilePicture';
import {
  Home,
  Car,
  Users,
  BarChart3,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  Phone,
  Info,
  ExternalLink,
  Crown,
  User,
  Settings,
  LogOut,
  Plus,
  FileText,
  Tag,
  ClipboardList,
  TrendingUp,
  CheckCircle,
  Star,
  Route
} from 'lucide-react';

const StickySidebar = ({ sidebarItems = [] }) => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { profilePicture } = useProfilePicture();
  
  // Debug log
  React.useEffect(() => {
    console.log('StickySidebar - Profile picture state:', profilePicture);
  }, [profilePicture]);

  // Default navigation items based on user role
  const getDefaultNavigationItems = () => {
    const commonItems = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: Home,
        path: `/dashboard/${userRole}`,
        description: 'Overview and main dashboard'
      }
    ];

    if (userRole === 'business') {
      return [
        ...commonItems,
        {
          id: 'vehicles',
          title: 'Vehicles',
          icon: Car,
          path: '/business/vehicles',
          description: 'Manage your vehicle fleet'
        },
        {
          id: 'labels',
          title: 'Manage Labels',
          icon: Tag,
          path: '/business/labels',
          description: 'Organize vehicles with labels'
        },
        {
          id: 'drivers',
          title: 'Driver Management',
          icon: Users,
          path: '/business/drivers',
          description: 'Hire and manage drivers'
        },
        {
          id: 'reports',
          title: 'Reports',
          icon: BarChart3,
          path: '/business/reports',
          description: 'View business analytics'
        }
      ];
    }

    if (userRole === 'driver') {
      return [
        ...commonItems,
        {
          id: 'trips',
          title: 'My Trips',
          icon: Route,
          path: '/driver/trips',
          description: 'View and manage your trips'
        },
        {
          id: 'schedule',
          title: 'Schedule',
          icon: Calendar,
          path: '/driver/schedule',
          description: 'Manage your availability'
        },
        {
          id: 'performance',
          title: 'Performance',
          icon: TrendingUp,
          path: '/driver/performance',
          description: 'Track your performance metrics'
        },
        {
          id: 'earnings',
          title: 'Earnings',
          icon: CreditCard,
          path: '/driver/earnings',
          description: 'Track your earnings'
        },
        {
          id: 'profile',
          title: 'Profile',
          icon: User,
          path: '/profile/driver',
          description: 'Manage your profile'
        }
      ];
    }

    if (userRole === 'customer') {
      return [
        ...commonItems,
        {
          id: 'book-ride',
          title: 'Book a Ride',
          icon: Car,
          path: '/customer/book-ride',
          description: 'Book a new ride'
        },
        {
          id: 'bookings',
          title: 'My Bookings',
          icon: Calendar,
          path: '/customer/bookings',
          description: 'View your ride bookings'
        },
        {
          id: 'vehicles',
          title: 'Available Vehicles',
          icon: Truck,
          path: '/customer/vehicles',
          description: 'Browse available vehicles'
        },
        {
          id: 'profile',
          title: 'Profile',
          icon: User,
          path: '/profile/customer',
          description: 'Manage your profile'
        }
      ];
    }

    return commonItems;
  };

  // Use provided sidebarItems or default navigation items
  const navigationItems = sidebarItems.length > 0 ? sidebarItems : getDefaultNavigationItems();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActiveRoute = (path) => {
    if (!path) return false;
    // Exact match or starts with path + '/'
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-700 z-40 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-yellow-400 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">M</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">mobiTrak</h1>
            <p className="text-gray-400 text-xs capitalize">{userRole} Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = isActiveRoute(item.path);
            
            // Handle both icon components and JSX elements
            const renderIcon = () => {
              if (React.isValidElement(item.icon)) {
                // If it's already a JSX element, render it directly
                return (
                  <div className="w-5 h-5 flex items-center justify-center">
                    {item.icon}
                  </div>
                );
              } else if (typeof item.icon === 'function') {
                // If it's a component function, render it
                const IconComponent = item.icon;
                return <IconComponent size={20} className={isActive ? '' : 'group-hover:text-primary transition-colors'} />;
              } else {
                // Fallback for other cases
                return <div className="w-5 h-5 bg-gray-500 rounded"></div>;
              }
            };
            
            return (
              <motion.button
                key={item.id || item.label || item.title || Math.random()}
                onClick={item.onClick || (() => navigate(item.path))}
                className={`w-full flex items-center space-x-3 p-3 text-left rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/20 to-yellow-400/20 text-white border border-primary/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-yellow-400 text-black'
                    : 'bg-gray-700 group-hover:bg-gray-600'
                }`}>
                  {renderIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isActive ? 'text-white' : ''}`}>
                    {item.label || item.title}
                  </p>
                  <p className={`text-xs truncate ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
                    {item.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
            {profilePicture?.url ? (
              <img 
                src={profilePicture.url} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              {profilePicture?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        
        {/* Settings and Logout */}
        <div className="mt-3 space-y-1">
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center space-x-3 p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings size={16} />
            <span className="text-sm">Settings</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 p-2 text-gray-300 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickySidebar;
